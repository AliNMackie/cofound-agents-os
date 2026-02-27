'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, ShieldAlert, Cpu, FileText } from 'lucide-react';

interface EntityDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    entity: any;
}

const EntityDetailModal: React.FC<EntityDetailModalProps> = ({ isOpen, onClose, entity }) => {
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
                        className="relative w-full max-w-4xl bg-[#0d1117] border border-white/10 rounded-[48px] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[80vh]"
                    >
                        {/* Left Column: Visuals & Core Metrics */}
                        <div className="w-full md:w-1/3 bg-gradient-to-br from-indigo-600/20 to-emerald-600/20 p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5">
                            <div>
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10 backdrop-blur-xl">
                                    <Cpu className="w-8 h-8 text-emerald-400" />
                                </div>
                                <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-4">{entity.payload?.name || entity.name}</h2>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-12">Strategic Deep-Dive</p>

                                <div className="space-y-8">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Growth Vector</p>
                                        <div className="flex items-center gap-3">
                                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                                            <span className="text-2xl font-black text-white">+{entity.payload?.growth || entity.growth}%</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Margin Topology</p>
                                        <div className="flex items-center gap-3">
                                            <ShieldAlert className="w-5 h-5 text-indigo-500" />
                                            <span className="text-2xl font-black text-white">{(entity.payload?.profit || entity.profit) > 0 ? '+' : ''}{entity.payload?.profit || entity.profit}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all flex items-center justify-center gap-3">
                                <FileText className="w-4 h-4" />
                                Export IC Dossier
                            </button>
                        </div>

                        {/* Right Column: Strategic Analysis */}
                        <div className="w-full md:w-2/3 p-12 overflow-y-auto custom-scrollbar">
                            <div className="flex justify-between items-start mb-12">
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

                            <div className="space-y-12">
                                <section>
                                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-6 underline decoration-emerald-500/30 underline-offset-8">Shadow Market Intelligence</h4>
                                    <p className="text-slate-400 text-sm leading-relaxed font-medium">
                                        Entity exhibits characteristic "Zombie" behavior via recent PSC changes and multiple debenture registrations at Companies House. Adjacency Score (88%) suggests imminent strategic pivot or liquidity event within 90 days.
                                    </p>
                                </section>

                                <section>
                                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-6 underline decoration-indigo-500/30 underline-offset-8">Recommended Orchestration</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {['Defensive Hedging', 'Supply Chain Absorption', 'Secondary Liquidity', 'Debt Advisory'].map(strategy => (
                                            <div key={strategy} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-[10px] font-bold text-slate-300 uppercase tracking-widest hover:border-indigo-500/30 transition-colors cursor-pointer">
                                                {strategy}
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 underline decoration-white/10 underline-offset-8">Recent Signal Feed</h4>
                                    <div className="space-y-4">
                                        {[
                                            { date: '2H AGO', msg: 'New Debenture Registered: Barclays Bank PLC' },
                                            { date: '1D AGO', msg: 'PSC Change: Iapetus Special Situations Fund I' },
                                            { date: '3D AGO', msg: 'Regional RSS: CEO mentioned in North West M&A podcast' }
                                        ].map(sig => (
                                            <div key={sig.msg} className="flex gap-4 items-center">
                                                <span className="text-[8px] font-mono text-emerald-500/50 whitespace-nowrap">{sig.date}</span>
                                                <div className="h-px flex-1 bg-white/5" />
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{sig.msg}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EntityDetailModal;
