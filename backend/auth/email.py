# File: backend/auth/email.py
import os
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import EmailStr
from typing import List

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_verification_email(email: List[EmailStr], verification_url: str):
    # ... (existing function) ...
    template = f"""
        <!DOCTYPE html>
        <html>
            <body>
                <p>Thank you for registering! Please click the link below to verify your email address:</p>
                <p><a href="{verification_url}">{verification_url}</a></p>
            </body>
        </html>
    """
    
    message = MessageSchema(
        subject="SwissTouristy Account Verification",
        recipients=email,
        body=template,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)


# New: Function to send the 6-digit password change code
async def send_password_change_code_email(email: List[EmailStr], code: str):
    template = f"""
        <!DOCTYPE html>
        <html>
            <body>
                <p>You requested to change your password.</p>
                <p>Enter the following 6-digit code to confirm this change. The code will expire in 10 minutes.</p>
                <h2 style=\"font-weight:bold;\">{code}</h2>
            </body>
        </html>
    """
    
    message = MessageSchema(
        subject="Your SwissTouristy Password Change Code",
        recipients=email,
        body=template,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)
    
# New: Function to send the password reset email
async def send_password_reset_email(email: List[EmailStr], reset_url: str):
    """
    Sends an email with the password reset link.
    """
    template = f"""
        <!DOCTYPE html>
        <html>
            <body>
                <p>You have requested to reset your password.</p>
                <p>Please click the link below to set a new password. This link will expire in 15 minutes:</p>
                <p><a href="{reset_url}">{reset_url}</a></p>
                <p>If you did not request a password reset, please ignore this email.</p>
            </body>
        </html>
    """
    
    message = MessageSchema(
        subject="SwissTouristy Password Reset",
        recipients=email,
        body=template,
        subtype="html"
    )

    fm = FastMail(conf)
    await fm.send_message(message)