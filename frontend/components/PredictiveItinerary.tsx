// File: frontend/components/PredictiveItinerary.tsx
"use client";

import { useState } from 'react';
import { ItineraryDay } from "@/lib/types";
import { Sun, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface PredictiveItineraryProps {
  itinerary: ItineraryDay[];
  onSaveTrip: (itineraryToSave: ItineraryDay[]) => void;
  onCustomize: (itinerary: ItineraryDay[]) => void;
}

export default function PredictiveItinerary({ itinerary, onSaveTrip, onCustomize }: PredictiveItineraryProps) {
  const [activeDay, setActiveDay] = useState(1);

  if (!itinerary || itinerary.length === 0) {
    return null;
  }

  const selectedDay = itinerary.find(day => day.day === activeDay);

  return (
    <TooltipProvider>
      <div className="bg-white rounded-lg border border-gray-200 shadow-md w-full">
          {/* Day Tabs */}
          <div className="flex border-b border-gray-200">
              {itinerary.map((day) => (
                  <button
                      key={day.day}
                      onClick={() => setActiveDay(day.day)}
                      className={`px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                          activeDay === day.day
                              ? 'border-b-2 border-swiss-red text-swiss-red bg-red-50'
                              : 'text-gray-500 hover:bg-gray-100'
                      }`}
                  >
                      Day {day.day}
                  </button>
              ))}
          </div>

          {/* Daily Plan */}
          {selectedDay && (
              <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                      <h5 className="font-semibold text-gray-700">{selectedDay.title}</h5>
                      <div className="flex items-center text-gray-500 text-sm">
                          <Sun className="h-4 w-4 mr-1.5" />
                          <span>24°C</span>
                      </div>
                  </div>
                  <div className="bg-gray-700 text-white rounded-md p-4 space-y-3">
                      {selectedDay.activities.map((activity, index) => (
                         <div key={index} className="flex items-center justify-between">
                             <div className="flex items-center">
                                 <span className="text-gray-400 w-16">{activity.time}</span>
                                 <span>{activity.description}</span>
                             </div>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <button className="ml-2 text-gray-400 hover:text-white transition-colors">
                                        <Info className="h-4 w-4"/>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{activity.reason}</p>
                                </TooltipContent>
                            </Tooltip>
                         </div>
                      ))}
                  </div>
              </div>
          )}
          {/* Footer with Buttons */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center space-x-2 rounded-b-lg">
              <Button variant="ghost" size="sm" onClick={() => onCustomize(itinerary)}>Customize</Button>
              <Button size="sm" className="bg-gray-800 hover:bg-gray-900" onClick={() => onSaveTrip(itinerary)}>Save</Button>
          </div>
      </div>
    </TooltipProvider>
  );
}

