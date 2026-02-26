'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SignalCardProps {
    id: string;
    entity: string;
    type: string;
    confidence: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    urgency: 'high' | 'medium' | 'low';
    tags: string[];
}

const SignalCard: React.FC<SignalCardProps> = ({ entity, type, confidence, sentiment, urgency, tags }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileHover={{ scale: 1.02, y: -5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0d1117] border border-white/5 p-8 rounded-3xl hover:border-emerald-500/20 transition-all group relative overflow-hidden shadow-xl"
        >
            {urgency === 'high' && (
                <div className="absolute top-0 right-0 w-2 h-full bg-rose-500 opacity-20 group-hover:opacity-40 transition-opacity" />
            )}

            <div className="flex justify-between items-start mb-6">
                <div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors leading-none">{entity}</h4>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-3">{type}</p>
                </div>
                <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${sentiment === 'positive' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                        sentiment === 'negative' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/10' :
                            'bg-white/5 text-slate-400 border border-white/5'
                    }`}>
                    {sentiment}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
                {tags.map(tag => (
                    <span key={tag} className="text-[8px] font-mono font-bold text-slate-600 bg-slate-900 border border-white/5 px-2 py-0.5 rounded uppercase tracking-tighter">
                        #{tag}
                    </span>
                ))}
            </div>

            <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${confidence * 100}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500"
                        />
                    </div>
                    <span className="text-[10px] font-mono font-black text-slate-400 tracking-tighter">
                        Match: {(confidence * 100).toFixed(0)}%
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${urgency === 'high' ? 'bg-rose-500' : urgency === 'medium' ? 'bg-amber-500' : 'bg-slate-600'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${urgency === 'high' ? 'text-rose-500' : 'text-slate-500'
                        }`}>
                        {urgency}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default SignalCard;
