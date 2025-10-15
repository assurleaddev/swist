# File: backend/payments/stripe_handler.py
import os
import stripe
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

# --- Setup ---
load_dotenv()
router = APIRouter()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


# --- Pydantic Models ---
class LineItem(BaseModel):
    name: str
    amount: int 
    quantity: int

class CreateCheckoutSessionRequest(BaseModel):
    line_items: List[LineItem]

# --- Stripe Checkout Endpoint ---
@router.post("/create-checkout-session")
async def create_checkout_session(request: CreateCheckoutSessionRequest):
    """
    Creates a Stripe Checkout session and returns the session URL.
    """
    try:
        line_items_for_stripe = []
        for item in request.line_items:
            line_items_for_stripe.append({
                'price_data': {
                    'currency': 'chf',
                    'product_data': {
                        'name': item.name,
                    },
                    'unit_amount': item.amount,
                },
                'quantity': item.quantity,
            })

        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items_for_stripe,
            mode='payment',
            success_url='http://localhost:3000?success=true', 
            cancel_url='http://localhost:3000?canceled=true',   
        )
        # Return the full URL for redirection
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

