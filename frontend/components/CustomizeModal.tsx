// File: frontend/components/CustomizeModal.tsx
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ItineraryDay, CustomizationFeedback } from "@/lib/types";

interface CustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary: ItineraryDay[];
  onSave: (feedback: CustomizationFeedback) => void;
  readOnlyFeedback?: CustomizationFeedback | null;
}

export default function CustomizeModal({ isOpen, onClose, itinerary, onSave, readOnlyFeedback }: CustomizeModalProps) {
  const [generalFeedback, setGeneralFeedback] = useState('');
  const [dailyFeedback, setDailyFeedback] = useState<{ day: number; feedback: string }[]>(
    itinerary.map(day => ({ day: day.day, feedback: '' }))
  );

  const handleDailyFeedbackChange = (day: number, feedback: string) => {
    setDailyFeedback(prev => 
      prev.map(item => (item.day === day ? { ...item, feedback } : item))
    );
  };

  const handleSave = () => {
    onSave({ generalFeedback, dailyFeedback });
    onClose();
    // Reset form for next use
    setGeneralFeedback('');
    setDailyFeedback(itinerary.map(day => ({ day: day.day, feedback: '' })));
  };
  
  const feedbackToDisplay = readOnlyFeedback || { generalFeedback: '', dailyFeedback: [] };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{readOnlyFeedback ? 'Customization Details' : 'Customize Your Itinerary'}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <label htmlFor="generalFeedback" className="text-sm font-medium">
              {readOnlyFeedback ? 'General Feedback Provided:' : 'What would you like to change overall? (e.g., "more focus on history," "less expensive restaurants")'}
            </label>
            <Textarea
              id="generalFeedback"
              value={readOnlyFeedback ? feedbackToDisplay.generalFeedback : generalFeedback}
              onChange={(e) => setGeneralFeedback(e.target.value)}
              className="mt-1"
              readOnly={!!readOnlyFeedback}
            />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium">Daily Feedback:</p>
            {(readOnlyFeedback ? feedbackToDisplay.dailyFeedback : dailyFeedback).map(item => (
              <div key={item.day}>
                <label htmlFor={`day-${item.day}-feedback`} className="text-xs font-semibold text-gray-600">
                  Day {item.day}: {itinerary.find(d => d.day === item.day)?.title}
                </label>
                <Textarea
                  id={`day-${item.day}-feedback`}
                  placeholder={`Any changes for Day ${item.day}?`}
                  value={item.feedback}
                  onChange={(e) => handleDailyFeedbackChange(item.day, e.target.value)}
                  className="mt-1 text-xs"
                  readOnly={!!readOnlyFeedback}
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          {readOnlyFeedback ? (
            <Button onClick={onClose}>Close</Button>
          ) : (
            <Button onClick={handleSave}>Generate Customization Request</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

