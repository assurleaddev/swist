# File: backend/chat/routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging
from openai import OpenAI

from auth import models as auth_models
from auth.database import get_db
from users.routes import get_current_user
from . import models, schemas
from schemas.agent import AgentRequest

# --- Setup ---
router = APIRouter()
logger = logging.getLogger(__name__)
client = OpenAI()

async def generate_chat_title(prompt: str) -> str:
    """Generates a concise title for a chat session based on the initial prompt."""
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert at creating short, descriptive titles for travel plans. Summarize the user's request in 3-5 words."},
                {"role": "user", "content": f"Create a title for a trip based on this request: '{prompt}'"}
            ],
            temperature=0.3,
            max_tokens=20,
        )
        title = response.choices[0].message.content.strip().replace('"', '')
        return title
    except Exception as e:
        logger.error(f"Error generating chat title: {e}")
        return "New Chat"

@router.post("/sessions", response_model=schemas.ChatSessionInfo, status_code=status.HTTP_201_CREATED)
async def create_chat_session(
    request: AgentRequest, # Expect the initial prompt
    current_user: auth_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a new chat session, automatically generating a title."""
    title = await generate_chat_title(request.prompt) if request.prompt else "New Chat"
    new_session = models.ChatSession(user_id=current_user.id, title=title)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/sessions", response_model=List[schemas.ChatSessionInfo])
def get_user_chat_sessions(
    current_user: auth_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all chat sessions for the current user."""
    return db.query(models.ChatSession).filter(models.ChatSession.user_id == current_user.id).order_by(models.ChatSession.created_at.desc()).all()

@router.get("/sessions/{session_id}", response_model=List[schemas.ChatMessage])
def get_chat_session_messages(
    session_id: int,
    current_user: auth_models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieves all messages for a specific chat session."""
    session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id, models.ChatSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session.messages