from agents.base import Agent
from agents.models import AgentResult
from orchestrator.config import OrchestratorConfig
from orchestrator.orchestrator import Orchestrator
from orchestrator.safety import SafetyGuard


class FakeAgent(Agent):
    name = "document_agent"
    description = "Answers questions about manuals."

    def __init__(self, result):
        self.result = result
        self.received_task = None

    def run(self, task):
        self.received_task = task
        return self.result


class FakeChatClient:
    def __init__(self, response):
        self.response = response
        self.last_messages = None
        self.last_tools = None

    def chat(self, messages, tools=None):
        self.last_messages = messages
        self.last_tools = tools
        return self.response


def make_orchestrator(agent, chat_response):
    config = OrchestratorConfig(low_confidence_threshold=0.35)
    return Orchestrator(
        agents=[agent],
        config=config,
        chat_client=FakeChatClient(chat_response),
        safety_guard=SafetyGuard(config),
    )


def test_routes_to_the_agent_the_model_calls():
    agent = FakeAgent(
        AgentResult(
            agent_name="document_agent",
            status="answered",
            output="3.5-4.2 bar",
            top_score=0.9,
        )
    )
    chat_response = {
        "message": {
            "tool_calls": [
                {"function": {"name": "document_agent", "arguments": {"task": "max discharge pressure"}}}
            ]
        }
    }
    orchestrator = make_orchestrator(agent, chat_response)

    decision = orchestrator.handle("What is the max discharge pressure for P-102?")

    assert agent.received_task == "max discharge pressure"
    assert decision.answer == "3.5-4.2 bar"
    assert decision.status == "answered"
    assert decision.requires_approval is False
    assert len(decision.agent_calls) == 1
    assert decision.agent_calls[0].agent_name == "document_agent"


def test_falls_back_to_only_agent_when_model_skips_tool_call():
    agent = FakeAgent(
        AgentResult(agent_name="document_agent", status="answered", output="ok", top_score=0.9)
    )
    chat_response = {"message": {"content": "I'll just answer directly."}}
    orchestrator = make_orchestrator(agent, chat_response)

    decision = orchestrator.handle("What is the max discharge pressure for P-102?")

    assert agent.received_task == "What is the max discharge pressure for P-102?"
    assert decision.status == "answered"


def test_insufficient_evidence_flags_for_human_approval():
    agent = FakeAgent(
        AgentResult(agent_name="document_agent", status="insufficient_evidence", output="insufficient evidence")
    )
    chat_response = {
        "message": {
            "tool_calls": [{"function": {"name": "document_agent", "arguments": {"task": "pump color"}}}]
        }
    }
    orchestrator = make_orchestrator(agent, chat_response)

    decision = orchestrator.handle("What color is the pump?")

    assert decision.status == "needs_human_approval"
    assert decision.requires_approval is True
    assert decision.answer == "insufficient evidence"


def test_no_tool_call_and_multiple_agents_returns_insufficient_evidence():
    agent_a = FakeAgent(AgentResult(agent_name="document_agent", status="answered", output="ok"))

    class OtherAgent(Agent):
        name = "vision_agent"
        description = "Reads diagrams."

        def run(self, task):
            return AgentResult(agent_name="vision_agent", status="answered", output="ok")

    chat_response = {"message": {"content": "unsure"}}
    config = OrchestratorConfig(low_confidence_threshold=0.35)
    orchestrator = Orchestrator(
        agents=[agent_a, OtherAgent()],
        config=config,
        chat_client=FakeChatClient(chat_response),
        safety_guard=SafetyGuard(config),
    )

    decision = orchestrator.handle("Ambiguous goal")

    assert decision.status == "insufficient_evidence"
    assert decision.requires_approval is True
    assert decision.agent_calls == []
