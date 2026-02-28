'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    Shield,
    Radar,
    Bell,
    Clock,
    Zap,
    ServerCog,
    TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── Types ─────────────────────────────────────────────────────────

interface TelemetryData {
    tenant_id: string;
    system_status: string;
    sync_active: boolean;
    entities_monitored: number;
    sweeps_executed: number;
    alerts_sent: number;
    reports_generated: number;
    last_sweep_at: string | null;
    next_sweep_at: string;
    billing_month: string;
    user_role: string;
    user_email: string;
}

interface PortfolioStatusProps {
    apiBaseUrl?: string;
}

// ─── Metric Card ───────────────────────────────────────────────────

const StatusMetric = ({
    label,
    value,
    subValue,
    icon,
    accentColor,
    glowColor,
}: {
    label: string;
    value: string | number;
    subValue?: string;
    icon: React.ReactNode;
    accentColor: string;
    glowColor: string;
}) => (
    <div className="bg-[#161b22] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-all duration-300">
        <div
            className={`absolute top-0 right-0 w-24 h-24 ${glowColor} blur-[60px] opacity-15 group-hover:opacity-30 transition-opacity`}
        />
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
                {icon}
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
                    {label}
                </p>
            </div>
            <p className={`text-3xl font-black tracking-tight ${accentColor}`}>
                {value}
            </p>
            {subValue && (
                <p className="text-[10px] font-mono text-slate-500 mt-1">{subValue}</p>
            )}
        </div>
    </div>
);

// ─── Component ─────────────────────────────────────────────────────

const PortfolioStatus: React.FC<PortfolioStatusProps> = ({
    apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
}) => {
    const { user } = useAuth();
    const [data, setData] = useState<TelemetryData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch(`${apiBaseUrl}/api/v1/telemetry/status`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (err) {
            console.error('Failed to fetch telemetry:', err);
        } finally {
            setLoading(false);
        }
    }, [user, apiBaseUrl]);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [fetchStatus]);

    // Format time helpers
    const formatTime = (iso: string | null) => {
        if (!iso) return '--:--';
        const d = new Date(iso);
        return d.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short',
        });
    };

    const formatRelative = (iso: string | null) => {
        if (!iso) return 'Never';
        const d = new Date(iso);
        const now = new Date();
        const diffMs = d.getTime() - now.getTime();
        const diffHrs = Math.round(diffMs / (1000 * 60 * 60));
        if (diffHrs <= 0) {
            const agoHrs = Math.abs(diffHrs);
            if (agoHrs === 0) return 'Just now';
            return `${agoHrs}h ago`;
        }
        return `In ${diffHrs}h`;
    };

    const isOperational = data?.sync_active ?? false;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
        >
            {/* ── System Status Banner ─────────────────────────────── */}
            <div className="bg-[#0d1117] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full" />
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-cyan-500/5 blur-[80px] rounded-full" />

                <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div
                                className={`w-3 h-3 rounded-full ${isOperational
                                        ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                                        : 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                                    }`}
                            />
                            {isOperational && (
                                <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-40" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">
                                System Status
                            </h2>
                            <p className="text-sm font-bold text-white mt-0.5">
                                {data?.system_status || 'Connecting...'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                            <Radar className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">
                                Real-Time Shadow Market Sync Active
                            </span>
                        </div>
                        <div className="hidden lg:flex items-center gap-2 text-[9px] font-mono text-slate-600 uppercase tracking-wider">
                            <ServerCog className="w-3 h-3" />
                            {data?.billing_month || '--'}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Metric Cards ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatusMetric
                    label="Entities Monitored"
                    value={loading ? '--' : (data?.entities_monitored ?? 0)}
                    subValue="Active counterparties"
                    icon={<Shield className="w-4 h-4 text-cyan-500" />}
                    accentColor="text-white"
                    glowColor="bg-cyan-500"
                />
                <StatusMetric
                    label="Sweeps Today"
                    value={loading ? '--' : (data?.sweeps_executed ?? 0)}
                    subValue={`Last: ${formatRelative(data?.last_sweep_at ?? null)}`}
                    icon={<Activity className="w-4 h-4 text-emerald-500" />}
                    accentColor="text-emerald-400"
                    glowColor="bg-emerald-500"
                />
                <StatusMetric
                    label="Alerts Generated (30d)"
                    value={loading ? '--' : (data?.alerts_sent ?? 0)}
                    subValue="This billing period"
                    icon={<Bell className="w-4 h-4 text-amber-500" />}
                    accentColor="text-amber-400"
                    glowColor="bg-amber-500"
                />
                <StatusMetric
                    label="Next Scheduled Sweep"
                    value={loading ? '--:--' : formatTime(data?.next_sweep_at ?? null)}
                    subValue={loading ? '' : formatRelative(data?.next_sweep_at ?? null)}
                    icon={<Clock className="w-4 h-4 text-violet-500" />}
                    accentColor="text-violet-400"
                    glowColor="bg-violet-500"
                />
            </div>
        </motion.div>
    );
};

export default PortfolioStatus;
