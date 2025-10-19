"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import mapboxgl, { LngLatLike, Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";

const carMarkerSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%231F2937" width="36px" height="36px"><path d="M0 0h24v24H0z" fill="none"/><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5S18.33 16 17.5 16zM5 11l1.5-4.5h11L19 11H5z"/></svg>`;

type Props = {
  payload: {
    pickup: { coordinates: [number, number]; label: string };
    destination: { coordinates: [number, number]; label: string };
  };
  onClose: () => void;
};

export default function RideBookingMap({ payload, onClose }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const carMarker = useRef<mapboxgl.Marker | null>(null);
  const animationFrame = useRef<number | null>(null);

  const [state, setState] = useState<
    "searching" | "driverEnRoute" | "arrived" | "inRide" | "completed"
  >("searching");

  const [clientReady, setClientReady] = useState(false);
  const [driverReady, setDriverReady] = useState(false);
  const [eta, setEta] = useState("");

  const { pickup, destination } = payload;

  // === INIT MAPBOX ===
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      console.error("Missing Mapbox token");
      return;
    }
    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v11",
      center: pickup.coordinates as LngLatLike,
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      // Add pickup & destination markers
      new mapboxgl.Marker({ color: "#059669" })
        .setLngLat(pickup.coordinates)
        .addTo(map.current!);
      new mapboxgl.Marker({ color: "#DC2626" })
        .setLngLat(destination.coordinates)
        .addTo(map.current!);
    });

    return () => {
      map.current?.remove();
    };
  }, [pickup, destination]);

  // === SIMULATE DRIVER FOUND ===
  useEffect(() => {
    if (state === "searching") {
      const timer = setTimeout(() => {
        startDriverEnRoute();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${start.join(
      ","
    )};${end.join(",")}?geometries=geojson&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.routes[0].geometry.coordinates as [number, number][];
  };

  // === START DRIVER COMING ===
  const startDriverEnRoute = async () => {
    setState("driverEnRoute");
    const driverStart: [number, number] = [
      pickup.coordinates[0] + (Math.random() - 0.5) * 0.05,
      pickup.coordinates[1] + (Math.random() - 0.5) * 0.05,
    ];

    // Add car marker
    const el = document.createElement("div");
    el.style.backgroundImage = `url('${carMarkerSVG}')`;
    el.style.width = "36px";
    el.style.height = "36px";
    carMarker.current = new mapboxgl.Marker(el).setLngLat(driverStart).addTo(map.current!);

    // Fetch route & draw dashed line
    const route = await fetchRoute(driverStart, pickup.coordinates);
    drawRoute("driver-route", route, "#1F2937", [2, 2]);

    animateCar(route, 20, () => setState("arrived"));
  };

  // === DRAW ROUTE ON MAP ===
  const drawRoute = (
    id: string,
    coords: [number, number][],
    color = "#3B82F6",
    dash: number[] = []
  ) => {
    if (!map.current) return;
    if (map.current.getLayer(id)) {
      map.current.removeLayer(id);
      map.current.removeSource(id);
    }
    map.current.addSource(id, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords },
      },
    });
    map.current.addLayer({
      id,
      type: "line",
      source: id,
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": color,
        "line-width": 4,
        "line-dasharray": dash.length ? dash : undefined,
      },
    });
  };

  // === ANIMATION ===
  const animateCar = (
    route: [number, number][],
    durationSeconds: number,
    onFinish?: () => void
  ) => {
    if (!carMarker.current) return;
    const startTime = performance.now();
    const duration = durationSeconds * 1000;

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const index = Math.floor(progress * (route.length - 1));
      const point = route[index];
      if (point) carMarker.current!.setLngLat(point as LngLatLike);

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        onFinish && onFinish();
      }
    };
    animationFrame.current = requestAnimationFrame(animate);
  };

  // === START TRAVEL WHEN BOTH READY ===
  useEffect(() => {
    if (state === "arrived" && clientReady && driverReady) {
      startRide();
    }
  }, [clientReady, driverReady, state]);

  const startRide = async () => {
    setState("inRide");
    const route = await fetchRoute(pickup.coordinates, destination.coordinates);
    drawRoute("travel-route", route, "#2563EB", []);
    animateCar(route, 25, () => setState("completed"));
  };

  const handleClose = () => {
    cancelAnimationFrame(animationFrame.current!);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="relative w-full h-full">
        <div ref={mapContainer} className="absolute inset-0 w-full h-full pointer-events-auto" />

        <div className="absolute inset-0 pointer-events-none">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-20 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 pointer-events-auto"
          >
            <X className="h-6 w-6 text-gray-800" />
          </button>

          <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-white shadow-2xl rounded-t-2xl md:m-4 md:rounded-2xl md:max-w-md md:left-0 pointer-events-auto text-center">
            {state === "searching" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Checking for available chauffeur...
                </h2>
                <Loader2 className="mx-auto my-6 h-8 w-8 animate-spin text-blue-500" />
              </div>
            )}

            {state === "driverEnRoute" && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Chauffeur on the way 🚗
                </h2>
                <p className="text-gray-500">Arriving shortly...</p>
              </div>
            )}

            {state === "arrived" && (
              <div>
                <h2 className="text-2xl font-bold text-green-600 mb-3">
                  Chauffeur has arrived!
                </h2>
                <div className="flex justify-center gap-4 mt-4">
                  <Button
                    onClick={() => setDriverReady(true)}
                    className={driverReady ? "bg-green-600" : ""}
                  >
                    Driver Start Ride
                  </Button>
                  <Button
                    onClick={() => setClientReady(true)}
                    className={clientReady ? "bg-green-600" : ""}
                  >
                    Client Start Ride
                  </Button>
                </div>
              </div>
            )}

            {state === "inRide" && (
              <div>
                <h2 className="text-2xl font-bold text-blue-600">Ride in Progress 🚙</h2>
                <p className="text-gray-500 mt-2">Enjoy your journey!</p>
              </div>
            )}

            {state === "completed" && (
              <div>
                <h2 className="text-2xl font-bold text-green-700">Ride Completed ✅</h2>
                <p className="text-gray-500 mt-2">Thank you for choosing us!</p>
                <Button onClick={handleClose} className="mt-4">
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
