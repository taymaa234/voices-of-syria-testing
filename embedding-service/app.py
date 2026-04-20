import json
import logging
import time
import requests
from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS

import config
from prompt_builder import build_prompt

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Flask app
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app)
app.config["MAX_CONTENT_LENGTH"] = config.MAX_CONTENT_LENGTH

# ---------------------------------------------------------------------------
# Lazy-loaded globals
# ---------------------------------------------------------------------------
_model = None          # BGEM3FlagModel instance
_chroma_client = None  # chromadb.Client instance
_collection = None     # ChromaDB collection


def _load_model():
    """Load BGE-M3 model once at startup."""
    global _model
    if _model is None:
        from FlagEmbedding import BGEM3FlagModel
        logger.info("Loading BGE-M3 model: %s", config.MODEL_NAME)
        _model = BGEM3FlagModel(config.MODEL_NAME, use_fp16=True)
        logger.info("BGE-M3 model loaded (dim=%d)", config.EMBEDDING_DIMENSION)
    return _model


def _init_chroma():
    """Initialise ChromaDB client and collection once at startup."""
    global _chroma_client, _collection
    if _chroma_client is None:
        import chromadb
        logger.info("Connecting to ChromaDB at %s", config.CHROMA_PERSIST_DIRECTORY)
        _chroma_client = chromadb.PersistentClient(path=config.CHROMA_PERSIST_DIRECTORY)
        _collection = _chroma_client.get_or_create_collection(
            name=config.CHROMA_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(
            "ChromaDB ready – collection '%s' has %d embeddings",
            config.CHROMA_COLLECTION_NAME,
            _collection.count(),
        )
    return _chroma_client, _collection


# ---------------------------------------------------------------------------
# Helper – API key guard
# ---------------------------------------------------------------------------
def _check_api_key():
    key = request.headers.get("X-API-Key") or request.args.get("api_key")
    if key != config.API_KEY:
        return jsonify({"error": "Unauthorized"}), 401
    return None


# ---------------------------------------------------------------------------
# Health check endpoint
# ---------------------------------------------------------------------------
@app.route("/api/embeddings/health", methods=["GET"])
def health():
    model_loaded = _model is not None
    chroma_ok = _collection is not None
    total_embeddings = 0

    if chroma_ok:
        try:
            total_embeddings = _collection.count()
        except Exception:
            chroma_ok = False

    status = "healthy" if (model_loaded and chroma_ok) else "degraded"
    code = 200 if status == "healthy" else 503

    return jsonify(
        {
            "status": status,
            "model_loaded": model_loaded,
            "chroma_connected": chroma_ok,
            "total_embeddings": total_embeddings,
        }
    ), code


# ---------------------------------------------------------------------------
# Core embedding logic
# ---------------------------------------------------------------------------
def generate_embedding(text: str) -> list:
    """
    Convert text (Arabic or English) into a dense float vector using BGE-M3.
    BGE-M3 supports 100+ languages including Arabic.
    Returns a list of floats with length == EMBEDDING_DIMENSION (1024).
    """
    if not text or not text.strip():
        raise ValueError("Text must be non-empty")

    model = _load_model()
    output = model.encode(
        [text],
        batch_size=1,
        max_length=8192,       # BGE-M3 يدعم حتى 8192 token
        return_dense=True,
        return_sparse=False,
        return_colbert_vecs=False,
    )
    return output["dense_vecs"][0].tolist()


# ---------------------------------------------------------------------------
# POST /api/embeddings/generate
# ---------------------------------------------------------------------------
@app.route("/api/embeddings/generate", methods=["POST"])
def generate():
    auth_error = _check_api_key()
    if auth_error:
        return auth_error

    data = request.get_json(silent=True) or {}
    story_id = data.get("story_id")
    content = data.get("content", "")

    if story_id is None:
        return jsonify({"error": "story_id is required"}), 400
    if not content or not content.strip():
        return jsonify({"error": "content must be non-empty"}), 400

    _, collection = _init_chroma()

    try:
        t0 = time.time()
        embedding = generate_embedding(content)
        elapsed_ms = int((time.time() - t0) * 1000)

        # Upsert so repeated calls for the same story_id overwrite
        collection.upsert(
            ids=[str(story_id)],
            embeddings=[embedding],
            metadatas=[{"story_id": story_id}],
        )

        logger.info("Generated embedding for story %s in %dms", story_id, elapsed_ms)
        return jsonify(
            {
                "success": True,
                "story_id": story_id,
                "embedding_dimensions": len(embedding),
                "processing_time_ms": elapsed_ms,
            }
        ), 200

    except Exception as exc:
        logger.error("Embedding generation failed for story %s: %s", story_id, exc)
        return jsonify({"error": str(exc)}), 500


# ---------------------------------------------------------------------------
# DELETE /api/embeddings/<story_id>
# ---------------------------------------------------------------------------
@app.route("/api/embeddings/<story_id>", methods=["DELETE"])
def delete_embedding(story_id):
    auth_error = _check_api_key()
    if auth_error:
        return auth_error

    _, collection = _init_chroma()

    try:
        collection.delete(ids=[str(story_id)])
        logger.info("Deleted embedding for story %s", story_id)
        return jsonify({"success": True, "story_id": story_id}), 200
    except Exception as exc:
        logger.error("Failed to delete embedding for story %s: %s", story_id, exc)
        return jsonify({"error": str(exc)}), 500

# ---------------------------------------------------------------------------
# POST /api/embeddings/search
# ---------------------------------------------------------------------------
@app.route("/api/embeddings/search", methods=["POST"])
def search():
    auth_error = _check_api_key()
    if auth_error:
        return auth_error

    data = request.get_json(silent=True) or {}
    query = data.get("query", "")
    top_k = int(data.get("top_k", 20))
    min_score = float(data.get("min_score", 0.5))

    if not query or not query.strip():
        return jsonify({"error": "query must be non-empty"}), 400

    _, collection = _init_chroma()

    try:
        t0 = time.time()

        # 1. حوّل الـ query لـ embedding
        query_embedding = generate_embedding(query)

        # 2. ابحث في ChromaDB عن أقرب الـ embeddings
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=min(top_k, collection.count()) if collection.count() > 0 else 1,
        )

        elapsed_ms = int((time.time() - t0) * 1000)

        # 3. ChromaDB بيرجع distances (0=identical, 2=opposite بـ cosine)
        #    حوّلها لـ relevance score بين 0 و 1
        ids = results["ids"][0]
        distances = results["distances"][0]

        filtered = []
        for story_id, distance in zip(ids, distances):
            relevance_score = 1 - (distance / 2)  # cosine distance → similarity
            if relevance_score >= min_score:
                filtered.append({
                    "story_id": int(story_id),
                    "relevance_score": round(relevance_score, 4),
                })

        # 4. رتّب من الأعلى للأدنى
        filtered.sort(key=lambda x: x["relevance_score"], reverse=True)

        return jsonify({
            "results": filtered,
            "query_time_ms": elapsed_ms,
        }), 200

    except Exception as exc:
        logger.error("Search failed: %s", exc)
        return jsonify({"error": str(exc)}), 500

# ---------------------------------------------------------------------------
# POST /api/chat/generate  — RAG chatbot endpoint (SSE streaming)
# ---------------------------------------------------------------------------
@app.route("/api/chat/generate", methods=["POST"])
def chat_generate():
    data = request.get_json(silent=True) or {}

    question = data.get("question", "").strip()
    stories = data.get("stories", [])
    chat_history = data.get("chat_history", [])
    language = data.get("language", "ar")

    if not question:
        return jsonify({"error": "question must be non-empty"}), 400

    # Build the prompt
    prompt = build_prompt(question, stories, chat_history, language)

    # Prepare sources list (passed through from caller)
    sources = [
        {
            "storyId": s.get("story_id"),
            "title": s.get("title", ""),
            "relevanceScore": s.get("relevance_score", 0),
        }
        for s in stories
    ]

    def generate_sse():
        headers = {
            "Authorization": f"Bearer {config.OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
        }
        payload = {
            "model": config.OPENROUTER_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "stream": True,
        }

        in_think_block = False

        try:
            with requests.post(
                f"{config.OPENROUTER_BASE_URL}/chat/completions",
                headers=headers,
                json=payload,
                stream=True,
                timeout=config.OPENROUTER_TIMEOUT,
            ) as resp:
                if resp.status_code != 200:
                    error_msg = {"type": "error", "content": f"OpenRouter error: {resp.status_code}"}
                    yield f"data: {json.dumps(error_msg)}\n\n"
                    return

                for line in resp.iter_lines():
                    if not line:
                        continue
                    line = line.decode("utf-8") if isinstance(line, bytes) else line
                    if line.startswith("data: "):
                        data = line[6:]
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                            token = chunk["choices"][0]["delta"].get("content", "")
                            if not token:
                                continue
                            # filter out <think>...</think> blocks (qwen3 thinking mode)
                            if "<think>" in token:
                                in_think_block = True
                            if in_think_block:
                                if "</think>" in token:
                                    in_think_block = False
                                    token = token.split("</think>", 1)[-1]
                                else:
                                    continue
                            if token:
                                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
                        except (json.JSONDecodeError, KeyError) as e:
                            logger.warning("Parse error: %s | line: %s", e, line[:200])
                            continue

        except requests.exceptions.Timeout:
            error_msg = {"type": "error", "content": "Request timed out, please try again"}
            yield f"data: {json.dumps(error_msg)}\n\n"
            return
        except Exception as exc:
            logger.error("chat_generate error: %s", exc)
            error_msg = {"type": "error", "content": str(exc)}
            yield f"data: {json.dumps(error_msg)}\n\n"
            return

        yield f"data: {json.dumps({'type': 'done', 'sources': sources})}\n\n"

    return Response(
        stream_with_context(generate_sse()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Application entry point – pre-load model & ChromaDB at startup
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logger.info("Starting Embedding Service...")
    _load_model()
    _init_chroma()
    logger.info(
        "Embedding Service ready on %s:%s", config.FLASK_HOST, config.FLASK_PORT
    )
    app.run(host=config.FLASK_HOST, port=config.FLASK_PORT, debug=False)
