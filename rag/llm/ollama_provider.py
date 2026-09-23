"""Ollama-backed local LLM provider."""

from __future__ import annotations

import re

import requests

from rag.llm.base import LlmProvider


def _strip_think_tags(text: str) -> str:
    """Remove Qwen3's <think>...</think> reasoning blocks from output."""
    return re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()


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
                "options": {
                    "temperature": 0.0,
                    "num_ctx": 8192,
                },
            },
            timeout=900,
        )
        try:
            response.raise_for_status()
        except requests.exceptions.HTTPError as e:
            raise Exception(f"Ollama returned HTTP {response.status_code}: {response.text}") from e
        
        payload = response.json()
        return _strip_think_tags(payload["response"])

