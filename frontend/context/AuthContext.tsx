// File: frontend/context/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

// Expanded User interface to hold profile data
interface User {
    id: number;
    email: string;
    first_name: string | null;
    last_name: string | null;
    bio: string | null;
    profile_picture_url: string | null;
    is_two_factor_enabled: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isLoading: boolean;
    fetchUserProfile: () => void; // Function to refresh user data
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create an Axios instance for authenticated requests
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});


export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchUserProfile = async () => {
        try {
            const response = await api.get('/users/me');
            setUser(response.data);
        } catch (error) {
            console.error("Failed to fetch user profile", error);
            logout(); // If we can't get the profile, log the user out
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            try {
                const decoded: any = jwtDecode(storedToken);
                if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                    logout();
                } else {
                    setToken(storedToken);
                    fetchUserProfile();
                }
            } catch (error) {
                console.error("Invalid token:", error);
                logout();
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string) => {
        localStorage.setItem('authToken', newToken);
        setToken(newToken);
        fetchUserProfile().then(() => {
            router.push('/');
        });
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading, fetchUserProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Export the api instance to be used in other components
export { api };