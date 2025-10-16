# File: backend/auth/schemas.py
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    two_factor_code: Optional[str] = None # Add 2FA code field

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    password: str

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

class PasswordChangeConfirm(BaseModel):
    code: str
    new_password: str
    
# New: Schema to return QR code for 2FA setup
class TwoFactorSetupResponse(BaseModel):
    secret_key: str
    otp_uri: str
    qr_code_image: str # Will be a base64 encoded image string

# New: Schema for verifying the 2FA code during setup
class TwoFactorVerify(BaseModel):
    secret_key: str
    code: str

# New: Schema for disabling 2FA
class TwoFactorDisable(BaseModel):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class Msg(BaseModel):
    msg: str
    
class UserOut(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    created_at: datetime
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True