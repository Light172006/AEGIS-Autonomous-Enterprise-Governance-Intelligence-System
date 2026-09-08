from agents.document_agent import DocumentAgent
from rag.models import Evidence, RagAnswer


class FakePipeline:
    def __init__(self, answer):
        self.answer_obj = answer
        self.asked = None
        self.top_k = None

    def ask(self, question, top_k=5):
        self.asked = question
        self.top_k = top_k
        return self.answer_obj


def test_document_agent_wraps_a_successful_answer():
    citation = {"document_name": "P102_manual.pdf", "section": "4. Technical Specifications"}
    evidence = [Evidence(text="Normal discharge pressure: 3.5-4.2 bar.", metadata=citation, score=0.91)]
    answer = RagAnswer(
        answer="The normal discharge pressure is 3.5-4.2 bar.",
        status="answered",
        citations=[citation],
        evidence=evidence,
    )
    pipeline = FakePipeline(answer)
    agent = DocumentAgent(pipeline=pipeline)

    result = agent.run("What is the normal discharge pressure of P-102?")

    assert pipeline.asked == "What is the normal discharge pressure of P-102?"
    assert pipeline.top_k == 5
    assert result.agent_name == "document_agent"
    assert result.status == "answered"
    assert result.output == "The normal discharge pressure is 3.5-4.2 bar."
    assert result.citations == [citation]
    assert result.raw_evidence_count == 1
    assert result.top_score == 0.91


def test_document_agent_reports_insufficient_evidence_with_no_score():
    answer = RagAnswer(answer="insufficient evidence", status="insufficient_evidence")
    agent = DocumentAgent(pipeline=FakePipeline(answer))

    result = agent.run("What is the pump color?")

    assert result.status == "insufficient_evidence"
    assert result.raw_evidence_count == 0
    assert result.top_score is None
