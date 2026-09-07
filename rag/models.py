"""Shared data models for the RAG pipeline."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class PageText:
    document_name: str
    source_path: str
    page_number: int
    text: str


@dataclass(frozen=True)
class TextBlock:
    document_name: str
    source_path: str
    page_number: int
    section: str | None
    text: str


@dataclass(frozen=True)
class Chunk:
    chunk_id: str
    document_name: str
    source_path: str
    page_start: int
    page_end: int
    section: str | None
    text: str

    @property
    def metadata(self) -> dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "document_name": self.document_name,
            "source_path": self.source_path,
            "page_start": self.page_start,
            "page_end": self.page_end,
            "section": self.section or "Unknown section",
        }


@dataclass(frozen=True)
class Evidence:
    text: str
    metadata: dict[str, Any]
    score: float | None = None
    distance: float | None = None


@dataclass(frozen=True)
class RagAnswer:
    answer: str
    status: str
    citations: list[dict[str, Any]] = field(default_factory=list)
    evidence: list[Evidence] = field(default_factory=list)
