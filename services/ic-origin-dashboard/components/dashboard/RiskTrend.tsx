'use client';

import React, { useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import type { Counterparty, ScoreHistory } from '../../lib/counterparty-data';

// ─── Props ───────────────────────────────────────────────────────────────────

interface RiskTrendProps {
    entities: Counterparty[];
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
    value: number;
    dataKey: string;
    payload: ScoreHistory & { entity?: string };
    color: string;
}

const CustomTooltip = ({
    active,
    payload,
    label,
}: {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
    label?: string;
}) => {
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0]?.payload;
    const score = payload[0]?.value ?? 0;

    return (
        <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-4 shadow-2xl backdrop-blur-xl min-w-[220px]">
            <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2">
                {label}
            </p>
            <div className="flex items-center gap-3 mb-2">
                <div
                    className={`w-2 h-2 rounded-full ${score >= 75
                        ? 'bg-rose-500'
                        : score >= 40
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                />
                <span className="text-xl font-black text-white">{score}</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    Risk Score
                </span>
            </div>
            {data?.event && (
                <div className="mt-2 pt-2 border-t border-white/5">
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">
                        Signal Event
                    </p>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                        {data.event}
                    </p>
                </div>
            )}
        </div>
    );
};

// ─── Component ───────────────────────────────────────────────────────────────

const RiskTrend: React.FC<RiskTrendProps> = ({ entities }) => {
    const [selectedEntity, setSelectedEntity] = useState<string>(
        entities[0]?.company_id || ''
    );

    const entity = entities.find(e => e.company_id === selectedEntity);
    const chartData = entity?.score_history || [];

    // Find the highest-risk entities for the selector
    const sortedEntities = [...entities].sort(
        (a, b) => b.conviction_score - a.conviction_score
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-[#0d1117] border border-white/5 rounded-[40px] p-10 relative overflow-hidden group shadow-2xl"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-1">
                        Risk Degradation // 90D Window
                    </h4>
                    <p className="text-lg font-bold text-white uppercase tracking-tighter">
                        Counterparty Score Trajectory
                    </p>
                </div>
                <select
                    value={selectedEntity}
                    onChange={e => setSelectedEntity(e.target.value)}
                    className="bg-[#161b22] border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black text-slate-300 uppercase tracking-widest outline-none focus:border-rose-500/50 transition-colors cursor-pointer"
                >
                    {sortedEntities.map(e => (
                        <option key={e.company_id} value={e.company_id}>
                            {e.company_name}
                            {e.risk_tier === 'ELEVATED_RISK' ? ' ⬤' : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Chart Container — CRITICAL: parent div must have fixed height */}
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                            </linearGradient>
                            <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#f43f5e" />
                                <stop offset="100%" stopColor="#f59e0b" />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(255,255,255,0.03)"
                            vertical={false}
                        />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                            tickLine={false}
                            axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }}
                            tickLine={false}
                            axisLine={false}
                            width={35}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        {/* Elevated risk threshold line */}
                        <ReferenceLine
                            y={75}
                            stroke="#f43f5e"
                            strokeDasharray="6 4"
                            strokeOpacity={0.4}
                            label={{
                                value: 'ELEVATED',
                                position: 'right',
                                fill: '#f43f5e',
                                fontSize: 8,
                                fontWeight: 900,
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="adjacency_score"
                            stroke="url(#strokeGradient)"
                            strokeWidth={2.5}
                            fill="url(#riskGradient)"
                            dot={false}
                            activeDot={{
                                r: 6,
                                fill: '#f43f5e',
                                stroke: '#0d1117',
                                strokeWidth: 3,
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Entity Quick Stats */}
            {entity && (
                <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">
                            Current Tier
                        </p>
                        <span
                            className={`text-sm font-black uppercase tracking-wider ${entity.risk_tier === 'ELEVATED_RISK'
                                ? 'text-rose-400'
                                : entity.risk_tier === 'IMPROVED'
                                    ? 'text-emerald-400'
                                    : 'text-amber-400'
                                }`}
                        >
                            {entity.risk_tier.replace('_', ' ')}
                        </span>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">
                            Conviction
                        </p>
                        <span className="text-sm font-black text-white">
                            {entity.conviction_score}/100
                        </span>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">
                            Active Charges
                        </p>
                        <span className="text-sm font-black text-white">
                            {entity.statutory_signals.total_active_charges}
                        </span>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">
                            Dir. Churn
                        </p>
                        <span className="text-sm font-black text-white">
                            {entity.statutory_signals.director_churn_index.toFixed(2)}
                        </span>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default RiskTrend;
