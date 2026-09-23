from agents.models import AgentResult
from orchestrator.config import OrchestratorConfig
from orchestrator.safety import SafetyGuard


def make_guard(threshold=0.35):
    return SafetyGuard(OrchestratorConfig(low_confidence_threshold=threshold))


def test_no_results_requires_approval():
    needs_approval, reasoning = make_guard().needs_approval([])
    assert needs_approval is True
    assert "No agent" in reasoning


def test_insufficient_evidence_requires_approval():
    result = AgentResult(agent_name="document_agent", status="insufficient_evidence", output="insufficient evidence")
    needs_approval, reasoning = make_guard().needs_approval([result])
    assert needs_approval is True
    assert "insufficient evidence" in reasoning


def test_error_requires_approval():
    result = AgentResult(agent_name="document_agent", status="error", output="")
    needs_approval, reasoning = make_guard().needs_approval([result])
    assert needs_approval is True
    assert "failed" in reasoning


def test_low_confidence_score_requires_approval():
    result = AgentResult(
        agent_name="document_agent", status="answered", output="ok", top_score=0.2
    )
    needs_approval, reasoning = make_guard(threshold=0.35).needs_approval([result])
    assert needs_approval is True
    assert "0.20" in reasoning


def test_confident_answer_does_not_require_approval():
    result = AgentResult(
        agent_name="document_agent", status="answered", output="ok", top_score=0.9
    )
    needs_approval, reasoning = make_guard(threshold=0.35).needs_approval([result])
    assert needs_approval is False
    assert reasoning == ""
