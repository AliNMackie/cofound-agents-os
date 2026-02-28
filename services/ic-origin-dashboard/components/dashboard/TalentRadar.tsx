'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import { Users, TrendingUp, TrendingDown, AlertTriangle, UserMinus, Briefcase } from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────

interface KeyDeparture {
    name?: string;
    role: string;
    type: 'HIRE' | 'DEPARTURE';
    date: string;
    seniority?: string;
    department?: string;
}

interface HumanCapitalData {
    headcount_delta: number;
    key_hire_departures: KeyDeparture[];
    hiring_velocity_pct: number;
    talent_concentration: Record<string, number>;
    active_job_postings: number;
    talent_signal: string | null;
}

interface TalentRadarProps {
    data: HumanCapitalData | null;
    companyName?: string;
}

// ── Constants ──────────────────────────────────────────────────

const SIGNAL_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    RAPID_GROWTH: {
        label: 'Rapid Growth',
        color: '#22c55e',
        icon: <TrendingUp className="w-4 h-4" />,
    },
    KEY_PERSON_RISK: {
        label: 'Key Person Risk',
        color: '#f43f5e',
        icon: <UserMinus className="w-4 h-4" />,
    },
    CONTRACTION_SIGNAL: {
        label: 'Contraction Signal',
        color: '#f59e0b',
        icon: <TrendingDown className="w-4 h-4" />,
    },
    CRITICAL_DISTRESS: {
        label: 'Critical Distress',
        color: '#dc2626',
        icon: <AlertTriangle className="w-4 h-4" />,
    },
    STABLE_TALENT: {
        label: 'Stable',
        color: '#64748b',
        icon: <Briefcase className="w-4 h-4" />,
    },
};

const DEPT_COLORS: Record<string, string> = {
    tech: '#8b5cf6',
    finance: '#3b82f6',
    legal: '#f59e0b',
    ops: '#22c55e',
    sales: '#f43f5e',
    hr: '#06b6d4',
    other: '#64748b',
};

// ── Component ──────────────────────────────────────────────────

const TalentRadar: React.FC<TalentRadarProps> = ({ data, companyName = 'Portfolio' }) => {
    // Default empty state
    const safeData: HumanCapitalData = data || {
        headcount_delta: 0,
        key_hire_departures: [],
        hiring_velocity_pct: 0,
        talent_concentration: {},
        active_job_postings: 0,
        talent_signal: null,
    };

    const signal = safeData.talent_signal || 'STABLE_TALENT';
    const signalConfig = SIGNAL_CONFIG[signal] || SIGNAL_CONFIG.STABLE_TALENT;

    // Hiring velocity bar chart data
    const velocityData = useMemo(() => [
        { name: 'Current', velocity: safeData.hiring_velocity_pct, fill: safeData.hiring_velocity_pct > 0 ? '#22c55e' : '#f43f5e' },
        { name: 'Threshold', velocity: 30, fill: '#334155' },
    ], [safeData.hiring_velocity_pct]);

    // Talent concentration pie chart data
    const concentrationData = useMemo(() => {
        return Object.entries(safeData.talent_concentration).map(([dept, pct]) => ({
            name: dept.charAt(0).toUpperCase() + dept.slice(1),
            value: Math.round(pct * 100),
            fill: DEPT_COLORS[dept] || DEPT_COLORS.other,
        }));
    }, [safeData.talent_concentration]);

    // Key departures (only DEPARTURE type, sorted by date)
    const departures = useMemo(() => {
        return safeData.key_hire_departures
            .filter(d => d.type === 'DEPARTURE')
            .slice(0, 5);
    }, [safeData.key_hire_departures]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[#0d1117] border border-white/10 rounded-3xl overflow-hidden"
        >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/10 rounded-xl">
                        <Users className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">
                            Talent Radar
                        </h3>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                            Human Capital Analytics — {companyName}
                        </p>
                    </div>
                </div>

                {/* Signal Badge */}
                <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
                    style={{
                        backgroundColor: `${signalConfig.color}15`,
                        borderColor: `${signalConfig.color}30`,
                        color: signalConfig.color,
                    }}
                >
                    {signalConfig.icon}
                    <span className="text-[9px] font-black uppercase tracking-wider">
                        {signalConfig.label}
                    </span>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 border-b border-white/5">
                {[
                    {
                        label: 'Headcount Δ',
                        value: safeData.headcount_delta,
                        suffix: '',
                        color: safeData.headcount_delta >= 0 ? 'text-emerald-400' : 'text-rose-400',
                        prefix: safeData.headcount_delta > 0 ? '+' : '',
                    },
                    {
                        label: 'Active Postings',
                        value: safeData.active_job_postings,
                        suffix: '',
                        color: 'text-blue-400',
                        prefix: '',
                    },
                    {
                        label: 'Hiring Velocity',
                        value: safeData.hiring_velocity_pct,
                        suffix: '%',
                        color: safeData.hiring_velocity_pct > 0 ? 'text-emerald-400' : 'text-rose-400',
                        prefix: safeData.hiring_velocity_pct > 0 ? '+' : '',
                    },
                ].map((metric) => (
                    <div key={metric.label} className="px-6 py-4 border-r border-white/5 last:border-r-0">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            {metric.label}
                        </p>
                        <p className={`text-2xl font-black ${metric.color}`}>
                            {metric.prefix}{metric.value}{metric.suffix}
                        </p>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-2 border-b border-white/5">
                {/* Hiring Velocity Bar Chart */}
                <div className="p-6 border-r border-white/5">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                        Hiring Velocity vs Threshold
                    </p>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={velocityData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis type="number" stroke="#475569" fontSize={10} />
                            <YAxis type="category" dataKey="name" stroke="#475569" fontSize={10} width={70} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    color: '#e2e8f0',
                                }}
                            />
                            <Bar dataKey="velocity" radius={[0, 6, 6, 0]}>
                                {velocityData.map((entry, idx) => (
                                    <Cell key={idx} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Talent Concentration Pie Chart */}
                <div className="p-6">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                        Talent Concentration
                    </p>
                    {concentrationData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <PieChart>
                                <Pie
                                    data={concentrationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, value }) => `${name} ${value}%`}
                                    labelLine={false}
                                >
                                    {concentrationData.map((entry, idx) => (
                                        <Cell key={idx} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        color: '#e2e8f0',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[180px] flex items-center justify-center text-slate-600 text-xs">
                            No talent data available
                        </div>
                    )}
                </div>
            </div>

            {/* Key Departures */}
            <div className="p-6">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Key Departures
                </p>
                {departures.length > 0 ? (
                    <div className="space-y-2">
                        {departures.map((dep, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="flex items-center gap-3 p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl"
                            >
                                <UserMinus className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-white truncate">
                                        {dep.role}
                                    </p>
                                    <p className="text-[10px] text-slate-500">
                                        {dep.department && (
                                            <span className="capitalize">{dep.department} · </span>
                                        )}
                                        {dep.seniority && (
                                            <span className="capitalize">{dep.seniority} · </span>
                                        )}
                                        {dep.date ? new Date(dep.date).toLocaleDateString() : 'Recent'}
                                    </p>
                                </div>
                                <div className="px-2 py-0.5 bg-rose-500/10 rounded text-[8px] font-bold text-rose-400 uppercase">
                                    Departed
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="h-20 flex items-center justify-center text-slate-600 text-xs border border-dashed border-white/5 rounded-xl">
                        No key departures detected
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default TalentRadar;
