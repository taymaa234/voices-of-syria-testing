import os
from dotenv import load_dotenv

load_dotenv(override=True)  # .env يأخذ أولوية دائماً

# Model Configuration
MODEL_NAME = "BAAI/bge-m3"
EMBEDDING_DIMENSION = 1024  # BGE-M3 dense embedding dimension

# ChromaDB Configuration
CHROMA_PERSIST_DIRECTORY = "./chroma_data"
CHROMA_COLLECTION_NAME = "story_embeddings"

# Flask Configuration
FLASK_HOST = "0.0.0.0"
FLASK_PORT = 5001
MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB

# API Security
API_KEY = os.getenv('EMBEDDING_API_KEY', 'dev-key-change-in-production')

# OpenRouter Configuration
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')
OPENROUTER_MODEL = os.getenv('OPENROUTER_MODEL', 'qwen/qwen3-8b:free')
OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
OPENROUTER_TIMEOUT = int(os.getenv('OPENROUTER_TIMEOUT', '60'))
