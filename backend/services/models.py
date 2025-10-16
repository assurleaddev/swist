# File: backend/services/models.py
import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    Float,
    DateTime,
    ForeignKey,
    JSON,
    Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..auth.database import Base
from ..auth.models import User


class VehicleType(enum.Enum):
    sedan = "sedan"
    suv = "suv"
    van = "van"
    minibus = "minibus"


class PricingCondition(enum.Enum):
    hourly = "hourly"
    flat = "flat"
    distance_based = "distance_based"


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    # Changed length from 255 to 191 for MySQL compatibility
    slug = Column(String(191), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)

    features = relationship("ServiceFeature", back_populates="service", cascade="all, delete-orphan")
    vehicles = relationship("Vehicle", secondary="service_vehicles", back_populates="services")
    pricing = relationship("Pricing", back_populates="service", cascade="all, delete-orphan")
    faqs = relationship("FAQ", back_populates="service", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="service", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="service")


class ServiceFeature(Base):
    __tablename__ = "service_features"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    service = relationship("Service", back_populates="features")


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum(VehicleType), nullable=False)
    capacity_adults = Column(Integer, nullable=False)
    capacity_luggage = Column(Integer, nullable=False)
    features = Column(JSON, nullable=True)
    image_url = Column(String(255), nullable=True)
    price_per_hour = Column(Float, nullable=True)
    price_per_km = Column(Float, nullable=True)

    services = relationship("Service", secondary="service_vehicles", back_populates="vehicles")
    pricing = relationship("Pricing", back_populates="vehicle")
    bookings = relationship("Booking", back_populates="vehicle")


class ServiceVehicle(Base):
    __tablename__ = "service_vehicles"
    service_id = Column(Integer, ForeignKey("services.id"), primary_key=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), primary_key=True)


class Destination(Base):
    __tablename__ = "destinations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    country = Column(String(255), nullable=False)
    city = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)


class Pricing(Base):
    __tablename__ = "pricing"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    from_destination_id = Column(Integer, ForeignKey("destinations.id"), nullable=False)
    to_destination_id = Column(Integer, ForeignKey("destinations.id"), nullable=False)
    price = Column(Float, nullable=False)
    currency = Column(String(10), default="CHF")
    condition = Column(Enum(PricingCondition), nullable=False)

    service = relationship("Service", back_populates="pricing")
    vehicle = relationship("Vehicle", back_populates="pricing")
    from_destination = relationship("Destination", foreign_keys=[from_destination_id])
    to_destination = relationship("Destination", foreign_keys=[to_destination_id])


class FAQ(Base):
    __tablename__ = "faqs"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    question = Column(String(255), nullable=False)
    answer = Column(Text, nullable=False)

    service = relationship("Service", back_populates="faqs")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    service = relationship("Service", back_populates="reviews")
    user = relationship("User", back_populates="reviews")


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    pickup_destination_id = Column(Integer, ForeignKey("destinations.id"), nullable=False)
    dropoff_destination_id = Column(Integer, ForeignKey("destinations.id"), nullable=False)
    pickup_time = Column(DateTime(timezone=True), nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String(50), default="pending")  # e.g., pending, confirmed, canceled
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="bookings")
    service = relationship("Service", back_populates="bookings")
    vehicle = relationship("Vehicle", back_populates="bookings")
    pickup_destination = relationship("Destination", foreign_keys=[pickup_destination_id])
    dropoff_destination = relationship("Destination", foreign_keys=[dropoff_destination_id])

# Update User model to include relationships to new models
User.reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
User.bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")