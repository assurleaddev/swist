# File: backend/agents/radar.py
from fastapi import APIRouter, HTTPException
from schemas.agent import AgentRequest, AgentResponse
from openai import AsyncOpenAI
import logging
import json

router = APIRouter()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


RADAR_AGENT_PROMPT = """
You are a context-aware radar agent for a luxury Swiss travel app.
Your role is to interpret raw external data and provide a concise, human-readable summary.
The user will provide a context query and a JSON object of raw data.
Summarize the key information relevant to a luxury traveler.

Example:
User Query: "What's the flight and weather situation for a trip to Zurich next week?"
Raw Data: {"flights": {"status": "On Time", "price_usd": 1200}, "weather": {"forecast": "Sunny", "temp_c": 22}}
Your Summary: "Flights to Zurich are on time, priced around $1200. Expect sunny weather with temperatures around 22°C."
"""

# Mock external data
MOCK_EXTERNAL_DATA = {
    "flights": {
        "from": "JFK",
        "to": "ZRH",
        "status": "On Time",
        "price_usd": 1450,
        "airline": "Swiss Air"
    },
    "weather": {
        "location": "Zurich",
        "forecast": "Clear skies with light breeze",
        "temp_c": 24
    },
    "events": [
        {
            "name": "Zurich Art Weekend",
            "type": "Art Fair",
            "venue": "Various Galleries"
        }
    ]
}


@router.post("/", response_model=AgentResponse)
async def run_radar_agent(request: AgentRequest):
    """
    Fetches and interprets external context (flights, weather, events) for the user.
    """
    logger.info(f"Radar Agent received prompt: {request.prompt}")
    try:
        # Initialize client inside the endpoint
        client = AsyncOpenAI()

        # Combine the user prompt with the mock data for the AI
        combined_prompt = f"""
        User Query: "{request.prompt}"
        Raw Data: {json.dumps(MOCK_EXTERNAL_DATA)}
        """
        
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": RADAR_AGENT_PROMPT},
                {"role": "user", "content": combined_prompt},
            ],
            temperature=0.3,
            max_tokens=150,
        )
        
        summary = response.choices[0].message.content
        logger.info(f"Radar Agent received OpenAI summary: {summary}")
        
        return AgentResponse(response=summary)

    except Exception as e:
        logger.error(f"Error in Radar Agent: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch context from Radar Agent.")

