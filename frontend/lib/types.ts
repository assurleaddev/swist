// File: frontend/lib/types.ts

// The main interface for a chat message, used throughout the frontend
export interface Message {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  itinerary?: ItineraryDay[];
  customizationRequest?: CustomizationFeedback;
  bookingSummaryItinerary?: ItineraryDay[];
  // New property to trigger the map modal
  rideBookingPayload?: RideBookingPayload;
}

// Corresponds to the Activity model in the backend
export interface Activity {
    time: string;
    description: string;
    reason: string;
    price: number; // Price in CHF
}

// Corresponds to the ItineraryDay model in the backend
export interface ItineraryDay {
    day: number;
    title: string;
    activities: Activity[];
}

// Represents a trip that the user has saved
export interface SavedTrip {
    id: string;
    name: string;
    dates: string;
    itinerary: ItineraryDay[];
}

// Holds the feedback from the customization modal
export interface CustomizationFeedback {
    generalFeedback: string;
    dailyFeedback: { day: number; feedback: string }[];
}

// Gathers all the details for the initial prompt
export interface PromptDetails {
  mainQuery: string;
  travelers: number;
  date: string;
  flights: boolean;
}

// Represents the response from the Emotional Agent (kept for potential future use)
export interface MoodResponse {
    mood: string;
    color: string;
}

// --- New Types for Ride Booking ---

// Represents a location with coordinates and name
export interface Location {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
}

// The payload sent from the backend to trigger the ride booking UI
export interface RideBookingPayload {
  pickup: Location;
  destination: Location;
}

