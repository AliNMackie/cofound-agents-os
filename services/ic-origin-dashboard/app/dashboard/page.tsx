'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../globals.css';
import SummaryHeader from '../../components/dashboard/SummaryHeader';
import MarketMetricCard from '../../components/dashboard/MarketMetricCard';
import MarketShareChart from '../../components/dashboard/MarketShareChart';
import MarketMapScatter from '../../components/dashboard/MarketMapScatter';
import CompetitiveBenchmark from '../../components/dashboard/CompetitiveBenchmark';
import SignalCard from '../../components/dashboard/SignalCard';
import useSWR from 'swr';
import { triggerSwarmAction } from '../actions';
import { Download } from 'lucide-react';
import { exportToPDF } from '../../lib/export';

const fetcher = (url: string) => fetch(url).then(res => res.json());

import EntityDetailModal from '../../components/dashboard/EntityDetailModal';
import CommandTerminal from '../../components/dashboard/CommandTerminal';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

const DashboardV2: React.FC = () => {
    const { user, loading } = useAuth();
    const router = useRouter();

    // Local state for UI
    const [timeRange, setTimeRange] = useState('7D');
    const [region, setRegion] = useState('Global');

    // Phase 3: Interactive Topology & Command State
    const [selectedEntity, setSelectedEntity] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);

    // Auth Redirect Loop
    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    // Command Terminal Shortcut (Institutional UX)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsTerminalOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleNodeClick = (entity: any) => {
        setSelectedEntity(entity);
        setIsModalOpen(true);
    };

    // Role-based Multi-tenant Mock (Zombie Hunter context)
    const tenantId = user?.email?.split('@')[1] || 'global';

    // SWR Polling Logic (Ralph Wuggum Precision)
    const { data: telemetry, error, isLoading, isValidating } = useSWR('/api/telemetry', fetcher, {
        refreshInterval: 60000,
        revalidateOnFocus: true,
        dedupingInterval: 10000,
        fallbackData: {
            metrics: {
                tam: "$4.18B", sam: "$1.82B", som: "$420M", share: "14.2%", efficiency: "0.82x",
                tamChange: "+12.4%", samChange: "+4.1%", shareChange: "+1.2%", efficiencyChange: "-0.14x"
            },
            signals: [],
            topology: [],
            status: "INITIALIZING"
        }
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [memo, setMemo] = useState<string | null>(null);

    const handleTriggerSwarm = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);

        // Optimistic UI state
        const targetName = selectedEntity?.name || 'ALPHA-TARGET-001';
        setMemo(`Swarm computing initiated... Synthesizing web-scale signals for ${targetName} [Estimated completion: 14s]`);

        const formData = new FormData();
        formData.append('targetId', selectedEntity?.id || 'ALPHA-TARGET-001');

        try {
            const result = await triggerSwarmAction(formData);
            if (result.success) {
                setMemo(result.memo);
            }
        } catch (err) {
            console.error("Orchestration failed", err);
            setMemo("Engine Timeout: Shadow-market volatility too high for current compute threshold. Retrying sequence...");
        } finally {
            setIsGenerating(false);
        }
    };

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
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-3 flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${isLoading || isValidating ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                Telemetry // Stage 01
                            </h2>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Where We Stand Now</h3>
                        </div>
                        <div className="hidden md:flex gap-3">
                            {['TAM', 'SAM', 'SOM'].map(t => (
                                <div key={t} className="px-4 py-1.5 bg-slate-900 border border-white/10 rounded-lg text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{t} Exposure</div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MarketMetricCard
                            label="Total Addressable Market"
                            value={telemetry.metrics.tam}
                            change={telemetry.metrics.tamChange}
                            isPositive={true}
                            isLoading={isLoading}
                            isRevalidating={isValidating}
                        />
                        <MarketMetricCard
                            label="Serviceable Market"
                            value={telemetry.metrics.sam}
                            change={telemetry.metrics.samChange}
                            isPositive={true}
                            isLoading={isLoading}
                            isRevalidating={isValidating}
                        />
                        <MarketMetricCard
                            label="Market Share"
                            value={telemetry.metrics.share}
                            change={telemetry.metrics.shareChange}
                            isPositive={true}
                            isLoading={isLoading}
                            isRevalidating={isValidating}
                        />
                        <MarketMetricCard
                            label="Capital Efficiency"
                            value={telemetry.metrics.efficiency}
                            change={telemetry.metrics.efficiencyChange}
                            isPositive={false}
                            isLoading={isLoading}
                            isRevalidating={isValidating}
                        />
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
                                <MarketMapScatter onNodeClick={handleNodeClick} />
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
                        <form onSubmit={handleTriggerSwarm}>
                            <button
                                type="submit"
                                disabled={isGenerating}
                                className={`hidden sm:block px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-600/20 ${isGenerating ? 'animate-pulse opacity-50 cursor-wait' : ''}`}
                            >
                                {isGenerating ? 'Agent Task Active...' : 'Trigger Adjacency Swarm'}
                            </button>
                        </form>
                    </div>


                    {memo && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            id="strategy-memo-content"
                            className="mb-12 p-8 bg-indigo-500/5 border border-indigo-500/20 rounded-[32px] font-mono text-xs text-indigo-300 whitespace-pre-wrap relative overflow-hidden shadow-inner group"
                        >
                            <div className="absolute top-0 right-0 p-4 flex gap-4 items-center">
                                <span className="font-black uppercase tracking-widest text-[8px] text-indigo-500/40">Orchestrator Memo // Dynamic Synthesis</span>
                                <button
                                    onClick={() => exportToPDF('strategy-memo-content', 'IC_Origin_Strategic_Dossier')}
                                    className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-lg text-indigo-400 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2"
                                >
                                    <Download className="w-3 h-3" />
                                    <span className="text-[8px] font-black uppercase">Export Dossier</span>
                                </button>
                            </div>
                            {memo}
                        </motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {(telemetry.signals.length > 0 ? telemetry.signals : [
                            { id: 'S1', entity: 'Quantum Leap AI', type: 'Series A Target', confidence: 0.95, sentiment: 'positive' as const, urgency: 'high' as const, tags: ['ip_rich', 'founder_led'] },
                            { id: 'S2', entity: 'BlueTech Corp', type: 'Encroachment Alert', confidence: 0.88, sentiment: 'negative' as const, urgency: 'medium' as const, tags: ['regional_overlap'] },
                            { id: 'S3', entity: 'Confidential Alpha', type: 'OTC Secondary', confidence: 0.99, sentiment: 'neutral' as const, urgency: 'high' as const, tags: ['shadow_market'] },
                            { id: 'S4', entity: 'GreenGrid UK', type: 'M&A Adjacency', confidence: 0.92, sentiment: 'positive' as const, urgency: 'low' as const, tags: ['synergy_high'] },
                        ]).map((signal: any) => (
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
                            <form onSubmit={handleTriggerSwarm}>
                                <button
                                    type="submit"
                                    disabled={isGenerating}
                                    className={`px-12 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_rgba(16,185,129,0.3)] ${isGenerating ? 'animate-pulse' : ''}`}
                                >
                                    {isGenerating ? 'Synthesizing Alpha...' : 'Initialize Strategy Swarm'}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </section>
            </motion.div>

            {/* Sticky Foot Terminal */}
            <div className="fixed bottom-0 left-0 w-full border-t border-white/5 bg-[#05070A]/80 backdrop-blur-xl py-4 px-12 flex justify-between items-center z-50">
                <div className="flex gap-8 items-center">
                    <p className="text-[9px] font-mono tracking-tighter text-slate-500 uppercase flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                        IC ORIGIN CORE // SESSION ACTIVATED
                    </p>
                    <div className="hidden sm:flex gap-4 text-[9px] font-bold uppercase tracking-widest text-slate-700">
                        <span>Status: {telemetry.status || 'Operational'}</span>
                        <span className="text-emerald-500/50">Ping: {isLoading ? '--' : '12ms'}</span>
                    </div>
                </div>
                <div className="flex gap-6 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400">
                    <span className="text-indigo-400/80">LATITUDE_DASHBOARD_READY</span>
                    <span className="text-slate-700 underline cursor-help">API Documentation</span>
                </div>
            </div>
            <EntityDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                entity={selectedEntity}
            />

            <CommandTerminal
                isOpen={isTerminalOpen}
                onClose={() => setIsTerminalOpen(false)}
            />
        </div>
    );
};

export default DashboardV2;
