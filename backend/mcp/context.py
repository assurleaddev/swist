# File: backend/mcp/context.py
import os
import logging
from fastapi import APIRouter, HTTPException
from openai import OpenAI
from schemas.agent import AgentRequest
from dotenv import load_dotenv

# --- Setup ---
load_dotenv()
router = APIRouter()
logger = logging.getLogger(__name__)

# --- MCP Context Endpoint ---
@router.post("/")
async def get_mcp_context(request: AgentRequest):
    """
    Provides a transparent explanation for an AI's suggestion based on user input.
    """
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        prompt = f"""
        Analyze the user's travel request and provide a one-sentence explanation for a potential AI recommendation.
        For example, if the user asks for luxury travel, the context might be "Based on your request for luxury, we are suggesting five-star accommodations."
        User request: '{request.prompt}'
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful travel assistant providing context for recommendations."},
                {"role": "user", "content": prompt}
            ]
        )
        context = response.choices[0].message.content.strip()
        
        # Return a simple dictionary to avoid Pydantic validation conflicts on the response.
        # FastAPI will correctly serialize this to JSON.
        return {"content": context}

    except Exception as e:
        logger.error(f"Error in MCP Context: {e}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

