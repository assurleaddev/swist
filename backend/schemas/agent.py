# File: backend/schemas/agent.py
from pydantic import BaseModel, Field
from typing import List, Optional, Union

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

# --- New Models for Tool Calling ---
class Location(BaseModel):
    name: str
    coordinates: List[float]

class RideBookingPayload(BaseModel):
    pickup: Location
    destination: Location

class ToolCallResponse(BaseModel):
    tool_name: str
    tool_params: RideBookingPayload

# --- Conversational Schemas ---

class Message(BaseModel):
    sender: str
    content: str

class ConversationalRequest(BaseModel):
    messages: List[Message]

# --- General Agent Schemas ---

class AgentRequest(BaseModel):
    prompt: Optional[str] = None
    messages: Optional[List[Message]] = None

class AgentResponse(BaseModel):
    content: str = Field(..., alias="response")

# --- Emotional Agent Schema ---
class MoodResponse(BaseModel):
    mood: str
    color: str = Field(..., alias="color_suggestion")

