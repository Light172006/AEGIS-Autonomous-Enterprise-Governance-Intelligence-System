# AEGIS RAG Component

AEGIS is a Sovereign On-Premise Agentic AI Workbench. This repository currently contains only the RAG component for the first P-102 manual milestone.

## Scope

The current pipeline supports:

- PDF text extraction
- text cleaning
- section-aware chunking
- local embeddings
- local Chroma vector storage
- semantic retrieval with metadata
- grounded answer generation through a configurable LLM provider

It does not include the frontend, backend API, authentication, application database, Vision Agent, Data Agent, or Orchestrator.

## Setup

Place the P-102 PDF in:

```text
data/
```

The filename should contain `P-102` or `P102`.

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a local `.env` from `.env.example` and set `OPENROUTER_API_KEY` if using OpenRouter for generation.

## Ingest

```bash
python scripts/ingest_p102.py
```

## Ask

```bash
python scripts/ask_rag.py "What is the normal discharge pressure of P-102?"
```

Expected grounded answer after the manual is ingested:

```text
The normal discharge pressure of P-102 is 3.5-4.2 bar.
```

The source should cite the P-102 manual section containing the technical specifications.

## Backend Integration

The backend can later call:

```python
from rag.pipeline import RagPipeline

answer = RagPipeline().ask("What is the normal discharge pressure of P-102?")
```

The returned object includes the answer, status, citations, and retrieved evidence.
