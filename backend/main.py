# File: backend/main.py
import os
import sys
from pathlib import Path
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging
from fastapi.staticfiles import StaticFiles

# Add the current directory to the path to allow direct imports
sys.path.append(str(Path(__file__).parent))

# Load environment variables FIRST
load_dotenv()

# Use direct imports for all local packages
from agents import neural, emotional, radar, conversational, location_agent
from mcp import context
from payments import stripe_handler, paypal_handler
from auth import routes as auth_routes, models as auth_models
from users import routes as user_routes
from auth.database import engine

# --- Static Files Setup ---
# Create directory relative to the backend folder
os.makedirs("static/profile_pictures", exist_ok=True)


# --- Logging Setup ---
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')

# --- App Initialization ---
app = FastAPI(
    title="SwissTouristy AI",
    description="Backend services for the SwissTouristy AI application.",
    version="1.0.0"
)

# Mount the 'static' directory at the root
app.mount("/static", StaticFiles(directory="static"), name="static")


auth_models.Base.metadata.create_all(bind=engine)
# --- CORS Middleware ---
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Routers ---
app.include_router(auth_routes.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(user_routes.router, prefix="/api/users", tags=["Users"])
app.include_router(neural.router, prefix="/api/agents/neural", tags=["Agents"])
app.include_router(emotional.router, prefix="/api/agents/emotional", tags=["Agents"])
app.include_router(radar.router, prefix="/api/agents/radar", tags=["Agents"])
app.include_router(conversational.router, prefix="/api/agents/conversational", tags=["Agents"])
app.include_router(location_agent.router, prefix="/api/agents/location", tags=["Agents"])
app.include_router(context.router, prefix="/api/mcp/context", tags=["MCP"])
app.include_router(stripe_handler.router, prefix="/api/payments", tags=["Payments"])
app.include_router(paypal_handler.router, prefix="/api/payments", tags=["Payments"])

# --- Root Endpoint ---
@app.get("/")
def read_root():
    return {"status": "SwissTouristy AI Backend is running"}

