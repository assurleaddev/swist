# File: backend/chat/schemas.py
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class ChatMessageBase(BaseModel):
    sender: str
    content: str
    itinerary: Optional[Any] = None
    customization_request: Optional[Any] = None
    booking_summary_itinerary: Optional[Any] = None
    ride_details: Optional[Any] = None
    auth_prompt: Optional[bool] = False

class ChatMessageCreate(ChatMessageBase):
    pass

class ChatMessage(ChatMessageBase):
    id: int
    session_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionBase(BaseModel):
    title: str

class ChatSessionCreate(ChatSessionBase):
    pass

class ChatSession(ChatSessionBase):
    id: int
    user_id: int
    created_at: datetime
    messages: List[ChatMessage] = []

    class Config:
        from_attributes = True

class ChatSessionInfo(BaseModel):
    id: int
    title: str
    created_at: datetime
    
    class Config:
        from_attributes = True