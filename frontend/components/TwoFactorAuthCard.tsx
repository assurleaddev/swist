// File: frontend/components/TwoFactorAuthCard.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export default function TwoFactorAuthCard() {
    const { user, token, fetchUserProfile } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [disablePassword, setDisablePassword] = useState('');
    const [isEnableModalOpen, setIsEnableModalOpen] = useState(false);
    const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/users/me/2fa/generate', {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setQrCode(response.data.qr_code_image);
            setSecretKey(response.data.secret_key);
        } catch (err) {
            setError("Failed to generate 2FA secret. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        setIsLoading(true);
        setError('');
        try {
            await axios.post('http://127.0.0.1:8000/api/users/me/2fa/verify', 
                { secret_key: secretKey, code: verifyCode },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            await fetchUserProfile();
            setIsEnableModalOpen(false); // Close modal on success
        } catch (err: any) {
            setError(err.response?.data?.detail || "Verification failed. Please check the code and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisable = async () => {
        setIsLoading(true);
        setError('');
        try {
            await axios.post('http://127.0.0.1:8000/api/users/me/2fa/disable',
                { password: disablePassword },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            await fetchUserProfile();
            setIsDisableModalOpen(false); // Close modal on success
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to disable 2FA. Please check your password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="max-w-3xl mx-auto p-4">
            <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                    Add an extra layer of security to your account by enabling 2FA.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className={`flex items-center justify-between p-4 rounded-md ${user?.is_two_factor_enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <p className={`text-sm font-medium ${user?.is_two_factor_enabled ? 'text-green-800' : 'text-gray-700'}`}>
                        Status: {user?.is_two_factor_enabled ? 'Enabled' : 'Disabled'}
                    </p>
                    {user?.is_two_factor_enabled ? (
                        <Dialog open={isDisableModalOpen} onOpenChange={setIsDisableModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">Disable 2FA</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <Label htmlFor="disable-password">Enter your password to confirm:</Label>
                                    <Input id="disable-password" type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} />
                                    {error && <p className="text-sm text-red-500">{error}</p>}
                                    <Button onClick={handleDisable} disabled={isLoading} className="w-full">
                                        {isLoading ? <Loader2 className="animate-spin" /> : "Confirm & Disable"}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    ) : (
                        <Dialog open={isEnableModalOpen} onOpenChange={setIsEnableModalOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={handleGenerate}>Enable 2FA</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                                </DialogHeader>
                                {isLoading && !qrCode && <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" />}
                                {qrCode && (
                                    <div className="flex flex-col items-center gap-4">
                                        <p className="text-sm text-center">Scan this QR code with your authenticator app (e.g., Google Authenticator).</p>
                                        <img src={qrCode} alt="2FA QR Code" className="rounded-lg" />
                                        <p className="text-sm text-center">Then, enter the 6-digit code from the app below.</p>
                                        <div className="w-full space-y-2 pt-4">
                                            <Label htmlFor="verify-code">Verification Code</Label>
                                            <Input id="verify-code" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} maxLength={6} placeholder="123456" />
                                            {error && <p className="text-sm text-red-500">{error}</p>}
                                            <Button onClick={handleVerify} disabled={isLoading} className="w-full">
                                                {isLoading ? <Loader2 className="animate-spin" /> : "Verify & Enable"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}