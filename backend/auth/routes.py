# File: backend/auth/routes.py
import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
import pyotp # Import pyotp

from . import models, schemas
from .database import get_db
from .email import send_verification_email, send_password_reset_email

router = APIRouter()

# --- Security Setup ---
SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key_for_development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES = 60
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = 15

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Helper Functions ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- API Endpoints ---
@router.post("/register", response_model=schemas.Msg, status_code=status.HTTP_201_CREATED)
async def register_user(user: schemas.UserCreate, request: Request, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(user.password.encode('utf-8')) > 72:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password is too long. Please use a password with 72 characters or fewer."
        )

    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        is_active=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    verification_token_expires = timedelta(minutes=EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES)
    verification_token = create_access_token(
        data={"sub": new_user.email, "scope": "email_verification"},
        expires_delta=verification_token_expires
    )
    
    base_url = "http://localhost:3000"
    verification_url = f"{base_url}/verify-email?token={verification_token}"

    await send_verification_email(email=[new_user.email], verification_url=verification_url)
    
    return {"msg": "Registration successful. Please check your email to verify your account."}


@router.get("/verify-email", response_model=schemas.Msg)
def verify_email(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        scope: str = payload.get("scope")
        if email is None or scope != "email_verification":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token scope")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_active:
        return {"msg": "Account already verified. You can log in."}
        
    user.is_active = True
    user.verified_at = datetime.now(timezone.utc)
    db.commit()

    return {"msg": "Account verified successfully. You can now log in."}


@router.post("/login")
def login_user(form_data: schemas.UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.email).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account not active. Please verify your email first."
        )

    # --- 2FA Logic ---
    if user.is_two_factor_enabled:
        if not form_data.two_factor_code:
            # 2FA is required, but no code was provided.
            return {"detail": "2FA code required.", "two_factor_required": True}
        
        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(form_data.two_factor_code):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid 2FA code.",
            )
            
    # --- End of 2FA Logic ---

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/forgot-password", response_model=schemas.Msg)
async def forgot_password(request: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        return {"msg": "If an account with that email exists, a password reset link has been sent."}
    
    reset_token_expires = timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    reset_token = create_access_token(
        data={"sub": user.email, "scope": "password_reset"},
        expires_delta=reset_token_expires
    )

    base_url = "http://localhost:3000"
    reset_url = f"{base_url}/reset-password?token={reset_token}"

    await send_password_reset_email(email=[user.email], reset_url=reset_url)

    return {"msg": "If an account with that email exists, a password reset link has been sent."}


@router.post("/reset-password", response_model=schemas.Msg)
def reset_password(request: schemas.PasswordReset, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        scope: str = payload.get("scope")
        if email is None or scope != "password_reset":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token scope")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials, token may be expired or invalid")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if len(request.password.encode('utf-8')) > 72:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Password is too long. Please use a password with 72 characters or fewer."
        )

    user.hashed_password = get_password_hash(request.password)
    db.commit()

    return {"msg": "Your password has been reset successfully."}