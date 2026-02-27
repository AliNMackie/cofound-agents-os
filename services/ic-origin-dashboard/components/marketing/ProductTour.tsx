'use client';

import React, { useState } from 'react';
import ArchitectureStack from './ArchitectureStack';

const ProductTour: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);

    const tabs = [
        {
            title: 'Adjacency Engine',
            description: 'Interactive topology mapping for non-obvious competitor discovery. Visualize where your core is under threat and where the "white space" actually lives.',
            bullets: ['Real-time territory mapping', 'Non-obvious competitor discovery', 'Adjacency scoring']
        },
        {
            title: 'Benchmarks',
            description: 'Deep-dive competitive performance metrics. Track margin variance, growth trajectories, and talent drain across direct and indirect peers.',
            bullets: ['Margin & Growth variance', 'Talent drain alerts', 'IP landscape tracking']
        },
        {
            title: 'Strategy Swarm',
            description: 'Multi-agent orchestration for scenario modeling and memo generation. Trigger bespoke strategy telemetry for any segment or entity in one click.',
            bullets: ['Automated memo synthesis', 'Evidence-backed GTM plays', 'Scenario modeling']
        }
    ];

    return (
        <section id="product-tour" className="py-32 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-indigo-500 mb-4">Product Tour</h2>
                    <h3 className="text-4xl font-black text-white">Experience the infrastructure.</h3>
                </div>

                <div className="grid lg:grid-cols-5 gap-12 items-center">
                    <div className="lg:col-span-2 space-y-4">
                        {tabs.map((tab, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveTab(idx)}
                                className={`w-full text-left p-8 rounded-3xl border transition-all duration-500 ${activeTab === idx
                                    ? 'bg-indigo-600/10 border-indigo-500/40'
                                    : 'bg-transparent border-white/5 hover:border-white/20 opacity-40'
                                    }`}
                            >
                                <h4 className={`text-lg font-bold mb-2 ${activeTab === idx ? 'text-white' : 'text-slate-400'}`}>
                                    {tab.title}
                                </h4>
                                {activeTab === idx && (
                                    <p className="text-sm text-slate-500 leading-relaxed mb-6 animate-in fade-in slide-in-from-left-4">
                                        {tab.description}
                                    </p>
                                )}
                                <ul className="space-y-2">
                                    {tab.bullets.map((b, i) => (
                                        <li key={i} className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === idx ? 'text-indigo-400' : 'text-slate-600'}`}>
                                            <div className={`w-1 body-1 rounded-full ${activeTab === idx ? 'bg-indigo-400 shadow-[0_0_5px_indigo]' : 'bg-slate-700'}`} />
                                            {b}
                                        </li>
                                    ))}
                                </ul>
                            </button>
                        ))}
                    </div>

                    <div className="lg:col-span-3">
                        <div className="relative bg-slate-900/50 rounded-[40px] border border-white/10 p-4 sm:p-6 backdrop-blur shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full" />

                            <div className="relative">
                                <ArchitectureStack />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductTour;
