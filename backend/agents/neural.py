# File: backend/agents/neural.py
import os
import logging
import json
import httpx
from fastapi import APIRouter, HTTPException
from openai import OpenAI
from schemas.agent import AgentRequest, ItineraryDraft, ToolCallResponse, LocationRequestResponse
from typing import Union, Dict, Any
from auth.database import SessionLocal
from chat import models as chat_models

router = APIRouter()
logger = logging.getLogger(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

tools = [
    {
        "type": "function",
        "function": {
            "name": "book_ride",
            "description": "Books a ride for the user from a specified pickup location to a destination.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pickup_location": {"type": "string", "description": "The starting point of the journey, e.g., 'Zurich Airport' or 'my current position'."},
                    "destination_location": {"type": "string", "description": "The end point of the journey, e.g., 'The Dolder Grand hotel'."}
                },
                "required": ["pickup_location", "destination_location"]
            }
        }
    }
]

@router.post("/", response_model=Union[ItineraryDraft, ToolCallResponse, LocationRequestResponse])
async def run_neural_agent(request: AgentRequest):
    prompt_text = request.prompt or ""
    if not prompt_text and request.messages:
        prompt_text = next((msg.content for msg in reversed(request.messages) if msg.sender == 'user'), "")
    
    if not prompt_text:
        raise HTTPException(status_code=422, detail="A prompt must be provided.")

    logger.info(f"Neural Agent received prompt: '{prompt_text}' for session: {request.session_id}")
    
    db = SessionLocal()
    if request.session_id:
        try:
            user_message = chat_models.ChatMessage(session_id=request.session_id, sender='user', content=prompt_text)
            db.add(user_message)
            db.commit()
        finally:
            db.close()

    try:
        system_prompt = """
        You are a luxury Swiss travel concierge. Your primary role is to create and modify travel itineraries.
        You can also book rides.
        - If the user asks to book a ride, book a taxi, or a similar transportation request, you MUST use the 'book_ride' tool.
        - For all other requests, generate or update an itinerary.
        - When creating an itinerary, your entire response MUST be a JSON object with a single key "itinerary_draft". Do not add any conversational text.
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": prompt_text}],
            tools=tools,
            tool_choice="auto",
            response_format={"type": "json_object"}
        )

        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls
        ai_response_object: Any = None
        
        if tool_calls:
            tool_call = tool_calls[0]
            if tool_call.function.name == "book_ride":
                args = json.loads(tool_call.function.arguments)
                pickup_name = args.get("pickup_location", "").lower()
                is_current_location_request = any(term in pickup_name for term in ["current position", "here", "my location", "current postions"])

                if is_current_location_request and not request.current_location:
                    ai_response_object = LocationRequestResponse()
                else:
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
                    
                    ai_response_object = ToolCallResponse(
                        tool_name="book_ride",
                        tool_params={"pickup": {"name": final_pickup_name.title(), "coordinates": pickup_coords}, "destination": {"name": args.get("destination_location"), "coordinates": dest_coords}}
                    )
        else:
            response_content = response_message.content
            if not response_content:
                raise HTTPException(status_code=500, detail="The AI returned an empty response.")
            
            try:
                itinerary_data = json.loads(response_content)
                if "itinerary_draft" not in itinerary_data:
                    raise ValueError("AI response is missing 'itinerary_draft' key.")
                ai_response_object = ItineraryDraft(**itinerary_data)
            except (json.JSONDecodeError, ValueError) as e:
                logger.error(f"Failed to parse AI response as itinerary JSON: {e}\nRaw response: {response_content}")
                raise HTTPException(status_code=500, detail="I couldn't generate a structured itinerary. Could you rephrase?")

        db = SessionLocal()
        if request.session_id and ai_response_object:
            try:
                ai_message_data: Dict[str, Any] = {"session_id": request.session_id, "sender": 'ai'}
                if isinstance(ai_response_object, ItineraryDraft):
                    ai_message_data["content"] = "Here is a draft of your itinerary."
                    ai_message_data["itinerary"] = json.loads(ai_response_object.model_dump_json(by_alias=True))['itinerary_draft']
                elif isinstance(ai_response_object, ToolCallResponse):
                    ai_message_data["content"] = "Of course, I can book that ride for you. Please confirm the details on the map."
                    ai_message_data["ride_details"] = json.loads(ai_response_object.tool_params.model_dump_json())
                elif isinstance(ai_response_object, LocationRequestResponse):
                    ai_message_data["content"] = ai_response_object.message
                
                ai_message = chat_models.ChatMessage(**ai_message_data)
                db.add(ai_message)
                db.commit()
            finally:
                db.close()

        return ai_response_object

    except httpx.HTTPStatusError as e:
        place_name = e.request.url.params.get("place_name", "the location")
        raise HTTPException(status_code=404, detail=f"Sorry, I couldn't find a location for '{place_name}'.")
    except Exception as e:
        logger.error(f"Error in Neural Agent: {type(e).__name__} - {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")