"""Prompt construction for grounded answers."""

from __future__ import annotations

from rag.models import Evidence


class PromptBuilder:
    def build(self, question: str, evidence: list[Evidence]) -> str:
        evidence_text = "\n\n".join(
            self._format_evidence(index, item) for index, item in enumerate(evidence, start=1)
        )
        return f"""Answer the question using only the evidence below.

Rules:
- If the evidence does not contain enough information to answer, say exactly: insufficient evidence.
- Do not use outside knowledge.
- Include concise source citations when answering.
- Prefer document name, section, and page number in citations.

Question:
{question}

Evidence:
{evidence_text}

Answer:"""

    def _format_evidence(self, index: int, evidence: Evidence) -> str:
        metadata = evidence.metadata
        citation = (
            f"{metadata.get('document_name', 'Unknown document')}, "
            f"{metadata.get('section', 'Unknown section')}, "
            f"pages {metadata.get('page_start', '?')}-{metadata.get('page_end', '?')}, "
            f"chunk {metadata.get('chunk_id', '?')}"
        )
        return f"[{index}] Source: {citation}\n{evidence.text}"

