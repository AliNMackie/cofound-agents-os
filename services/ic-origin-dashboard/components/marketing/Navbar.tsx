import React from 'react';

const Navbar: React.FC = () => {
    return (
        <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#05070A]/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-emerald-500 to-blue-600 rounded-lg shadow-lg shadow-emerald-500/20" />
                    <span className="font-black tracking-tighter text-xl text-white">IC ORIGIN</span>
                </div>

                <div className="hidden md:flex items-center gap-10">
                    <a href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">How it works</a>
                    <a href="#benefits" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Benefits</a>
                    <a href="#use-cases" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Use Cases</a>
                </div>

                <div className="flex items-center gap-4">
                    <a href="/dashboard" className="text-sm font-bold text-slate-400 hover:text-white transition-colors hidden sm:block">Log in</a>
                    <button className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-xl shadow-emerald-600/20">
                        Book Demo
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
