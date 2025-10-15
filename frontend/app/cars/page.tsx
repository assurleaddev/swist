// File: frontend/app/cars/page.tsx
"use client";

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import VehicleBooking from '@/components/VehicleBooking';
import CarsHero from '@/components/CarsHero'; // Import the new hero component

export default function CarsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans text-gray-800">
      <Header />
      <main>
        <CarsHero />
        <div className="p-8 mt-24 relative z-10">
            <VehicleBooking />
        </div>
      </main>
      <Footer />
    </div>
  );
}

