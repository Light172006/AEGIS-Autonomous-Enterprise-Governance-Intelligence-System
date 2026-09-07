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

Create a local `.env` from `.env.example`. The default provider is Ollama, which is the local model runtime. Set
`OLLAMA_BASE_URL` and `OLLAMA_MODEL` to the Ollama endpoint and the Qwen model tag available on the machine.
OpenRouter remains an optional development provider; select it with `AEGIS_LLM_PROVIDER=openrouter` and set
`OPENROUTER_API_KEY`.

## Local LLM Configuration

Ollama serves the local Qwen model through its local HTTP API. The RAG pipeline sends the grounded prompt, including
only retrieved evidence, to the selected provider. The provider does not perform retrieval.

Example local configuration:

```text
AEGIS_LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

The model tag is configurable and is only an example; use the Qwen tag installed in the local Ollama runtime.

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
