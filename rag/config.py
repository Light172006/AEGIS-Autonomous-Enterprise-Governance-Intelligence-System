"""Configuration for the AEGIS RAG component."""

from __future__ import annotations

from dataclasses import dataclass
import os
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class RagConfig:
    data_dir: Path = PROJECT_ROOT / "data"
    vector_db_dir: Path = PROJECT_ROOT / "vector_db" / "chroma"
    collection_name: str = "aegis_p102"
    embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    llm_provider: str = "ollama"
    llm_model: str = "openai/gpt-4o-mini"
    openrouter_api_key: str | None = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1/chat/completions"
    ollama_model: str = ""
    ollama_base_url: str = "http://localhost:11434"

    @classmethod
    def from_env(cls) -> "RagConfig":
        try:
            from dotenv import load_dotenv
        except ImportError:
            pass
        else:
            load_dotenv(PROJECT_ROOT / ".env")

        return cls(
            data_dir=Path(os.getenv("AEGIS_DATA_DIR", PROJECT_ROOT / "data")),
            vector_db_dir=Path(os.getenv("AEGIS_VECTOR_DB_DIR", PROJECT_ROOT / "vector_db" / "chroma")),
            collection_name=os.getenv("AEGIS_COLLECTION_NAME", "aegis_p102"),
            embedding_model_name=os.getenv(
                "AEGIS_EMBEDDING_MODEL",
                "sentence-transformers/all-MiniLM-L6-v2",
            ),
            llm_provider=os.getenv(
                "AEGIS_LLM_PROVIDER",
                os.getenv("LLM_PROVIDER", "ollama"),
            ),
            llm_model=os.getenv("AEGIS_LLM_MODEL", "openai/gpt-4o-mini"),
            openrouter_api_key=os.getenv("OPENROUTER_API_KEY"),
            openrouter_base_url=os.getenv(
                "OPENROUTER_BASE_URL",
                "https://openrouter.ai/api/v1/chat/completions",
            ),
            ollama_model=os.getenv("OLLAMA_MODEL", ""),
            ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434"),
        )


def find_p102_pdf(data_dir: Path) -> Path:
    matches = sorted(
        path
        for path in data_dir.glob("*.pdf")
        if "p-102" in path.name.lower() or "p102" in path.name.lower()
    )
    if not matches:
        raise FileNotFoundError(
            f"No P-102 PDF found in {data_dir}. Place the manual in data/ with 'P-102' in the filename."
        )
    return matches[0]
