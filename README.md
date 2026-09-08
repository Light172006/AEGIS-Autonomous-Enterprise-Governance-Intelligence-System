# AEGIS — Sovereign On-Premise Agentic AI Workbench

AEGIS is a Sovereign On-Premise Agentic AI Workbench. This repository currently
contains the RAG component for the first P-102 manual milestone, plus a
**Document Agent** and an **Orchestrator** that routes goals to it using
Qwen3's native tool-calling.

```
Engineer → Goal → Orchestrator → [Document Agent | Vision Agent | Data Agent]
                       ↓
                Evidence Verification → Decision → Safety Guard
```

Only the Document Agent exists today. The Orchestrator is written so a Vision
Agent or Data Agent can be registered later without changing any orchestrator
code — see "Adding a new agent" below.

## Scope

The current pipeline supports:

- PDF text extraction
- text cleaning
- section-aware chunking
- local embeddings
- local Chroma vector storage
- semantic retrieval with metadata
- grounded answer generation through a configurable LLM provider
- a Document Agent wrapping that pipeline as an Orchestrator-callable capability
- an Orchestrator that routes a goal to the right agent(s) via Qwen3 tool-calling,
  with a Safety Guard that flags low-confidence or unverifiable answers for human review

It does not yet include the frontend, backend API, authentication, application
database, Vision Agent, Data Agent, Action Agent, Workflow Engine, or Simulated
Environment.

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

Create a local `.env` from `.env.example`. The default provider is Ollama, which is
the local model runtime. Set `OLLAMA_BASE_URL` and `OLLAMA_MODEL` to the Ollama
endpoint and the Qwen model tag available on the machine. OpenRouter remains an
optional development provider; select it with `AEGIS_LLM_PROVIDER=openrouter` and
set `OPENROUTER_API_KEY`.

## Local LLM Configuration

Ollama serves the local Qwen model through its local HTTP API. The RAG pipeline
sends the grounded prompt, including only retrieved evidence, to the selected
provider. The provider does not perform retrieval.

Example local configuration:

```text
AEGIS_LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
```

The model tag is configurable and is only an example; use the Qwen tag installed
in the local Ollama runtime.

## Ingest

```bash
python scripts/ingest_p102.py
```

## Ask (RAG pipeline directly)

```bash
python scripts/ask_rag.py "What is the normal discharge pressure of P-102?"
```

Expected grounded answer after the manual is ingested:

```text
The normal discharge pressure of P-102 is 3.5-4.2 bar.
```

The source should cite the P-102 manual section containing the technical
specifications.

## Backend Integration

The backend can later call the pipeline directly:

```python
from rag.pipeline import RagPipeline

answer = RagPipeline().ask("What is the normal discharge pressure of P-102?")
```

The returned object includes the answer, status, citations, and retrieved
evidence. Or, to go through the Orchestrator instead (recommended once more
than one agent exists):

```python
from agents.document_agent import DocumentAgent
from orchestrator.orchestrator import Orchestrator

orchestrator = Orchestrator(agents=[DocumentAgent()])
decision = orchestrator.handle("What is the normal discharge pressure of P-102?")
```

`decision` includes the answer, status, the full audit trail of which agents
were called with what task, and whether a human needs to sign off.

---

## Document Agent & Orchestrator

This layer doesn't replace the RAG pipeline above — it's the same retrieval,
chunking, and grounded generation, just made callable by something that can
decide *when* to call it.

### Why an Orchestrator on top of the RAG pipeline?

The RAG pipeline alone can only do one thing: answer a question from
documents. The Orchestrator's job is to decide *whether* that's even the
right tool for a given goal, using Qwen3's tool-calling to make that decision
instead of hardcoding "always call the Document Agent." With one agent
registered this looks almost trivial — but it's the seam where a second and
third agent plug in later, and it's also where trust decisions live: the
Orchestrator runs every result through a **Safety Guard** before calling
anything "answered," flagging low-confidence or unverifiable answers for a
human instead of presenting them with false confidence.

### New files

```
agents/
├── __init__.py
├── base.py              # Agent interface — every capability implements this
├── models.py            # AgentResult — the shape every agent returns
└── document_agent.py    # Wraps RagPipeline as a callable Agent

orchestrator/
├── __init__.py
├── config.py             # Reads ORCHESTRATOR_MODEL / OLLAMA_MODEL etc. from .env
├── models.py              # AgentCallRecord, OrchestratorDecision
├── tool_schema.py         # Builds Ollama tool-calling schemas from registered agents
├── ollama_chat_client.py  # Talks to Ollama's /api/chat (tool-calling), not /api/generate
├── safety.py              # SafetyGuard — decides if a result needs human approval
└── orchestrator.py        # The Orchestrator itself

scripts/
└── run_orchestrator.py    # CLI: python scripts/run_orchestrator.py "your question"

tests/
├── test_document_agent.py
├── test_safety_guard.py
├── test_tool_schema.py
└── test_orchestrator.py
```

### Additional setup for the Orchestrator

1. Pull a Qwen3 model that supports tool-calling, e.g.:
   ```
   ollama pull qwen3:4b
   ```
2. Add to your `.env` (on top of what's already there):
   ```
   ORCHESTRATOR_MODEL=qwen3:4b          # falls back to OLLAMA_MODEL if unset
   ORCHESTRATOR_MAX_AGENT_CALLS=3
   ORCHESTRATOR_CONFIDENCE_THRESHOLD=0.35
   ```
3. Run it:
   ```
   python scripts/run_orchestrator.py "What is the max discharge pressure for P-102?"
   ```

### How a request flows

1. `run_orchestrator.py` builds an `Orchestrator` with the `DocumentAgent`
   registered.
2. `Orchestrator.handle(goal)` sends the goal to Qwen3 via `OllamaChatClient`,
   along with a tool schema built from every registered agent's name and
   description.
3. Qwen3 decides whether to call a tool, and with what task text. If it calls
   `document_agent`, the Orchestrator runs `DocumentAgent.run(task)`, which
   calls into `RagPipeline.ask(...)` — same grounded retrieval and
   "insufficient evidence" behaviour as above.
4. Every agent result passes through `SafetyGuard.needs_approval(...)`, which
   flags the result for human review if evidence was insufficient, the agent
   errored, or the top evidence match scored below
   `ORCHESTRATOR_CONFIDENCE_THRESHOLD`.
5. `Orchestrator.handle(...)` returns an `OrchestratorDecision` — the answer,
   its status, the full audit trail of which agents were called with what
   task, and whether a human needs to sign off.

### Adding a new agent (e.g. a Vision Agent later)

1. Implement the `Agent` interface in `agents/base.py` — a `name`, a
   `description` (this is what Qwen3 reads to decide when to call it), and a
   `run(task) -> AgentResult` method.
2. Register it: `Orchestrator(agents=[DocumentAgent(), VisionAgent()])`.

No other code changes — the tool schema, routing, and safety checks are all
agent-agnostic already.

### What this does not do yet

- No Action Agent, Workflow Engine, or Simulated Environment — the
  Orchestrator currently only ever *investigates*, it never takes an action.
  `SafetyGuard` is written to grow into gating actions once one exists.
- `Orchestrator._compose_answer` is a simple pass-through with one agent.
  Once a second agent exists, this is the point to reconcile conflicting
  evidence between sources rather than just concatenating outputs.
- The single-agent fallback in `Orchestrator.handle` (routing to the only
  registered agent if Qwen3 answers in plain text instead of calling a tool)
  stops applying the moment a second agent is registered — at that point a
  missed tool call correctly surfaces as `insufficient_evidence` rather than
  being silently guessed.

### Tests

```
pytest tests/ -q
```

All new modules are tested against fakes (`FakeAgent`, `FakeChatClient`) — no
live Ollama connection is required to run the test suite, matching how the
existing RAG tests already work.
