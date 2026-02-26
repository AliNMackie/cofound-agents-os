'use client';

import React, { useState } from 'react';

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
                        <div className="relative aspect-[4/3] bg-slate-900/50 rounded-[40px] border border-white/10 p-6 backdrop-blur shadow-2xl overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />

                            {/* Visual Placeholder for Tab Content */}
                            <div className="h-full border border-white/5 rounded-[24px] bg-[#05070A] overflow-hidden flex flex-col p-8">
                                <div className="flex justify-between items-center mb-12">
                                    <div className="w-32 h-6 bg-slate-800/50 rounded-lg" />
                                    <div className="flex gap-2">
                                        <div className="w-12 h-6 bg-slate-800/50 rounded-lg" />
                                        <div className="w-12 h-6 bg-indigo-500/20 rounded-lg" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-8 animate-pulse">
                                    <div className="grid grid-cols-4 gap-4">
                                        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-900 border border-white/5 rounded-xl" />)}
                                    </div>
                                    <div className="w-full h-32 bg-slate-900 border border-white/5 rounded-2xl" />
                                    <div className="w-2/3 h-4 bg-slate-900 rounded-full" />
                                    <div className="w-1/2 h-4 bg-slate-900 rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductTour;
