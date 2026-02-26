'use client';

import React, { useState, useEffect } from 'react';
import '../globals.css';

type ThemaMode = 'defend' | 'expand' | 'originate' | 'shadow';

interface Signal {
    id: string;
    entity: string;
    type: string;
    confidence: number;
    tags: string[];
}

const ORCHESTRATOR_URL = "https://ic-origin-orchestrator-1005792944830.europe-west2.run.app";
const INGEST_URL = "https://ic-origin-ingest-1005792944830.europe-west2.run.app";

const DashboardStore: Record<ThemaMode, Signal[]> = {
    defend: [
        { id: 'D1', entity: 'BlueTech Corp', type: 'Competitor Encroachment', confidence: 0.88, tags: ['regional_overlap'] },
        { id: 'D2', entity: 'SilverLine Inc', type: 'Talent Drain', confidence: 0.75, tags: ['key_personnel_exit'] },
    ],
    expand: [
        { id: 'E1', entity: 'GreenGrid UK', type: 'M&A Adjacency', confidence: 0.92, tags: ['synergy_high', 'undervalued'] },
        { id: 'E2', entity: 'EcoWatt Ltd', type: 'Market Gap', confidence: 0.81, tags: ['unmet_demand'] },
    ],
    originate: [
        { id: 'O1', entity: 'Quantum Leap', type: 'Series A Target', confidence: 0.95, tags: ['ip_rich', 'founder_led'] },
        { id: 'O2', entity: 'AI First', type: 'Stealth Growth', confidence: 0.84, tags: ['patent_filed'] },
    ],
    shadow: [
        { id: 'S1', entity: 'Confidential Alpha', type: 'OTC Secondary', confidence: 0.99, tags: ['shadow_market', 'tier_1'] },
        { id: 'S2', entity: 'Project Omega', type: 'Private Placement', confidence: 0.91, tags: ['distressed_debt'] },
    ],
};

const Dashboard: React.FC = () => {
    const [mode, setMode] = useState<ThemaMode>('originate');
    const [isActivating, setIsActivating] = useState(false);
    const [isDemoActive, setIsDemoActive] = useState(false);
    const [systemHealth, setSystemHealth] = useState('Checking...');

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const res = await fetch(`${ORCHESTRATOR_URL}/health`);
                const data = await res.json();
                setSystemHealth(`v${data.version} - Online`);
            } catch (e) {
                setSystemHealth('Disconnected');
            }
        };
        checkHealth();
    }, []);

    const handleActivate = async () => {
        setIsActivating(true);
        try {
            // Wake the swarm
            await fetch(`${ORCHESTRATOR_URL}/activate`, { method: 'POST' });
            // Start demo crawl
            await fetch(`${ORCHESTRATOR_URL}/demo`, { method: 'POST' });

            await new Promise((r) => setTimeout(r, 1000));
            setIsDemoActive(true);
        } catch (e) {
            console.error("Failed to activate swarm:", e);
        } finally {
            setIsActivating(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-200 font-sans p-6 md:p-12 selection:bg-emerald-500/30">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                        IC ORIGIN <span className="text-slate-500 text-xl font-light">v2.5 Alpha</span>
                    </h1>
                    <p className="text-slate-500 mt-1 uppercase tracking-widest text-xs font-semibold">
                        Thema Adjacency Discovery Engine // System: {systemHealth}
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-slate-900/50 p-1.5 rounded-full border border-slate-800 shadow-2xl backdrop-blur-xl">
                    {(['defend', 'expand', 'originate', 'shadow'] as ThemaMode[]).map((m) => (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${mode === m
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                                : 'text-slate-500 hover:text-slate-300'
                                }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </header>

            {/* Main Grid */}
            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Table View */}
                <section className="lg:col-span-2 bg-[#0d1117] rounded-3xl border border-slate-800/60 shadow-inner overflow-hidden">
                    <div className="p-8 border-b border-slate-800/60 flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full animate-pulse ${mode === 'shadow' ? 'bg-purple-500 shadow-[0_0_10px_purple]' : 'bg-emerald-500 shadow-[0_0_10px_emerald]'}`} />
                            {mode.charAt(0).toUpperCase() + mode.slice(1)} Signals
                        </h2>
                        {mode === 'shadow' && (
                            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full font-black uppercase tracking-tighter">
                                Premium Layer: Tier 3 Access
                            </span>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-[10px] uppercase font-bold tracking-[0.2em] bg-slate-900/20">
                                    <th className="px-8 py-4">Entity</th>
                                    <th className="px-8 py-4">Anomaly / Type</th>
                                    <th className="px-8 py-4">Adjacency %</th>
                                    <th className="px-8 py-4">Discovery Path</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                                {DashboardStore[mode].map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-800/10 transition-colors group cursor-default">
                                        <td className="px-8 py-6">
                                            <p className="font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">{s.entity}</p>
                                            <p className="text-[10px] text-slate-600 font-mono tracking-tighter">{s.id}</p>
                                        </td>
                                        <td className="px-8 py-6 text-sm text-slate-400">{s.type}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full transition-all duration-1000 ${mode === 'shadow' ? 'bg-purple-500' : 'bg-emerald-500'}`} style={{ width: `${s.confidence * 100}%` }} />
                                                </div>
                                                <span className="text-xs font-mono font-bold text-slate-300">{(s.confidence * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-mono text-[9px] text-slate-500">
                                            {s.tags.map(t => <span key={t} className="mr-2 bg-slate-900 px-2 py-1 rounded border border-slate-800">#{t}</span>)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Sidebar Controls */}
                <aside className="space-y-8">
                    {/* Investor Demo Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-[#12161c] p-8 rounded-3xl border border-slate-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-colors duration-500" />
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="text-emerald-500">⚡</span> Agent Orchestration
                        </h3>
                        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                            Activate the web-scale crawling layer and trigger 2-hour multi-agent strategy telemetry.
                        </p>
                        <button
                            onClick={handleActivate}
                            disabled={isActivating || isDemoActive}
                            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-500 shadow-2xl ${isDemoActive
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 cursor-default'
                                : isActivating
                                    ? 'bg-slate-800 text-slate-500 border border-slate-700'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.02] active:scale-[0.98]'
                                }`}
                        >
                            {isDemoActive ? 'System Live' : isActivating ? 'Spinning Dataflow...' : '1-Click Activate Demo'}
                        </button>
                        {isDemoActive && (
                            <div className="mt-4 p-4 bg-emerald-950/20 border border-emerald-900/30 rounded-xl">
                                <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-2 uppercase tracking-tighter">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                    Live Feed: 1.2TB Swiping...
                                </p>
                            </div>
                        )}
                    </div>

                    {/* SaaS Tiers Card */}
                    <div className="bg-[#0a0c10] p-8 rounded-3xl border border-slate-800/80">
                        <h3 className="text-lg font-bold mb-6">License Configuration</h3>
                        <div className="space-y-4">
                            <div className="p-5 border border-slate-800 rounded-2xl flex justify-between items-center group hover:border-emerald-500/30 transition-all cursor-pointer">
                                <div>
                                    <p className="font-bold text-sm">Growth Tier</p>
                                    <p className="text-[10px] text-slate-500">Defend + Expand Views</p>
                                </div>
                                <p className="font-mono text-xs text-slate-300">£1,200/yr</p>
                            </div>
                            <div className="p-5 border-2 border-emerald-500/40 bg-emerald-500/5 rounded-2xl flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-emerald-500 text-[8px] px-2 py-0.5 font-bold text-slate-900 rounded-bl-lg uppercase">Best Value</div>
                                <div>
                                    <p className="font-bold text-sm text-emerald-400">Originate Pro</p>
                                    <p className="text-[10px] text-emerald-500/60">Full Strategy Engine</p>
                                </div>
                                <p className="font-mono text-xs text-emerald-300">£2,800/yr</p>
                            </div>
                            <div className="p-5 border border-purple-500/30 bg-purple-500/5 rounded-2xl flex justify-between items-center group hover:border-purple-500 transition-all cursor-pointer">
                                <div>
                                    <p className="font-bold text-sm text-purple-400">Shadow Market</p>
                                    <p className="text-[10px] text-purple-600">OTC + Private Credits</p>
                                </div>
                                <p className="font-mono text-xs text-purple-400">£5,000/yr</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Footer */}
            <footer className="mt-20 border-t border-slate-900 pt-10 flex flex-col md:flex-row justify-between items-center gap-6 saturate-0 opacity-40 hover:saturate-100 hover:opacity-100 transition-all duration-700">
                <p className="text-[10px] font-mono tracking-tighter">IC ORIGIN TERMINAL // SHADOW_MARKET_DISABLED=FALSE // SESSION_ID=IC-0226</p>
                <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <a href="#" className="hover:text-emerald-400 transition-colors">API Docs</a>
                    <a href="#" className="hover:text-emerald-400 transition-colors">Compliance</a>
                    <a href="#" className="hover:text-emerald-400 transition-colors">Support</a>
                </div>
            </footer>
        </div>
    );
};

export default Dashboard;
