# File: backend/schemas/agent.py
from pydantic import BaseModel, Field
from typing import List, Optional

# --- Main Itinerary Schemas ---

class Activity(BaseModel):
    time: str
    description: str
    reason: str
    price: int # Price in CHF

class ItineraryDay(BaseModel):
    day: int
    title: str
    activities: List[Activity]

class ItineraryDraft(BaseModel):
    itinerary: List[ItineraryDay] = Field(..., alias="itinerary_draft")

# --- Conversational Schemas ---

class Message(BaseModel):
    sender: str
    content: str

class ConversationalRequest(BaseModel):
    messages: List[Message]

# --- General Agent Schemas ---

class AgentRequest(BaseModel):
    prompt: str

class AgentResponse(BaseModel):
    content: str = Field(..., alias="response")

# --- Emotional Agent Schema (This was missing) ---
class MoodResponse(BaseModel):
    mood: str
    color: str = Field(..., alias="color_suggestion")

