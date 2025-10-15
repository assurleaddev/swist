# File: backend/agents/emotional.py
from fastapi import APIRouter, HTTPException
from schemas.agent import AgentRequest, MoodResponse
from openai import AsyncOpenAI
import logging

router = APIRouter()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

EMOTIONAL_AGENT_PROMPT = """
Analyze the emotional tone of the user's text.
Based on the tone, classify the mood into one of the following categories:
- Neutral
- Excited
- Frustrated
- Happy
- Anxious
- Inquisitive

Then, suggest a UI accent color that reflects this mood. The color should be a hex code.
- Neutral: #808080 (Grey)
- Excited: #4CAF50 (Vibrant Green)
- Frustrated: #F44336 (Warning Red)
- Happy: #FFC107 (Sunny Yellow)
- Anxious: #9C27B0 (Deep Purple)
- Inquisitive: #2196F3 (Bright Blue)

Respond with a JSON object containing two keys: "mood" and "color_suggestion".
"""

@router.post("/", response_model=MoodResponse)
async def run_emotional_agent(request: AgentRequest):
    """
    Detects the emotional tone of the user's input and suggests a responsive UI color.
    """
    logger.info(f"Emotional Agent received prompt: {request.prompt}")
    try:
        # Initialize client inside the endpoint
        client = AsyncOpenAI()

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": EMOTIONAL_AGENT_PROMPT},
                {"role": "user", "content": request.prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        
        mood_data = response.choices[0].message.content
        logger.info(f"Emotional Agent received OpenAI response: {mood_data}")

        # The response is a JSON string, so we directly model_validate it.
        return MoodResponse.model_validate_json(mood_data)

    except Exception as e:
        logger.error(f"Error in Emotional Agent: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze mood from Emotional Agent.")

