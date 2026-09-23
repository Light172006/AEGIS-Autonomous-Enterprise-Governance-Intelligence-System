from rag.chunking.semantic_chunker import SemanticChunker
from rag.models import TextBlock


def test_chunker_preserves_metadata():
    block = TextBlock(
        document_name="P-102 Manual.pdf",
        source_path="data/P-102 Manual.pdf",
        page_number=4,
        section="Section 4: Technical Specifications",
        text="Normal discharge pressure is 3.5-4.2 bar. Flow rate is listed separately.",
    )

    chunks = SemanticChunker(max_words=20, overlap_words=5).chunk([block])

    assert len(chunks) == 1
    assert chunks[0].document_name == "P-102 Manual.pdf"
    assert chunks[0].page_start == 4
    assert chunks[0].section == "Section 4: Technical Specifications"
    assert "3.5-4.2 bar" in chunks[0].text

