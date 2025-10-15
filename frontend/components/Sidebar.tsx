// File: frontend/components/Sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card/Card";
import { Bookmark } from "lucide-react";
import { SavedTrip } from "@/lib/types";

// The isPlanFinalized prop is no longer needed
interface SidebarProps {
  savedTrips: SavedTrip[];
}

const SidebarSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <Card className="shadow-sm"><CardHeader><div className="h-6 w-3/4 bg-gray-200 rounded"></div></CardHeader><CardContent><div className="h-16 bg-gray-200 rounded"></div></CardContent></Card>
        <Card className="shadow-sm"><CardHeader><div className="h-6 w-1/2 bg-gray-200 rounded"></div></CardHeader><CardContent><div className="h-10 bg-gray-200 rounded"></div></CardContent></Card>
        {/* Skeleton for the removed booking summary is also removed */}
    </div>
);


export default function Sidebar({ savedTrips }: SidebarProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <SidebarSkeleton />;
  }

  return (
    <div className="space-y-6">
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

      {/* Today's Suggestions Card */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-lg font-semibold">Today's Suggestions</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2">
            <p>Dinner in Zurich tonight? Based on your preference for fine dining.</p>
            <Button variant="link" className="p-0 h-auto text-swiss-red">Find Tables</Button>
        </CardContent>
      </Card>

      {/* The Booking Summary Card has been removed from the sidebar */}
    </div>
  );
}

