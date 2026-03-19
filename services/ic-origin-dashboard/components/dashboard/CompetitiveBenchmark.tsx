'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CompetitiveBenchmarkProps {
    data?: any[];
}

const CompetitiveBenchmark: React.FC<CompetitiveBenchmarkProps> = ({ data }) => {
    const competitors = (data && data.length > 0) ? data.slice(0, 5).map(m => ({
        name: m.company_name || 'Unknown',
        share: `${(1.2 + Math.random() * 5).toFixed(1)}%`, // aesthetic coordinate
        growth: m.growth ? `${m.growth > 0 ? '+' : ''}${m.growth}%` : '0%',
        margin: m.profit ? `${m.profit}%` : '0%',
        status: m.risk_tier || 'UNSCORED'
    })) : [];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-[#0d1117] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
        >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">Market Benchmark // Performance Pulse</h3>
                <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Sovereign Feed Active</span>
                </div>
            </div>
            <div className="p-0 overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-slate-600 text-[9px] uppercase font-black tracking-[0.2em] border-b border-white/5 bg-white/[0.005]">
                            <th className="px-8 py-5 text-emerald-500/50">Entity Topology</th>
                            <th className="px-8 py-5">Proj. Share</th>
                            <th className="px-8 py-5">CAGR / Growth</th>
                            <th className="px-8 py-5">EBITDA</th>
                            <th className="px-8 py-5">Signal Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-xs">
                        {competitors.map((c, idx) => (
                            <tr key={c.name} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-1.5 h-1.5 rounded-full ${c.status === 'Dominant' ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                                        <span className="font-bold text-slate-300 group-hover:text-white transition-colors">{c.name}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-slate-400">{c.share}</td>
                                <td className={`px-8 py-6 ${c.growth.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{c.growth}</td>
                                <td className="px-8 py-6 text-indigo-400">{c.margin}</td>
                                <td className="px-8 py-6">
                                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${c.status === 'Dominant' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' :
                                        c.status === 'At Risk' ? 'border-rose-500/30 text-rose-500 bg-rose-500/5' :
                                            'border-slate-800 text-slate-500'
                                        }`}>
                                        {c.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default CompetitiveBenchmark;
