// File: frontend/components/ChatMessage.tsx
"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Message, ItineraryDay, CustomizationFeedback } from "@/lib/types";
import PredictiveItinerary from "./PredictiveItinerary";
import { Button } from "./ui/button";
import BookingSummaryCard from "./BookingSummaryCard";
import RideBookingCard from "./RideBookingCard";
import AuthPromptCard from "./AuthPromptCard"; // Import the new card

interface ChatMessageProps {
  message: Message;
  onSaveTrip: (itineraryToSave: ItineraryDay[]) => void;
  onCustomize: (itinerary: ItineraryDay[]) => void;
  onViewCustomization: (feedback: CustomizationFeedback) => void;
  onExpandRide: (messageId: number) => void;
}

export default function ChatMessage({ message, onSaveTrip, onCustomize, onViewCustomization, onExpandRide }: ChatMessageProps) {
  const isUser = message.sender === 'user';

  // Render the Auth Prompt Card
  if (message.authPrompt) {
      return (
        <div className="flex items-start gap-4">
            <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-gray-700 text-white text-xs">AI</AvatarFallback>
            </Avatar>
            <AuthPromptCard />
        </div>
      )
  }

  // Render the Ride Booking Card
  if (message.sender === 'ai' && message.rideDetails) {
    return (
        <div className="flex items-start gap-4">
            <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-gray-700 text-white text-xs">AI</AvatarFallback>
            </Avatar>
            <div className="w-full max-w-md">
                <p className="max-w-xl rounded-lg px-4 py-3 text-sm rounded-bl-none bg-gray-100 text-gray-800 mb-2">{message.content}</p>
                <RideBookingCard
                    payload={message.rideDetails}
                    summary={message.rideDetails.summary}
                    onExpand={() => onExpandRide(message.id)}
                />
            </div>
        </div>
    );
  }

  // Render the Booking Summary Card with the final itinerary
  if (message.sender === 'ai' && message.bookingSummaryItinerary) {
    return (
        <div className="flex items-start gap-4">
            <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-gray-700 text-white text-xs">AI</AvatarFallback>
            </Avatar>
            <div className="w-full max-w-md">
                <p className="max-w-xl rounded-lg px-4 py-3 text-sm rounded-bl-none bg-gray-100 text-gray-800 mb-2">{message.content}</p>
                <BookingSummaryCard itinerary={message.bookingSummaryItinerary} />
            </div>
        </div>
    );
  }

  // Render the Itinerary Card
  if (message.sender === 'ai' && message.itinerary && message.itinerary.length > 0) {
    return (
        <div className="flex items-start gap-4">
            <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-gray-700 text-white text-xs">AI</AvatarFallback>
            </Avatar>
            <div className="w-full max-w-2xl">
                 <PredictiveItinerary itinerary={message.itinerary} onSaveTrip={onSaveTrip} onCustomize={onCustomize} />
            </div>
        </div>
    );
  }

  // Render a customization request
  if (isUser && message.customizationRequest) {
    return (
        <div className={`flex items-start gap-4 justify-end`}>
            <div className="max-w-xl">
                <div className="rounded-lg px-4 py-3 text-sm rounded-br-none bg-gray-800 text-white">
                    <p>{message.content}</p>
                </div>
                <Button variant="link" size="sm" className="text-xs text-gray-500" onClick={() => onViewCustomization(message.customizationRequest!)}>View Customizations</Button>
            </div>
            <Avatar className="h-8 w-8"><AvatarFallback className="bg-gray-300 text-gray-700 text-xs">U</AvatarFallback></Avatar>
        </div>
    );
  }

  if (!message.content) { return null; }

  // Render standard text bubbles
  return (
    <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gray-700 text-white text-xs">AI</AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-xl rounded-lg px-4 py-3 text-sm ${
          isUser
            ? 'rounded-br-none bg-gray-800 text-white'
            : 'rounded-bl-none bg-gray-100 text-gray-800'
        }`}
      >
        <p>{message.content}</p>
      </div>
      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gray-300 text-gray-700 text-xs">U</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}