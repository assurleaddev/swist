// File: frontend/components/ChangePasswordCard.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function ChangePasswordCard() {
    const { token } = useAuth();
    const [stage, setStage] = useState<'form' | 'confirming'>('form');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long.');
            return;
        }
        
        setIsLoading(true);
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/users/me/request-password-change', 
                { old_password: oldPassword, new_password: newPassword },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setMessage(response.data.msg);
            setStage('confirming'); // Move to next stage on success
        } catch (err: any) {
            setError(err.response?.data?.detail || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinalSubmit = async () => {
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await axios.post('http://127.0.0.1:8000/api/users/me/confirm-password-change', 
                { code: verificationCode, new_password: newPassword },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setMessage(response.data.msg);
            resetForm();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Confirmation failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        resetForm();
    };

    const resetForm = () => {
        setStage('form');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setVerificationCode('');
        setError('');
        // Keep success message for a bit before clearing if needed
    };

    return (
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                    {stage === 'form' 
                        ? 'Enter your old and new password. A verification code will be sent to your email.'
                        : 'A 6-digit code was sent to your email. Enter it below to confirm the change.'
                    }
                </CardDescription>
            </CardHeader>
            <CardContent>
                {stage === 'form' && (
                    <form onSubmit={handleRequestCode} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="old_password">Old Password</Label>
                            <Input id="old_password" type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new_password">New Password</Label>
                            <Input id="new_password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm_password">Confirm New Password</Label>
                            <Input id="confirm_password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                        </div>
                        <CardFooter className="px-0 pt-6">
                            {error && <p className="text-sm text-red-600 mr-auto">{error}</p>}
                            <Button type="submit" disabled={isLoading} className="ml-auto">
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Get Verification Code'}
                            </Button>
                        </CardFooter>
                    </form>
                )}
                {stage === 'confirming' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="verification_code">Verification Code</Label>
                            <Input 
                                id="verification_code" 
                                type="text" 
                                value={verificationCode} 
                                onChange={(e) => setVerificationCode(e.target.value)} 
                                required 
                                maxLength={6}
                                placeholder="Enter 6-digit code"
                            />
                        </div>
                         <CardFooter className="px-0 pt-6 flex justify-between">
                            <div>
                                {error && <p className="text-sm text-red-600">{error}</p>}
                                {message && <p className="text-sm text-green-600">{message}</p>}
                            </div>
                            <div className="flex gap-2 ml-auto">
                                {message === 'Password updated successfully.' ? (
                                     <Button onClick={handleCancel}>Done</Button>
                                ) : (
                                    <>
                                        <Button variant="ghost" onClick={handleCancel} disabled={isLoading}>Cancel</Button>
                                        <Button onClick={handleFinalSubmit} disabled={isLoading}>
                                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Confirm & Save'}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardFooter>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}