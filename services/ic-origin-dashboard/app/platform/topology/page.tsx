'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../../components/marketing/Navbar';
import Footer from '../../../components/marketing/Footer';
import { Share2, Map, Layers } from 'lucide-react';

const TopologyMapping = () => {
    return (
        <div className="min-h-screen bg-[#05070A] text-slate-300 font-sans selection:bg-emerald-500/30">
            <Navbar onOpenContact={() => { }} />

            <main className="max-w-7xl mx-auto px-6 pt-40 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-24"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 mb-8">
                        <Share2 size={12} className="text-indigo-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Strategic Intelligence</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-8 uppercase tracking-tighter">Topology Mapping</h1>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed font-medium">
                        Reveal the non-obvious architecture of your market. Our agents map the competitive landscape to surface hidden overlaps and adjacency opportunities.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: 'Adjacency Discovery', desc: 'Identify stealth entrants and potential partners before they become obvious competitors.', icon: <Map className="text-indigo-500" /> },
                        { title: 'Multi-layer Analysis', desc: 'Sift through statutory, credit, and talent signals to build a 360-degree view of any entity.', icon: <Layers className="text-indigo-500" /> },
                        { title: 'Dynamic Clusters', desc: 'Visualise market movement in real-time as entities pivot, raise capital, or shift talent strategy.', icon: <Share2 className="text-indigo-500" /> }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-[#0d1117] border border-white/5 p-10 rounded-[32px] hover:border-indigo-500/30 transition-all group"
                        >
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
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

export default TopologyMapping;
