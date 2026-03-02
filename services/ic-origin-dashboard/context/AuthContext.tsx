'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut, getRedirectResult } from 'firebase/auth';
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
        if (!auth) {
            setLoading(false);
            return;
        }

        console.log("AuthContext: Checking for redirect result...");
        // Handle redirect result
        getRedirectResult(auth).then((result) => {
            if (result?.user) {
                console.log("AuthContext: Redirect login successful for", result.user.email);
                router.push('/dashboard');
            } else {
                console.log("AuthContext: No redirect result found.");
            }
        }).catch((error) => {
            console.error("AuthContext: Redirect auth failed:", error);
        });

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
        if (auth) await signOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
