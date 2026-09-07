#!/usr/bin/env python3
"""Ingest the P-102 manual into the local vector database."""

from __future__ import annotations

from rag.config import RagConfig, find_p102_pdf
from rag.pipeline import RagPipeline


def main() -> None:
    config = RagConfig.from_env()
    pdf_path = find_p102_pdf(config.data_dir)
    pipeline = RagPipeline(config)
    chunks = pipeline.ingest_pdf(pdf_path)
    print(f"Ingested {len(chunks)} chunks from {pdf_path}")


if __name__ == "__main__":
    main()

