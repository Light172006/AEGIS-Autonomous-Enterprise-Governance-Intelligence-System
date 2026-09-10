"""Document management endpoints."""

import asyncio
import shutil
from typing import List
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from backend.config import BackendConfig
from backend.dependencies import get_config, get_current_user, get_db
from backend.models import AuditLog, Document, User
from backend.schemas import DocumentOut
from backend.services.ingestion_service import get_progress, run_ingestion_background, subscribe, unsubscribe

router = APIRouter(tags=["documents"])

@router.get("/documents", response_model=List[DocumentOut])
def list_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "admin":
        docs = db.query(Document).all()
    else:
        docs = db.query(Document).filter(Document.owner_id == current_user.id).all()
    return docs

@router.get("/documents/{id}", response_model=DocumentOut)
def get_document(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if current_user.role != "admin" and doc.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this document")
    return doc

@router.post("/documents/upload", response_model=DocumentOut)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    config: BackendConfig = Depends(get_config),
):
    # Ensure upload dir exists
    config.upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file
    file_id = uuid4().hex[:12]
    safe_name = file.filename or "upload.pdf"
    stored_name = f"{file_id}_{safe_name}"
    dest = config.upload_dir / stored_name
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    # Create DB record
    doc = Document(
        owner_id=current_user.id,
        filename=safe_name,
        stored_path=str(dest),
        status="uploaded",
    )
    db.add(doc)
    db.flush()
    
    # Audit log
    audit = AuditLog(actor=current_user.name, actor_email=current_user.email, action="DOCUMENT_UPLOAD", target=safe_name, status="success")
    db.add(audit)
    db.commit()
    db.refresh(doc)
    
    # Start background ingestion
    run_ingestion_background(doc.id, dest, safe_name)
    
    return doc

@router.delete("/documents/{id}")
def delete_document(id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    if current_user.role != "admin" and doc.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this document")
    
    filename = doc.filename
    db.delete(doc)
    
    audit = AuditLog(actor=current_user.name, actor_email=current_user.email, action="DOCUMENT_DELETE", target=filename, status="success")
    db.add(audit)
    db.commit()
    
    return {"message": "Document deleted successfully"}

@router.websocket("/documents/{document_id}/progress")
async def document_progress_ws(websocket: WebSocket, document_id: str):
    await websocket.accept()
    queue = asyncio.Queue()
    subscribe(document_id, queue)
    try:
        # Send current progress if available
        current = get_progress(document_id)
        if current:
            await websocket.send_json(current)
        # Stream updates
        while True:
            update = await asyncio.wait_for(queue.get(), timeout=120)
            await websocket.send_json(update)
            if update.get("stage") in ("complete", "error"):
                break
    except (WebSocketDisconnect, asyncio.TimeoutError):
        pass
    finally:
        unsubscribe(document_id, queue)
