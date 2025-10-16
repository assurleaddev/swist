# File: backend/auth/models.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(191), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    bio = Column(Text, nullable=True)
    profile_picture_url = Column(String(255), nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    password_reset_code = Column(String(255), nullable=True)
    password_reset_code_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # --- Fields for 2FA ---
    two_factor_secret = Column(String(191), nullable=True, unique=True)
    is_two_factor_enabled = Column(Boolean, default=False, nullable=False)