"""AI Orchestrator — routes a goal to the right agent(s) using Qwen3 tool-calling,
then runs the Safety Guard before returning a decision.

With only the Document Agent registered so far, most goals resolve to a
single tool call. The routing logic is written to generalise once the Vision
Agent and Data Agent from the architecture are added: nothing here is
document-agent-specific, and adding a new agent means registering it in the
`agents` list passed to the constructor — no other code changes.
"""

from __future__ import annotations

import json
from typing import Any

from agents.base import Agent
from agents.models import AgentResult
from orchestrator.config import OrchestratorConfig
from orchestrator.models import AgentCallRecord, OrchestratorDecision
from orchestrator.ollama_chat_client import OllamaChatClient
from orchestrator.safety import SafetyGuard
from orchestrator.tool_schema import build_tool_schema

SYSTEM_PROMPT = (
    "You are the orchestrator for an industrial engineering assistant. "
    "You do not answer questions yourself. For every goal, decide which of "
    "the available tools can help, and call that tool with a clear, specific "
    "task written in your own words. Call a tool whenever the goal needs "
    "information you do not already have. If no available tool can help, "
    "respond in plain text explaining why."
)


def _parse_task_argument(arguments: Any, fallback: str) -> str:
    """Ollama sometimes returns tool arguments as a dict, sometimes as a raw
    JSON string, depending on the model. Handle both without blowing up."""
    if isinstance(arguments, str):
        try:
            arguments = json.loads(arguments)
        except json.JSONDecodeError:
            return fallback
    if isinstance(arguments, dict):
        return str(arguments.get("task", fallback))
    return fallback


class Orchestrator:
    def __init__(
        self,
        agents: list[Agent],
        config: OrchestratorConfig | None = None,
        chat_client: OllamaChatClient | None = None,
        safety_guard: SafetyGuard | None = None,
    ) -> None:
        if not agents:
            raise ValueError("Orchestrator requires at least one registered agent.")

        self.config = config or OrchestratorConfig.from_env()
        self.agents = {agent.name: agent for agent in agents}
        self.chat_client = chat_client or OllamaChatClient(
            model=self.config.ollama_model,
            base_url=self.config.ollama_base_url,
        )
        self.safety_guard = safety_guard or SafetyGuard(self.config)

    def handle(self, goal: str) -> OrchestratorDecision:
        tools = build_tool_schema(list(self.agents.values()))
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": goal},
        ]

        response = self.chat_client.chat(messages, tools=tools)
        message = response.get("message", {})
        tool_calls = message.get("tool_calls") or []

        # If the model answered in plain text instead of calling a tool, and
        # there is exactly one agent registered, route to it anyway. This
        # keeps a single-agent deployment reliable while the real
        # tool-calling path still gets exercised whenever the model uses it,
        # and it stops being used automatically the moment a second agent
        # is registered (at which point a missed tool call should surface,
        # not be silently guessed).
        if not tool_calls and len(self.agents) == 1:
            (only_agent,) = self.agents.values()
            tool_calls = [
                {"function": {"name": only_agent.name, "arguments": {"task": goal}}}
            ]

        if not tool_calls:
            return OrchestratorDecision(
                goal=goal,
                answer=message.get("content", "").strip() or "insufficient evidence",
                status="insufficient_evidence",
                reasoning="No registered agent was selected for this goal.",
                requires_approval=True,
            )

        call_records: list[AgentCallRecord] = []
        results: list[AgentResult] = []

        for call in tool_calls[: self.config.max_agent_calls]:
            function = call.get("function", {})
            agent_name = function.get("name")
            task = _parse_task_argument(function.get("arguments"), fallback=goal)

            agent = self.agents.get(agent_name)
            if agent is None:
                continue

            result = agent.run(task)
            results.append(result)
            call_records.append(
                AgentCallRecord(
                    agent_name=result.agent_name,
                    task=task,
                    status=result.status,
                    output=result.output,
                    citations=result.citations,
                )
            )

        requires_approval, reasoning = self.safety_guard.needs_approval(results)
        final_answer = self._compose_answer(results)
        status = "needs_human_approval" if requires_approval else "answered"

        return OrchestratorDecision(
            goal=goal,
            answer=final_answer,
            status=status,
            agent_calls=call_records,
            reasoning=reasoning,
            requires_approval=requires_approval,
        )

    def _compose_answer(self, results: list[AgentResult]) -> str:
        answered = [r for r in results if r.status == "answered"]
        if not answered:
            return "insufficient evidence"
        # With one agent this is a pass-through. With more than one agent
        # registered, this is the point to reconcile/merge evidence from
        # multiple sources before answering — deliberately left simple until
        # a second agent (Vision/Data) actually exists to reconcile against.
        return "\n\n".join(r.output for r in answered)
