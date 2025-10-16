// File: frontend/app/profile/page.tsx
"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card/Card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ChangePasswordCard from '@/components/ChangePasswordCard'; // Import the new component
import TwoFactorAuthCard from '@/components/TwoFactorAuthCard'; // Import the new 2FA component
export default function ProfilePage() {
    const { user, token, isLoading: authIsLoading, fetchUserProfile } = useAuth();
    const router = useRouter();
    
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        bio: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');


    useEffect(() => {
        if (!authIsLoading && !user) {
            router.replace('/login');
        }
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                bio: user.bio || ''
            });
        }
    }, [user, authIsLoading, router]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveAll = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');
        setError('');

        try {
            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('file', selectedFile);

                await axios.post('http://127.0.0.1:8000/api/users/me/upload-picture', uploadData, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
            }

            await axios.put('http://127.0.0.1:8000/api/users/me', formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            await fetchUserProfile();
            
            setMessage('Profile updated successfully!');
            setSelectedFile(null);
            setPreview(null);

        } catch (err) {
            console.error("Failed to update profile", err);
            setError('An error occurred while saving. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authIsLoading || !user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    const getInitials = () => {
        const first = user.first_name?.[0] || '';
        const last = user.last_name?.[0] || '';
        return first || last ? `${first}${last}`.toUpperCase() : user.email[0].toUpperCase();
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-24 sm:px-6 lg:px-8 space-y-8">
                {/* Profile Info Card */}
                <Card className="max-w-3xl mx-auto">
                    <CardHeader>
                        <CardTitle>My Profile</CardTitle>
                        <CardDescription>Update your personal information and profile picture.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSaveAll}>
                        <CardContent className="space-y-8">
                            <div className="flex items-center gap-6">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage src={preview || user.profile_picture_url || ''} />
                                    <AvatarFallback className="text-3xl">{getInitials()}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-2">
                                    <Label htmlFor="picture">Change Profile Picture</Label>
                                    <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} className="max-w-xs" />
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="first_name">First Name</Label>
                                        <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="last_name">Last Name</Label>
                                        <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={user.email} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} placeholder="Tell us a little about yourself" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="px-6 pt-6">
                            {message && <p className="text-sm text-green-600">{message}</p>}
                            {error && <p className="text-sm text-red-600">{error}</p>}
                            <Button type="submit" className="ml-auto" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save All Changes'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* New Change Password Card */}
                <ChangePasswordCard />

                {/* New 2FA Card */}
                <TwoFactorAuthCard />
            </main>
            <Footer />
        </div>
    );
}