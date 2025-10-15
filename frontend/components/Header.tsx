// File: frontend/components/Header.tsx
"use client";

import { useState, useEffect } from "react";
import { User, LogOut } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext"; // Import the useAuth hook

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout, isLoading } = useAuth(); // Get user and logout function from context

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-20 transition-all duration-300 ease-in-out",
        isScrolled ? "bg-white/80 backdrop-blur-sm shadow-sm" : "bg-transparent"
      )}
    >
      <div className="w-full max-w-screen-2xl mx-auto px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <img src="assets/swiss.webp" alt="swiss touristy" className="h-16" />
        </Link>
        <nav className={cn("hidden md:flex items-center space-x-8 text-sm font-medium transition-colors", isScrolled ? "text-gray-600" : "text-white")}>
          <Link href="/" className={cn(isScrolled ? "hover:text-gray-900" : "hover:text-gray-200")}>Experiences</Link>
          <Link href="/cars" className={cn(isScrolled ? "hover:text-gray-900" : "hover:text-gray-200")}>Cars</Link>
          <Link href="/" className={cn(isScrolled ? "hover:text-gray-900" : "hover:text-gray-200")}>Destinations</Link>
          <Link href="/" className={cn(isScrolled ? "hover:text-gray-900" : "hover:text-gray-200")}>Concierge</Link>
        </nav>
        <div className={cn("flex items-center space-x-4 transition-colors", isScrolled ? "text-gray-600" : "text-white")}>
          {isLoading ? (
              <div className="h-5 w-24 bg-gray-200/50 rounded animate-pulse"></div>
          ) : user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">{user.email}</span>
              </div>
              <button onClick={logout} title="Logout" className="hover:text-swiss-red transition-colors">
                  <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="text-sm font-medium">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}


