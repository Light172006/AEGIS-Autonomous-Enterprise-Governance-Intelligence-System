"""Ollama-backed local LLM provider."""

from __future__ import annotations

import requests

from rag.llm.base import LlmProvider


class OllamaProvider(LlmProvider):
    def __init__(self, model: str, base_url: str = "http://localhost:11434") -> None:
        if not model:
            raise RuntimeError("OLLAMA_MODEL is not set.")
        self.model = model
        self.base_url = base_url.rstrip("/")

    def generate(self, prompt: str) -> str:
        response = requests.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.0},
            },
            timeout=60,
        )
        response.raise_for_status()
        payload = response.json()
        return payload["response"].strip()
