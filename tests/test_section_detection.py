from pathlib import Path

from rag.chunking.semantic_chunker import SemanticChunker
from rag.ingestion.pdf_loader import PdfLoader
from rag.ingestion.section_detector import SectionDetector
from rag.ingestion.text_cleaner import TextCleaner


def test_p102_section_metadata_is_preserved_across_pages_and_headings():
    pdf_path = Path(__file__).parents[1] / "data" / "P102_manual.pdf"
    pages = TextCleaner().clean_pages(PdfLoader().load(pdf_path))
    blocks = SectionDetector().assign_sections(pages)
    chunks = SemanticChunker(max_words=260, overlap_words=45).chunk(blocks)

    page_sections = {
        (chunk.page_start, chunk.section)
        for chunk in chunks
        if chunk.page_start in {4, 5, 6}
    }

    assert (4, "8. Normal Operation") in page_sections
    assert (4, "9. Shutdown Procedure") in page_sections
    assert (4, "10. Troubleshooting") in page_sections
    assert (5, "13. Alarm Reference") in page_sections
    assert (5, "14. Inspection Checklist") in page_sections
    assert (5, "15. Agent / RAG Test Questions") in page_sections
    assert (6, "15. Agent / RAG Test Questions") in page_sections
    assert all(section != "5.5 Motor M-102 — Simulated electric driver connected to the pump through a coupling." for _, section in page_sections)

    high_pressure = next(
        chunk for chunk in chunks if "High discharge pressure" in chunk.text
    )
    assert high_pressure.page_start == 4
    assert high_pressure.section == "10. Troubleshooting"
