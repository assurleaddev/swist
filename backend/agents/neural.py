# File: backend/agents/neural.py
import os
import logging
import json
import httpx
from fastapi import APIRouter, HTTPException
from openai import OpenAI
from schemas.agent import AgentRequest, ItineraryDraft, ToolCallResponse
from typing import Union

# --- Setup ---
router = APIRouter()
logger = logging.getLogger(__name__)

# --- OpenAI Client Initialization ---
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# --- Available Tools Definition ---
tools = [
    {
        "type": "function",
        "function": {
            "name": "book_ride",
            "description": "Books a ride for the user from a specified pickup location to a destination.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pickup_location": {
                        "type": "string",
                        "description": "The starting point of the journey, e.g., 'Zurich Airport'."
                    },
                    "destination_location": {
                        "type": "string",
                        "description": "The end point of the journey, e.g., 'The Dolder Grand hotel'."
                    }
                },
                "required": ["pickup_location", "destination_location"]
            }
        }
    }
]

available_tools = {
    "book_ride": "book_ride"
}

# --- Neural Agent Endpoint ---
@router.post("/", response_model=Union[ItineraryDraft, ToolCallResponse])
async def run_neural_agent(request: AgentRequest):
    """
    Generates or modifies an itinerary, or triggers a tool call for actions like booking a ride.
    """
    # --- Logic to handle flexible input from either prompt or messages ---
    if request.prompt:
        prompt_text = request.prompt
    elif request.messages:
        # Combine messages into a single prompt string, taking the last user message as primary
        prompt_text = next((msg.content for msg in reversed(request.messages) if msg.sender == 'user'), None)
        if not prompt_text:
             raise HTTPException(status_code=422, detail="No user message found in 'messages'.")
    else:
        raise HTTPException(status_code=422, detail="Either 'prompt' or 'messages' must be provided.")
    
    logger.info(f"Neural Agent received prompt: {prompt_text}")
    try:
        system_prompt = """
        You are a luxury Swiss travel concierge. Your primary role is to create and modify travel itineraries.
        However, you also have the ability to book rides.
        - If the user asks to book a ride, book a taxi, or a similar transportation request, use the 'book_ride' tool.
        - For all other requests related to planning, sightseeing, or modifying trips, generate or update an itinerary.
        - When creating an itinerary, always return the response as a JSON object with a single key "itinerary_draft".
          "itinerary_draft" must be an array of day objects.
          Each day object MUST have "day", "title", and "activities".
          Each activity MUST have "time", "description", "reason", and a "price" (integer, in CHF).
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt_text}
            ],
            tools=tools,
            tool_choice="auto"
        )
        
        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls

        if tool_calls:
            logger.info(f"Neural Agent initiated tool call: {tool_calls[0].function.name}")
            tool_call = tool_calls[0]
            tool_name = tool_call.function.name

            if available_tools.get(tool_name) == "book_ride":
                args = json.loads(tool_call.function.arguments)
                pickup_name = args.get("pickup_location")
                destination_name = args.get("destination_location")

                async with httpx.AsyncClient() as http_client:
                    # Use the location agent to get coordinates
                    pickup_response = await http_client.get(f"http://127.0.0.1:8000/api/agents/location/search?place_name={pickup_name}")
                    destination_response = await http_client.get(f"http://127.0.0.1:8000/api/agents/location/search?place_name={destination_name}")
                    
                    pickup_response.raise_for_status()
                    destination_response.raise_for_status()
                    
                    pickup_coords = pickup_response.json()["coordinates"]
                    destination_coords = destination_response.json()["coordinates"]
                
                tool_response = ToolCallResponse(
                    tool_name="book_ride",
                    tool_params={
                        "pickup": {"name": pickup_name, "coordinates": pickup_coords},
                        "destination": {"name": destination_name, "coordinates": destination_coords}
                    }
                )
                return tool_response

        # Default behavior: Generate or modify an itinerary
        # Fallback to generating a standard text/itinerary response if no tool is called
        completion_without_tools = client.chat.completions.create(
             model="gpt-4o-mini",
             response_format={"type": "json_object"},
             messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt_text}
            ]
        )
        response_content = completion_without_tools.choices[0].message.content

        if not response_content:
            raise HTTPException(status_code=500, detail="AI model returned an empty response.")

        logger.info(f"Neural Agent received OpenAI response: {response_content}")
        itinerary_data = json.loads(response_content)
        return ItineraryDraft(**itinerary_data)

    except httpx.HTTPStatusError as e:
        logger.error(f"Error calling location agent: {e.response.text}")
        raise HTTPException(status_code=500, detail=f"Failed to find location: {e.request.url}")
    except Exception as e:
        logger.error(f"Error in Neural Agent: {e}")
        raise HTTPException(status_code=500, detail="Error processing your request.")

