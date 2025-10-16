# File: backend/users/routes.py
import os
import shutil
import uuid
import random
import pyotp
import qrcode
import io
import base64
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request, status
from sqlalchemy.orm import Session

# Use direct imports
from auth import models as auth_models
from auth.database import get_db
from auth.routes import SECRET_KEY, ALGORITHM, verify_password, get_password_hash # Import helpers
from auth.email import send_password_change_code_email
from jose import jwt, JWTError

from . import schemas as user_schemas
from auth import schemas as auth_schemas # Import auth schemas

router = APIRouter()

# Dependency to get current user
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    token = request.headers.get("Authorization")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = token.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(auth_models.User).filter(auth_models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/me", response_model=user_schemas.UserProfile)
async def read_users_me(current_user: auth_models.User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=user_schemas.UserProfile)
async def update_users_me(
    user_update: user_schemas.UserProfileUpdate, 
    db: Session = Depends(get_db), 
    current_user: auth_models.User = Depends(get_current_user)
):
    user_data = user_update.dict(exclude_unset=True)
    for key, value in user_data.items():
        setattr(current_user, key, value)
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/upload-picture", response_model=user_schemas.UserProfile)
async def upload_profile_picture(
    request: Request,
    file: UploadFile = File(...), 
    db: Session = Depends(get_db), 
    current_user: auth_models.User = Depends(get_current_user)
):
    upload_dir = "static/profile_pictures"
    os.makedirs(upload_dir, exist_ok=True)

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    base_url = str(request.base_url)
    file_url = f"{base_url}static/profile_pictures/{unique_filename}"

    current_user.profile_picture_url = file_url
    db.commit()
    db.refresh(current_user)

    return current_user

@router.post("/me/request-password-change", response_model=auth_schemas.Msg)
async def request_password_change(
    password_data: auth_schemas.PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    if not verify_password(password_data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password.",
        )
    
    code = str(random.randint(100000, 999999))
    current_user.password_reset_code = get_password_hash(code)
    current_user.password_reset_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    db.commit()

    await send_password_change_code_email(email=[current_user.email], code=code)

    return {"msg": "A verification code has been sent to your email."}


@router.post("/me/confirm-password-change", response_model=auth_schemas.Msg)
async def confirm_password_change(
    confirmation_data: auth_schemas.PasswordChangeConfirm,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user)
):
    expires_at = current_user.password_reset_code_expires_at
    if expires_at and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if (
        not current_user.password_reset_code or
        not expires_at or
        expires_at < datetime.now(timezone.utc)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code is invalid or has expired.",
        )

    if not verify_password(confirmation_data.code, current_user.password_reset_code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect verification code.",
        )

    if len(confirmation_data.new_password.encode('utf-8')) > 72:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password is too long."
        )

    current_user.hashed_password = get_password_hash(confirmation_data.new_password)
    current_user.password_reset_code = None
    current_user.password_reset_code_expires_at = None
    db.commit()

    return {"msg": "Password updated successfully."}

# --- New Endpoints for 2FA Management ---

@router.post("/me/2fa/generate", response_model=auth_schemas.TwoFactorSetupResponse)
async def generate_two_factor_secret(current_user: auth_models.User = Depends(get_current_user)):
    """Generate a new 2FA secret and QR code for the user to scan."""
    if current_user.is_two_factor_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled.")

    secret_key = pyotp.random_base32()
    otp_uri = pyotp.totp.TOTP(secret_key).provisioning_uri(
        name=current_user.email, issuer_name="SwissTouristy AI"
    )

    # Generate QR code image
    img = qrcode.make(otp_uri)
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    qr_code_image_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

    return {
        "secret_key": secret_key,
        "otp_uri": otp_uri,
        "qr_code_image": f"data:image/png;base64,{qr_code_image_b64}",
    }

@router.post("/me/2fa/verify", response_model=auth_schemas.Msg)
async def verify_two_factor_setup(
    verification_data: auth_schemas.TwoFactorVerify,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user),
):
    """Verify the 2FA code and enable 2FA for the user."""
    totp = pyotp.TOTP(verification_data.secret_key)
    if not totp.verify(verification_data.code):
        raise HTTPException(status_code=400, detail="Invalid 2FA code.")

    current_user.two_factor_secret = verification_data.secret_key
    current_user.is_two_factor_enabled = True
    db.commit()
    return {"msg": "2FA has been successfully enabled."}

@router.post("/me/2fa/disable", response_model=auth_schemas.Msg)
async def disable_two_factor(
    disable_data: auth_schemas.TwoFactorDisable,
    db: Session = Depends(get_db),
    current_user: auth_models.User = Depends(get_current_user),
):
    """Disable 2FA after verifying the user's password."""
    if not current_user.is_two_factor_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled.")
        
    if not verify_password(disable_data.password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect password.")

    current_user.two_factor_secret = None
    current_user.is_two_factor_enabled = False
    db.commit()
    return {"msg": "2FA has been successfully disabled."}