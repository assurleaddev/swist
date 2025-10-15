// File: frontend/components/FeaturedJourney.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText } from "lucide-react";

const journeys = [
    {
        title: "Geneva & Lake Region",
        description: "Cosmopolitan elegance with lakeside serenity, where international sophistication meets natural beauty.",
        image: "/assets/lake.webp",
        chronicle: "5-Day Lakeside Chronicle",
        steps: [
            { step: 1, details: "Geneva arrival → Waterfront dining" },
            { step: 2, details: "Old town tour → Luxury shopping" },
            { step: 3, details: "Lake cruise → Lavaux vineyards" },
            { step: 4, details: "Montreux & Chillon Castle → Gourmet dining" },
            { step: 5, details: "Spa morning → Departure" },
        ]
    },
    {
        title: "Alpine Adventure in Interlaken",
        description: "Experience thrilling outdoor activities and breathtaking mountain vistas in the heart of the Swiss Alps.",
        image: "/assets/alpine.jpeg",
        chronicle: "4-Day Mountain Escape",
        steps: [
            { step: 1, details: "Arrival & Harder Kulm viewpoint" },
            { step: 2, details: "Jungfraujoch – Top of Europe" },
            { step: 3, details: "Paragliding & Lake Thun cruise" },
            { step: 4, details: "Grindelwald First & Departure" },
        ]
    },
    {
        title: "Cultural Heart of Zurich",
        description: "Discover a vibrant city of art, history, and culinary delights, nestled by its pristine lake.",
        image: "/assets/cultural.webp",
        chronicle: "3-Day City Discovery",
        steps: [
            { step: 1, details: "Old Town (Altstadt) & Fraumünster Church" },
            { step: 2, details: "Kunsthaus Art Museum & Bahnhofstrasse shopping" },
            { step: 3, details: "Uetliberg Mountain & Departure" },
        ]
    }
];

export default function FeaturedJourney() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % journeys.length);
    }, 5000); // Change slide every 3 seconds

    return () => clearInterval(timer); // Cleanup interval on component unmount
  }, []);

  return (
    <section className="w-full max-w-screen-2xl mx-auto">
        <div className="relative w-full h-[500px] rounded-lg overflow-hidden">
            {journeys.map((journey, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                        index === currentSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                >
                    <img 
                        src={journey.image} 
                        alt={journey.title} 
                        className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                    <div className={`relative z-10 p-8 md:p-12 flex flex-col justify-center h-full max-w-2xl text-white transition-all duration-1000 ease-in-out ${
                        index === currentSlide ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'
                    }`}>
                        <div className="bg-gray-800/80 p-8 rounded-lg backdrop-blur-sm">
                            <h2 className="text-4xl md:text-5xl font-bold">{journey.title}</h2>
                            <p className="mt-4 text-lg text-gray-200">{journey.description}</p>
                            <div className="mt-6 flex items-center text-sm font-medium">
                                <FileText className="h-4 w-4 mr-2" /> {journey.chronicle}
                            </div>
                            <div className="mt-4 space-y-2 text-sm">
                                {journey.steps.map(({step, details}) => (
                                    <div key={step} className="flex items-center">
                                        <span className="flex items-center justify-center h-6 w-6 rounded-full bg-yellow-400 text-black font-bold mr-3">{step}</span>
                                        <span className="text-gray-300">{details}</span>
                                    </div>
                                ))}
                            </div>
                            <Button className="mt-8 bg-yellow-400 text-black font-semibold hover:bg-yellow-500 w-fit">
                                Expand Journey <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </section>
  );
}

