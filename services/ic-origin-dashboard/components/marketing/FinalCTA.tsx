import React from 'react';

const FinalCTA: React.FC = () => {
    return (
        <section className="py-40 relative">
            <div className="absolute inset-0 bg-emerald-600/5 blur-[120px] rounded-full scale-50 pointer-events-none" />

            <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-8">
                    Stop guessing. Start <span className="text-emerald-500">originating</span>.
                </h2>
                <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto">
                    Deploy institutional-grade AI infrastructure to understand your market in real-time. Join the teams making informed decisions at machine speed.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <button className="w-full sm:w-auto px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-600/30">
                        Book a 15-minute demo
                    </button>
                    <a href="mailto:alpha@icorigin.ai" className="text-sm font-bold text-slate-500 hover:text-white transition-colors">
                        Contact Sales Engineering &rarr;
                    </a>
                </div>
            </div>
        </section>
    );
};

export default FinalCTA;
