// File: frontend/components/HeroSection.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Mic } from "lucide-react";
import { Utensils, Zap, Hotel, Calendar } from 'lucide-react';

const heroData = [
  {
    title: "Where can I take you today?",
    subtitle: "Luxury Airport Transfers",
    description: "Seamless journeys with prestige and comfort",
    welcome: "Welcome back to your exclusive travel service. Where may we drive you today?",
    image: "/assets/trasfere-service.png" 
  },
  {
    title: "Your table is waiting",
    subtitle: "Fine Dining Reservations",
    description: "Michelin-starred experiences reserved just for you",
    welcome: "Welcome back to your private dining concierge. Which flavor inspires you tonight?",
    image: "/assets/lux-dining.png"
  },
  {
    title: "Step inside a world beyond velvet ropes",
    subtitle: "Exclusive Events in Switzerland",
    description: "Unforgettable moments at Switzerland’s most prestigious gatherings",
    welcome: "Welcome back to your exclusive events concierge. Which occasion shall we unlock for you?",
    image: "/assets/exclusive-events.png"
  },
  {
    title: "Your sanctuary awaits",
    subtitle: "Luxury Hotels & Retreats",
    description: "Iconic stays, timeless design, and Swiss-level precision",
    welcome: "Welcome back to your luxury hotels concierge. Where would you like to wake up next?",
    image: "/assets/lux-hotels.png"
  }
];

const serviceCards = [
    { id: 0, icon: <Zap className="h-8 w-8 text-red-500" />, title: "Private Transfers", description: "Helicopter & luxury transport" },
    { id: 1, icon: <Utensils className="h-8 w-8 text-red-500" />, title: "Fine Dining", description: "Michelin-starred reservations" },
    { id: 2, icon: <Calendar className="h-8 w-8 text-red-500" />, title: "Exclusive Events", description: "Private experiences & VIP access" },
    { id: 3, icon: <Hotel className="h-8 w-8 text-red-500" />, title: "Luxury Hotels", description: "5-star accommodations" },
];

interface HeroSectionProps {
    onStartChat: (prompt: string) => void;
}

export default function HeroSection({ onStartChat }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    // This single timer now controls all animations
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroData.length);
    }, 5000); // Change every 5 seconds
    return () => clearInterval(timer);
  }, []);

  const handlePromptSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(prompt.trim()) {
          onStartChat(prompt);
      }
  };

  const activeHero = heroData[currentSlide];

  return (
    <section className="relative w-full h-screen flex flex-col justify-center items-center text-white overflow-hidden">
        {/* Background Image Slider now controlled by React state */}
        <div className="absolute inset-0 w-full h-full">
            {heroData.map((hero, index) => (
                <img
                key={index}
                src={hero.image}
                alt={hero.title}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                    currentSlide === index ? "opacity-100" : "opacity-0"
                }`}
                />
            ))}
            <div className="absolute inset-0 bg-black/40"></div>
        </div>

        <div key={currentSlide} className="relative z-10 flex flex-col items-center text-center px-4 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold">{activeHero.title}</h1>
            
            <div className="animated-gradient-border-input mt-8 w-full max-w-2xl p-1">
              <form onSubmit={handlePromptSubmit} className="relative">
                  <Input
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="I want to experience authentic Swiss culture with luxury accommodations..."
                      className="w-full h-16 rounded-full pl-6 pr-14 text-base bg-gray-900/20 backdrop-blur-sm text-white placeholder:text-gray-300 border-transparent focus:ring-0 focus:border-transparent"
                  />
                  <button type="submit" className="absolute right-5 top-1/2 -translate-y-1/2">
                      <Mic className="h-6 w-6 text-white cursor-pointer" />
                  </button>
              </form>
            </div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-4xl">
                {serviceCards.map((card, index) => {
                    const isActive = currentSlide === index;
                    return (
                        <div key={card.id} className={`${isActive ? 'animated-gradient-border' : 'rounded-2xl'}`}>
                            <div className="bg-gray-900/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-40 hover:bg-gray-800 transition-colors cursor-pointer">
                                {card.icon}
                                <h3 className="mt-2 font-semibold">{card.title}</h3>
                                <p className="text-xs text-gray-300">{card.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-16 text-center">
                <h2 className="text-3xl font-bold">{activeHero.subtitle}</h2>
                <p className="mt-1 text-lg text-gray-200">{activeHero.description}</p>
                <p className="mt-4 text-sm text-gray-300">{activeHero.welcome}</p>
            </div>
        </div>
    </section>
  );
}

