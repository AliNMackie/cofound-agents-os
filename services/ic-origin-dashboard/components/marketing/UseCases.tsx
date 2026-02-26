import React from 'react';

const UseCases: React.FC = () => {
    const cases = [
        {
            role: 'Strategy Directors',
            title: 'Defend Core Markets',
            scenario: 'Monitor regional overlaps and talent drains to proactively safeguard your dominant market positions.',
            icon: '🛡️'
        },
        {
            role: 'Product Leaders',
            title: 'Identify Expansion Latitudes',
            scenario: 'Map IP landscapes and customer intent to discover high-value adjacencies for new feature or product launches.',
            icon: '🚀'
        },
        {
            role: 'GTM & Investors',
            title: 'Originate New Bets',
            scenario: 'Use Day-Zero discovery to find stealth startups and distressed opportunities before they enter the public domain.',
            icon: '💎'
        }
    ];

    return (
        <section id="use-cases" className="py-32 relative bg-[#0d1117]/10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-24">
                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-500 mb-4">Vertical Scenarios</h2>
                    <p className="text-3xl font-bold text-white tracking-tight">Purpose-built for mission-critical roles.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {cases.map((c) => (
                        <div key={c.title} className="bg-gradient-to-br from-[#0d1117] to-transparent border border-white/5 p-10 rounded-[40px] hover:border-emerald-500/20 transition-all group">
                            <div className="text-4xl mb-8 group-hover:scale-125 transition-transform duration-500 inline-block bg-slate-900/50 p-4 rounded-2xl">
                                {c.icon}
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 mb-2">{c.role}</p>
                            <h3 className="text-xl font-bold text-white mb-6 leading-tight">{c.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                {c.scenario}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default UseCases;
