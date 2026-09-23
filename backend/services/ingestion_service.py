"""Background document ingestion service with WebSocket progress reporting."""

import json
import logging
import threading
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from queue import Queue
from typing import Any

from sqlalchemy.orm import Session

import backend.database as database

logger = logging.getLogger(__name__)

# In-memory progress store: document_id -> {"stage": ..., "progress": ..., "filename": ...}
# WebSocket clients read from here.
_progress: dict[str, dict[str, Any]] = {}
# WebSocket subscribers: document_id -> list of thread-safe Queue objects
_subscribers: dict[str, list[Queue]] = defaultdict(list)


def get_progress(document_id: str) -> dict[str, Any] | None:
    return _progress.get(document_id)


def subscribe(document_id: str, queue):
    _subscribers[document_id].append(queue)


def unsubscribe(document_id: str, queue):
    if document_id in _subscribers:
        _subscribers[document_id] = [q for q in _subscribers[document_id] if q is not queue]


def _notify(document_id: str, stage: str, progress: int, filename: str):
    """Update progress and push to all WebSocket subscribers."""
    import asyncio
    update = {"stage": stage, "progress": progress, "filename": filename}
    _progress[document_id] = update
    for queue in _subscribers.get(document_id, []):
        try:
            queue.put_nowait(update)
        except Exception:
            pass


def run_ingestion_background(document_id: str, file_path: Path, filename: str):
    """Run PDF ingestion in a background thread. Updates DB and progress store."""
    thread = threading.Thread(
        target=_ingest_worker,
        args=(document_id, file_path, filename),
        daemon=True,
    )
    thread.start()


def _ingest_worker(document_id: str, file_path: Path, filename: str):
    """Worker that runs the full RAG ingestion pipeline."""
    from backend.models import AuditLog, Document
    
    # Access SessionLocal at call time (not import time) so we get the
    # live reference that init_db() has already set.
    if database.SessionLocal is None:
        logger.error("Database not initialized — cannot run ingestion")
        return
    db: Session = database.SessionLocal()
    try:
        doc = db.query(Document).filter(Document.id == document_id).first()
        if not doc:
            logger.error(f"Document {document_id} not found in DB")
            return
        
        # Update status to processing
        doc.status = "processing"
        db.commit()
        _notify(document_id, "text_extraction", 10, filename)
        
        # Run the RAG pipeline using the globally cached instance to prevent
        # memory leaks (duplicate PyTorch models) and Chroma DB locks.
        from backend.services.qa_service import get_orchestrator
        
        orchestrator = get_orchestrator()
        agent = orchestrator.agents.get("document_agent")
        pipeline = agent.pipeline
        
        _notify(document_id, "chunking", 30, filename)
        
        # ingest_pdf does: load -> clean -> section detect -> chunk -> embed -> upsert
        chunks = pipeline.ingest_pdf(file_path)
        
        _notify(document_id, "embedding", 60, filename)
        _notify(document_id, "vector_indexing", 80, filename)
        
        # Determine page count from chunks
        page_numbers = set()
        for chunk in chunks:
            for p in range(chunk.page_start, chunk.page_end + 1):
                page_numbers.add(p)
        pages = len(page_numbers) if page_numbers else 0
        
        # Update document record
        doc.status = "ready"
        doc.pages = pages
        doc.updated_at = datetime.now(timezone.utc)
        
        # Audit log
        audit = AuditLog(
            actor="System",
            actor_email="system@aegis.local",
            action="DOCUMENT_INGEST",
            target=filename,
            details=f"Ingested {pages} pages, generated {len(chunks)} semantic vector chunks.",
            status="success",
        )
        db.add(audit)
        db.commit()
        
        _notify(document_id, "complete", 100, filename)
        logger.info(f"Ingestion complete for {filename}: {pages} pages, {len(chunks)} chunks")
        
    except Exception as e:
        logger.exception(f"Ingestion failed for {filename}: {e}")
        try:
            doc = db.query(Document).filter(Document.id == document_id).first()
            if doc:
                doc.status = "error"
                doc.error_detail = str(e)
                db.commit()
        except Exception:
            db.rollback()
        _notify(document_id, "error", 0, filename)
    finally:
        db.close()
