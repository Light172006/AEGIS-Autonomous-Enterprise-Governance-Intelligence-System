from rag.config import RagConfig
from rag.pipeline import RagPipeline


class FakeEmbeddingProvider:
    def embed_texts(self, texts):
        return [[1.0, 0.0] for _ in texts]

    def embed_query(self, query):
        return [1.0, 0.0]


class FakeVectorStore:
    def upsert_chunks(self, chunks, embeddings):
        self.chunks = chunks
        self.embeddings = embeddings

    def query(self, query_embedding, top_k=5):
        return []


def test_pipeline_init_does_not_require_openrouter_key():
    config = RagConfig(openrouter_api_key=None)

    pipeline = RagPipeline(
        config=config,
        embedding_provider=FakeEmbeddingProvider(),
        vector_store=FakeVectorStore(),
    )

    assert pipeline.config.openrouter_api_key is None
