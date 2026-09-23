#!/usr/bin/env python3
"""Ask the AEGIS orchestrator a question — it decides which agent(s) to call.

Usage:
    python scripts/run_orchestrator.py "What is the max discharge pressure for P-102?"

Requires Ollama running locally with a Qwen3 model pulled and set as
ORCHESTRATOR_MODEL (or OLLAMA_MODEL) in .env, and the P-102 manual already
ingested via scripts/ingest_p102.py.
"""

from __future__ import annotations

import argparse
import sys

from agents.document_agent import DocumentAgent
from orchestrator.orchestrator import Orchestrator


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("goal", help="The question or task to hand to the orchestrator")
    args = parser.parse_args()

    orchestrator = Orchestrator(agents=[DocumentAgent()])
    decision = orchestrator.handle(args.goal)

    print(decision.answer)
    print(f"\nStatus: {decision.status}")

    if decision.requires_approval:
        print(f"Needs human approval: {decision.reasoning}")

    if decision.agent_calls:
        print("\nAgent calls:")
        for call in decision.agent_calls:
            print(f"- {call.agent_name} [{call.status}]: {call.task}")


if __name__ == "__main__":
    try:
        main()
    except RuntimeError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
