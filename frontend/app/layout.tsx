// File: frontend/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext"; // Import the AuthProvider

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "SwissTouristy AI",
  description: "Your personal AI-powered Swiss travel concierge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-gray-100 font-sans antialiased",
          inter.variable
        )}
      >
        {/* Wrap the entire application with the AuthProvider */}
        {/* This makes the auth state available to all child components, including the Header */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}



