from scripts import ask_rag
from rag.models import Evidence


def test_print_retrieved_evidence_includes_metadata(capsys):
    evidence = [
        Evidence(
            text="Normal discharge pressure is 3.5-4.2 bar.",
            metadata={
                "document_name": "P-102 Manual.pdf",
                "section": "Section 4: Technical Specifications",
                "page_start": 4,
                "page_end": 4,
                "chunk_id": "P-102 Manual.pdf:chunk-0004",
            },
            score=0.91,
            distance=0.10,
        )
    ]

    ask_rag.print_retrieved_evidence(evidence)

    output = capsys.readouterr().out
    assert "P-102 Manual.pdf" in output
    assert "Section 4: Technical Specifications" in output
    assert "Pages: 4-4" in output
    assert "P-102 Manual.pdf:chunk-0004" in output
    assert "Similarity score: 0.9100" in output
    assert "Distance: 0.1000" in output
    assert "3.5-4.2 bar" in output


def test_retrieve_only_cli_does_not_call_llm(monkeypatch, capsys):
    evidence = [
        Evidence(
            text="Normal discharge pressure is 3.5-4.2 bar.",
            metadata={
                "document_name": "P102_manual.pdf",
                "section": "4. Technical Specifications",
                "page_start": 3,
                "page_end": 3,
                "chunk_id": "chunk-0012",
            },
        )
    ]

    class FakePipeline:
        def retrieve(self, question, top_k):
            assert question == "What is the normal discharge pressure?"
            assert top_k == 1
            return evidence

        def ask(self, question, top_k):
            raise AssertionError("retrieve-only mode must not call the LLM")

    monkeypatch.setattr(ask_rag, "RagPipeline", FakePipeline)
    monkeypatch.setattr(
        "sys.argv",
        [
            "ask_rag.py",
            "What is the normal discharge pressure?",
            "--top-k",
            "1",
            "--retrieve-only",
        ],
    )

    ask_rag.main()

    assert "Normal discharge pressure is 3.5-4.2 bar." in capsys.readouterr().out
