// File: frontend/app/verify-email/page.tsx
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card/Card";
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, ShieldX } from 'lucide-react';

function VerificationComponent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('Verifying your account, please wait...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Verification token not found. The link may be incomplete.');
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/auth/verify-email?token=${token}`);
                setStatus('success');
                setMessage(response.data.msg || 'Your account has been successfully verified!');
            } catch (error: any) {
                setStatus('error');
                const detail = error.response?.data?.detail || 'An unknown error occurred.';
                setMessage(`Verification failed: ${detail}`);
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="mx-auto max-w-sm w-full">
                <CardHeader className="items-center text-center">
                    {status === 'verifying' && <Loader2 className="h-12 w-12 text-gray-400 animate-spin mb-4" />}
                    {status === 'success' && <ShieldCheck className="h-12 w-12 text-green-500 mb-4" />}
                    {status === 'error' && <ShieldX className="h-12 w-12 text-red-500 mb-4" />}
                    <CardTitle className="text-2xl">
                        {status === 'verifying' && 'Verifying...'}
                        {status === 'success' && 'Verification Successful!'}
                        {status === 'error' && 'Verification Failed'}
                    </CardTitle>
                    <CardDescription>{message}</CardDescription>
                </CardHeader>
                <CardContent>
                    {status !== 'verifying' && (
                        <Button asChild className="w-full">
                            <Link href="/login">Proceed to Login</Link>
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <VerificationComponent />
        </Suspense>
    )
}