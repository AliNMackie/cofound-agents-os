import React from 'react';

const HowItWorks: React.FC = () => {
    const steps = [
        {
            id: '01',
            label: 'Ingest & Structure',
            description: 'Our ingest swarm monitors web-scale signals across 1,200+ sources, structuring the un-structured in real-time.',
            icon: '📡'
        },
        {
            id: '02',
            label: 'Map Market Topology',
            description: 'Automated multi-agent agents map the competitive landscape, highlighting non-obvious adjacencies and overlaps.',
            icon: '🗺️'
        },
        {
            id: '03',
            label: 'Surface Strategy',
            description: 'Receive IC-ready strategy memos focused on three key outcomes: where to defend, expand, and originate.',
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

                <div className="grid md:grid-cols-3 gap-12">
                    {steps.map((step) => (
                        <div key={step.id} className="relative group">
                            <div className="absolute -top-10 -left-6 text-6xl font-black text-white/5 group-hover:text-emerald-500/10 transition-colors pointer-events-none">
                                {step.id}
                            </div>
                            <div className="text-4xl mb-6">{step.icon}</div>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                {step.label}
                                <div className="h-px bg-white/10 flex-1" />
                            </h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
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
