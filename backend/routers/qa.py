"""QA endpoints."""

import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.dependencies import get_db, get_current_user
from backend.models import Conversation, User
from backend.schemas import CitationOut, ConversationOut, QAMessageOut, QARequest, QAResponse
from backend.services.qa_service import handle_question

router = APIRouter(tags=["qa"])

@router.post("/qa", response_model=QAResponse)
def ask_question(
    request: QARequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return handle_question(
        question=request.question,
        user=current_user,
        db=db,
        conversation_id=request.conversation_id
    )

@router.get("/qa/conversations", response_model=List[ConversationOut])
def list_conversations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conversations = db.query(Conversation).filter(Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc()).all()
    
    results = []
    for conv in conversations:
        messages_out = []
        for msg in conv.messages:
            citations = []
            if msg.citations_json:
                try:
                    c_list = json.loads(msg.citations_json)
                    citations = [CitationOut(**c) for c in c_list]
                except Exception:
                    pass
            messages_out.append(QAMessageOut(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                citations=citations,
                created_at=msg.created_at
            ))
        
        results.append(ConversationOut(
            id=conv.id,
            title=conv.title,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            messages=messages_out
        ))
        
    return results

@router.get("/qa/conversations/{id}", response_model=ConversationOut)
def get_conversation(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == id, Conversation.user_id == current_user.id).first()
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
        
    messages_out = []
    for msg in conv.messages:
        citations = []
        if msg.citations_json:
            try:
                c_list = json.loads(msg.citations_json)
                citations = [CitationOut(**c) for c in c_list]
            except Exception:
                pass
        messages_out.append(QAMessageOut(
            id=msg.id,
            role=msg.role,
            content=msg.content,
            citations=citations,
            created_at=msg.created_at
        ))
    
    return ConversationOut(
        id=conv.id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=messages_out
    )
