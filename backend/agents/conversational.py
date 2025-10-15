# File: backend/agents/conversational.py
import os
import logging
import json
from fastapi import APIRouter, HTTPException
from openai import OpenAI
from schemas.agent import ConversationalRequest, AgentResponse
from dotenv import load_dotenv

# --- Setup ---
load_dotenv()
router = APIRouter()
logger = logging.getLogger(__name__)

# --- Conversational Agent Endpoint ---
@router.post("/", response_model=AgentResponse)
async def run_conversational_agent(request: ConversationalRequest):
    """
    Manages the conversational flow, gathering details before itinerary generation.
    """
    logger.info(f"Conversational Agent received messages: {request.messages}")
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        # Create a string representation of the chat history
        chat_history = "\n".join([f"{msg.sender}: {msg.content}" for msg in request.messages])

        # This detailed prompt turns the AI into a state machine.
        # It analyzes the history and determines what to ask next.
        system_prompt = f"""
        You are a Swiss travel concierge AI. Your goal is to gather the necessary information to plan a trip.
        You need to collect: 1. The main travel request, 2. The number of travelers, 3. The travel dates, 4. Flight booking status.

        Analyze the following chat history and determine the NEXT question to ask.
        - If the user has just provided their main request, ask for the number of travelers.
        - If the number of travelers has just been provided, ask for the travel dates.
        - If the travel dates have just been provided, ask if flights are booked.
        - If the flight status has just been provided, you have all the information. In this case, and ONLY in this case, respond with the exact text: "READY_TO_PLAN".
        - If the user is asking for improvements on an existing plan, ask them for their specific feedback.

        Keep your questions brief, friendly, and conversational.

        Chat History:
        ---
        {chat_history}
        ---
        What is the very next thing you should say?
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful travel planning assistant."},
                {"role": "user", "content": system_prompt}
            ]
        )
        
        follow_up_question = response.choices[0].message.content.strip()
        logger.info(f"Conversational Agent generated response: {follow_up_question}")
        
        # The schema expects a 'response' field, so we wrap it correctly.
        return {"response": follow_up_question}

    except Exception as e:
        logger.error(f"Error in Conversational Agent: {e}")
        raise HTTPException(status_code=500, detail="Error in conversational agent.")

