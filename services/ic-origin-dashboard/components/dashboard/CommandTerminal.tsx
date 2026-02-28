'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Command, Search, Cpu, Zap, X, ArrowRight } from 'lucide-react';
import { executeCommandAction } from '../../app/actions';

interface CommandTerminalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CommandTerminal: React.FC<CommandTerminalProps> = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [prediction, setPrediction] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const currentQuery = query.trim();
        if (!currentQuery) return;

        setQuery('');
        setHistory(prev => [...prev, currentQuery]);
        setIsAnalyzing(true);
        setPrediction("Synthesizing Institutional Intent...");
        setResults([]);

        try {
            const response = await executeCommandAction(currentQuery);
            if (response.success) {
                setPrediction(`Intent: ${response.intent}`);
                setResults(response.matches || []);
            } else {
                setPrediction("Orchestration failed: " + response.error);
            }
        } catch (err) {
            setPrediction("Engine Timeout: Shadow-market volatility too high.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-start justify-center pt-24 px-6 pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#05070A]/80 backdrop-blur-md pointer-events-auto"
                    />

                    {/* Terminal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="relative w-full max-w-2xl bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <Terminal className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Strategic Command Line</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 bg-white/5 rounded text-[8px] font-bold text-slate-500">PROACTIVE MODE</span>
                                <button onClick={onClose} className="p-1 hover:bg-white/5 rounded transition-colors">
                                    <X className="w-3 h-3 text-slate-500" />
                                </button>
                            </div>
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="relative flex items-center">
                                <Search className="absolute left-0 w-5 h-5 text-slate-500" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Execute natural language query (e.g. 'Show Series B in North West')..."
                                    className="w-full bg-transparent pl-10 pr-4 py-2 text-sm text-white focus:outline-none placeholder-slate-600 font-medium"
                                />
                                <div className="flex items-center gap-2">
                                    <kbd className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-slate-500 font-bold">↵</kbd>
                                </div>
                            </div>
                        </form>

                        {/* Status / History Area */}
                        <div className="px-6 pb-6 space-y-4">
                            {prediction && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 text-emerald-400/80"
                                >
                                    <Zap className="w-3 h-3 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-tight">{prediction}</span>
                                </motion.div>
                            )}

                            {results.length > 0 && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Matched Institutional Targets</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {results.map((res: any, i: number) => {
                                            const isShadow = res.tags?.some((t: string) => t.toLowerCase().includes('shadow') || t.toLowerCase().includes('debt'));
                                            return (
                                                <div key={i} className={`group flex items-center justify-between p-3 bg-white/[0.02] border ${isShadow ? 'border-amber-500/20 bg-amber-500/[0.02]' : 'border-white/5'} hover:border-emerald-500/30 rounded-xl transition-all cursor-pointer`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-6 h-6 ${isShadow ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'} rounded flex items-center justify-center border`}>
                                                            <Cpu className={`w-3 h-3 ${isShadow ? 'text-amber-400' : 'text-emerald-400'}`} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-[10px] font-bold text-white uppercase tracking-tight">{res.name}</p>
                                                                {isShadow && <span className="text-[7px] font-black px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded uppercase">Shadow Market</span>}
                                                            </div>
                                                            <p className="text-[8px] font-medium text-slate-500 uppercase tracking-widest">Score: {res.score}</p>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className="w-3 h-3 text-slate-700 group-hover:text-emerald-400 transition-colors" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {history.length > 0 && results.length === 0 && !isAnalyzing && (
                                <div className="p-12 text-center space-y-4 bg-white/[0.01] border border-white/5 rounded-2xl animate-in fade-in zoom-in-95 duration-500">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-5 h-5 text-slate-700" />
                                    </div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-widest">No Matches Identified</h4>
                                    <p className="text-[10px] text-slate-500 max-w-[240px] mx-auto leading-relaxed uppercase font-bold tracking-tighter">
                                        The engine found no high-conviction institutional matches for this query. Refine your strategic parameters.
                                    </p>
                                    <div className="pt-4 flex flex-wrap justify-center gap-2">
                                        {['High Growth', 'Shadow Market', 'Series B'].map(tag => (
                                            <button
                                                key={tag}
                                                onClick={() => setQuery(tag)}
                                                className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[8px] font-black text-slate-400 uppercase tracking-widest transition-colors"
                                            >
                                                Try "{tag}"
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-center gap-4 text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                                    <div className="flex items-center gap-1">
                                        <Cpu className="w-3 h-3" />
                                        Gemini 3.1 Pro Integrated
                                    </div>
                                    <div className="w-1 h-1 bg-white/10 rounded-full" />
                                    <span>Latency: 42ms</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommandTerminal;
