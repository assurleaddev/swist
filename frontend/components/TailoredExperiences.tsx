// File: frontend/components/TailoredExperiences.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Mic, Mountain, Map, Star, Telescope, Utensils, GlassWater , Dessert, Cigarette } from "lucide-react";

const experiences = [
  {
    title: "Skiing the Alps",
    description: "An elegant escape into the snowy Alps, where adventure meets refined comfort.",
    image: "assets/alpine.jpeg",
    activities: [
      { icon: <Map className="h-4 w-4 mr-3 text-gray-300" />, text: "Arrive in Geneva" },
      { icon: <Mountain className="h-4 w-4 mr-3 text-gray-300" />, text: "Scenic Mont Blanc transfer" },
      { icon: <Star className="h-4 w-4 mr-3 text-gray-300" />, text: "Luxury resort check-in" },
      { icon: <Telescope className="h-4 w-4 mr-3 text-gray-300" />, text: "Guided slopes adventure" },
      { icon: <GlassWater className="h-4 w-4 mr-3 text-gray-300" />, text: "Après-ski fine dining" },
    ],
  },
  {
    title: "Hidden Villages",
    description: "Discover Switzerland's secret villages and timeless traditions.",
    image: "assets/cultural.webp",
    activities: [
      { icon: <Mountain className="h-4 w-4 mr-3 text-gray-300" />, text: "Morning countryside drive" },
      { icon: <Map className="h-4 w-4 mr-3 text-gray-300" />, text: "Explore medieval streets" },
      { icon: <Star className="h-4 w-4 mr-3 text-gray-300" />, text: "Artisan workshop visit" },
      { icon: <Utensils className="h-4 w-4 mr-3 text-gray-300" />, text: "Traditional lunch with locals" },
      { icon: <Telescope className="h-4 w-4 mr-3 text-gray-300" />, text: "Sunset over vineyards" },
    ],
  },
  {
    title: "Fine Dining Journeys",
    description: "Indulge in unforgettable Michelin-starred journeys, curated for every palate.",
    image: "assets/lake.webp",
    activities: [
      { icon: <Star className="h-4 w-4 mr-3 text-gray-300" />, text: "Michelin-starred arrival" },
      { icon: <Utensils className="h-4 w-4 mr-3 text-gray-300" />, text: "Chef's tasting tour" },
      { icon: <GlassWater className="h-4 w-4 mr-3 text-gray-300" />, text: "Wine pairing session" },
      { icon: <Dessert className="h-4 w-4 mr-3 text-gray-300" />, text: "Private rooftop dessert" },
      { icon: <Cigarette className="h-4 w-4 mr-3 text-gray-300" />, text: "Post-dinner cigar and scotch" },
    ],
  },
];

export default function TailoredExperiences() {
  return (
    <section className="w-full max-w-screen-2xl mx-auto py-8">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold tracking-tight">Tailored Swiss Experiences</h2>
        <p className="text-gray-500 mt-2">Curated adventures that capture the essence of Switzerland</p>
      </div>

      <div className="relative mb-12 max-w-xl mx-auto">
        <Input
          placeholder="Which adventure shall we begin?"
          className="w-full h-14 rounded-full pl-6 pr-14 text-base border-gray-300 focus:ring-swiss-red focus:border-swiss-red"
        />
        <Mic className="absolute right-5 top-1/2 -translate-y-1/2 h-6 w-6 text-red-500 cursor-pointer" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {experiences.map((exp, index) => (
          <div key={index} className="relative rounded-2xl overflow-hidden text-white h-[500px] flex flex-col justify-end p-8 bg-black group">
            <img src={exp.image} alt={exp.title} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-30 transition-opacity duration-300"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <div className="relative z-10">
                <h3 className="text-3xl font-bold">{exp.title}</h3>
                <p className="mt-2 text-gray-300">{exp.description}</p>
                <ul className="mt-6 space-y-4 text-sm font-medium">
                    {exp.activities.map((act, actIndex) => (
                        <li key={actIndex} className="flex items-center">
                            {act.icon}
                            <span>{act.text}</span>
                        </li>
                    ))}
                </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
