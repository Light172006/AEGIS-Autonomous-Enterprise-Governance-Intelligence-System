"""Builds Ollama/OpenAI-style tool schemas from registered agents.

Qwen3 (served through Ollama) supports native tool-calling using this schema
shape, so every registered Agent just needs a name and a description and it
becomes something the model can choose to call — no per-agent prompt work.
"""

from __future__ import annotations

from typing import Any

from agents.base import Agent


def build_tool_schema(agents: list[Agent]) -> list[dict[str, Any]]:
    return [
        {
            "type": "function",
            "function": {
                "name": agent.name,
                "description": agent.description,
                "parameters": {
                    "type": "object",
                    "properties": {
                        "task": {
                            "type": "string",
                            "description": (
                                "The specific question or task to hand to this "
                                "agent, in your own words."
                            ),
                        }
                    },
                    "required": ["task"],
                },
            },
        }
        for agent in agents
    ]
