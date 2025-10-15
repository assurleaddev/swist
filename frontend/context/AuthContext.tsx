// File: frontend/context/AuthContext.tsx
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';

interface User {
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            try {
                const decoded: any = jwtDecode(storedToken);
                // Debug: log decoded token
                console.log("Decoded token:", decoded);
                if (!decoded.sub) {
                    throw new Error("Token missing 'sub' field");
                }
                if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                    logout();
                } else {
                    setUser({ email: decoded.sub });
                    setToken(storedToken);
                }
            } catch (error) {
                console.error("Invalid token:", error);
                logout();
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string) => {
        try {
            const decoded: { sub: string } = jwtDecode(newToken);
            localStorage.setItem('authToken', newToken);
            setUser({ email: decoded.sub });
            setToken(newToken);
            router.push('/');
        } catch (error) {
            console.error("Failed to decode token on login:", error);
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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

