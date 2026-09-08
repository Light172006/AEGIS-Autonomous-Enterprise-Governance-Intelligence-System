"""A small Ollama chat client with native tool-calling support.

rag/llm/ollama_provider.py talks to Ollama's /api/generate endpoint, which is
fine for plain text generation but does not support tool-calling. The
Orchestrator needs tool-calling, so it talks to /api/chat instead, which is
the endpoint Qwen3's tool-calling mode actually uses. Kept as a separate,
small client rather than bolted onto LlmProvider, since its shape (messages
+ tools in, a message with optional tool_calls out) is genuinely different
from the single prompt-in/string-out interface the RAG pipeline needs.
"""

from __future__ import annotations

from typing import Any

import requests


class OllamaChatClient:
    def __init__(self, model: str, base_url: str = "http://localhost:11434") -> None:
        if not model:
            raise RuntimeError(
                "No Qwen3 model configured. Set ORCHESTRATOR_MODEL (or OLLAMA_MODEL) "
                "in your .env — e.g. ORCHESTRATOR_MODEL=qwen3:4b — and make sure "
                "`ollama pull qwen3:4b` has been run."
            )
        self.model = model
        self.base_url = base_url.rstrip("/")

    def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {"temperature": 0.0},
        }
        if tools:
            payload["tools"] = tools

        response = requests.post(f"{self.base_url}/api/chat", json=payload, timeout=120)
        response.raise_for_status()
        return response.json()
