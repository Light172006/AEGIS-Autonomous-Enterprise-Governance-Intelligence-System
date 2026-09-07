from scripts.ask_rag import print_retrieved_evidence
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

    print_retrieved_evidence(evidence)

    output = capsys.readouterr().out
    assert "P-102 Manual.pdf" in output
    assert "Section 4: Technical Specifications" in output
    assert "Pages: 4-4" in output
    assert "P-102 Manual.pdf:chunk-0004" in output
    assert "Similarity score: 0.9100" in output
    assert "Distance: 0.1000" in output
    assert "3.5-4.2 bar" in output
