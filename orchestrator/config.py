"""Configuration for the AEGIS Orchestrator.

Mirrors the pattern already used in rag/config.py so both configs behave the
same way (load a .env file if python-dotenv is available, fall back to
os.environ otherwise).
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class OrchestratorConfig:
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = ""
    max_agent_calls: int = 3
    low_confidence_threshold: float = 0.35

    @classmethod
    def from_env(cls) -> "OrchestratorConfig":
        try:
            from dotenv import load_dotenv
        except ImportError:
            pass
        else:
            load_dotenv(PROJECT_ROOT / ".env")

        return cls(
            ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
            # Falls back to OLLAMA_MODEL so the Document Agent's answer model
            # and the Orchestrator's routing model can be the same Qwen3 tag
            # unless you deliberately set them differently.
            ollama_model=os.getenv("ORCHESTRATOR_MODEL", os.getenv("OLLAMA_MODEL", "")),
            max_agent_calls=int(os.getenv("ORCHESTRATOR_MAX_AGENT_CALLS", "3")),
            low_confidence_threshold=float(
                os.getenv("ORCHESTRATOR_CONFIDENCE_THRESHOLD", "0.35")
            ),
        )
