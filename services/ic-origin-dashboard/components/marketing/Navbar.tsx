import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import ContactModal from './ContactModal';
import { useRouter } from 'next/navigation';

interface NavbarProps {
    onOpenContact: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenContact }) => {
    const { user, loading, logout } = useAuth();
    const router = useRouter();

    const handleLogin = async () => {
        if (!auth) {
            console.error("Firebase not initialized. Check your environment variables.");
            return;
        }
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push('/dashboard');
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#05070A]/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-lg shadow-lg shadow-emerald-500/20" />
                    <span className="font-black tracking-tighter text-xl text-white">IC ORIGIN</span>
                </div>

                <div className="hidden md:flex items-center gap-10">
                    <a href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">How it works</a>
                    <a href="#benefits" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Benefits</a>
                    <a href="#use-cases" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Use Cases</a>
                </div>

                <div className="flex items-center gap-4">
                    {loading ? (
                        <div className="w-24 h-8 bg-white/10 rounded-full animate-pulse" />
                    ) : user ? (
                        <div className="flex items-center gap-6">
                            <a href="/dashboard" className="text-sm font-black text-emerald-400 uppercase tracking-widest animate-pulse">Dashboard</a>
                            <button
                                onClick={() => logout()}
                                className="text-xs font-bold text-slate-500 hover:text-rose-400 transition-colors uppercase tracking-widest"
                            >
                                Log out
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleLogin}
                            className="text-sm font-bold text-slate-400 hover:text-white transition-colors hidden sm:block"
                        >
                            Log in
                        </button>
                    )}
                    <button
                        onClick={onOpenContact}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-600/20"
                    >
                        Book Demo
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
