// File: frontend/app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import NeuralPromptBar from '@/components/NeuralPromptBar';
import ChatMessage from '@/components/ChatMessage';
import Sidebar from '@/components/Sidebar';
import ServiceCard from '@/components/ServiceCard';
import Footer from '@/components/Footer';
import CustomizeModal from '@/components/CustomizeModal';
import VehicleBooking from '@/components/VehicleBooking';
import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FeaturedJourney from '@/components/FeaturedJourney';
import TailoredExperiences from '@/components/TailoredExperiences'; // Import the new component
import { ItineraryDay, SavedTrip, CustomizationFeedback, Message, PromptDetails } from '@/lib/types';
import { Utensils, Zap, Hotel, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type ConversationStage = 
  | 'AWAITING_INITIAL_PROMPT' | 'AWAITING_TRAVELERS' | 'AWAITING_DATE'
  | 'AWAITING_FLIGHTS' | 'GENERATING_ITINERARY' | 'AWAITING_IMPROVEMENTS' | 'PLAN_CONFIRMED';

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [conversationStage, setConversationStage] = useState<ConversationStage>('AWAITING_INITIAL_PROMPT');
  const [promptDetails, setPromptDetails] = useState<Partial<PromptDetails>>({});
  const [isPlanFinalized, setIsPlanFinalized] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [currentItineraryToCustomize, setCurrentItineraryToCustomize] = useState<ItineraryDay[]>([]);
  const [isReadOnlyModal, setIsReadOnlyModal] = useState(false);
  const [currentFeedbackToView, setCurrentFeedbackToView] = useState<CustomizationFeedback | null>(null);

  useEffect(() => {
    startNewSession();
  }, []);

  const startNewSession = () => {
    setSessionId(crypto.randomUUID());
    setMessages([{ id: Date.now(), sender: 'ai', content: 'Welcome to your personal Swiss Concierge. How can I assist you with your travel plans today?' }]);
    setConversationStage('AWAITING_INITIAL_PROMPT');
    setPromptDetails({});
    setIsPlanFinalized(false);
  };

  const handleNewMessage = (newMessage: Message) => {
    setMessages(prev => [...prev, newMessage]);
  };
  
  useEffect(() => {
    const stageActions: Record<ConversationStage, () => void> = {
        AWAITING_TRAVELERS: () => handleNewMessage({ id: Date.now(), sender: 'ai', content: 'That sounds wonderful! To help me plan the perfect trip, could you tell me how many people will be traveling?' }),
        AWAITING_DATE: () => handleNewMessage({ id: Date.now(), sender: 'ai', content: 'Great! And what are your preferred travel dates?' }),
        AWAITING_FLIGHTS: () => handleNewMessage({ id: Date.now(), sender: 'ai', content: 'Perfect. Have you already booked your flights? (Yes/No)' }),
        PLAN_CONFIRMED: () => {
            const lastItinerary = [...messages].reverse().find(m => m.itinerary)?.itinerary;
            if (lastItinerary) {
                handleNewMessage({ id: Date.now(), sender: 'ai', content: "Excellent! I'm glad you're happy with the plan. Here is the final summary. You can proceed with the booking.", bookingSummaryItinerary: lastItinerary });
                setIsPlanFinalized(true);
            }
        },
        AWAITING_INITIAL_PROMPT: () => {},
        GENERATING_ITINERARY: () => {},
        AWAITING_IMPROVEMENTS: () => {}
    };
    stageActions[conversationStage]?.();
  }, [conversationStage]);

  const handleNewPrompt = async (prompt: string) => {
    handleNewMessage({ id: Date.now(), sender: 'user', content: prompt });
    
    switch (conversationStage) {
        case 'AWAITING_INITIAL_PROMPT':
            setPromptDetails({ mainQuery: prompt }); setConversationStage('AWAITING_TRAVELERS'); break;
        case 'AWAITING_TRAVELERS':
            setPromptDetails(prev => ({ ...prev, travelers: parseInt(prompt, 10) || 1 })); setConversationStage('AWAITING_DATE'); break;
        case 'AWAITING_DATE':
            setPromptDetails(prev => ({ ...prev, date: prompt })); setConversationStage('AWAITING_FLIGHTS'); break;
        case 'AWAITING_FLIGHTS':
            const finalDetails = { ...promptDetails, flights: prompt.toLowerCase().includes('yes') } as PromptDetails;
            setPromptDetails(finalDetails); setConversationStage('GENERATING_ITINERARY'); generateItinerary(finalDetails, null); break;
        case 'AWAITING_IMPROVEMENTS':
            const positiveConfirmation = ['yes', 'perfect', 'looks good', 'no more changes', 'proceed', 'checkout', 'finalize', 'confirm'].some(term => prompt.toLowerCase().includes(term));
            if (positiveConfirmation) {
                setConversationStage('PLAN_CONFIRMED');
            } else {
                const lastItinerary = [...messages].reverse().find(m => m.itinerary)?.itinerary;
                if (lastItinerary) {
                    setConversationStage('GENERATING_ITINERARY');
                    generateItinerary(promptDetails as PromptDetails, lastItinerary, prompt);
                } else {
                    handleNewMessage({id: Date.now() + 1, sender: 'ai', content: "I seem to have lost the context. Let's start a new plan."});
                    startNewSession();
                }
            }
            break;
    }
  };

  const generateItinerary = async (details: PromptDetails, previousItinerary: ItineraryDay[] | null, feedback?: string) => {
    setIsLoading(true);
    let fullPrompt = `Plan a trip based on the following details:\n- Main Request: ${details.mainQuery}\n- Number of Travelers: ${details.travelers}\n- Departure Date: ${details.date}\n- Flights Booked: ${details.flights ? 'Yes' : 'No'}`;
    if (previousItinerary && feedback) {
        fullPrompt = `Please improve the following travel itinerary based on my feedback.\n\nOriginal Request Details:\n- Main Request: ${details.mainQuery}\n- Travelers: ${details.travelers}\n- Date: ${details.date}\n\nPrevious Itinerary:\n${JSON.stringify(previousItinerary, null, 2)}\n\nMy Feedback for Improvement:\n"${feedback}"\n\nGenerate a new, improved itinerary based on all this information.`
    }
    try {
      const neuralResponse = await axios.post('http://127.0.0.1:8000/api/agents/neural', { prompt: fullPrompt });
      if (neuralResponse.data && neuralResponse.data.itinerary_draft) {
        handleNewMessage({ id: Date.now() + 2, sender: 'ai', content: "", itinerary: neuralResponse.data.itinerary_draft });
        handleNewMessage({ id: Date.now() + 3, sender: 'ai', content: "How does this look? Are there any further adjustments you'd like, or shall we finalize this plan?" });
        setConversationStage('AWAITING_IMPROVEMENTS');
      }
    } catch (error) {
      console.error("Error fetching AI responses:", error);
      handleNewMessage({ id: Date.now() + 1, sender: 'ai', content: "I'm sorry, I encountered an error. Please try again." });
      setConversationStage('AWAITING_INITIAL_PROMPT');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTrip = (itineraryToSave: ItineraryDay[]) => {
    const tripId = itineraryToSave[0]?.title || `Trip ${Date.now()}`;
    if (savedTrips.some(trip => trip.id === tripId)) {
        setShowSavedPopup(true); setTimeout(() => setShowSavedPopup(false), 3000); return;
    }
    const newSavedTrip: SavedTrip = { id: tripId, name: tripId, dates: `5 Days • Est. Dec 18-22`, itinerary: itineraryToSave };
    setSavedTrips(prev => [...prev, newSavedTrip]);
  };
  const handleOpenCustomizeModal = (itinerary: ItineraryDay[]) => {
    setCurrentItineraryToCustomize(itinerary); setIsReadOnlyModal(false); setCurrentFeedbackToView(null); setIsCustomizeModalOpen(true);
  };
  const handleViewCustomization = (feedback: CustomizationFeedback) => {
    setCurrentFeedbackToView(feedback); const relatedItinerary = messages.find(m => m.itinerary)?.itinerary || []; setCurrentItineraryToCustomize(relatedItinerary); setIsReadOnlyModal(true); setIsCustomizeModalOpen(true);
  };
  const handleSaveCustomization = (feedback: CustomizationFeedback) => {
    const feedbackPrompt = `My overall feedback is: "${feedback.generalFeedback}". For specific days: ${feedback.dailyFeedback.filter(d => d.feedback.trim() !== '').map(d => `For Day ${d.day}, I'd like to change it to: "${d.feedback}"`).join('. ')}.`;
    handleNewMessage({ id: Date.now(), sender: 'user', content: `I've requested some changes to the previous itinerary.`, customizationRequest: feedback });
    const lastItinerary = [...messages].reverse().find(m => m.itinerary)?.itinerary;
    if(lastItinerary) {
        setConversationStage('GENERATING_ITINERARY');
        generateItinerary(promptDetails as PromptDetails, lastItinerary, feedbackPrompt);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-800">
        {showSavedPopup && ( <div className="fixed top-5 right-5 bg-black text-white px-4 py-2 rounded-md shadow-lg z-50 animate-fade-in-out"> Trip already saved! </div> )}
        
        <Header />
        <main>
            <HeroSection onStartChat={handleNewPrompt} />
        </main>
        <div className="p-8 space-y-8">
            <TailoredExperiences />
            <VehicleBooking />
            <FeaturedJourney />
        </div>

        <div className="flex-grow w-full max-w-screen-2xl mx-auto grid grid-cols-12 gap-8 px-8 pt-0">
            <main className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm h-[80vh]">
                <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                    {messages.map((msg) => ( <ChatMessage key={msg.id} message={msg} onSaveTrip={handleSaveTrip} onCustomize={handleOpenCustomizeModal} onViewCustomization={handleViewCustomization} /> ))}
                    {isLoading && ( <div className="flex items-start gap-4"> <Avatar className="h-8 w-8"> <AvatarFallback className="bg-gray-700 text-white text-xs">AI</AvatarFallback> </Avatar> <div className="max-w-xl rounded-lg px-4 py-3 text-sm rounded-bl-none bg-gray-100 text-gray-800"> <div className="flex items-center justify-center space-x-1 h-5"> <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span> <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span> <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span> </div> </div> </div> )}
                </div>
                <div className="p-4 border-t border-gray-200">
                    <NeuralPromptBar onNewPrompt={handleNewPrompt} onNewTrip={startNewSession} isLoading={isLoading} />
                </div>
            </main>
            <aside className="col-span-12 lg:col-span-4 xl:col-span-3"> <Sidebar savedTrips={savedTrips} /> </aside>
        </div>
        <section className="w-full max-w-screen-2xl mx-auto px-8 pb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ServiceCard icon={<Utensils className="h-6 w-6" />} title="Fine Dining" description="Michelin-starred reservations" />
                <ServiceCard icon={<Zap className="h-6 w-6" />} title="Private Transfers" description="Helicopter & luxury transport" />
                <ServiceCard icon={<Hotel className="h-6 w-6" />} title="Luxury Hotels" description="5-star suites & spa access" />
                <ServiceCard icon={<Calendar className="h-6 w-6" />} title="Exclusive Events" description="Private experiences & VIP access" />
            </div>
        </section>
        <Footer />
        <CustomizeModal isOpen={isCustomizeModalOpen} onClose={() => setIsCustomizeModalOpen(false)} itinerary={currentItineraryToCustomize} onSave={handleSaveCustomization} readOnlyFeedback={currentFeedbackToView} />
  
    </div>
  );
}

