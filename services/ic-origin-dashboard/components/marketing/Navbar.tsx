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

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogin = async () => {
        if (!auth) {
            console.error("Firebase not initialized. Check your environment variables.");
            return;
        }
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            if (result.user) {
                router.push('/dashboard');
            }
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

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-10">
                    <a href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">How it works</a>
                    <a href="#benefits" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Benefits</a>
                    <a href="#use-cases" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Use Cases</a>
                </div>

                {/* Desktop Auth & CTA */}
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-4">
                        {loading ? (
                            <div className="w-24 h-8 bg-white/10 rounded-full animate-pulse" />
                        ) : user ? (
                            <div className="flex items-center gap-6">
                                <a href="/dashboard" className="text-sm font-black text-emerald-400 uppercase tracking-widest animate-pulse">Dashboard</a>
                                <button
                                    onClick={() => logout()}
                                    className="text-xs font-bold text-slate-500 hover:text-rose-400 transition-colors uppercase tracking-widest"
                                    data-testid="desktop-logout"
                                >
                                    Log out
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Log in
                            </button>
                        )}
                    </div>

                    <button
                        onClick={onOpenContact}
                        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-600/20 hidden sm:block"
                    >
                        Book Demo
                    </button>

                    {/* Mobile Hamburger Toggle */}
                    <button
                        className="md:hidden p-2 text-slate-400 hover:text-white"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle mobile menu"
                    >
                        {isMobileMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>

                    <button
                        onClick={onOpenContact}
                        className="sm:hidden px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20"
                    >
                        Demo
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden w-full bg-[#05070A] border-b border-white/5 py-4 px-6 flex flex-col gap-6" data-testid="mobile-menu">
                    <div className="flex flex-col gap-4 border-b border-white/5 pb-4">
                        <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-slate-400 hover:text-white">How it works</a>
                        <a href="#benefits" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-slate-400 hover:text-white">Benefits</a>
                        <a href="#use-cases" onClick={() => setIsMobileMenuOpen(false)} className="text-sm font-medium text-slate-400 hover:text-white">Use Cases</a>
                    </div>
                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <div className="w-24 h-8 bg-white/10 rounded-full animate-pulse" />
                        ) : user ? (
                            <div className="flex flex-col gap-4">
                                <a href="/dashboard" className="text-sm font-black text-emerald-400 uppercase tracking-widest w-fit">Dashboard</a>
                                <button
                                    onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                                    className="text-xs font-bold text-slate-500 hover:text-rose-400 transition-colors uppercase tracking-widest text-left w-fit"
                                >
                                    Log out
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setIsMobileMenuOpen(false); handleLogin(); }}
                                className="text-sm font-bold text-slate-400 hover:text-white transition-colors text-left w-fit"
                            >
                                Log in
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
