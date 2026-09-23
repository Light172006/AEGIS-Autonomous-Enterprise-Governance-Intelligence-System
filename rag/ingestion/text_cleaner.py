"""Text cleanup for industrial manuals."""

from __future__ import annotations

import re

from rag.models import PageText


class TextCleaner:
    def clean_pages(self, pages: list[PageText]) -> list[PageText]:
        return [
            PageText(
                document_name=page.document_name,
                source_path=page.source_path,
                page_number=page.page_number,
                text=self.clean_text(page.text),
            )
            for page in pages
        ]

    def clean_text(self, text: str) -> str:
        text = text.replace("\x00", " ")
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"(?<=\w)-\n(?=\w)", "", text)
        text = re.sub(r"(?<![.:;!?])\n(?=[a-z])", " ", text)
        return text.strip()

