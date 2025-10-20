// File: frontend/components/RideBookingCard.tsx
"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card/Card";
import { Button } from "@/components/ui/button";
import { Map, Clock } from "lucide-react";
import { RideBookingPayload, RideSummary } from "@/lib/types";

interface RideBookingCardProps {
  payload: RideBookingPayload;
  summary?: RideSummary;
  onExpand: () => void;
}

// Function to generate the static Mapbox image URL
const getStaticMapUrl = (payload: RideBookingPayload, summary?: RideSummary) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const pickupCoords = payload.pickup.coordinates.join(',');
    const destCoords = payload.destination.coordinates.join(',');
    
    // Create a path overlay if the ride is complete
    const pathOverlay = summary ? `path-5+2563EB-0.8(${encodeURIComponent(summary.route.map(p => p.join(',')).join(';'))})` : '';

    return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s-a+059669(${pickupCoords}),pin-s-b+DC2626(${destCoords}),${pathOverlay}/auto/400x200?access_token=${token}`;
};

export default function RideBookingCard({ payload, summary, onExpand }: RideBookingCardProps) {
    const mapImageUrl = getStaticMapUrl(payload, summary);

    return (
        <Card className="w-full max-w-md shadow-md">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">
                    {summary ? 'Ride Completed' : 'Ride Booking'}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="relative">
                    <img src={mapImageUrl} alt="Map of the ride" className="rounded-md w-full" />
                </div>
                <div className="text-sm space-y-1">
                    <p><strong>From:</strong> {payload.pickup.name}</p>
                    <p><strong>To:</strong> {payload.destination.name}</p>
                </div>
                {summary && (
                     <div className="flex items-center text-sm text-gray-600 pt-2">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>Trip duration: ~{summary.duration}</span>
                    </div>
                )}
            </CardContent>
            {!summary && (
                <CardFooter>
                    <Button className="w-full" onClick={onExpand}>
                        <Map className="mr-2 h-4 w-4" /> View Live Map
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}