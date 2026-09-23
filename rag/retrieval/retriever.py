"""Semantic retrieval over the local vector database."""

from __future__ import annotations

from rag.embeddings.base import EmbeddingProvider
from rag.models import Evidence
from rag.vectorstore.chroma_store import ChromaVectorStore


class Retriever:
    def __init__(self, embeddings: EmbeddingProvider, vector_store: ChromaVectorStore) -> None:
        self.embeddings = embeddings
        self.vector_store = vector_store

    def retrieve(self, question: str, top_k: int = 5) -> list[Evidence]:
        query_embedding = self.embeddings.embed_query(question)
        return self.vector_store.query(query_embedding, top_k=top_k)

