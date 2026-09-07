#!/usr/bin/env python3
"""Ask the local RAG pipeline a question."""

from __future__ import annotations

import argparse

from rag.models import Evidence
from rag.pipeline import RagPipeline


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("question")
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument(
        "--retrieve-only",
        action="store_true",
        help="Print retrieved evidence without calling the LLM.",
    )
    args = parser.parse_args()

    pipeline = RagPipeline()
    if args.retrieve_only:
        evidence = pipeline.retrieve(args.question, top_k=args.top_k)
        print_retrieved_evidence(evidence)
        return

    answer = pipeline.ask(args.question, top_k=args.top_k)
    print(answer.answer)
    if answer.citations:
        print("\nSources:")
        for citation in answer.citations:
            print(
                "- "
                f"{citation.get('document_name')} | "
                f"{citation.get('section')} | "
                f"pages {citation.get('page_start')}-{citation.get('page_end')} | "
                f"{citation.get('chunk_id')}"
            )


def print_retrieved_evidence(evidence: list[Evidence]) -> None:
    if not evidence:
        print("No evidence retrieved.")
        return

    for index, item in enumerate(evidence, start=1):
        metadata = item.metadata
        print(f"\n[{index}] {metadata.get('document_name', 'Unknown document')}")
        print(f"Section: {metadata.get('section', 'Unknown section')}")
        print(f"Pages: {metadata.get('page_start', '?')}-{metadata.get('page_end', '?')}")
        print(f"Chunk ID: {metadata.get('chunk_id', '?')}")
        if item.score is not None:
            print(f"Similarity score: {item.score:.4f}")
        if item.distance is not None:
            print(f"Distance: {item.distance:.4f}")
        print("Text:")
        print(item.text)


if __name__ == "__main__":
    main()
