from FlagEmbedding import BGEM3FlagModel
import config

print("=" * 60)
print("Downloading BGE-M3 Embedding Model")
print("=" * 60)
print(f"Model: {config.MODEL_NAME}")
print(f"Embedding Dimension: {config.EMBEDDING_DIMENSION}")
print("\nThis may take a few minutes (downloading ~2.2GB)...")
print("Please wait...\n")

try:
    # Download and load BGE-M3 model
    # use_fp16=True يسرّع الأداء على CPU
    model = BGEM3FlagModel(config.MODEL_NAME, use_fp16=True)

    print("✓ Model downloaded successfully!")
    print("✓ Model cached locally for future use")

    # Test the model with Arabic and English text
    print("\n" + "=" * 60)
    print("Testing Model")
    print("=" * 60)

    test_texts = [
        "مرحباً بك في نظام البحث الدلالي",
        "Hello, welcome to the semantic search system",
        "قصة عن النزوح من حلب إلى إدلب",
    ]

    # BGE-M3 يولد 3 أنواع embeddings: dense, sparse, colbert
    # نستخدم dense فقط للبحث الأساسي
    output = model.encode(
        test_texts,
        batch_size=3,
        max_length=512,
        return_dense=True,
        return_sparse=False,
        return_colbert_vecs=False,
    )

    dense_embeddings = output["dense_vecs"]

    for text, emb in zip(test_texts, dense_embeddings):
        print(f"✓ Text: {text}")
        print(f"  Embedding shape: {emb.shape}")
        print(f"  First 5 values: {emb[:5]}")
        print()

    print("=" * 60)
    print("✓ BGE-M3 Model is ready to use!")
    print("=" * 60)
    print("\nYou can now run the embedding service with:")
    print("  python app.py")

except Exception as e:
    print(f"\n✗ Error downloading model: {e}")
    print("\nMake sure FlagEmbedding is installed:")
    print("  pip install FlagEmbedding")
    exit(1)
