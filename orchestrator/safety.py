"""Safety Guard — decides whether an agent's output needs human sign-off.

This is a first pass at the "confidence-gated autonomy" idea from the
project pitch. There is no Action Agent in this repo yet, so nothing here
gates a physical action — what it gates today is *trust in an answer*:
anything that could not be verified against real evidence is flagged for a
human rather than presented as a confident fact. The same object is meant to
grow into the action-approval gate once the Action Agent exists.
"""

from __future__ import annotations

from agents.models import AgentResult
from orchestrator.config import OrchestratorConfig


class SafetyGuard:
    def __init__(self, config: OrchestratorConfig | None = None) -> None:
        self.config = config or OrchestratorConfig.from_env()

    def needs_approval(self, results: list[AgentResult]) -> tuple[bool, str]:
        if not results:
            return True, "No agent produced a result for this goal."

        for result in results:
            if result.status == "insufficient_evidence":
                return True, (
                    f"{result.agent_name} reported insufficient evidence — "
                    "do not present a confident answer without human review."
                )
            if result.status == "error":
                return True, f"{result.agent_name} failed to complete its task."
            if (
                result.top_score is not None
                and result.top_score < self.config.low_confidence_threshold
            ):
                return True, (
                    f"{result.agent_name}'s best evidence match scored "
                    f"{result.top_score:.2f}, below the "
                    f"{self.config.low_confidence_threshold} confidence "
                    "threshold — flagging for human review."
                )

        return False, ""
