// File: frontend/components/BookingSummaryCard.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card/Card";
import { ItineraryDay, Activity } from "@/lib/types";
import { XCircle, Loader2 } from "lucide-react";
import axios from "axios";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

interface BookingSummaryCardProps {
    itinerary: ItineraryDay[];
}

export default function BookingSummaryCard({ itinerary }: BookingSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState<null | 'stripe' | 'paypal'>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActivities(itinerary.flatMap(day => day.activities));
  }, [itinerary]);

  const totalCost = activities.reduce((sum, activity) => sum + activity.price, 0);
  const displayedActivities = isExpanded ? activities : activities.slice(0, 3);

  const handleRemoveActivity = (activityToRemove: Activity) => {
    setActivities(prevActivities => prevActivities.filter(activity => activity !== activityToRemove));
  };

  const handleStripeCheckout = async () => {
    setIsLoading('stripe');
    setError(null);
    try {
        const response = await axios.post('http://127.0.0.1:8000/api/payments/create-checkout-session', {
            line_items: activities.map(activity => ({
                name: activity.description,
                amount: activity.price * 100,
                quantity: 1,
            }))
        });
        const { url } = response.data;
        if (url) {
            window.location.href = url;
        } else {
            throw new Error("Stripe checkout URL not received.");
        }
    } catch (err) {
        setError("Failed to initiate Stripe payment.");
        console.error("Error creating Stripe checkout session:", err);
        setIsLoading(null);
    }
  };

  return (
    <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "CHF" }}>
        <Card className="shadow-md transition-all duration-300 ring-2 ring-swiss-red ring-offset-2">
        <CardHeader>
            <CardTitle className="text-lg font-semibold">Booking Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
            {displayedActivities.map((activity, index) => (
                <div key={index} className="flex justify-between items-center">
                <div className="flex items-center min-w-0">
                    <button onClick={() => handleRemoveActivity(activity)} className="mr-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0" title="Remove item"><XCircle className="h-4 w-4" /></button>
                    <span className="truncate pr-4">{activity.description}</span>
                </div>
                <span className="flex-shrink-0">CHF {activity.price}</span>
                </div>
            ))}
            {activities.length > 3 && (
                <Button variant="link" size="sm" className="p-0 h-auto text-swiss-red text-xs" onClick={() => setIsExpanded(!isExpanded)}>
                    {isExpanded ? 'Show Less' : `+ ${activities.length - 3} more items`}
                </Button>
            )}
        </CardContent>
        <CardFooter className="flex flex-col items-stretch space-y-3 pt-4 border-t">
            <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>CHF {totalCost.toLocaleString()}</span>
            </div>
            <div className="space-y-2">
                <p className="text-xs text-center text-gray-500">Choose your payment method:</p>
                <div className="grid grid-cols-1 gap-2">
                    <PayPalButtons
                        style={{ layout: "horizontal", label: "pay", height: 40 }}
                        disabled={!!isLoading || activities.length === 0}
                        createOrder={async (data, actions) => {
                            setIsLoading('paypal');
                            setError(null);
                            try {
                                const res = await axios.post("http://127.0.0.1:8000/api/payments/create-paypal-order", {
                                    total_amount: totalCost.toFixed(2),
                                    currency: "CHF"
                                });
                                return res.data.orderID;
                            } catch (err) {
                                setError("Failed to create PayPal order.");
                                console.error(err);
                                return '';
                            }
                        }}
                        onApprove={async (data, actions) => {
                           try {
                                await axios.post("http://127.0.0.1:8000/api/payments/capture-paypal-order", { order_id: data.orderID });
                                alert("Payment successful! Your order has been confirmed.");
                                // Here you would typically redirect to a success page
                           } catch(err) {
                               setError("Failed to capture PayPal payment.");
                               console.error(err);
                           } finally {
                                setIsLoading(null);
                           }
                        }}
                        onError={(err) => {
                            setError("An error occurred with the PayPal payment.");
                            console.error("PayPal Error:", err);
                            setIsLoading(null);
                        }}
                        onCancel={() => {
                            setIsLoading(null);
                        }}
                    />
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleStripeCheckout} disabled={!!isLoading || activities.length === 0}>
                        {isLoading === 'stripe' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Pay with Stripe"}
                    </Button>
                </div>
                 {error && <p className="text-xs text-center text-red-500 mt-2">{error}</p>}
            </div>
        </CardFooter>
        </Card>
    </PayPalScriptProvider>
  );
}

