// File: frontend/components/VehicleBooking.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card/Card";
import { Input } from "@/components/ui/input";
import { MapPin, Users, Briefcase, Search } from "lucide-react";
// We no longer import the Next.js Image component
// import Image from 'next/image';

const vehicles = [
  {
    name: "Volkswagen Touareg",
    description: "Ultimate luxury for discerning travelers",
    features: ["Up to 4 passengers", "Massage seats & champagne service", "Professional chauffeur", "Airport transfers included"],
    image: "/assets/volkswagen-touareg.png"
  },
  {
    name: "Tesla Model X",
    description: "Spacious comfort with cutting-edge technology",
    features: ["Up to 7 passengers", "Falcon wing doors", "Autopilot capability", "Zero emissions travel"],
    image: "/assets/tesla-model-x.png"
  },
  {
    name: "Mercedes V-Class",
    description: "Spacious comfort for group adventures",
    features: ["Up to 8 passengers", "Individual captain's chairs", "Panoramic sunroof", "Extra luggage space"],
    image: "/assets/mercedes-v-class.png"
  }
];

export default function VehicleBooking() {
  return (
    <section className="w-full max-w-screen-2xl mx-auto py-8 px-4 sm:px-6 md:px-8">
        <div className="text-center mb-8">
            <h2 className="text-4xl font-bold tracking-tight">Travel in Style</h2>
            <p className="text-gray-500 mt-2">Premium vehicles tailored to your journey</p>
            <div className="mt-4 inline-flex items-center bg-gray-100 p-1 rounded-lg">
            <Button variant="ghost" className="bg-white shadow-sm text-sm">Airport Transfer</Button>
            <Button variant="ghost" className="text-gray-600 text-sm">Chauffeur Service</Button>
            </div>
        </div>

        {/* Input fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input placeholder="Enter Pick-up location" className="pl-10 bg-gray-50" />
            </div>
            <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input placeholder="Destination" className="pl-10 bg-gray-50" />
            </div>
            <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select className="w-full h-10 pl-10 pr-4 text-sm border border-input bg-gray-50 rounded-md focus:ring-ring focus:border-ring">
                    <option>1-3 passengers</option>
                    <option>4-7 passengers</option>
                    <option>8+ passengers</option>
                </select>
            </div>
            <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select className="w-full h-10 pl-10 pr-4 text-sm border border-input bg-gray-50 rounded-md focus:ring-ring focus:border-ring">
                    <option>1-2 bags</option>
                    <option>3-5 bags</option>
                    <option>6+ bags</option>
                </select>
            </div>
        </div>
        
        {/* Search bar - simplified for UI */}
        <div className="relative mb-4 max-w-lg mx-auto">
            <Input placeholder="What's your destination? I'll handle the rest." className="pl-4 pr-10 h-12 rounded-full bg-gray-100" />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <p className="text-xs text-center text-gray-500 mb-8">
            <span className="text-green-500 font-semibold">●</span> Real-time insights active • Weather: 18°C • Traffic: Light
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {vehicles.map((vehicle, index) => (
            <Card key={index} className="overflow-hidden shadow-none border-gray-200">
                <CardHeader className="p-0">
                {/* Using a standard <img> tag to bypass Next.js image optimization */}
                <img 
                    src={vehicle.image} 
                    alt={vehicle.name} 
                    className="h-48 w-full object-cover"
                />
                </CardHeader>
                <CardContent className="p-6">
                    <h3 className="text-xl font-bold">{vehicle.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{vehicle.description}</p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-600">
                    {vehicle.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center">
                        <span className="text-gray-400 mr-2 text-xs">●</span> {feature}
                        </li>
                    ))}
                    </ul>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                    <Button className="w-full bg-swiss-red hover:bg-red-700">Book</Button>
                </CardFooter>
            </Card>
            ))}
        </div>
    </section>
  );
}

