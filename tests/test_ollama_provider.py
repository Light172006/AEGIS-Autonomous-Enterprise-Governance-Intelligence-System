import pytest

from rag.config import RagConfig
from rag.llm.factory import build_llm_provider
from rag.llm.ollama_provider import OllamaProvider
from rag.llm.openrouter_provider import OpenRouterProvider


class FakeResponse:
    def __init__(self, payload):
        self.payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self.payload


def test_ollama_provider_implements_generate_without_network(monkeypatch):
    calls = []

    def fake_post(url, json, timeout):
        calls.append((url, json, timeout))
        return FakeResponse({"response": " grounded answer "})

    monkeypatch.setattr("rag.llm.ollama_provider.requests.post", fake_post)

    provider = OllamaProvider(
        model="qwen2.5:7b",
        base_url="http://ollama.local/",
    )
    result = provider.generate("Answer using the evidence.")

    assert result == "grounded answer"
    assert calls == [
        (
            "http://ollama.local/api/generate",
            {
                "model": "qwen2.5:7b",
                "prompt": "Answer using the evidence.",
                "stream": False,
                "options": {"temperature": 0.0},
            },
            60,
        )
    ]


def test_factory_selects_ollama_by_default_configuration():
    assert RagConfig().llm_provider == "ollama"

    provider = build_llm_provider(
        RagConfig(
            llm_provider="ollama",
            ollama_model="configured-qwen-model",
        )
    )

    assert isinstance(provider, OllamaProvider)
    assert provider.model == "configured-qwen-model"
    assert provider.base_url == "http://localhost:11434"


def test_factory_keeps_openrouter_as_an_optional_provider():
    provider = build_llm_provider(
        RagConfig(
            llm_provider="openrouter",
            openrouter_api_key="test-key",
        )
    )

    assert isinstance(provider, OpenRouterProvider)


def test_ollama_provider_requires_a_configured_model():
    with pytest.raises(RuntimeError, match="OLLAMA_MODEL is not set"):
        OllamaProvider(model="")
