'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../../components/marketing/Navbar';
import Footer from '../../../components/marketing/Footer';
import { FileText, Cpu, CheckCircle } from 'lucide-react';

const StrategyMemos = () => {
    return (
        <div className="min-h-screen bg-[#05070A] text-slate-300 font-sans selection:bg-emerald-500/30">
            <Navbar />

            <main className="max-w-7xl mx-auto px-6 pt-40 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-24"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 mb-8">
                        <FileText size={12} className="text-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Decision Intelligence</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-8 uppercase tracking-tighter">Strategy Memos</h1>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
                        Shift from research to board-ready decisions. High-fidelity intelligence synthesized with full evidentiary support in hours, not weeks.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: 'Emerald Memos', desc: 'Context-aware strategy papers synthesized by our Orchestrator agent. Designed for Investment Committee (IC) reviews.', icon: <FileText className="text-emerald-500" /> },
                        { title: 'Evidentiary Proof', desc: 'Every signal, insight, and prediction is backed by traceable raw telemetry and statutory filings.', icon: <CheckCircle className="text-emerald-500" /> },
                        { title: 'Decision Synthesis', desc: 'Our Swarm doesn\'t just find data; it weighs it against your mandate to surface truly actionable adjacencies.', icon: <Cpu className="text-emerald-500" /> }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-[#0d1117] border border-white/5 p-10 rounded-[32px] hover:border-emerald-500/30 transition-all group"
                        >
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">{feature.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default StrategyMemos;
