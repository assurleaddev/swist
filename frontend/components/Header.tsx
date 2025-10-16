// File: frontend/components/Header.tsx
"use client";

import { useState, useEffect } from "react";
import { User, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logout, isLoading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getInitials = () => {
    if (!user) return "U";
    const first = user.first_name?.[0] || '';
    const last = user.last_name?.[0] || '';
    return first || last ? `${first}${last}`.toUpperCase() : user.email[0].toUpperCase();
  }

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-20 transition-all duration-300 ease-in-out",
        isScrolled ? "bg-white/80 backdrop-blur-sm shadow-sm" : "bg-transparent"
      )}
    >
      <div className="w-full max-w-screen-2xl mx-auto px-8 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <img src="/assets/swiss.webp" alt="swiss touristy" className="h-16" />
        </Link>
        <nav className={cn("hidden md:flex items-center space-x-8 text-sm font-medium transition-colors", isScrolled ? "text-gray-600" : "text-white")}>
          <Link href="/" className={cn(isScrolled ? "hover:text-gray-900" : "hover:text-gray-200")}>Experiences</Link>
          <Link href="/cars" className={cn(isScrolled ? "hover:text-gray-900" : "hover:text-gray-200")}>Cars</Link>
          <Link href="/" className={cn(isScrolled ? "hover:text-gray-900" : "hover:text-gray-200")}>Destinations</Link>
          <Link href="/" className={cn(isScrolled ? "hover:text-gray-900" : "hover:text-gray-200")}>Concierge</Link>
        </nav>
        <div className={cn("flex items-center space-x-4 transition-colors", isScrolled ? "text-gray-600" : "text-white")}>
          {isLoading ? (
            <div className="h-8 w-24 bg-gray-200/50 rounded animate-pulse"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-2 outline-none">
                <span className="text-sm font-medium hidden sm:inline">
                  {user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user.email}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.profile_picture_url || ''} alt="Profile picture" />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile"><Settings className="mr-2 h-4 w-4" /> Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" className="text-sm font-medium">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}