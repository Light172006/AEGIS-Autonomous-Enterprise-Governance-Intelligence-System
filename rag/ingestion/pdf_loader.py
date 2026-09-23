"""PDF text extraction."""

from __future__ import annotations

from pathlib import Path

from rag.models import PageText


class PdfLoader:
    def load(self, pdf_path: Path) -> list[PageText]:
        try:
            import fitz
        except ImportError as exc:
            raise RuntimeError("PyMuPDF is required for PDF ingestion. Install dependencies from requirements.txt.") from exc

        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF not found: {pdf_path}")

        pages: list[PageText] = []
        with fitz.open(pdf_path) as doc:
            for index, page in enumerate(doc, start=1):
                text = page.get_text("text")
                pages.append(
                    PageText(
                        document_name=pdf_path.name,
                        source_path=str(pdf_path),
                        page_number=index,
                        text=text,
                    )
                )
        return pages

