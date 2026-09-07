"""Simple section detection for manual-style documents."""

from __future__ import annotations

import re

from rag.models import PageText, TextBlock


SECTION_PATTERN = re.compile(
    r"^\s*(Section\s+\d+(?:\.\d+)?\s*[:.-]\s*[^\n]+|\d+(?:\.\d+)*\s+[A-Z][^\n]{3,80})\s*$",
    re.IGNORECASE,
)


class SectionDetector:
    def assign_sections(self, pages: list[PageText]) -> list[TextBlock]:
        blocks: list[TextBlock] = []
        current_section: str | None = None

        for page in pages:
            page_lines: list[str] = []
            for line in page.text.splitlines():
                candidate = line.strip()
                if candidate:
                    match = SECTION_PATTERN.match(candidate)
                    if match:
                        current_section = self._normalize_section(match.group(1))
                page_lines.append(line)

            blocks.append(
                TextBlock(
                    document_name=page.document_name,
                    source_path=page.source_path,
                    page_number=page.page_number,
                    section=current_section,
                    text="\n".join(page_lines).strip(),
                )
            )
        return blocks

    def _normalize_section(self, section: str) -> str:
        return re.sub(r"\s+", " ", section).strip()

