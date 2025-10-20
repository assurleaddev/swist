"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl, { LngLatLike, Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import { RideSummary, RideState, RideBookingPayload } from "@/lib/types";

const carMarkerSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231F2937" width="36px" height="36px"><path d="M0 0h24v24H0z" fill="none"/><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5S18.33 16 17.5 16zM5 11l1.5-4.5h11L19 11H5z"/></svg>`;

type Props = {
  payload: RideBookingPayload;
  initialState: RideState;
  onClose: () => void;
  onStateChange: (newState: RideState) => void;
  onComplete: (summary: RideSummary) => void;
};

const fetchRoute = async (start: [number, number], end: [number, number]) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.join(
      ","
    )};${end.join(",")}?geometries=geojson&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();
    return {
        route: data.routes[0].geometry.coordinates as [number, number][],
        duration: data.routes[0].duration as number,
    };
};

export default function RideBookingMap({ payload, initialState, onClose, onStateChange, onComplete }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const carMarker = useRef<mapboxgl.Marker | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const watchId = useRef<number | null>(null);
  const animationFrame = useRef<number | null>(null);

  const [clientReady, setClientReady] = useState(false);
  const [driverReady, setDriverReady] = useState(false);
  const [eta, setEta] = useState<string>("");

  const { pickup, destination } = payload;

  const drawRoute = useCallback((
    id: string,
    coords: [number, number][],
    color = "#3B82F6",
    dash: number[] = []
  ) => {
    if (!map.current) return;
    const source = map.current.getSource(id);
    if (source) {
        (source as mapboxgl.GeoJSONSource).setData({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
        });
    } else {
        map.current.addSource(id, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
          },
        });
        
        const paint: mapboxgl.LinePaint = {
            "line-color": color,
            "line-width": 4,
        };

        if (dash.length > 0) {
            paint["line-dasharray"] = dash;
        }

        map.current.addLayer({
          id,
          type: "line",
          source: id,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: paint,
        });
    }
  }, []);

  const animateCar = useCallback((
    routeId: string,
    route: [number, number][],
    durationSeconds: number,
    onFinish?: () => void,
    routeOptions?: { color?: string; dash?: number[] }
  ) => {
    if (!carMarker.current) return;
    const startTime = performance.now();
    const duration = durationSeconds * 1000;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const index = Math.floor(progress * (route.length - 1));
      const point = route[index];
      
      if (point) {
        carMarker.current!.setLngLat(point as LngLatLike);
        drawRoute(routeId, route.slice(index), routeOptions?.color, routeOptions?.dash);
      }

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        onFinish && onFinish();
      }
    };
    animationFrame.current = requestAnimationFrame(animate);
  }, [drawRoute]);

  const startDriverEnRoute = useCallback(async () => {
    onStateChange("driverEnRoute");
    const driverStart: [number, number] = [
      pickup.coordinates[0] + (Math.random() - 0.5) * 0.05,
      pickup.coordinates[1] + (Math.random() - 0.5) * 0.05,
    ];

    const el = document.createElement("div");
    el.style.backgroundImage = `url('${carMarkerSVG}')`;
    el.style.width = "36px";
    el.style.height = "36px";
    if (map.current) {
        carMarker.current = new mapboxgl.Marker(el).setLngLat(driverStart).addTo(map.current);
    }

    const { route, duration } = await fetchRoute(driverStart, pickup.coordinates);
    const arrivalTime = new Date(Date.now() + duration * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setEta(`Driver arriving in ~${Math.round(duration / 60)} mins (at ${arrivalTime})`);
    
    animateCar("driver-route", route, 20, () => onStateChange("arrived"), { color: "#1F2937", dash: [2, 2] });
  }, [pickup.coordinates, animateCar, onStateChange]);

  const startRide = useCallback(async () => {
    onStateChange("inRide");
    const { route, duration } = await fetchRoute(pickup.coordinates, destination.coordinates);
    const arrivalTime = new Date(Date.now() + duration * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setEta(`Trip will take ~${Math.round(duration / 60)} mins, arriving at ${arrivalTime}`);

    const onRideFinish = () => {
        onComplete({
            duration: `${Math.round(duration / 60)} minutes`,
            route: route,
            eta: arrivalTime
        });
    };

    animateCar("travel-route", route, 25, onRideFinish, { color: "#2563EB" });
  }, [pickup.coordinates, destination.coordinates, animateCar, onComplete, onStateChange]);


  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) { console.error("Missing Mapbox token"); return; }
    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v11",
      center: pickup.coordinates as LngLatLike,
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
        new mapboxgl.Marker({ color: "#059669" }).setLngLat(pickup.coordinates).addTo(map.current!);
        new mapboxgl.Marker({ color: "#DC2626" }).setLngLat(destination.coordinates).addTo(map.current!);
        const userEl = document.createElement("div");
        userEl.className = "user-location-marker";
        userMarker.current = new mapboxgl.Marker(userEl);
        if (navigator.geolocation) {
            watchId.current = navigator.geolocation.watchPosition(
              (position) => {
                const userLngLat: LngLatLike = [position.coords.longitude, position.coords.latitude];
                if (userMarker.current && map.current) {
                  userMarker.current.setLngLat(userLngLat);
                  if (!userMarker.current.getElement().parentNode) {
                    userMarker.current.addTo(map.current);
                  }
                }
              },
              (error) => console.error("Geolocation error:", error),
              { enableHighAccuracy: true }
            );
        }
    });

    return () => {
      if (watchId.current) { navigator.geolocation.clearWatch(watchId.current); }
      map.current?.remove();
    };
  }, [pickup, destination]);

  useEffect(() => {
    if (initialState === "searching") {
      const timer = setTimeout(() => {
        startDriverEnRoute();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [initialState, startDriverEnRoute]);

  useEffect(() => {
    if (initialState === "arrived" && clientReady && driverReady) {
      startRide();
    }
  }, [clientReady, driverReady, initialState, startRide]);

  const handleClose = () => {
    if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
       <style>{`
        .user-location-marker {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background-color: #3B82F6;
          border: 2px solid white;
          box-shadow: 0 0 0 2px #3B82F6;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }
      `}</style>
      <div className="relative w-full h-full">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full pointer-events-auto" />
        <div className="absolute inset-0 pointer-events-none">
          <button onClick={handleClose} className="absolute top-4 right-4 z-20 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 pointer-events-auto">
            <X className="h-6 w-6 text-gray-800" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-white shadow-2xl rounded-t-2xl md:m-4 md:rounded-2xl md:max-w-md md:left-0 pointer-events-auto text-center">
            {initialState === "searching" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Checking for available chauffeur...</h2>
                <Loader2 className="mx-auto my-6 h-8 w-8 animate-spin text-blue-500" />
              </div>
            )}
            {initialState === "driverEnRoute" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Chauffeur on the way 🚗</h2>
                <p className="text-gray-500">{eta || "Arriving shortly..."}</p>
              </div>
            )}
            {initialState === "arrived" && (
              <div>
                <h2 className="text-2xl font-bold text-green-600 mb-3">Chauffeur has arrived!</h2>
                <div className="flex justify-center gap-4 mt-4">
                  <Button onClick={() => setDriverReady(true)} className={driverReady ? "bg-green-600" : ""}>Driver Start Ride</Button>
                  <Button onClick={() => setClientReady(true)} className={clientReady ? "bg-green-600" : ""}>Client Start Ride</Button>
                </div>
              </div>
            )}
            {initialState === "inRide" && (
              <div>
                <h2 className="text-2xl font-bold text-blue-600">Ride in Progress 🚙</h2>
                <p className="text-gray-500 mt-2">{eta || "Enjoy your journey!"}</p>
              </div>
            )}
            {initialState === "completed" && (
              <div>
                <h2 className="text-2xl font-bold text-green-700">Ride Completed ✅</h2>
                <p className="text-gray-500 mt-2">Thank you for choosing us!</p>
                <Button onClick={handleClose} className="mt-4">Close</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}