"""Section-aware semantic-ish chunking for early RAG ingestion."""

from __future__ import annotations

import re

from rag.models import Chunk, TextBlock


class SemanticChunker:
    def __init__(self, max_words: int = 260, overlap_words: int = 45) -> None:
        if overlap_words >= max_words:
            raise ValueError("overlap_words must be smaller than max_words")
        self.max_words = max_words
        self.overlap_words = overlap_words

    def chunk(self, blocks: list[TextBlock]) -> list[Chunk]:
        chunks: list[Chunk] = []
        counter = 1

        for block in blocks:
            sentences = self._split_sentences(block.text)
            current: list[str] = []
            current_words = 0

            for sentence in sentences:
                word_count = len(sentence.split())
                if current and current_words + word_count > self.max_words:
                    chunks.append(self._make_chunk(counter, block, current))
                    counter += 1
                    current = self._overlap_tail(current)
                    current_words = sum(len(item.split()) for item in current)
                current.append(sentence)
                current_words += word_count

            if current:
                chunks.append(self._make_chunk(counter, block, current))
                counter += 1

        return chunks

    def _make_chunk(self, counter: int, block: TextBlock, parts: list[str]) -> Chunk:
        return Chunk(
            chunk_id=f"{block.document_name}:chunk-{counter:04d}",
            document_name=block.document_name,
            source_path=block.source_path,
            page_start=block.page_number,
            page_end=block.page_number,
            section=block.section,
            text=" ".join(part.strip() for part in parts if part.strip()),
        )

    def _split_sentences(self, text: str) -> list[str]:
        paragraphs = [item.strip() for item in re.split(r"\n{2,}", text) if item.strip()]
        sentences: list[str] = []
        for paragraph in paragraphs:
            pieces = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9])", paragraph)
            sentences.extend(piece.strip() for piece in pieces if piece.strip())
        return sentences

    def _overlap_tail(self, parts: list[str]) -> list[str]:
        tail: list[str] = []
        total = 0
        for part in reversed(parts):
            words = len(part.split())
            if total + words > self.overlap_words:
                break
            tail.insert(0, part)
            total += words
        return tail

