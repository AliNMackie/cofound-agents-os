import React from 'react';

const SocialProof: React.FC = () => {
    return (
        <section className="py-20 border-y border-white/5 bg-slate-900/10">
            <div className="max-w-7xl mx-auto px-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 text-center mb-12">
                    Trusted by leading strategy and investment committee (IC) teams
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
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-10 py-5 flex items-center gap-8 backdrop-blur-sm">
                        <div className="text-center">
                            <p className="text-2xl font-black text-white">Day-Zero Discovery.</p>
                            <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1">Significant gain in time-to-insight vs. traditional research</p>
                        </div>
                        <div className="w-px h-12 bg-white/10" />
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#05070A] bg-slate-800 shadow-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default SocialProof;
