// File: frontend/components/Sidebar.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card/Card";
import { Bookmark, PlusCircle, MessageSquare } from "lucide-react";
import { SavedTrip } from "@/lib/types";

// Define the shape of a chat session object for the props
interface ChatSession {
  id: number;
  title: string;
}

// Update the props interface to include all the new properties
interface SidebarProps {
  savedTrips: SavedTrip[];
  chatSessions: ChatSession[];
  onNewChat: () => void;
  onSelectChat: (sessionId: number) => void;
  activeSessionId: number | null;
}

export default function Sidebar({ savedTrips, chatSessions, onNewChat, onSelectChat, activeSessionId }: SidebarProps) {
  return (
    <div className="space-y-6">
      {/* Chat History Card */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Chat History</CardTitle>
            <Button variant="ghost" size="sm" onClick={onNewChat} title="Start New Chat">
                <PlusCircle className="h-5 w-5" />
            </Button>
        </CardHeader>
        <CardContent>
          {chatSessions.length > 0 ? (
            <div className="space-y-2">
              {chatSessions.map((session) => (
                <div key={session.id}
                     className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${activeSessionId === session.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                     onClick={() => onSelectChat(session.id)}>
                  <div className="flex items-center text-sm">
                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate font-medium">{session.title}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <MessageSquare className="mx-auto h-8 w-8 mb-2 text-gray-400" />
              <p className="text-sm">No previous chats.</p>
              <p className="text-xs">Start a new chat to begin planning.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saved Trips Card */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold">Saved Trips</CardTitle></CardHeader>
        <CardContent>
          {savedTrips.length > 0 ? (
            <div className="space-y-3">
              {savedTrips.map((trip) => (
                <div key={trip.id} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium">{trip.name}</p>
                    <p className="text-xs text-gray-500">{trip.dates}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-swiss-red hover:bg-red-50 hover:text-swiss-red">Open</Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              <Bookmark className="mx-auto h-8 w-8 mb-2 text-gray-400" />
              <p className="text-sm">No saved trips yet.</p>
              <p className="text-xs">Click 'Save' on an itinerary to add it here.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}