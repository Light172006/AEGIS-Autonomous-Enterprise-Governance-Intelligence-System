"""OpenRouter LLM provider."""

from __future__ import annotations

import requests

from rag.llm.base import LlmProvider


class OpenRouterProvider(LlmProvider):
    def __init__(self, api_key: str | None, model: str, base_url: str) -> None:
        if not api_key:
            raise RuntimeError("OPENROUTER_API_KEY is not set.")
        self.api_key = api_key
        self.model = model
        self.base_url = base_url

    def generate(self, prompt: str) -> str:
        response = requests.post(
            self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You answer industrial engineering questions using only the provided evidence.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.0,
            },
            timeout=60,
        )
        response.raise_for_status()
        payload = response.json()
        return payload["choices"][0]["message"]["content"].strip()

