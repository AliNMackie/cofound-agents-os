import React, { useState } from 'react';
import ContactModal from './ContactModal';

const FinalCTA: React.FC = () => {
    const [isContactOpen, setIsContactOpen] = useState(false);

    return (
        <section className="py-48 relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-600/5 blur-[120px] rounded-full scale-50 pointer-events-none" />

            <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-8">
                    Stop guessing. Start <span className="text-emerald-500 italic">originating</span>.
                </h2>
                <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                    Deploy institutional-grade AI infrastructure to understand your market in real-time. Join the teams making informed decisions at machine speed.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <button
                        onClick={() => setIsContactOpen(true)}
                        className="w-full sm:w-auto px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-600/40"
                    >
                        Book a 15-minute demo
                    </button>
                    <a href="mailto:alpha@icorigin.ai" className="text-sm font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-2">
                        Contact Sales Engineering <span className="text-lg">→</span>
                    </a>
                </div>
                <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
            </div>
        </section>
    );
};

export default FinalCTA;
