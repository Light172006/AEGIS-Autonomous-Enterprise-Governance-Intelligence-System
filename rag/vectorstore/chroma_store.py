"""Local Chroma vector store adapter."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from rag.models import Chunk, Evidence


class ChromaVectorStore:
    def __init__(self, persist_dir: Path, collection_name: str) -> None:
        try:
            import chromadb
        except ImportError as exc:
            raise RuntimeError("chromadb is required for local vector storage. Install dependencies from requirements.txt.") from exc

        self.client = chromadb.PersistentClient(path=str(persist_dir))
        self.collection = self.client.get_or_create_collection(name=collection_name)

    def upsert_chunks(self, chunks: list[Chunk], embeddings: list[list[float]]) -> None:
        if len(chunks) != len(embeddings):
            raise ValueError("chunks and embeddings must have the same length")
        if not chunks:
            return

        self.collection.upsert(
            ids=[chunk.chunk_id for chunk in chunks],
            documents=[chunk.text for chunk in chunks],
            embeddings=embeddings,
            metadatas=[chunk.metadata for chunk in chunks],
        )

    def query(self, query_embedding: list[float], top_k: int = 5) -> list[Evidence]:
        result: dict[str, Any] = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )
        documents = result.get("documents", [[]])[0]
        metadatas = result.get("metadatas", [[]])[0]
        distances = result.get("distances", [[]])[0]

        evidence: list[Evidence] = []
        for text, metadata, distance in zip(documents, metadatas, distances):
            score = 1.0 / (1.0 + float(distance)) if distance is not None else None
            evidence.append(
                Evidence(
                    text=text,
                    metadata=metadata,
                    score=score,
                    distance=float(distance) if distance is not None else None,
                )
            )
        return evidence
