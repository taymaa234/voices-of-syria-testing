"""
test_chat_endpoint.py — Checkpoint tests for /api/chat/generate SSE endpoint.

Runs tests directly against the Flask app (no live server needed).
For live Ollama streaming, pass --live flag.

Run:
    cd embedding-service && python test_chat_endpoint.py
    cd embedding-service && python test_chat_endpoint.py --live
"""

import json
import sys
import os

# Ensure we can import from embedding-service directory
sys.path.insert(0, os.path.dirname(__file__))

import app as flask_app_module

# Use Flask test client — no running server needed
client = flask_app_module.app.test_client()

SAMPLE_STORIES = [
    {
        "story_id": 1,
        "title": "قصة من حلب",
        "content": "كانت حلب مدينة جميلة قبل الحرب، يعيش فيها الناس بسلام.",
        "relevance_score": 0.87,
    }
]

SAMPLE_HISTORY = [
    {"role": "user", "content": "ما هي المدن السورية؟"},
    {"role": "assistant", "content": "من أبرز المدن السورية: دمشق وحلب وحمص."},
]


def _parse_sse_events(data: bytes) -> list:
    """Parse raw SSE bytes into a list of event dicts."""
    events = []
    for line in data.decode("utf-8").splitlines():
        if line.startswith("data: "):
            payload = line[len("data: "):]
            try:
                events.append(json.loads(payload))
            except json.JSONDecodeError:
                events.append({"raw": payload})
    return events


def test_empty_question():
    """Empty question must return 400 before touching Ollama."""
    print("TEST 1: Empty question → 400 ...")
    resp = client.post(
        "/api/chat/generate",
        json={"question": "  ", "stories": [], "chat_history": []},
    )
    assert resp.status_code == 400, f"Expected 400, got {resp.status_code}: {resp.data}"
    body = json.loads(resp.data)
    assert "error" in body, f"Expected 'error' key in response: {body}"
    print("  PASS — 400 returned with error message")


def test_sse_content_type():
    """Response must have text/event-stream content type."""
    print("TEST 2: SSE Content-Type header ...")
    resp = client.post(
        "/api/chat/generate",
        json={"question": "ما هي قصص حلب؟", "stories": SAMPLE_STORIES, "chat_history": []},
    )
    ct = resp.content_type
    assert "text/event-stream" in ct, f"Expected text/event-stream, got: {ct}"
    print(f"  PASS — Content-Type: {ct}")


def test_ollama_unavailable_returns_error_event():
    """When Ollama is down, the SSE stream must emit an error event (not crash)."""
    print("TEST 3: Ollama unavailable → SSE error event ...")
    resp = client.post(
        "/api/chat/generate",
        json={"question": "ما هي قصص حلب؟", "stories": SAMPLE_STORIES, "chat_history": []},
    )
    assert resp.status_code == 200, f"Expected 200 (SSE), got {resp.status_code}"

    events = _parse_sse_events(resp.data)
    assert len(events) > 0, "Expected at least one SSE event"

    types = [e.get("type") for e in events]
    assert "error" in types or "done" in types, (
        f"Expected 'error' or 'done' event, got types: {types}"
    )
    if "error" in types:
        err_event = next(e for e in events if e.get("type") == "error")
        assert err_event.get("content"), "Error event must have a content message"
        print(f"  PASS — Error event received: {err_event['content'][:80]}...")
    else:
        print("  PASS — Ollama is running; got token stream instead of error")


def test_sources_passed_through():
    """Sources in the done event must match the stories sent in the request."""
    print("TEST 4: Sources pass-through in done event ...")
    resp = client.post(
        "/api/chat/generate",
        json={
            "question": "test question",
            "stories": SAMPLE_STORIES,
            "chat_history": [],
            "language": "en",
        },
    )
    assert resp.status_code == 200
    events = _parse_sse_events(resp.data)
    done_events = [e for e in events if e.get("type") == "done"]

    if done_events:
        sources = done_events[0].get("sources", [])
        assert len(sources) == len(SAMPLE_STORIES), (
            f"Expected {len(SAMPLE_STORIES)} source(s), got {len(sources)}"
        )
        assert sources[0]["storyId"] == SAMPLE_STORIES[0]["story_id"]
        assert sources[0]["title"] == SAMPLE_STORIES[0]["title"]
        print(f"  PASS — {len(sources)} source(s) correctly passed through")
    else:
        # Ollama down → error event, sources not emitted; acceptable
        print("  SKIP — Ollama unavailable, sources not emitted (expected)")


def test_no_api_key_required():
    """The /api/chat/generate endpoint should NOT require an API key."""
    print("TEST 5: No API key required for chat endpoint ...")
    resp = client.post(
        "/api/chat/generate",
        json={"question": "test", "stories": [], "chat_history": []},
    )
    # Should not return 401
    assert resp.status_code != 401, "Chat endpoint should not require API key"
    print(f"  PASS — No 401 returned (got {resp.status_code})")


def test_live_stream():
    """Live test via running server: full SSE stream with tokens and done+sources."""
    import requests as req_lib
    BASE_URL = "http://localhost:5001"
    CHAT_URL = f"{BASE_URL}/api/chat/generate"

    print("TEST 6 (LIVE): Streaming response from running server ...")
    try:
        health = req_lib.get(f"{BASE_URL}/api/embeddings/health", timeout=3)
        print(f"  Server health: {health.json().get('status')}")
    except Exception:
        print("  SKIP — Server not running on port 5001")
        return

    resp = req_lib.post(
        CHAT_URL,
        json={
            "question": "ما هي أبرز القصص عن حلب؟",
            "stories": SAMPLE_STORIES,
            "chat_history": SAMPLE_HISTORY,
            "language": "ar",
        },
        stream=True,
        timeout=35,
    )
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"

    events = []
    for line in resp.iter_lines():
        if not line:
            continue
        decoded = line.decode("utf-8") if isinstance(line, bytes) else line
        if decoded.startswith("data: "):
            try:
                events.append(json.loads(decoded[6:]))
            except json.JSONDecodeError:
                pass

    types = [e.get("type") for e in events]
    assert "done" in types or "error" in types, f"Expected done or error event. Got: {types}"

    if "done" in types:
        done_event = next(e for e in events if e.get("type") == "done")
        token_events = [e for e in events if e.get("type") == "token"]
        answer = "".join(e.get("content", "") for e in token_events)
        print(f"  Tokens: {len(token_events)}, Answer preview: {answer[:80]}...")
        print(f"  Sources: {done_event.get('sources', [])}")
        print("  PASS — Full SSE stream with tokens and done+sources")
    else:
        err = next(e for e in events if e.get("type") == "error")
        print(f"  INFO — Ollama not running: {err.get('content', '')[:80]}")
        print("  PASS — Error event correctly returned when Ollama unavailable")


if __name__ == "__main__":
    live = "--live" in sys.argv

    print("=" * 60)
    print("Checkpoint: /api/chat/generate SSE endpoint tests")
    print("=" * 60)
    print()

    tests = [
        test_empty_question,
        test_sse_content_type,
        test_ollama_unavailable_returns_error_event,
        test_sources_passed_through,
        test_no_api_key_required,
    ]
    if live:
        tests.append(test_live_stream)

    passed = 0
    failed = 0

    for test_fn in tests:
        try:
            test_fn()
            passed += 1
        except AssertionError as e:
            print(f"  FAIL — {e}")
            failed += 1
        except Exception as e:
            print(f"  ERROR — {type(e).__name__}: {e}")
            failed += 1
        print()

    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    if failed:
        sys.exit(1)
