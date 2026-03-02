'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, ShieldAlert, Cpu, FileText, Network, Activity } from 'lucide-react';
import ContagionMap from './ContagionMap';

interface EntityDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    entity: any;
    isLoading?: boolean;
}

const EntityDetailModal: React.FC<EntityDetailModalProps> = ({ isOpen, onClose, entity, isLoading }) => {
    if (!entity) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#05070A]/90 backdrop-blur-2xl"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-6xl bg-[#0d1117] border border-white/10 rounded-[48px] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-full max-h-[90vh]"
                    >
                        {/* Left Column: Visuals & Core Metrics */}
                        <div className="w-full lg:w-1/3 bg-gradient-to-br from-indigo-600/20 to-emerald-600/20 p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5 shrink-0">
                            <div>
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10 backdrop-blur-xl">
                                    <Cpu className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4">{entity.payload?.name || entity.company_name || entity.name}</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-12">Strategic Deep-Dive</p>

                                <div className="space-y-8">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Growth Vector</p>
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                                            <span className="text-2xl font-black text-white">+{entity.payload?.growth || entity.growth || 0}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Margin Topology</p>
                                        <div className="flex items-center gap-3">
                                            <ShieldAlert className="w-5 h-5 text-indigo-500" />
                                            <span className="text-2xl font-black text-white">{(entity.payload?.profit || entity.profit || 0) > 0 ? '+' : ''}{entity.payload?.profit || entity.profit || 0}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all flex items-center justify-center gap-3 mt-8">
                                <FileText className="w-4 h-4" />
                                Export IC Dossier
                            </button>
                        </div>

                        {/* Right Column: Strategic Analysis & Contagion Map */}
                        <div className="w-full lg:w-2/3 p-12 overflow-y-auto custom-scrollbar flex flex-col">
                            <div className="flex justify-between items-start mb-8 shrink-0">
                                <div>
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Alpha Assessment</h3>
                                    <p className="text-xl font-bold text-white uppercase tracking-tight">Institutional Sentiment: HIGH</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-3 bg-white/5 hover:bg-rose-500/20 border border-white/10 rounded-2xl transition-all group"
                                >
                                    <X className="w-5 h-5 text-slate-500 group-hover:text-rose-500" />
                                </button>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 flex flex-col space-y-12">
                                {/* Contagion Map Area */}
                                <section className="flex-1 min-h-[400px]">
                                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 underline decoration-emerald-500/30 underline-offset-8">Shadow Market Intelligence // Neo4j Graph</h4>

                                    {isLoading ? (
                                        <div className="w-full h-[450px] bg-[#0d1117]/50 border border-white/5 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden">
                                            {/* Pulse overlay */}
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-transparent to-indigo-500/5"
                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                            />

                                            <div className="relative z-10 flex flex-col items-center">
                                                <div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 border-r-indigo-500 rounded-full animate-spin mb-6" />
                                                <p className="text-[12px] font-black tracking-[0.4em] uppercase text-emerald-400 mb-2">Querying Neo4j Graph Service</p>
                                                <p className="text-[10px] font-mono text-slate-500">Resolving multi-hop entity relations...</p>

                                                {/* Simulated progress logs */}
                                                <div className="mt-8 space-y-2 opacity-60">
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-[8px] font-mono text-slate-500">{'>'} SELECT * FROM Counterparty WHERE id = '{entity.company_id || "TARGET"}'</motion.div>
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-[8px] font-mono text-slate-500">{'>'} TRAVERSING edges: [SUPPLIER, PSC, DIRECTOR]</motion.div>
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="text-[8px] font-mono text-emerald-500/70">{'>'} MATCH (source)-[r:SUPPLIER]-{'>'}(n) - 6 nodes found.</motion.div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full shadow-2xl">
                                            <ContagionMap
                                                data={entity.contagionData}
                                                isOpen={true}
                                            // Disable close button inside the map since it's embedded
                                            />
                                        </div>
                                    )}
                                </section>

                                {/* Insights Section */}
                                {!isLoading && (
                                    <motion.section
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-6 underline decoration-indigo-500/30 underline-offset-8">Recommended Orchestration</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {['Defensive Hedging', 'Supply Chain Absorption', 'Secondary Liquidity', 'Debt Advisory'].map(strategy => (
                                                <div key={strategy} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:border-indigo-500/30 transition-colors cursor-pointer">
                                                    {strategy}
                                                </div>
                                            ))}
                                        </div>
                                    </motion.section>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EntityDetailModal;
