'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal as TerminalIcon, ChevronRight, Play } from 'lucide-react';

interface TerminalPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TerminalPreviewModal: React.FC<TerminalPreviewModalProps> = ({ isOpen, onClose }) => {
    const [lines, setLines] = useState<{ type: 'input' | 'output' | 'system', content: string }[]>([]);
    const [isTyping, setIsTyping] = useState(false);

    const commands = [
        {
            cmd: "/scan-cluster --region='North West' --depth=high",
            output: [
                "Establishing secure tunnel to IC Origin Core...",
                "Scanning 1,422 entities in North West Cluster...",
                "Analyzing talent churn vs. leverage creep...",
                "MATCH FOUND: 3 'Borderline' entities showing Debt Whiplash signals.",
                "Primary Target: [CONFIDENTIAL_ALPHA] - Alpha Score: 0.92"
            ]
        },
        {
            cmd: "/synthesize-alpha --target='alpha-001'",
            output: [
                "Accessing Golden_v2.1 data model...",
                "Applying recursive signal synthesis...",
                "Signal: Talent Freeze (Severity: 0.88)",
                "Signal: Leverage Creep (Severity: 0.74)",
                "Synthesis Complete: Primary Thesis generated for 'Emerald Memo'."
            ]
        },
        {
            cmd: "/check-swarm-health",
            output: [
                "Agent 01 (Scout): Active",
                "Agent 02 (Sentinel): Active",
                "Agent 03 (Orchestrator): Active",
                "Swarm Synchronized. All systems operational."
            ]
        }
    ];

    const runCommand = async (command: typeof commands[0]) => {
        if (isTyping) return;
        setIsTyping(true);

        // Add command line
        setLines(prev => [...prev, { type: 'input', content: command.cmd }]);

        // Simulate typing/processing delay
        await new Promise(r => setTimeout(r, 800));

        // Add output lines one by one
        for (const out of command.output) {
            await new Promise(r => setTimeout(r, 400));
            setLines(prev => [...prev, { type: out.startsWith('MATCH') || out.startsWith('Signal') ? 'system' : 'output', content: out }]);
        }

        setIsTyping(false);
    };

    useEffect(() => {
        if (isOpen && lines.length === 0) {
            setLines([{ type: 'output', content: 'IC ORIGIN CORE // SESSION ACTIVATED v2.5.0' }]);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#05070A]/90 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 40 }}
                        className="relative w-full max-w-4xl bg-[#010409] border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col h-[600px]"
                    >
                        {/* Terminal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-rose-500/20" />
                                    <div className="w-3 h-3 rounded-full bg-amber-500/20" />
                                    <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <TerminalIcon size={14} className="text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Interactive Preview // Unlocked</span>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Terminal Body */}
                        <div className="flex-1 overflow-y-auto p-8 font-mono text-sm space-y-3 custom-scrollbar">
                            {lines.map((line, i) => (
                                <div key={i} className={`flex gap-3 ${line.type === 'input' ? 'text-white' : line.type === 'system' ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    {line.type === 'input' && <ChevronRight size={16} className="text-emerald-500 mt-0.5 shrink-0" />}
                                    <p className="leading-relaxed whitespace-pre-wrap">{line.content}</p>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex gap-3">
                                    <div className="w-2 h-4 bg-emerald-500 animate-pulse" />
                                </div>
                            )}
                            <div id="terminal-end" />
                        </div>

                        {/* Suggested Actions */}
                        <div className="p-6 border-t border-white/5 bg-white/[0.01]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-4 ml-2">Suggested Scenarios</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {commands.map((c, i) => (
                                    <button
                                        key={i}
                                        disabled={isTyping}
                                        onClick={() => runCommand(c)}
                                        className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all text-left group"
                                    >
                                        <span className="truncate mr-2 font-mono">{c.cmd.split(' ')[0]}</span>
                                        <Play size={12} className="text-emerald-500 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TerminalPreviewModal;
