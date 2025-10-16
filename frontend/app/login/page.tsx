// File: frontend/app/login/page.tsx
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card/Card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState(''); // State for 2FA code
    const [loginStage, setLoginStage] = useState<'credentials' | '2fa'>('credentials'); // To control UI
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { login, user, isLoading: authIsLoading } = useAuth();

    useEffect(() => {
        if (!authIsLoading && user) {
            router.replace('/');
        }
    }, [user, authIsLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // If in the 2FA stage, include the code
            const payload = loginStage === '2fa'
                ? { email, password, two_factor_code: twoFactorCode }
                : { email, password };
            
            const response = await axios.post('http://127.0.0.1:8000/api/auth/login', payload);

            // Check if backend is now asking for a 2FA code
            if (response.data.two_factor_required) {
                setLoginStage('2fa');
            } else if (response.data.access_token) {
                login(response.data.access_token);
            }

        } catch (err: any) {
          setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
          console.error("Login error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (authIsLoading || user) {
        return null;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="mx-auto max-w-sm w-full">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        {loginStage === 'credentials' 
                            ? "Enter your email below to login to your account"
                            : "Enter the 6-digit code from your authenticator app."
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        {loginStage === 'credentials' ? (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">Password</Label>
                                        <Link href="/forgot-password" className="ml-auto inline-block text-xs underline">
                                            Forgot your password?
                                        </Link>
                                    </div>
                                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                            </>
                        ) : (
                             <div className="grid gap-2">
                                <Label htmlFor="2fa-code">Verification Code</Label>
                                <Input id="2fa-code" type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} required maxLength={6} />
                            </div>
                        )}

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Verifying...' : (loginStage === 'credentials' ? 'Login' : 'Verify Code')}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="underline">
                            Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}