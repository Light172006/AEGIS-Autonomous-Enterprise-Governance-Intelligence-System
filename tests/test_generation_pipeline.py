from rag.config import RagConfig
from rag.generation.answer_generator import AnswerGenerator
from rag.models import Evidence
from rag.pipeline import RagPipeline


class FakeEmbeddingProvider:
    def embed_query(self, query):
        assert query == "What is the normal discharge pressure of P-102?"
        return [1.0, 0.0]


class FakeVectorStore:
    def __init__(self, evidence):
        self.evidence = evidence
        self.query_embedding = None
        self.top_k = None

    def query(self, query_embedding, top_k=5):
        self.query_embedding = query_embedding
        self.top_k = top_k
        return self.evidence


class FakeLlm:
    def __init__(self):
        self.prompts = []

    def generate(self, prompt):
        self.prompts.append(prompt)
        return "The normal discharge pressure of P-102 is 3.5-4.2 bar."


def test_pipeline_connects_retrieval_to_grounded_generation():
    metadata = {
        "document_name": "P102_manual.pdf",
        "page_start": 3,
        "page_end": 3,
        "section": "4. Technical Specifications",
        "chunk_id": "P102_manual.pdf:chunk-0012",
    }
    evidence = [
        Evidence(
            text="Normal discharge pressure: 3.5-4.2 bar.",
            metadata=metadata,
            score=0.97,
            distance=0.03,
        )
    ]
    vector_store = FakeVectorStore(evidence)
    llm = FakeLlm()
    pipeline = RagPipeline(
        config=RagConfig(openrouter_api_key=None),
        embedding_provider=FakeEmbeddingProvider(),
        vector_store=vector_store,
        answer_generator=AnswerGenerator(llm),
    )

    result = pipeline.ask("What is the normal discharge pressure of P-102?", top_k=1)

    assert vector_store.query_embedding == [1.0, 0.0]
    assert vector_store.top_k == 1
    assert len(llm.prompts) == 1
    assert "Normal discharge pressure: 3.5-4.2 bar." in llm.prompts[0]
    assert "P102_manual.pdf" in llm.prompts[0]
    assert "4. Technical Specifications" in llm.prompts[0]
    assert "P102_manual.pdf:chunk-0012" in llm.prompts[0]
    assert "unretrieved factual claim" not in llm.prompts[0]

    assert result.answer == "The normal discharge pressure of P-102 is 3.5-4.2 bar."
    assert result.status == "answered"
    assert result.citations == [metadata]
    assert result.evidence == evidence


def test_answer_generator_returns_insufficient_evidence_without_calling_llm():
    llm = FakeLlm()

    result = AnswerGenerator(llm).answer("What is the pump color?", [])

    assert result.answer == "insufficient evidence"
    assert result.status == "insufficient_evidence"
    assert result.citations == []
    assert result.evidence == []
    assert llm.prompts == []
