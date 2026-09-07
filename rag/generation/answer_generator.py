"""Grounded answer generation."""

from __future__ import annotations

from rag.generation.prompt_builder import PromptBuilder
from rag.llm.base import LlmProvider
from rag.models import Evidence, RagAnswer


class AnswerGenerator:
    def __init__(self, llm: LlmProvider, prompt_builder: PromptBuilder | None = None) -> None:
        self.llm = llm
        self.prompt_builder = prompt_builder or PromptBuilder()

    def answer(self, question: str, evidence: list[Evidence]) -> RagAnswer:
        if not evidence:
            return RagAnswer(answer="insufficient evidence", status="insufficient_evidence", evidence=[])

        prompt = self.prompt_builder.build(question, evidence)
        answer = self.llm.generate(prompt).strip()
        status = "insufficient_evidence" if answer.lower().startswith("insufficient evidence") else "answered"
        citations = [item.metadata for item in evidence] if status == "answered" else []
        return RagAnswer(answer=answer, status=status, citations=citations, evidence=evidence)

