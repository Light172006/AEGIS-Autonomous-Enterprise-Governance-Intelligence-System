"""Document Agent — wraps the existing RAG pipeline as an Orchestrator-callable agent.

This does not reimplement retrieval or generation. Every piece of intelligence
here (chunking, embeddings, grounding, citations, "insufficient evidence"
refusal) already lives in `rag/`. This module is purely an adapter so the
Orchestrator can call it through the generic `Agent` interface.
"""

from __future__ import annotations

from agents.base import Agent
from agents.models import AgentResult
from rag.pipeline import RagPipeline


class DocumentAgent(Agent):
    name = "document_agent"
    description = (
        "Answers questions about ingested equipment manuals and industrial "
        "documents (specifications, procedures, part numbers, pressures, "
        "maintenance steps, safety limits). Use this whenever the task "
        "requires looking something up in a document rather than reasoning "
        "from general knowledge."
    )

    def __init__(self, pipeline: RagPipeline | None = None) -> None:
        self.pipeline = pipeline or RagPipeline()

    def run(self, task: str, top_k: int = 5) -> AgentResult:
        answer = self.pipeline.ask(task, top_k=top_k)
        top_score = answer.evidence[0].score if answer.evidence else None

        return AgentResult(
            agent_name=self.name,
            status=answer.status,
            output=answer.answer,
            citations=answer.citations,
            raw_evidence_count=len(answer.evidence),
            top_score=top_score,
        )
