# Embedding Service

Semantic search service for Voices of Syria using sentence-transformers and ChromaDB.

## Features

- Generate embeddings for Arabic and English text
- Semantic search using ChromaDB vector database
- RESTful API with Flask
- Multilingual support (50+ languages including Arabic)

## Setup

### 1. Create Virtual Environment

```cmd
python -m venv venv
venv\Scripts\activate
```

### 2. Install Dependencies

```cmd
pip install -r requirements.txt
```

### 3. Download Model

```cmd
python download_model.py
```

This will download the `paraphrase-multilingual-MiniLM-L12-v2` model (~500MB).

### 4. Run Service

```cmd
python app.py
```

The service will start on `http://localhost:5000`

## API Endpoints

### Generate Embeddings

```http
POST /api/embeddings/generate
Content-Type: application/json

{
  "story_id": 123,
  "content": "نص القصة هنا..."
}
```

### Search Similar Stories

```http
POST /api/embeddings/search
Content-Type: application/json

{
  "query": "قصص عن النزوح",
  "top_k": 20,
  "min_score": 0.5
}
```

### Delete Embedding

```http
DELETE /api/embeddings/{story_id}
```

### Health Check

```http
GET /api/embeddings/health
```

## Configuration

Edit `config.py` to change:
- Model name
- ChromaDB settings
- Flask port
- API security

## Model Information

- **Model**: paraphrase-multilingual-MiniLM-L12-v2
- **Embedding Dimension**: 384
- **Languages**: 50+ including Arabic
- **Speed**: ~50ms per text
- **Size**: ~500MB

## Troubleshooting

### Model Download Fails

- Check internet connection
- Try running `python download_model.py` again
- Model will be cached after first download

### Port Already in Use

Change `FLASK_PORT` in `config.py` to a different port (e.g., 5001)

### Out of Memory

The model requires ~500MB RAM. Close other applications if needed.
