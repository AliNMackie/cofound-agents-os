import React from 'react';

const HowItWorks: React.FC = () => {
    const steps = [
        {
            id: '01',
            label: 'Ingest Swarm',
            description: 'Continuous web-scale signal telemetry across specialized sources. Raw market noise is ingested, cleaned, and structured into institutional-grade data in real-time.',
            icon: '📡'
        },
        {
            id: '02',
            label: 'Map Topology',
            description: 'Our agents map the competitive landscape to reveal non-obvious adjacencies and hidden market overlaps. See the architecture of your market as it forms.',
            icon: '🗺️'
        },
        {
            id: '03',
            label: 'Surface Strategy',
            description: 'High-fidelity strategy memos are generated with full evidentiary support. Shift from research to board-ready decisions in hours.',
            icon: '🎯'
        }
    ];

    return (
        <section id="how-it-works" className="py-32 relative">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-24">
                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-emerald-500 mb-4">Precision Workflow</h2>
                    <p className="text-3xl font-bold text-white tracking-tight">How our infrastructure builds your alpha.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-16">
                    {steps.map((step) => (
                        <div key={step.id} className="relative group">
                            <div className="absolute -top-12 -left-8 text-8xl font-black text-white/[0.03] font-mono group-hover:text-emerald-500/[0.08] transition-colors pointer-events-none">
                                {step.id}
                            </div>
                            <div className="text-4xl mb-6 bg-slate-900 w-16 h-16 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform shadow-xl">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                {step.label}
                                <div className="h-px bg-white/10 flex-1" />
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
