"""QA service — bridges API requests to the Orchestrator."""

import json
import logging
import time
from datetime import datetime

from sqlalchemy.orm import Session

from backend.models import AuditLog, Conversation, Message, User
from backend.schemas import CitationOut, QAResponse

logger = logging.getLogger(__name__)

# Track response times for avg_latency_ms telemetry
_latencies: list[float] = []
MAX_LATENCY_SAMPLES = 100


def get_avg_latency_ms() -> float:
    if not _latencies:
        return 0.0
    return sum(_latencies) / len(_latencies)


def handle_question(
    question: str,
    user: User,
    db: Session,
    conversation_id: str | None = None,
) -> QAResponse:
    """Process a question through the Orchestrator and persist the conversation."""
    from agents.document_agent import DocumentAgent
    from orchestrator.orchestrator import Orchestrator
    
    # Find or create conversation
    conversation: Conversation | None = None
    if conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user.id,
        ).first()
    
    if conversation is None:
        title = question[:38] + ("..." if len(question) > 38 else "")
        conversation = Conversation(
            user_id=user.id,
            title=title,
        )
        db.add(conversation)
        db.flush()  # get the ID
    
    # Save user message
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=question,
    )
    db.add(user_msg)
    db.flush()
    
    # Call orchestrator
    start = time.time()
    try:
        orchestrator = Orchestrator(agents=[DocumentAgent()])
        decision = orchestrator.handle(question)
    except Exception as e:
        logger.exception(f"Orchestrator error: {e}")
        # Return a graceful error response
        error_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=f"I encountered an error processing your question: {str(e)}",
        )
        db.add(error_msg)
        conversation.updated_at = datetime.utcnow()
        db.commit()
        return QAResponse(
            answer=error_msg.content,
            citations=[],
            conversation_id=conversation.id,
        )
    elapsed_ms = (time.time() - start) * 1000
    _latencies.append(elapsed_ms)
    if len(_latencies) > MAX_LATENCY_SAMPLES:
        _latencies.pop(0)
    
    # Map orchestrator citations to CitationOut format
    citations: list[CitationOut] = []
    for call_record in decision.agent_calls:
        for cite in call_record.citations:
            citations.append(CitationOut(
                document_id=cite.get("source_path", ""),
                document_name=cite.get("document_name", ""),
                page=cite.get("page_start", 0),
                section=cite.get("section", ""),
                chunk_id=cite.get("chunk_id", ""),
                snippet=cite.get("text", cite.get("snippet", "")),
            ))
    
    # Save assistant message
    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=decision.answer,
        citations_json=json.dumps([c.model_dump() for c in citations]) if citations else None,
    )
    db.add(assistant_msg)
    conversation.updated_at = datetime.utcnow()
    
    # Audit log
    audit = AuditLog(
        actor=user.name,
        actor_email=user.email,
        action="QA_QUERY",
        target=question[:100],
        details=f"Retrieved {len(citations)} citations. Status: {decision.status}",
        status="success" if decision.status == "answered" else "warning",
    )
    db.add(audit)
    db.commit()
    
    return QAResponse(
        answer=decision.answer,
        citations=citations,
        conversation_id=conversation.id,
    )
