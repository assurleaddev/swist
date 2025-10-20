// File: frontend/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth, api } from '@/context/AuthContext';
import NeuralPromptBar from '@/components/NeuralPromptBar';
import ChatMessage from '@/components/ChatMessage';
import Sidebar from '@/components/Sidebar';
import RideBookingMap from '@/components/RideBookingMap';
import { ItineraryDay, SavedTrip, CustomizationFeedback, Message, PromptDetails, RideBookingPayload, RideSummary, RideState } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import FeaturedJourney from '@/components/FeaturedJourney';
import TailoredExperiences from '@/components/TailoredExperiences';
import VehicleBooking from '@/components/VehicleBooking';
import CustomizeModal from '@/components/CustomizeModal';
import ServiceCard from '@/components/ServiceCard';
import { Utensils, Zap, Hotel, Calendar } from 'lucide-react';

type ConversationStage =
  | 'AWAITING_INITIAL_PROMPT' | 'AWAITING_TRAVELERS' | 'AWAITING_DATE'
  | 'AWAITING_FLIGHTS' | 'GENERATING_ITINERARY' | 'AWAITING_IMPROVEMENTS' | 'PLAN_CONFIRMED';

export default function Home() {
  const { user, isLoading: authIsLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<{id: number, title: string}[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRideBookingModalOpen, setIsRideBookingModalOpen] = useState(false);
  const [activeRideMessageId, setActiveRideMessageId] = useState<number | null>(null);
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [showSavedPopup, setShowSavedPopup] = useState(false);
  const [conversationStage, setConversationStage] = useState<ConversationStage>('AWAITING_INITIAL_PROMPT');
  const [promptDetails, setPromptDetails] = useState<Partial<PromptDetails>>({});
  const [isPlanFinalized, setIsPlanFinalized] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [currentItineraryToCustomize, setCurrentItineraryToCustomize] = useState<ItineraryDay[]>([]);
  const [isReadOnlyModal, setIsReadOnlyModal] = useState(false);
  const [currentFeedbackToView, setCurrentFeedbackToView] = useState<CustomizationFeedback | null>(null);
  
  const startNewSession = useCallback(() => {
    setActiveSessionId(null);
    setMessages([{ id: Date.now(), sender: 'ai', content: 'Welcome! Log in or register to save your chat history and create multiple travel plans.' }]);
  }, []);
  
  const handleNewChat = useCallback(async () => {
    if (!user) {
        startNewSession();
        return;
    }
    try {
        const response = await api.post('/chat/sessions', { title: "New Chat" });
        const newSession = response.data;
        setChatSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setMessages([{ id: Date.now(), sender: 'ai', content: 'How can I assist you with your new trip?' }]);
    } catch (error) {
        console.error("Failed to create new chat session:", error);
    }
  }, [user, startNewSession]);

  const handleSelectChat = useCallback(async (sessionId: number) => {
    if (sessionId === activeSessionId) return;
    setActiveSessionId(sessionId);
    setIsLoading(true);
    try {
        const response = await api.get(`/chat/sessions/${sessionId}`);
        setMessages(response.data.length > 0 ? response.data : [{ id: Date.now(), sender: 'ai', content: 'This is a new chat. How can I help?' }]);
    } catch (error) {
        console.error("Failed to fetch messages for session:", sessionId, error);
    } finally {
        setIsLoading(false);
    }
  }, [activeSessionId]);

  const fetchChatSessions = useCallback(async () => {
    if (!user) return;
    try {
        const response = await api.get('/chat/sessions');
        setChatSessions(response.data);
        if (response.data.length > 0 && !activeSessionId) {
            handleSelectChat(response.data[0].id);
        } else if (response.data.length === 0) {
            handleNewChat();
        }
    } catch (error) {
        console.error("Failed to fetch chat sessions:", error);
    }
  }, [user, activeSessionId, handleSelectChat, handleNewChat]);

  useEffect(() => {
    if (!authIsLoading) {
        if (user) {
            fetchChatSessions();
        } else {
            setChatSessions([]);
            startNewSession();
        }
    }
  }, [user, authIsLoading, fetchChatSessions, startNewSession]);

  const handleNewMessage = (newMessage: Message) => {
    setMessages(prev => [...prev, newMessage]);
  };

  const handleNewPrompt = async (prompt: string) => {
    handleNewMessage({ id: Date.now(), sender: 'user', content: prompt });

    if (!user) {
        handleNewMessage({ id: Date.now() + 1, sender: 'ai', content: '', authPrompt: true });
        return;
    }

    if (!activeSessionId) {
        handleNewMessage({id: Date.now() + 1, sender: 'ai', content: "Please select or create a new chat session first."});
        return;
    }
    
    await generateItinerary({ mainQuery: prompt, sessionId: activeSessionId });
  };
  
  const generateItinerary = async (details: Partial<PromptDetails & { sessionId: number, currentLocation?: { latitude: number, longitude: number } }>, previousItinerary?: ItineraryDay[] | null, feedback?: string) => {
    setIsLoading(true);
    let fullPrompt = feedback || details.mainQuery || '';
    
    try {
      const payload: any = { prompt: fullPrompt, session_id: details.sessionId };
      if (details.currentLocation) {
          payload.current_location = [details.currentLocation.longitude, details.currentLocation.latitude];
      }
      
      const neuralResponse = await api.post('/agents/neural', payload);
      const { data } = neuralResponse;

      if (data.action_required === 'get_location') {
        handleNewMessage({ id: Date.now() + 1, sender: 'ai', content: data.message });
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    generateItinerary({ ...details, currentLocation: { latitude, longitude } });
                },
                (error) => {
                    let errorMessage = "I couldn't get your location. ";
                    if (error.code === error.PERMISSION_DENIED) {
                        errorMessage += "To use this feature, please enable location permissions for this site in your browser settings and try again.";
                    } else {
                        errorMessage += "Please provide a specific pickup address instead.";
                    }
                    handleNewMessage({ id: Date.now() + 2, sender: 'ai', content: errorMessage });
                    setIsLoading(false);
                }
            );
        } else {
            handleNewMessage({ id: Date.now() + 2, sender: 'ai', content: "Geolocation is not supported by your browser." });
            setIsLoading(false);
        }
      } else if (data.tool_name === 'book_ride') {
          const messageId = Date.now() + 2;
          handleNewMessage({ 
            id: messageId, 
            sender: 'ai', 
            content: "Of course, I can book that ride for you. Please confirm the details on the map.",
            rideDetails: { ...data.tool_params, state: 'searching' } 
          });
          setActiveRideMessageId(messageId);
          setIsRideBookingModalOpen(true);
          setIsLoading(false);
      } else if (data.itinerary_draft) {
        handleNewMessage({ id: Date.now() + 2, sender: 'ai', content: "", itinerary: data.itinerary_draft });
        handleNewMessage({ id: Date.now() + 3, sender: 'ai', content: "How does this look? Are there any further adjustments you'd like, or shall we finalize this plan?" });
        setIsLoading(false);
      } else {
          throw new Error("Invalid response from server.");
      }
    } catch (error) {
        console.error("Error fetching AI responses:", error);
        let errorMessage = "I'm sorry, I encountered an error. Please try again.";
        if (axios.isAxiosError(error) && error.response?.data?.detail) {
            errorMessage = error.response.data.detail;
        }
        handleNewMessage({ id: Date.now() + 1, sender: 'ai', content: errorMessage });
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
        generateItinerary(promptDetails as PromptDetails, lastItinerary, feedbackPrompt);
    }
  };

  const handleExpandRide = (messageId: number) => {
    setActiveRideMessageId(messageId);
    setIsRideBookingModalOpen(true);
  };

  const handleRideStateChange = (newState: RideState) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === activeRideMessageId && msg.rideDetails
          ? { ...msg, rideDetails: { ...msg.rideDetails, state: newState } }
          : msg
      )
    );
  };

  const handleRideComplete = (summary: RideSummary) => {
    setMessages(prevMessages => 
        prevMessages.map(msg => 
            msg.id === activeRideMessageId && msg.rideDetails
            ? { ...msg, rideDetails: { ...msg.rideDetails, summary: summary, state: 'completed' } }
            : msg
        )
    );
    setIsRideBookingModalOpen(false);
    setActiveRideMessageId(null);
  };
  
  const activeRideDetails = messages.find(m => m.id === activeRideMessageId)?.rideDetails;

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
            <aside className="col-span-12 lg:col-span-3">
                <Sidebar 
                    savedTrips={savedTrips} 
                    chatSessions={chatSessions}
                    onNewChat={handleNewChat}
                    onSelectChat={handleSelectChat}
                    activeSessionId={activeSessionId}
                /> 
            </aside>
            <main className="col-span-12 lg:col-span-9 flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm h-[calc(100vh-8rem)]">
                <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                    {messages.map((msg) => ( 
                        <ChatMessage 
                            key={msg.id} 
                            message={msg} 
                            onSaveTrip={handleSaveTrip} 
                            onCustomize={handleOpenCustomizeModal} 
                            onViewCustomization={handleViewCustomization}
                            onExpandRide={handleExpandRide} 
                        /> 
                    ))}
                    {isLoading && ( <div className="flex items-start gap-4"> <Avatar className="h-8 w-8"> <AvatarFallback className="bg-gray-700 text-white text-xs">AI</AvatarFallback> </Avatar> <div className="max-w-xl rounded-lg px-4 py-3 text-sm rounded-bl-none bg-gray-100 text-gray-800"> <div className="flex items-center justify-center space-x-1 h-5"> <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span> <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span> <span className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></span> </div> </div> </div> )}
                </div>
                <div className="p-4 border-t border-gray-200">
                    <NeuralPromptBar onNewPrompt={handleNewPrompt} onNewTrip={handleNewChat} isLoading={isLoading} />
                </div>
            </main>
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
        <CustomizeModal isOpen={isCustomizeModalOpen} onClose={() => setIsCustomizeModalOpen(false)} itinerary={currentItineraryToCustomize} onSave={() => {}} readOnlyFeedback={currentFeedbackToView} />
  
        {isRideBookingModalOpen && activeRideDetails && (
          <RideBookingMap
            payload={activeRideDetails}
            initialState={activeRideDetails.state}
            onClose={() => setIsRideBookingModalOpen(false)}
            onStateChange={handleRideStateChange}
            onComplete={handleRideComplete}
          />
        )}
    </div>
  );
}