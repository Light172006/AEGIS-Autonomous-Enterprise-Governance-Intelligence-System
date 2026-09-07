from rag.generation.prompt_builder import PromptBuilder
from rag.models import Evidence


def test_prompt_requires_insufficient_evidence():
    prompt = PromptBuilder().build(
        "What is the bearing temperature?",
        [
            Evidence(
                text="Normal discharge pressure is 3.5-4.2 bar.",
                metadata={
                    "document_name": "P-102 Manual.pdf",
                    "section": "Section 4: Technical Specifications",
                    "page_start": 4,
                    "page_end": 4,
                    "chunk_id": "chunk-1",
                },
            )
        ],
    )

    assert "insufficient evidence" in prompt
    assert "Do not use outside knowledge" in prompt
    assert "Section 4: Technical Specifications" in prompt

