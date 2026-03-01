'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../../components/marketing/Navbar';
import Footer from '../../../components/marketing/Footer';
import { Radio, Zap, Shield } from 'lucide-react';

const IngestSwarm = () => {
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
                        <Radio size={12} className="text-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Core Infrastructure</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-8 uppercase tracking-tighter">Ingest Swarm</h1>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
                        Continuous web-scale signal telemetry. Raw market noise ingested, cleaned, and structured into institutional-grade data in real-time.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: 'Infinite Scale', desc: 'Our agents crawl specialized sources, statutory filings, and private placement signals simultaneously.', icon: <Zap className="text-emerald-500" /> },
                        { title: 'Data Hardening', desc: 'Automatic validation and cleaning of raw telemetry to ensure board-ready precision.', icon: <Shield className="text-emerald-500" /> },
                        { title: 'Real-time Sync', desc: 'Changes in the market landscape are reflected in your dashboard in under 14 seconds.', icon: <Radio className="text-emerald-500" /> }
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

export default IngestSwarm;
