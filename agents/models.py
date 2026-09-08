"""Shared data models for agents callable by the Orchestrator."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class AgentResult:
    """The result of a single agent handling a single task.

    This is deliberately provider-agnostic: the Orchestrator never looks at
    an agent's internals (RAG pipeline, vision model, simulator, whatever),
    only at this result.
    """

    agent_name: str
    status: str  # "answered" | "insufficient_evidence" | "error"
    output: str
    citations: list[dict[str, Any]] = field(default_factory=list)
    raw_evidence_count: int = 0
    top_score: float | None = None
