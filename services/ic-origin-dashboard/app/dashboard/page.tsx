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
import PortfolioRisk from '../../components/dashboard/PortfolioRisk';
import PortfolioStatus from '../../components/dashboard/PortfolioStatus';
import RiskTrend from '../../components/dashboard/RiskTrend';
import { DEMO_COUNTERPARTIES } from '../../lib/counterparty-data';
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

    // 1. Hoist all state hooks to the top
    const [timeRange, setTimeRange] = useState('7D');
    const [region, setRegion] = useState('Global');
    const [sector, setSector] = useState('All Sectors');
    const [category, setCategory] = useState('All Categories');
    const [activeSignal, setActiveSignal] = useState<string | null>(null);
    const [selectedEntity, setSelectedEntity] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [memo, setMemo] = useState<string | null>(null);
    const [isFetchingNeo4j, setIsFetchingNeo4j] = useState(false);

    // 2. All Effect hooks
    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

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

    // 3. All Data fetching hooks
    const { data: telemetry, error, isLoading, isValidating } = useSWR('/api/telemetry', fetcher, {
        refreshInterval: 60000,
        revalidateOnFocus: true,
        dedupingInterval: 10000,
        fallbackData: {
            metrics: {
                tam: "--", sam: "--", som: "--", share: "--", efficiency: "--",
                tamChange: "", samChange: "", shareChange: "", efficiencyChange: ""
            },
            signals: [],
            topology: [],
            status: "INITIALIZING"
        }
    });

    // 4. Derived logic (moved after hooks)
    const tenantId = user?.email?.split('@')[1] || 'global';

    const handleNodeClick = (entity: any) => {
        setIsFetchingNeo4j(true);
        setIsModalOpen(true);

        // Simulate a 1.5s network request to Neo4j
        setTimeout(() => {
            const baseEntity = telemetry?.topology?.find((e: any) => (e.company_id === entity.id || e.company_name === entity.name)) || entity;

            // Highly realistic, M&A-focused dummy JSON payload for the Neo4j graph data
            const dummyNeo4jData = {
                ...baseEntity,
                contagionData: {
                    target: {
                        ch_number: baseEntity.company_id || "01234567",
                        name: baseEntity.company_name || baseEntity.name || "Target Entity",
                        risk_tier: "STABLE"
                    },
                    nodes: [
                        { id: 'target', label: baseEntity.company_name || baseEntity.name || "Target Entity", type: 'Company', is_target: true },
                        { id: 'supplier_1', label: 'Apex Logistics Ltd', type: 'Company', risk_tier: 'ELEVATED_RISK' },
                        { id: 'supplier_2', label: 'Meridian Manufacturing', type: 'Company', risk_tier: 'STABLE' },
                        { id: 'buyer_1', label: 'Global Retail Corp', type: 'Company', risk_tier: 'STABLE' },
                        { id: 'person_1', label: 'John Smith (Director)', type: 'Person' },
                        { id: 'person_2', label: 'Jane Doe (PSC)', type: 'Person' }
                    ],
                    links: [
                        { source: 'supplier_1', target: 'target', type: 'SUPPLIER' }, // The "sick" supplier connected to the target
                        { source: 'supplier_2', target: 'target', type: 'SUPPLIER' },
                        { source: 'target', target: 'buyer_1', type: 'CUSTOMER' },
                        { source: 'person_1', target: 'target', type: 'DIRECTOR' },
                        { source: 'person_2', target: 'target', type: 'PSC' },
                        { source: 'person_1', target: 'supplier_1', type: 'DIRECTOR' } // Cross-directorship risk
                    ]
                }
            };

            setSelectedEntity(dummyNeo4jData);
            setIsFetchingNeo4j(false);
        }, 1500);
    };

    const handleTriggerSwarm = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsGenerating(true);

        const targetId = selectedEntity?.id || selectedEntity?.company_id || 'alpha-001';
        const targetName = selectedEntity?.name || selectedEntity?.company_name || 'Alpha Target';

        setMemo(`[EMERALD_ORCHESTRATOR] Initiating recursive signal synthesis for ${targetName}...`);

        try {
            const formData = new FormData();
            formData.append('targetId', targetId);

            // Enforce a small artificial loading state to allow the UI to show the 'Synthesizing...' animation
            // without making the user wait 20 agonizing seconds during the pitch!
            const [result] = await Promise.all([
                triggerSwarmAction(formData),
                new Promise(resolve => setTimeout(resolve, 3000))
            ]);

            if (result.success) {
                setMemo(result.memo);

                // Automatically export to PDF once the DOM has updated
                setTimeout(() => {
                    try {
                        exportToPDF('strategy-memo-content', 'IC_Origin_Strategic_Dossier');
                    } catch (e) {
                        console.error('Auto-PDF export failed:', e);
                    }
                }, 500);
            }
        } catch (err) {
            console.error("Orchestration failed", err);
            setMemo("Engine Timeout: Shadow-market volatility too high for current compute threshold.");
        } finally {
            setIsGenerating(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2
            }
        }
    };

    // 5. Early return replacement (Rendering logic)
    if (loading) {
        return (
            <div className="min-h-screen bg-[#05070A] flex items-center justify-center">
                <div className="relative">
                    <div className="w-24 h-24 border-2 border-emerald-500/20 rounded-full animate-ping" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 border-t-2 border-emerald-500 rounded-full animate-spin" />
                    </div>
                    <div className="mt-8 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500 animate-pulse">Establishing Secure Session</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) return null;

    // Institutional Filtering Logic
    const filteredTopology = (telemetry?.topology || []).filter((entity: any) => {
        const matchesRegion = region === 'Global' || entity.region === region;
        const matchesCategory = category === 'All Categories' || entity.ic_origin_classification?.category === category;

        let matchesSignal = true;
        if (activeSignal) {
            const hasTalentFreeze = (entity.human_capital?.hiring_velocity_6mo_pct || 0) < 0 && (entity.human_capital?.active_job_postings || 0) === 0;
            const hasDebtWhiplash = (entity.statutory_signals?.recent_mr01_count_24mo || 0) > 0 && (entity.statutory_signals?.recent_mr04_count_24mo || 0) > 0;
            const hasLeverageCreep = (entity.statutory_signals?.total_active_charges || 0) > 3;
            const hasBoardVolatility = (entity.statutory_signals?.director_churn_index || 0) > 0.5;

            if (activeSignal === 'Talent Freeze') matchesSignal = hasTalentFreeze;
            if (activeSignal === 'Debt Whiplash') matchesSignal = hasDebtWhiplash;
            if (activeSignal === 'Leverage Creep') matchesSignal = hasLeverageCreep;
            if (activeSignal === 'Board Volatility') matchesSignal = hasBoardVolatility;
        }

        return matchesRegion && matchesCategory && matchesSignal;
    });

    const sectionVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 100,
                damping: 20,
                duration: 0.8
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
                <motion.section
                    variants={sectionVariants}
                    id="executive-overview"
                    className="scroll-mt-24"
                >
                    <div className="flex justify-between items-end mb-10">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-3 flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${isLoading || isValidating ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                                Telemetry // Stage 01
                            </h2>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Where We Stand Now</h3>
                        </motion.div>
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
                            <MarketShareChart isLoading={isLoading} />
                        </div>
                    </div>
                </motion.section>

                {/* 2. Forces Reshaping the Market (Competitive Intelligence) */}
                <motion.section
                    variants={sectionVariants}
                    id="competitive-intelligence"
                    className="scroll-mt-24"
                >
                    <div className="flex justify-between items-end mb-10">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-500 mb-3">Intelligence // Stage 02</h2>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Forces Reshaping the Market</h3>
                        </motion.div>

                        {/* Control Bar - Institutional Facets */}
                        <div className="flex flex-wrap items-center gap-4 bg-slate-900/50 p-3 rounded-2xl border border-white/10 backdrop-blur-xl">
                            <select
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                className="bg-transparent text-[10px] font-black text-slate-400 focus:text-white border-none outline-none cursor-pointer uppercase tracking-widest"
                            >
                                <option value="Global">All Regions</option>
                                <option value="North West">North West Cluster</option>
                                <option value="Midlands">Midlands Hub</option>
                                <option value="Scotland">Central Belt Scotland</option>
                            </select>

                            <div className="w-px h-6 bg-white/10" />

                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="bg-transparent text-[10px] font-black text-slate-400 focus:text-white border-none outline-none cursor-pointer uppercase tracking-widest"
                            >
                                <option value="All Categories">All Categories</option>
                                <option value="Obvious Winner">Obvious Winners</option>
                                <option value="Borderline">Borderline</option>
                                <option value="Distressed / Contrarian">Distressed</option>
                            </select>

                            <div className="w-px h-6 bg-white/10" />

                            <select
                                value={activeSignal || ''}
                                onChange={(e) => setActiveSignal(e.target.value || null)}
                                className="bg-transparent text-[10px] font-black text-slate-400 focus:text-emerald-400 border-none outline-none cursor-pointer uppercase tracking-widest"
                            >
                                <option value="">No Signal Filters</option>
                                <option value="Talent Freeze">Talent Freeze</option>
                                <option value="Debt Whiplash">Debt Whiplash</option>
                                <option value="Leverage Creep">Leverage Creep</option>
                                <option value="Board Volatility">Board Volatility</option>
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
                                <MarketMapScatter
                                    onNodeClick={handleNodeClick}
                                    isLoading={isLoading}
                                    data={filteredTopology}
                                />
                            </div>
                        </div>

                        {/* Benchmark Table */}
                        <div className="lg:col-span-3">
                            <CompetitiveBenchmark data={filteredTopology} />
                        </div>
                    </div>
                </motion.section>

                {/* 3. Where We Can Go Next (Strategic Signals) */}
                <motion.section
                    variants={sectionVariants}
                    id="strategic-signals"
                    className="scroll-mt-24"
                >
                    <div className="flex justify-between items-center mb-10">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-3">Strategy // Stage 03</h2>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Where We Can Go Next</h3>
                        </motion.div>
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
                        {(telemetry.signals || []).map((signal: any) => (
                            <SignalCard key={signal.id} {...signal} />
                        ))}
                    </div>
                </motion.section>

                {/* 3.5 Portfolio Status Telemetry */}
                <motion.section
                    variants={sectionVariants}
                    id="portfolio-status"
                    className="scroll-mt-24"
                >
                    <div className="flex justify-between items-end mb-10">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-500 mb-3">Status // Telemetry</h2>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Portfolio Command Centre</h3>
                        </motion.div>
                    </div>
                    <PortfolioStatus />
                </motion.section>

                {/* 4. Counterparty Risk Intelligence */}
                <motion.section
                    variants={sectionVariants}
                    id="counterparty-risk"
                    className="scroll-mt-24"
                >
                    <div className="flex justify-between items-end mb-10">
                        <motion.div
                            initial={{ x: -20, opacity: 0 }}
                            whileInView={{ x: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-rose-500 mb-3">Exposure // Stage 04</h2>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Counterparty Risk Intelligence</h3>
                        </motion.div>
                    </div>

                    <PortfolioRisk entities={filteredTopology} />

                    <div className="mt-8">
                        <RiskTrend entities={filteredTopology} />
                    </div>
                </motion.section>

                {/* 5. Strategy (Where We Can Go Next) */}
                <motion.section
                    variants={sectionVariants}
                    id="strategy-generator"
                    className="scroll-mt-24"
                >
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
                                <span className="text-slate-600 italic ml-2">Estimated compute time: 3s.</span>
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
                </motion.section>
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
                isLoading={isFetchingNeo4j}
            />

            <CommandTerminal
                isOpen={isTerminalOpen}
                onClose={() => setIsTerminalOpen(false)}
            />
        </div>
    );
};

export default DashboardV2;
