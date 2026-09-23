from agents.document_agent import DocumentAgent
from orchestrator.tool_schema import build_tool_schema


def test_build_tool_schema_from_document_agent():
    schema = build_tool_schema([DocumentAgent(pipeline=object())])

    assert len(schema) == 1
    tool = schema[0]
    assert tool["type"] == "function"
    assert tool["function"]["name"] == "document_agent"
    assert "manuals" in tool["function"]["description"]
    assert tool["function"]["parameters"]["required"] == ["task"]
    assert "task" in tool["function"]["parameters"]["properties"]
