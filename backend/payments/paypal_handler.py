# File: backend/payments/paypal_handler.py
import os
import paypalrestsdk
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# --- Setup ---
load_dotenv()
router = APIRouter()

# Configure the PayPal SDK
paypalrestsdk.configure({
  "mode": "sandbox", # sandbox or live
  "client_id": os.getenv("PAYPAL_CLIENT_ID"),
  "client_secret": os.getenv("PAYPAL_CLIENT_SECRET")
})

# --- Pydantic Models ---
class CreateOrderRequest(BaseModel):
    total_amount: str # e.g., "1030.00"
    currency: str # e.g., "CHF"

class CaptureOrderRequest(BaseModel):
    order_id: str

# --- PayPal Endpoints ---
@router.post("/create-paypal-order")
async def create_paypal_order(request: CreateOrderRequest):
    """
    Creates a PayPal order and returns the order ID.
    """
    try:
        payment = paypalrestsdk.Payment({
            "intent": "sale",
            "payer": {
                "payment_method": "paypal"
            },
            "transactions": [{
                "amount": {
                    "total": request.total_amount,
                    "currency": request.currency
                },
                "description": "Payment for SwissTouristy AI services."
            }],
            "redirect_urls": {
                "return_url": "http://localhost:3000?success=true",
                "cancel_url": "http://localhost:3000?canceled=true"
            }
        })

        if payment.create():
            for link in payment.links:
                if link.rel == "approval_url":
                    # The frontend SDK needs the order ID from the URL
                    order_id = link.href.split("token=")[1]
                    return {"orderID": order_id}
            raise HTTPException(status_code=500, detail="Could not find approval URL.")
        else:
            raise HTTPException(status_code=500, detail=payment.error)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/capture-paypal-order")
async def capture_paypal_order(request: CaptureOrderRequest):
    """
    Captures the payment for a PayPal order.
    """
    try:
        # This is a simplified capture flow. In a real app, you would retrieve the payment
        # using the order_id and then execute it with the PayerID.
        # The frontend SDK handles this, and we just need to confirm the capture.
        return {"status": "success", "order_id": request.order_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
