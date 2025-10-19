# File: backend/agents/location_agent.py
import os
import logging
import httpx
from fastapi import APIRouter, HTTPException, Query

# --- Setup ---
router = APIRouter()
logger = logging.getLogger(__name__)
MAPBOX_API_KEY = os.getenv("MAPBOX_API_KEY")

# --- Location Agent Endpoints ---
@router.get("/search")
async def search_place(place_name: str = Query(..., description="The name of the place to search for in Switzerland.")):
    """
    Finds the coordinates for a given place name using Mapbox Geocoding.
    """
    if not MAPBOX_API_KEY:
        raise HTTPException(status_code=500, detail="Mapbox API key is not configured.")
        
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{place_name}.json"
    params = {
        "access_token": MAPBOX_API_KEY,
        "country": "CH", # Restrict search to Switzerland
        "limit": 1
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            if not data.get("features"):
                raise HTTPException(status_code=404, detail=f"Could not find a location for '{place_name}'.")
            
            # Return the coordinates of the first result
            coordinates = data["features"][0]["geometry"]["coordinates"]
            return {"place_name": place_name, "coordinates": coordinates}
        except httpx.HTTPStatusError as e:
            logger.error(f"Error calling Mapbox API: {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, detail="Error searching for location.")

@router.get("/route")
async def get_route(start_lon: float, start_lat: float, end_lon: float, end_lat: float):
    """
    Calculates a driving route between two points using Mapbox Directions.
    """
    if not MAPBOX_API_KEY:
        raise HTTPException(status_code=500, detail="Mapbox API key is not configured.")

    url = f"https://api.mapbox.com/directions/v5/mapbox/driving/{start_lon},{start_lat};{end_lon},{end_lat}"
    params = {
        "access_token": MAPBOX_API_KEY,
        "geometries": "geojson"
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            if not data.get("routes"):
                raise HTTPException(status_code=404, detail="Could not calculate a route.")
            
            return data["routes"][0]
        except httpx.HTTPStatusError as e:
            logger.error(f"Error calling Mapbox Directions API: {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, detail="Error calculating route.")

