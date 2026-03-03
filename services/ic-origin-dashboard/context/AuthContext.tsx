'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    logout: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Playwright E2E Mock Hook
        if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_FORCE_AUTH) {
            console.log("AuthContext: Playwright mock auth engaged.");
            setUser({
                email: 'demo@icorigin.com',
                uid: 'test-pw-001',
                getIdToken: async () => 'mock-jwt-token-xyz'
            } as unknown as User);
            setLoading(false);
            return;
        }

        if (!auth) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
            console.log("AuthContext: Auth state changed:", firebaseUser?.email || "No user");
            setUser(firebaseUser);
            setLoading(false);

            // Auto-redirect if user lands on root while logged in
            if (firebaseUser && window.location.pathname === '/') {
                console.log("AuthContext: User logged in on root, routing to dashboard.");
                router.push('/dashboard');
            }
        });

        return () => unsubscribe();
    }, [router]);

    const logout = async () => {
        if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_FORCE_AUTH) {
            console.log("AuthContext: Engaging Playwright mock logout.");
            (window as any).__PLAYWRIGHT_FORCE_AUTH = false;
            setUser(null);
            router.push('/');
            return;
        }
        if (auth) await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
