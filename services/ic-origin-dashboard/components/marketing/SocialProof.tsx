import React from 'react';

const SocialProof: React.FC = () => {
    return (
        <section className="py-20 border-y border-white/5 bg-slate-900/10">
            <div className="max-w-7xl mx-auto px-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-center mb-10">
                    Teams and Investors relying on our infrastructure
                </p>

                <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                    {['GlobalEquity', 'FortressVenture', 'ApexStrategy', 'NexusPartners'].map(name => (
                        <div key={name} className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-slate-700 rounded-sm" />
                            <span className="font-bold tracking-tighter text-lg text-slate-300">{name}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-16 flex justify-center">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-8 py-4 flex items-center gap-6 backdrop-blur-sm">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#05070A] bg-slate-800" />
                            ))}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-white">"Cut time-to-insight from 3 weeks to 2 days"</p>
                            <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">Leading Mid-Market Strategy Director</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SocialProof;
