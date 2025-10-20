// File: frontend/components/AuthPromptCard.tsx
"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card/Card";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

export default function AuthPromptCard() {
  return (
    <Card className="w-full max-w-md shadow-md bg-gray-50">
      <CardHeader className="text-center">
        <CardTitle className="text-xl font-bold">Join Swist!</CardTitle>
        <CardDescription>
          Please log in or create an account to start planning your personalized Swiss journey.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <LogIn className="h-12 w-12 text-gray-400" />
      </CardContent>
      <CardFooter className="flex justify-center gap-4">
        <Link href="/login" passHref>
          <Button>Login</Button>
        </Link>
        <Link href="/register" passHref>
          <Button variant="outline">Register</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}