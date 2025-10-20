# File: backend/agents/neural.py
import os
import logging
import json
import httpx
from fastapi import APIRouter, HTTPException
from openai import OpenAI
from schemas.agent import AgentRequest, ItineraryDraft, ToolCallResponse, LocationRequestResponse
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
                        "description": "The starting point of the journey, e.g., 'Zurich Airport' or 'my current position'."
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
@router.post("/", response_model=Union[ItineraryDraft, ToolCallResponse, LocationRequestResponse])
async def run_neural_agent(request: AgentRequest):
    """
    Generates an itinerary, triggers a tool call, or requests location data.
    """
    prompt_text = request.prompt or ""
    logger.info(f"Neural Agent received prompt: {prompt_text}")
    try:
        system_prompt = """
        You are a luxury Swiss travel concierge. Your primary role is to create and modify travel itineraries.
        However, you also have the ability to book rides.
        - If the user asks to book a ride, book a taxi, or a similar transportation request, use the 'book_ride' tool.
        - For all other requests related to planning, sightseeing, or modifying trips, generate or update an itinerary.
        - When creating an itinerary, always return the response as a JSON object with a single key "itinerary_draft".
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt_text}],
            tools=tools,
            tool_choice="auto"
        )

        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls

        if tool_calls:
            tool_call = tool_calls[0]
            if tool_call.function.name == "book_ride":
                args = json.loads(tool_call.function.arguments)
                pickup_name = args.get("pickup_location", "").lower()
                
                is_current_location_request = any(term in pickup_name for term in ["current position", "here", "my location", "current postions"])

                if is_current_location_request and not request.current_location:
                    # Backend is now requesting the location from the frontend
                    return LocationRequestResponse()

                # Proceed if we have coordinates or a named location
                pickup_coords = request.current_location if is_current_location_request else None
                final_pickup_name = "Current Location" if is_current_location_request else pickup_name

                async with httpx.AsyncClient() as http_client:
                    if not pickup_coords:
                        pickup_res = await http_client.get(f"http://127.0.0.1:8000/api/agents/location/search?place_name={final_pickup_name}")
                        pickup_res.raise_for_status()
                        pickup_coords = pickup_res.json()["coordinates"]
                    
                    dest_res = await http_client.get(f"http://127.0.0.1:8000/api/agents/location/search?place_name={args.get('destination_location')}")
                    dest_res.raise_for_status()
                    dest_coords = dest_res.json()["coordinates"]

                return ToolCallResponse(
                    tool_name="book_ride",
                    tool_params={
                        "pickup": {"name": final_pickup_name.title(), "coordinates": pickup_coords},
                        "destination": {"name": args.get("destination_location"), "coordinates": dest_coords}
                    }
                )

        # Fallback to generating an itinerary
        completion = client.chat.completions.create(
             model="gpt-4o-mini",
             response_format={"type": "json_object"},
             messages=[
                {"role": "system", "content": system_prompt + '\nEnsure each activity has "time", "description", "reason", and "price".'},
                {"role": "user", "content": prompt_text}
            ]
        )
        response_content = completion.choices[0].message.content
        return ItineraryDraft(**json.loads(response_content or '{}'))

    except httpx.HTTPStatusError as e:
        place_name = e.request.url.params.get("place_name", "the location")
        raise HTTPException(status_code=404, detail=f"Sorry, I couldn't find a location for '{place_name}'.")
    except Exception as e:
        logger.error(f"Error in Neural Agent: {e}")
        raise HTTPException(status_code=500, detail="An error occurred while processing your request.")