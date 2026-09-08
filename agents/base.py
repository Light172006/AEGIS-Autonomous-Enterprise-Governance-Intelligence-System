"""Agent interface.

Every capability the Orchestrator can call — the Document Agent today, a
Vision Agent or Data Agent later — implements this. The Orchestrator only
ever depends on this interface, never on a concrete agent, so new agents can
be registered without touching orchestrator code.
"""

from __future__ import annotations

from abc import ABC, abstractmethod

from agents.models import AgentResult


class Agent(ABC):
    name: str
    description: str

    @abstractmethod
    def run(self, task: str) -> AgentResult:
        """Execute a single task and return a structured result.

        `task` is a natural-language instruction the Orchestrator's tool-calling
        model wrote for this specific agent — it may be a reworded, narrower
        version of the original goal, not the goal verbatim.
        """
        raise NotImplementedError
