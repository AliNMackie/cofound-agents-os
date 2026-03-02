'use client';

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, AlertTriangle, X, Maximize2 } from 'lucide-react';

// ── Dynamic import to avoid SSR `window is not defined` ────────
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
    ),
});

// ── Types ───────────────────────────────────────────────────────

interface GraphNode {
    id: string;
    label: string;
    type: 'Company' | 'Person';
    risk_tier?: string;
    is_target?: boolean;
}

interface GraphLink {
    source: string;
    target: string;
    type: string;
}

interface ContagionData {
    target: {
        ch_number: string;
        name: string;
        risk_tier: string;
    } | null;
    nodes: GraphNode[];
    links: GraphLink[];
}

interface ContagionMapProps {
    data: ContagionData | null;
    onClose?: () => void;
    isOpen?: boolean;
}

// ── Color Mapping ──────────────────────────────────────────────

const RISK_COLORS: Record<string, string> = {
    ELEVATED_RISK: '#f43f5e',   // Rose-500
    STABLE: '#22c55e',          // Green-500
    IMPROVED: '#3b82f6',        // Blue-500
    UNSCORED: '#64748b',        // Slate-500
};

const NODE_COLORS = {
    target: '#10b981',          // Emerald-500 (center node)
    company: '#8b5cf6',         // Violet-500
    person: '#06b6d4',          // Cyan-500
    elevated: '#f43f5e',        // Rose-500
};

// ── Component ──────────────────────────────────────────────────

const ContagionMap: React.FC<ContagionMapProps> = ({
    data,
    onClose,
    isOpen = true,
}) => {
    const graphRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 600, height: 450 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Resize observer
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDimensions({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Center graph on mount
    useEffect(() => {
        if (graphRef.current && data?.nodes?.length) {
            setTimeout(() => {
                graphRef.current?.zoomToFit(400, 60);
            }, 500);
        }
    }, [data]);

    // Node color based on type and risk tier
    const getNodeColor = useCallback((node: GraphNode) => {
        if (node.is_target) return NODE_COLORS.target;
        if (node.type === 'Person') return NODE_COLORS.person;
        if (node.risk_tier === 'ELEVATED_RISK') return NODE_COLORS.elevated;
        return NODE_COLORS.company;
    }, []);

    // Node size based on type
    const getNodeSize = useCallback((node: GraphNode) => {
        if (node.is_target) return 12;
        if (node.type === 'Company') return 8;
        return 5;
    }, []);

    // Custom node canvas rendering
    const paintNode = useCallback(
        (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
            const size = getNodeSize(node);
            const color = getNodeColor(node);
            const fontSize = 10 / globalScale;

            // Draw node
            ctx.beginPath();
            if (node.type === 'Person') {
                // Diamond for persons
                ctx.moveTo(node.x, node.y - size);
                ctx.lineTo(node.x + size, node.y);
                ctx.lineTo(node.x, node.y + size);
                ctx.lineTo(node.x - size, node.y);
            } else {
                // Circle for companies
                ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
            }
            ctx.fillStyle = color;
            ctx.fill();

            // Glow for elevated risk
            if (node.risk_tier === 'ELEVATED_RISK' || node.is_target) {
                ctx.shadowColor = color;
                ctx.shadowBlur = 15;
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            // Border
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1 / globalScale;
            ctx.stroke();

            // Label
            if (globalScale > 0.5) {
                ctx.font = `${node.is_target ? 'bold ' : ''}${fontSize}px Inter, sans-serif`;
                ctx.fillStyle = 'rgba(255,255,255,0.85)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(
                    node.label?.substring(0, 20) || '',
                    node.x,
                    node.y + size + 3
                );
            }
        },
        [getNodeColor, getNodeSize]
    );

    // Link styling
    const getLinkColor = useCallback((link: any) => {
        if (link.type === 'PSC') return 'rgba(244, 63, 94, 0.4)';     // Rose
        if (link.type === 'DIRECTOR') return 'rgba(6, 182, 212, 0.4)'; // Cyan
        return 'rgba(100, 116, 139, 0.3)';                              // Slate
    }, []);

    // Transform data for force graph
    const graphData = useMemo(() => {
        if (!data) return { nodes: [], links: [] };
        return {
            nodes: data.nodes.map((n) => ({ ...n })),
            links: data.links.map((l) => ({ ...l })),
        };
    }, [data]);

    const elevatedCount = useMemo(
        () =>
            data?.nodes.filter(
                (n) => n.type === 'Company' && n.risk_tier === 'ELEVATED_RISK' && !n.is_target
            ).length || 0,
        [data]
    );

    if (!isOpen || !data) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0d1117] border border-white/10 rounded-3xl overflow-hidden relative"
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                            <Network className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-white uppercase tracking-widest">
                                Contagion Network
                            </h3>
                            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                                {data.target?.name || 'Unknown'} — {data.nodes.length} nodes, {data.links.length} edges
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {elevatedCount > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                <span className="text-[9px] font-black text-rose-400 uppercase">
                                    {elevatedCount} Elevated
                                </span>
                            </div>
                        )}
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4 text-slate-500" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Legend */}
                <div className="px-6 py-2 border-b border-white/5 flex items-center gap-4">
                    {[
                        { color: NODE_COLORS.target, label: 'Target Entity', shape: '●' },
                        { color: NODE_COLORS.company, label: 'Linked Company', shape: '●' },
                        { color: NODE_COLORS.person, label: 'Person / PSC', shape: '◆' },
                        { color: NODE_COLORS.elevated, label: 'Elevated Risk', shape: '●' },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-1.5">
                            <span style={{ color: item.color }} className="text-xs">{item.shape}</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Graph Canvas */}
                <div ref={containerRef} className="w-full h-[450px] relative">
                    {graphData.nodes.length > 0 ? (
                        <ForceGraph2D
                            graphData={graphData}
                            width={dimensions.width}
                            height={dimensions.height}
                            backgroundColor="#0d1117"
                            nodeCanvasObject={paintNode}
                            linkColor={getLinkColor}
                            linkWidth={1.5}
                            linkDirectionalArrowLength={4}
                            linkDirectionalArrowRelPos={0.85}
                            d3AlphaDecay={0.04}
                            d3VelocityDecay={0.3}
                            warmupTicks={50}
                            cooldownTicks={100}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                            No contagion network data available
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ContagionMap;
