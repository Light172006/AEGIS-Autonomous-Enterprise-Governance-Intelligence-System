"""Shared data models for the Orchestrator."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class AgentCallRecord:
    """An audit-trail entry for one agent call the Orchestrator made.

    Kept separate from AgentResult so the Orchestrator's own record of "what
    I asked and what came back" survives even if an agent's own result type
    changes later.
    """

    agent_name: str
    task: str
    status: str
    output: str
    citations: list[dict[str, Any]] = field(default_factory=list)


@dataclass(frozen=True)
class OrchestratorDecision:
    goal: str
    answer: str
    status: str  # "answered" | "insufficient_evidence" | "needs_human_approval" | "error"
    agent_calls: list[AgentCallRecord] = field(default_factory=list)
    reasoning: str = ""
    requires_approval: bool = False
