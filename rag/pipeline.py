"""High-level RAG pipeline assembly."""

from __future__ import annotations

from pathlib import Path

from rag.chunking.semantic_chunker import SemanticChunker
from rag.config import RagConfig, find_p102_pdf
from rag.embeddings.base import EmbeddingProvider
from rag.embeddings.sentence_transformer_provider import SentenceTransformerEmbeddingProvider
from rag.ingestion.pdf_loader import PdfLoader
from rag.ingestion.section_detector import SectionDetector
from rag.ingestion.text_cleaner import TextCleaner
from rag.models import Chunk, Evidence, RagAnswer
from rag.retrieval.retriever import Retriever
from rag.vectorstore.chroma_store import ChromaVectorStore


class RagPipeline:
    def __init__(
        self,
        config: RagConfig | None = None,
        embedding_provider: EmbeddingProvider | None = None,
        vector_store: ChromaVectorStore | None = None,
        retriever: Retriever | None = None,
        answer_generator: object | None = None,
    ) -> None:
        self.config = config or RagConfig.from_env()
        self.embedding_provider = embedding_provider or SentenceTransformerEmbeddingProvider(
            self.config.embedding_model_name
        )
        self.vector_store = vector_store or ChromaVectorStore(
            self.config.vector_db_dir,
            self.config.collection_name,
        )
        self.retriever = retriever or Retriever(self.embedding_provider, self.vector_store)
        self._answer_generator = answer_generator

    def ingest_pdf(self, pdf_path: Path | None = None) -> list[Chunk]:
        path = pdf_path or find_p102_pdf(self.config.data_dir)
        pages = PdfLoader().load(path)
        clean_pages = TextCleaner().clean_pages(pages)
        blocks = SectionDetector().assign_sections(clean_pages)
        chunks = SemanticChunker().chunk(blocks)
        embeddings = self.embedding_provider.embed_texts([chunk.text for chunk in chunks])
        self.vector_store.upsert_chunks(chunks, embeddings)
        return chunks

    def ask(self, question: str, top_k: int = 5) -> RagAnswer:
        evidence = self.retrieve(question, top_k=top_k)
        return self.answer_generator.answer(question, evidence)

    def retrieve(self, question: str, top_k: int = 5) -> list[Evidence]:
        return self.retriever.retrieve(question, top_k=top_k)

    @property
    def answer_generator(self):
        if self._answer_generator is None:
            from rag.generation.answer_generator import AnswerGenerator
            from rag.llm.factory import build_llm_provider

            self._answer_generator = AnswerGenerator(build_llm_provider(self.config))
        return self._answer_generator
