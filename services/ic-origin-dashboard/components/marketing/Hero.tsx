import React, { useState } from 'react';
import ContactModal from './ContactModal';
import TerminalPreviewModal from './TerminalPreviewModal';

interface HeroProps {
    onOpenContact: () => void;
}

const Hero: React.FC<HeroProps> = ({ onOpenContact }) => {
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);

    return (
        <section className="relative pt-44 pb-32 overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/10 blur-[120px] rounded-full opacity-50 pointer-events-none" />
            <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/5 blur-[100px] rounded-full opacity-30 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">v2.5 Alpha Now Live</span>
                </div>

                <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-8 max-w-4xl mx-auto text-white">
                    The AI Infrastructure for Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-indigo-500">Defensibility</span> and Growth.
                </h1>

                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                    Defend, expand, and originate with precision. The multi-agent platform for institutional-grade market understanding.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                    <button
                        onClick={onOpenContact}
                        className="w-full sm:w-auto px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-xs transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-600/30"
                    >
                        Book a 15-minute demo
                    </button>
                    <a href="#product-tour" className="w-full sm:w-auto px-10 py-5 border border-white/10 hover:bg-white/5 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-xs transition-all">
                        View Sample Dashboard
                    </a>
                </div>

                <TerminalPreviewModal isOpen={isTerminalOpen} onClose={() => setIsTerminalOpen(false)} />

                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 mb-20">
                    Institutional-grade market understanding. Processed at machine speed.
                </p>

                {/* Product UI Shot Mockup */}
                <div className="relative max-w-5xl mx-auto group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-[32px] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                    <div className="relative bg-[#0d1117] border border-white/10 rounded-[30px] shadow-2xl overflow-hidden aspect-video">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#05070a]/80 z-10" />

                        {/* Simulated UI Content */}
                        <div className="p-8 text-left h-full flex flex-col">
                            <div className="flex justify-between items-center mb-10 opacity-40">
                                <div className="flex gap-4">
                                    <div className="w-24 h-4 bg-slate-800 rounded-full" />
                                    <div className="w-16 h-4 bg-slate-800 rounded-full" />
                                </div>
                                <div className="w-32 h-4 bg-slate-800 rounded-full" />
                            </div>

                            <div className="grid grid-cols-3 gap-6 flex-1">
                                <div className="col-span-2 bg-slate-900/50 rounded-2xl border border-white/5 p-6 backdrop-blur">
                                    <div className="w-1/3 h-6 bg-emerald-500/20 rounded-lg mb-6" />
                                    <div className="space-y-4 font-mono text-[10px]">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="flex justify-between items-center py-3 border-b border-white/5">
                                                <div className="w-1/3 h-4 bg-slate-800/40 rounded" />
                                                <div className="w-1/4 h-3 bg-emerald-500/20 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 backdrop-blur">
                                    <div className="w-1/2 h-6 bg-indigo-500/20 rounded-lg mb-6" />
                                    <div className="space-y-6">
                                        <div className="w-full h-32 bg-slate-800/40 rounded-xl" />
                                        <div className="w-full h-4 bg-slate-800/60 rounded" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Interaction Prompt */}
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <button
                                onClick={() => setIsTerminalOpen(true)}
                                className="bg-emerald-600 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-emerald-600/40 opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95 duration-300 transform translate-y-4 group-hover:translate-y-0"
                            >
                                Preview Interactive Terminal
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};


export default Hero;
