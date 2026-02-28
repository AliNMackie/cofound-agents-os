'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, TrendingDown, CheckCircle2, AlertTriangle } from 'lucide-react';
import type {
    Counterparty,
    PortfolioSummary,
} from '../../lib/counterparty-data';
import { computePortfolioSummary } from '../../lib/counterparty-data';

// ─── Props ───────────────────────────────────────────────────────────────────

interface PortfolioRiskProps {
    entities: Counterparty[];
}

// ─── Risk Tier Badge ─────────────────────────────────────────────────────────

const RiskBadge = ({ tier }: { tier: string }) => {
    const config = {
        ELEVATED_RISK: {
            label: 'Elevated',
            classes:
                'border-rose-500/30 text-rose-400 bg-rose-500/10',
            dot: 'bg-rose-500',
        },
        STABLE: {
            label: 'Stable',
            classes:
                'border-amber-500/30 text-amber-400 bg-amber-500/10',
            dot: 'bg-amber-500',
        },
        IMPROVED: {
            label: 'Improved',
            classes:
                'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
            dot: 'bg-emerald-500',
        },
        UNSCORED: {
            label: 'Unscored',
            classes:
                'border-slate-700 text-slate-500 bg-slate-800',
            dot: 'bg-slate-600',
        },
    }[tier] || {
        label: tier,
        classes: 'border-slate-700 text-slate-500 bg-slate-800',
        dot: 'bg-slate-600',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${config.classes}`}
        >
            <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {config.label}
        </span>
    );
};

// ─── Type Badge ──────────────────────────────────────────────────────────────

const TypeBadge = ({ type }: { type: string }) => {
    const colorMap: Record<string, string> = {
        BORROWER: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
        SUPPLIER: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
        INSURED: 'text-violet-400 border-violet-500/20 bg-violet-500/5',
    };

    return (
        <span
            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${colorMap[type] || 'text-slate-500 border-slate-700'
                }`}
        >
            {type}
        </span>
    );
};

// ─── Metric Card ─────────────────────────────────────────────────────────────

const MetricCard = ({
    label,
    value,
    subValue,
    icon,
    color,
}: {
    label: string;
    value: string | number;
    subValue?: string;
    icon: React.ReactNode;
    color: string;
}) => (
    <div className="bg-[#161b22] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
        <div className={`absolute top-0 right-0 w-24 h-24 ${color} blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity`} />
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
                    {label}
                </p>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">{value}</p>
            {subValue && (
                <p className="text-[10px] font-mono text-slate-500 mt-1">{subValue}</p>
            )}
        </div>
    </div>
);

// ─── Component ───────────────────────────────────────────────────────────────

const PortfolioRisk: React.FC<PortfolioRiskProps> = ({ entities }) => {
    const summary: PortfolioSummary = useMemo(
        () => computePortfolioSummary(entities),
        [entities]
    );

    const sortedEntities = useMemo(
        () =>
            [...entities].sort((a, b) => {
                const tierOrder = { ELEVATED_RISK: 0, STABLE: 1, IMPROVED: 2, UNSCORED: 3 };
                const aTier = tierOrder[a.risk_tier as keyof typeof tierOrder] ?? 3;
                const bTier = tierOrder[b.risk_tier as keyof typeof tierOrder] ?? 3;
                if (aTier !== bTier) return aTier - bTier;
                return b.conviction_score - a.conviction_score;
            }),
        [entities]
    );

    return (
        <div className="space-y-8">
            {/* ── Summary Metric Row ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Counterparties"
                    value={summary.total_entities}
                    subValue="Portfolio total"
                    icon={<ShieldAlert className="w-4 h-4 text-slate-500" />}
                    color="bg-slate-500"
                />
                <MetricCard
                    label="Elevated Risk"
                    value={summary.elevated_count}
                    subValue={`${summary.elevated_pct}% of portfolio`}
                    icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
                    color="bg-rose-500"
                />
                <MetricCard
                    label="Stable"
                    value={summary.stable_count}
                    subValue="No active triggers"
                    icon={<CheckCircle2 className="w-4 h-4 text-amber-500" />}
                    color="bg-amber-500"
                />
                <MetricCard
                    label="Improved"
                    value={summary.improved_count}
                    subValue="Debt clearing trend"
                    icon={<TrendingDown className="w-4 h-4 text-emerald-500" />}
                    color="bg-emerald-500"
                />
            </div>

            {/* ── Dense Data Table ────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="bg-[#0d1117] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
            >
                {/* Table Header Bar */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">
                        Portfolio Risk Grid // Live Monitoring
                    </h3>
                    <div className="flex gap-2 items-center">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                            {summary.elevated_count} Alert{summary.elevated_count !== 1 ? 's' : ''} Active
                        </span>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-600 text-[9px] uppercase font-black tracking-[0.2em] border-b border-white/5 bg-white/[0.005]">
                                <th className="px-8 py-5 text-rose-500/50">Entity</th>
                                <th className="px-6 py-5">CH Number</th>
                                <th className="px-6 py-5">Type</th>
                                <th className="px-6 py-5">Region</th>
                                <th className="px-6 py-5">Risk Tier</th>
                                <th className="px-6 py-5">Conviction</th>
                                <th className="px-6 py-5">Charges</th>
                                <th className="px-6 py-5">Last Signal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-xs">
                            {sortedEntities.map((entity, idx) => (
                                <motion.tr
                                    key={entity.company_id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className={`hover:bg-white/[0.02] transition-colors group ${entity.risk_tier === 'ELEVATED_RISK'
                                            ? 'bg-rose-500/[0.03] border-l-2 border-l-rose-500/40'
                                            : ''
                                        }`}
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${entity.risk_tier === 'ELEVATED_RISK'
                                                        ? 'bg-rose-500 animate-pulse'
                                                        : entity.risk_tier === 'IMPROVED'
                                                            ? 'bg-emerald-500'
                                                            : 'bg-amber-500'
                                                    }`}
                                            />
                                            <span className="font-bold text-slate-300 group-hover:text-white transition-colors whitespace-nowrap">
                                                {entity.company_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-slate-500 font-mono text-[10px]">
                                        {entity.company_number}
                                    </td>
                                    <td className="px-6 py-5">
                                        <TypeBadge type={entity.counterparty_type} />
                                    </td>
                                    <td className="px-6 py-5 text-slate-400 text-[10px] uppercase tracking-wider">
                                        {entity.region}
                                    </td>
                                    <td className="px-6 py-5">
                                        <RiskBadge tier={entity.risk_tier} />
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${entity.conviction_score >= 75
                                                            ? 'bg-rose-500'
                                                            : entity.conviction_score >= 40
                                                                ? 'bg-amber-500'
                                                                : 'bg-emerald-500'
                                                        }`}
                                                    style={{
                                                        width: `${entity.conviction_score}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-slate-400 text-[10px] font-bold">
                                                {entity.conviction_score}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-slate-500 font-mono text-[10px]">
                                        {entity.statutory_signals.total_active_charges}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="max-w-[200px]">
                                            <p className="text-[9px] font-mono text-slate-600 mb-0.5">
                                                {entity.last_signal_date}
                                            </p>
                                            <p className="text-[10px] text-slate-400 truncate">
                                                {entity.last_signal_description}
                                            </p>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default PortfolioRisk;
