# File: backend/agents/neural.py
import os
import logging
import json
from fastapi import APIRouter, HTTPException
from openai import OpenAI
from schemas.agent import AgentRequest, ItineraryDraft
from dotenv import load_dotenv

# --- Setup ---
load_dotenv()
router = APIRouter()
logger = logging.getLogger(__name__)

# --- Neural Agent Endpoint ---
@router.post("/", response_model=ItineraryDraft)
async def run_neural_agent(request: AgentRequest):
    """
    Generates or modifies an itinerary with pricing based on a detailed prompt.
    """
    logger.info(f"Neural Agent received prompt: {request.prompt}")
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Updated system prompt to request pricing
        system_prompt = """
        You are a luxury Swiss travel concierge. You will receive a detailed travel request.
        The request might be for a brand new itinerary OR it might be a request to modify a previous itinerary that will be provided.
        Your task is to create or modify the day-by-day travel itinerary based on ALL the information provided.
        Always return the response as a JSON object with a single key "itinerary_draft".
        "itinerary_draft" must be an array of day objects.
        Each day object MUST have "day" (integer), "title" (string), and "activities" (array).
        Each activity object MUST have "time", "description", a "reason", and a "price" (integer, in CHF).
        Example activity: { "time": "19:00", "description": "Dinner at Pavillon", "reason": "...", "price": 250 }
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.prompt}
            ]
        )
        
        response_content = response.choices[0].message.content
        logger.info(f"Neural Agent received OpenAI response: {response_content}")
        
        itinerary_data = json.loads(response_content)
        
        return ItineraryDraft(**itinerary_data)

    except Exception as e:
        logger.error(f"Error in Neural Agent: {e}")
        raise HTTPException(status_code=500, detail="Error processing itinerary request.")

