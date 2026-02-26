import React from 'react';

const Benefits: React.FC = () => {
    const outcomes = [
        {
            title: 'Stop Guessing Resource Deployment',
            description: 'Shift from reactive responses to proactive GTM precision with evidence-backed territory mapping.',
            metric: '92% Faster Targeting',
            icon: '⚡'
        },
        {
            title: 'Get IC-Ready Views in Hours',
            description: 'Our agents synthesize raw market signals into board-ready strategy memos, bypassing weeks of analyst grunt work.',
            metric: 'Save 120hrs/mo per analyst',
            icon: '📄'
        },
        {
            title: 'Spot the Shadow Market',
            description: 'Gain visibility into private placement, OTC secondary, and distressed credit signals before they hit the wire.',
            metric: 'Day-Zero Discovery',
            icon: '🔍'
        }
    ];

    return (
        <section id="benefits" className="py-32 bg-[#0d1117]/30 border-y border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-20 items-center">
                    <div>
                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-500 mb-4">Outcome-Driven</h2>
                        <h3 className="text-4xl font-black text-white leading-tight mb-8">
                            High-fidelity intelligence for <span className="text-slate-500 italic">high-stakes</span> decisions.
                        </h3>
                        <p className="text-slate-400 mb-10 leading-relaxed text-lg">
                            IC Origin isn't just another dashboard. It's the strategic infrastructure that enables your team to move with absolute confidence.
                        </p>
                        <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                            Explore Capability Matrix
                        </button>
                    </div>

                    <div className="space-y-6">
                        {outcomes.map((o) => (
                            <div key={o.title} className="bg-[#05070A] border border-white/5 p-8 rounded-3xl hover:border-emerald-500/30 transition-all group">
                                <div className="flex items-start gap-6">
                                    <div className="text-3xl bg-slate-900 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                                        {o.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-white text-lg">{o.title}</h4>
                                            <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">
                                                {o.metric}
                                            </span>
                                        </div>
                                        <p className="text-slate-500 text-sm leading-relaxed">{o.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Benefits;
