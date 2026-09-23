"""Section detection for manual-style documents."""

from __future__ import annotations

import re

from rag.models import PageText, TextBlock


SECTION_PATTERN = re.compile(
    r"^\s*(?P<section>"
    r"Section\s+\d+(?:\.\d+)?\s*[:.-]\s*[^\n]+"
    r"|"
    r"\d+\.\s+[^\n]+"
    r")\s*$",
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
                match = self._match_heading(candidate) if candidate else None
                if match:
                    self._append_block(blocks, page, current_section, page_lines)
                    current_section = self._normalize_section(match.group("section"))
                    page_lines = [line]
                else:
                    page_lines.append(line)

            self._append_block(blocks, page, current_section, page_lines)
        return blocks

    def _match_heading(self, candidate: str) -> re.Match[str] | None:
        match = SECTION_PATTERN.match(candidate)
        if not match:
            return None

        section = match.group("section").strip()
        if re.match(r"^\d+\.\s+", section):
            title = re.sub(r"^\d+\.\s+", "", section)
            # Numbered instructions also start with an integer and a period.
            # Headings in this manual are short title-like lines without
            # sentence punctuation or comma-separated instructions.
            if (
                not title
                or not title[0].isupper()
                or len(title) > 80
                or "," in title
                or title[-1] in ".!?;:"
            ):
                return None
        return match

    def _append_block(
        self,
        blocks: list[TextBlock],
        page: PageText,
        section: str | None,
        lines: list[str],
    ) -> None:
        text = "\n".join(lines).strip()
        if not text:
            return
        blocks.append(
            TextBlock(
                document_name=page.document_name,
                source_path=page.source_path,
                page_number=page.page_number,
                section=section,
                text=text,
            )
        )

    def _normalize_section(self, section: str) -> str:
        normalized = re.sub(r"\s+", " ", section).strip()
        return re.sub(r"\s*/\s*", " / ", normalized)
