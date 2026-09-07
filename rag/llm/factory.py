"""LLM provider factory."""

from __future__ import annotations

from rag.config import RagConfig
from rag.llm.base import LlmProvider


def build_llm_provider(config: RagConfig) -> LlmProvider:
    provider = config.llm_provider.lower().strip()
    if provider == "openrouter":
        from rag.llm.openrouter_provider import OpenRouterProvider

        return OpenRouterProvider(
            api_key=config.openrouter_api_key,
            model=config.llm_model,
            base_url=config.openrouter_base_url,
        )

    raise ValueError(
        f"Unsupported LLM provider: {config.llm_provider}. "
        "Supported providers currently: openrouter."
    )
