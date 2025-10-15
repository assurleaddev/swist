// File: frontend/components/NeuralPromptBar.tsx
"use client";
import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, Mic, SendHorizontal, PlusCircle } from 'lucide-react';

interface NeuralPromptBarProps {
  onNewPrompt: (prompt: string) => void;
  onNewTrip: () => void; // Function to start a new session
  isLoading: boolean;
}

export default function NeuralPromptBar({ 
  onNewPrompt, 
  onNewTrip,
  isLoading,
}: NeuralPromptBarProps) {
  const [mainQuery, setMainQuery] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMainQuery(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mainQuery.trim()) return;
    onNewPrompt(mainQuery);
    setMainQuery('');
  };

  return (
    <div className="relative mt-auto">
      <form onSubmit={handleSubmit} className="relative">
        <Input
          type="text"
          value={mainQuery}
          onChange={handleInputChange}
          placeholder="Ask me anything, or provide feedback on the itinerary..."
          className="w-full rounded-full py-6 pl-12 pr-40 border-gray-300 focus:ring-swiss-red focus:border-swiss-red text-base"
          disabled={isLoading}
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center space-x-3">
            <button type="button" className="text-gray-400 hover:text-gray-600" title="Start New Trip">
                <PlusCircle className="h-5 w-5" onClick={onNewTrip} />
            </button>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
            <button type="button" className="text-gray-400 hover:text-gray-600">
                <Mic className="h-5 w-5" />
            </button>
            <Button type="submit" className="rounded-full bg-swiss-red hover:bg-red-700 p-2 h-9 w-9" disabled={isLoading}>
                <SendHorizontal className="h-5 w-5 text-white" />
            </Button>
        </div>
      </form>
    </div>
  );
}

