'use client';

import React, { useState, useEffect } from 'react';
import {
    Bot,
    Database,
    Network,
    BrainCircuit,
    LayoutDashboard,
    Activity,
    ArrowUp,
    ShieldAlert,
    TrendingUp,
    Lightbulb,
    Cpu,
    ChevronDown,
    ChevronUp,
    Terminal
} from 'lucide-react';

const layers = [
    {
        id: 'dashboard',
        title: 'Top Layer: Dashboard',
        function: 'Premium executive interface featuring glassmorphism, topology maps, and a live signal feed. Includes the "Trigger Adjacency Swarm" deployment system.',
        color: 'from-blue-900 to-blue-950',
        borderColor: 'border-blue-500/50',
        glow: 'shadow-[0_0_30px_rgba(59,130,246,0.2)]',
        icon: <LayoutDashboard className="w-8 h-8 text-blue-400" />,
        accent: 'blue'
    },
    {
        id: 'orchestrator',
        title: 'Upper Middle: Orchestrator',
        function: 'Central "brain" hub for adjacency discovery and generating board-ready strategy memos. Agentic elements enable self-orchestration of workflows.',
        color: 'from-purple-900 to-purple-950',
        borderColor: 'border-purple-500/50',
        glow: 'shadow-[0_0_30px_rgba(168,85,247,0.2)]',
        icon: <BrainCircuit className="w-8 h-8 text-purple-400" />,
        accent: 'purple'
    },
    {
        id: 'sentinel',
        title: 'Middle Layer: Sentinel',
        function: 'Processes signals with filtering, sentiment analysis, and LLM nodes. Categorizes into Defend (risk), Expand (growth), and Originate (innovation).',
        color: 'from-emerald-900 to-emerald-950',
        borderColor: 'border-emerald-500/50',
        glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]',
        icon: <Activity className="w-8 h-8 text-emerald-400" />,
        accent: 'emerald'
    },
    {
        id: 'scout',
        title: 'Bottom Layer: Scout Swarm',
        function: 'Distributed bots scraping real-time data from RSS feeds, Companies House filings, and news sites. Pulls raw web signals into a collection pool.',
        color: 'from-cyan-900 to-cyan-950',
        borderColor: 'border-cyan-500/50',
        glow: 'shadow-[0_0_30px_rgba(6,182,212,0.2)]',
        icon: <Bot className="w-8 h-8 text-cyan-400" />,
        accent: 'cyan'
    }
];

// Reusable animated data stream component with connection line
const DataStream: React.FC<{ startColor: string; endColor: string }> = ({ startColor, endColor }) => (
    <div className="flex flex-col items-center justify-center py-2 relative h-16 sm:h-20">
        {/* Continuous vertical connection line */}
        <div className={`absolute h-full w-[2px] bg-gradient-to-t ${startColor} ${endColor} opacity-20`} />

        <div className="absolute inset-0 flex justify-center items-center overflow-hidden">
            <div className={`w-1 h-full bg-gradient-to-t ${startColor} ${endColor} opacity-40 rounded-full`} />
            <div className="absolute bottom-0 w-2 h-8 bg-white rounded-full animate-flow-up shadow-[0_0_10px_white]" />
            <div className="absolute bottom-[-20px] w-2 h-6 bg-white rounded-full animate-flow-up-delayed shadow-[0_0_10px_white]" />
        </div>
        <ArrowUp className="w-6 h-6 text-white opacity-50 z-10 animate-pulse hardware-accelerated" />
    </div>
);

// Toast Notification Component
const Toast: React.FC<{ message: string; visible: boolean }> = ({ message, visible }) => (
    <div
        className={`fixed bottom-6 right-6 bg-cyan-950/90 border border-cyan-500/50 text-cyan-50 px-5 py-3 rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] z-50 flex items-center gap-3 backdrop-blur-md transition-all duration-500 ease-out transform ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95 pointer-events-none'
            }`}
    >
        <Terminal className="w-5 h-5 text-cyan-400 animate-pulse hardware-accelerated" />
        <span className="text-sm font-medium tracking-wide">{message}</span>
    </div>
);

export default function ArchitectureStack() {
    const [expandedLayer, setExpandedLayer] = useState<string | null>('dashboard');
    const [swarmActive, setSwarmActive] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVisible, setToastVisible] = useState(false);

    // Add custom keyframes and performance utilities
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'architecture-stack-styles';
        style.innerHTML = `
      @keyframes flow-up {
        0% { transform: translateY(100px) translateZ(0); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateY(-100px) translateZ(0); opacity: 0; }
      }
      .animate-flow-up {
        animation: flow-up 2s infinite linear;
        will-change: transform, opacity;
      }
      .animate-flow-up-delayed {
        animation: flow-up 2s infinite linear 1s;
        will-change: transform, opacity;
      }
      .glass-panel-stack {
        background: rgba(255, 255, 255, 0.03);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      .hardware-accelerated {
        transform: translateZ(0);
        will-change: transform;
      }
    `;
        document.head.appendChild(style);
        return () => {
            const el = document.getElementById('architecture-stack-styles');
            if (el) el.remove();
        };
    }, []);

    const triggerSwarm = () => {
        setSwarmActive(true);
        setToastMessage("Adjacency Swarm Deployed – Scanning...");
        setToastVisible(true);

        setTimeout(() => {
            setSwarmActive(false);
            setToastVisible(false);
        }, 3000);
    };

    const handleKeyDown = (e: React.KeyboardEvent, layerId: string) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpandedLayer(expandedLayer === layerId ? null : layerId);
        }
    };

    return (
        <div className="text-slate-200 font-sans relative w-full h-full overflow-y-auto custom-scrollbar p-1">
            {/* Background grids and ambient glow removed as they should be handled by parent or simplified here */}

            <div className="max-w-4xl mx-auto relative z-10 w-full">

                {/* Interactive Architecture Stack */}
                <div className="flex flex-col gap-1 sm:gap-2 relative">

                    {layers.map((layer, index) => (
                        <React.Fragment key={layer.id}>

                            {/* Layer Card (Accessible & Navigable) */}
                            <div
                                role="button"
                                tabIndex={0}
                                aria-expanded={expandedLayer === layer.id}
                                onKeyDown={(e) => handleKeyDown(e, layer.id)}
                                onClick={() => setExpandedLayer(expandedLayer === layer.id ? null : layer.id)}
                                className={`glass-panel-stack rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-500 ease-out border-t border-l focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950
                  ${layer.borderColor} ${expandedLayer === layer.id ? layer.glow : 'hover:bg-white/5'}
                  ${swarmActive && layer.id === 'scout' ? 'shadow-[0_0_50px_rgba(6,182,212,0.6)] animate-pulse' : ''}
                `}
                                style={expandedLayer === layer.id ? {
                                    boxShadow: layer.glow.split('shadow-')[1]?.replace('[', '').replace(']', '')
                                } : undefined}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 sm:gap-4 flex-1">
                                        <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${layer.color} border border-white/10 shadow-lg shrink-0`}>
                                            {layer.icon}
                                        </div>
                                        <div>
                                            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">{layer.title}</h2>
                                        </div>
                                    </div>
                                    <div className="shrink-0 p-1">
                                        {expandedLayer === layer.id ? <ChevronUp className="text-slate-400 w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="text-slate-400 w-4 h-4 sm:w-5 sm:h-5" />}
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                <div
                                    className={`grid transition-all duration-300 ease-in-out ${expandedLayer === layer.id ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'
                                        }`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="text-slate-300 text-xs sm:text-sm leading-relaxed border-l-2 pl-4 ml-4 sm:ml-6 border-indigo-500/30">
                                            <p>{layer.function}</p>

                                            {/* Interactive UI specific to layers */}
                                            {layer.id === 'dashboard' && (
                                                <div className="mt-4 flex flex-wrap gap-4">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); triggerSwarm(); }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.stopPropagation();
                                                                e.preventDefault();
                                                                triggerSwarm();
                                                            }
                                                        }}
                                                        className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/50 rounded-lg text-blue-300 text-[10px] font-semibold transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                    >
                                                        <Network className="w-3 h-3" /> Trigger Adjacency Swarm
                                                    </button>
                                                </div>
                                            )}

                                            {layer.id === 'sentinel' && (
                                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    <div className="p-2 bg-red-950/30 border border-red-500/20 rounded-lg flex items-center gap-2">
                                                        <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                                                        <span className="text-[10px] font-medium text-red-200">Defend</span>
                                                    </div>
                                                    <div className="p-2 bg-emerald-950/30 border border-emerald-500/20 rounded-lg flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                                                        <span className="text-[10px] font-medium text-emerald-200">Expand</span>
                                                    </div>
                                                    <div className="p-2 bg-amber-950/30 border border-amber-500/20 rounded-lg flex items-center gap-2">
                                                        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                                                        <span className="text-[10px] font-medium text-amber-200">Originate</span>
                                                    </div>
                                                </div>
                                            )}

                                            {layer.id === 'orchestrator' && (
                                                <div className="mt-4 flex items-center justify-center p-4 glass-panel-stack rounded-xl border-purple-500/30 gap-6">
                                                    <div className="relative shrink-0">
                                                        <div className="absolute inset-0 bg-purple-600 rounded-full blur-xl animate-pulse opacity-50 hardware-accelerated" />
                                                        <BrainCircuit className="w-8 h-8 text-purple-300 relative z-10 animate-bounce hardware-accelerated" style={{ animationDuration: '3s' }} />
                                                    </div>
                                                    <div className="space-y-2 flex-1 max-w-[200px]">
                                                        <div className="h-1.5 w-full bg-purple-900/50 rounded overflow-hidden">
                                                            <div className="h-full bg-purple-500 w-full animate-[pulse_1.5s_ease-in-out_infinite] hardware-accelerated" />
                                                        </div>
                                                        <div className="h-1.5 w-3/4 bg-purple-900/50 rounded overflow-hidden">
                                                            <div className="h-full bg-purple-400 w-full animate-[pulse_2s_ease-in-out_infinite] hardware-accelerated" />
                                                        </div>
                                                        <div className="text-[8px] text-purple-300/80 font-mono mt-1">Synthesizing Memos...</div>
                                                    </div>
                                                </div>
                                            )}

                                            {layer.id === 'scout' && (
                                                <div className="mt-4 flex justify-around p-3 glass-panel-stack rounded-xl border-cyan-500/30">
                                                    {[1, 2, 3, 4, 5].map((bot) => (
                                                        <Bot
                                                            key={bot}
                                                            className={`w-5 h-5 text-cyan-500 hardware-accelerated transition-all duration-300 ${swarmActive ? 'animate-bounce text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.8)] rounded-full' : 'opacity-60'}`}
                                                            style={{ animationDelay: `${bot * 100}ms` }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Data Flow Connections */}
                            {index < layers.length - 1 && (
                                <DataStream
                                    startColor={
                                        index === 0 ? 'from-purple-500' :
                                            index === 1 ? 'from-emerald-500' : 'from-cyan-500'
                                    }
                                    endColor={
                                        index === 0 ? 'to-blue-500' :
                                            index === 1 ? 'to-purple-500' : 'to-emerald-500'
                                    }
                                />
                            )}
                        </React.Fragment>
                    ))}

                </div>
            </div>

            {/* Global Toast Notification */}
            <Toast message={toastMessage} visible={toastVisible} />
        </div>
    );
}
