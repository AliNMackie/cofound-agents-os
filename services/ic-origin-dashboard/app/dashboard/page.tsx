'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import '../globals.css';
import SummaryHeader from '../components/dashboard/SummaryHeader';
import MarketMetricCard from '../components/dashboard/MarketMetricCard';
import MarketShareChart from '../components/dashboard/MarketShareChart';
import MarketMapScatter from '../components/dashboard/MarketMapScatter';
import CompetitiveBenchmark from '../components/dashboard/CompetitiveBenchmark';
import SignalCard from '../components/dashboard/SignalCard';

const DashboardV2: React.FC = () => {
    // Local state for filters
    const [timeRange, setTimeRange] = useState('7D');
    const [region, setRegion] = useState('Global');

    // Mock Data for Signals (Deepened for V2)
    const signals = [
        { id: 'S1', entity: 'Quantum Leap AI', type: 'Series A Target', confidence: 0.95, sentiment: 'positive' as const, urgency: 'high' as const, tags: ['ip_rich', 'founder_led', 'stealth_origination'] },
        { id: 'S2', entity: 'BlueTech Corp', type: 'Encroachment Alert', confidence: 0.88, sentiment: 'negative' as const, urgency: 'medium' as const, tags: ['regional_overlap', 'talent_drain'] },
        { id: 'S3', entity: 'Confidential Alpha', type: 'OTC Secondary', confidence: 0.99, sentiment: 'neutral' as const, urgency: 'high' as const, tags: ['shadow_market', 'tier_1_nexus'] },
        { id: 'S4', entity: 'GreenGrid UK', type: 'M&A Adjacency', confidence: 0.92, sentiment: 'positive' as const, urgency: 'low' as const, tags: ['synergy_high', 'undervalued_asset'] },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#05070A] text-slate-200 font-sans p-6 md:p-12 selection:bg-emerald-500/30 overflow-x-hidden">
            <SummaryHeader />

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="max-w-7xl mx-auto space-y-24 pb-20"
            >
                {/* 1. Where We Stand Now (Executive Overview) */}
                <section id="executive-overview" className="scroll-mt-24">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-3">Telemetry // Stage 01</h2>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Where We Stand Now</h3>
                        </div>
                        <div className="hidden md:flex gap-3">
                            {['TAM', 'SAM', 'SOM'].map(t => (
                                <div key={t} className="px-4 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{t} Exposure</div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MarketMetricCard label="Total Addressable Market" value="$4.2B" change="12.4%" isPositive={true} />
                        <MarketMetricCard label="Serviceable Market" value="$1.8B" change="4.1%" isPositive={true} />
                        <MarketMetricCard label="Market Share" value="14.2%" change="1.2%" isPositive={true} />
                        <MarketMetricCard label="Capital Efficiency" value="0.82x" change="0.14x" isPositive={false} />
                    </div>

                    {/* Hero Chart Section */}
                    <div className="mt-8 bg-[#0d1117] border border-white/5 rounded-[40px] p-10 h-[400px] relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-8 left-10 z-10">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Market Dominance // 7D Telemetry</h4>
                            <p className="text-lg font-bold text-white uppercase tracking-tighter">Share Trajectory</p>
                        </div>
                        <div className="absolute inset-0 pt-20 pb-6 px-4">
                            <MarketShareChart />
                        </div>
                    </div>
                </section>

                {/* 2. Forces Reshaping the Market (Competitive Intelligence) */}
                <section id="competitive-intelligence" className="scroll-mt-24">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500 mb-3">Intelligence // Stage 02</h2>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Forces Reshaping the Market</h3>
                        </div>

                        {/* Control Bar */}
                        <div className="flex items-center gap-6 bg-slate-900/50 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
                            <div className="flex gap-1 px-1">
                                {['24H', '7D', '30D'].map(range => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${timeRange === range ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                            <div className="w-px h-6 bg-white/10" />
                            <select
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className="bg-transparent text-[10px] font-black text-slate-400 focus:text-white border-none outline-none cursor-pointer uppercase tracking-widest pr-4"
                            >
                                <option value="Global">Global Topology</option>
                                <option value="EMEA">EMEA Topology</option>
                                <option value="AMER">AMER Topology</option>
                                <option value="APAC">APAC Topology</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Market Map Scatter */}
                        <div className="lg:col-span-2 bg-[#0d1117] border border-white/5 rounded-[40px] p-10 h-[500px] flex flex-col relative overflow-hidden group shadow-2xl">
                            <div className="mb-8">
                                <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Topology Map</h4>
                                <p className="text-lg font-bold text-white uppercase tracking-tighter">Growth x Profitability</p>
                            </div>
                            <div className="flex-1">
                                <MarketMapScatter />
                            </div>
                        </div>

                        {/* Benchmark Table */}
                        <div className="lg:col-span-3">
                            <CompetitiveBenchmark />
                        </div>
                    </div>
                </section>

                {/* 3. Where We Can Go Next (Strategic Signals) */}
                <section id="strategic-signals" className="scroll-mt-24">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-3">Strategy // Stage 03</h2>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Where We Can Go Next</h3>
                        </div>
                        <button className="hidden sm:block px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-600/20">
                            Trigger Adjacency Swarm
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {signals.map(signal => (
                            <SignalCard key={signal.id} {...signal} />
                        ))}
                    </div>

                    {/* Premium Strategy Generator Trigger */}
                    <motion.div
                        whileHover={{ y: -10 }}
                        className="mt-16 bg-gradient-to-br from-[#0d1117] via-[#0d1117] to-emerald-900/10 border border-white/10 rounded-[48px] p-20 text-center relative group overflow-hidden shadow-2xl"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] via-transparent to-indigo-500/[0.03] pointer-events-none" />
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full group-hover:bg-emerald-500/20 transition-colors" />
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full group-hover:bg-indigo-500/20 transition-colors" />

                        <div className="relative z-10">
                            <div className="inline-block px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-8">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Intelligence Synthesis Engine</span>
                            </div>
                            <h4 className="text-4xl font-black text-white mb-6 uppercase tracking-tight">Generate Adjacency Discovery Memo</h4>
                            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
                                Synthesize all regional telemetry, talent flows, and shadow market signals into a high-fidelity, board-ready strategic roadmap.
                                <span className="text-slate-600 italic ml-2">Estimated compute time: 14s.</span>
                            </p>
                            <button className="px-12 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(16,185,129,0.3)]">
                                Initialize Strategy Swarm
                            </button>
                        </div>
                    </motion.div>
                </section>
            </motion.div>

            {/* Sticky Foot Terminal */}
            <div className="fixed bottom-0 left-0 w-full border-t border-white/5 bg-[#05070A]/80 backdrop-blur-xl py-4 px-12 flex justify-between items-center z-50">
                <div className="flex gap-8 items-center">
                    <p className="text-[9px] font-mono tracking-tighter text-slate-500 uppercase">IC ORIGIN CORE // SESSION ACTIVATED</p>
                    <div className="hidden sm:flex gap-4 text-[9px] font-bold uppercase tracking-widest text-slate-700">
                        <span>Status: Operational</span>
                        <span className="text-emerald-500/50">Ping: 12ms</span>
                    </div>
                </div>
                <div className="flex gap-6 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400">
                    <span className="text-indigo-400/80">LATITUDE_DASHBOARD_READY</span>
                    <span className="text-slate-700 underline cursor-help">API Documentation</span>
                </div>
            </div>
        </div>
    );
};

export default DashboardV2;
