# File: backend/chat/routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from auth import models as auth_models
from auth.database import get_db
from users.routes import get_current_user
from . import models, schemas

router = APIRouter()

@router.post("/sessions", response_model=schemas.ChatSessionInfo, status_code=status.HTTP_201_CREATED)
def create_chat_session(
    current_user: auth_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_session = models.ChatSession(user_id=current_user.id, title="New Chat")
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/sessions", response_model=List[schemas.ChatSessionInfo])
def get_user_chat_sessions(
    current_user: auth_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(models.ChatSession).filter(models.ChatSession.user_id == current_user.id).order_by(models.ChatSession.created_at.desc()).all()

@router.get("/sessions/{session_id}", response_model=List[schemas.ChatMessage])
def get_chat_session_messages(
    session_id: int,
    current_user: auth_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id, models.ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.messages