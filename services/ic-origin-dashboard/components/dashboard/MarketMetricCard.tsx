'use client';

import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface MarketMetricCardProps {
    label: string;
    value: string;
    change?: string;
    isPositive?: boolean;
    data?: { value: number }[];
}

const MarketMetricCard: React.FC<MarketMetricCardProps> = ({ label, value, change, isPositive, data }) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const defaultData = [
        { value: 10 }, { value: 25 }, { value: 15 }, { value: 30 }, { value: 20 }, { value: 45 }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-[#0d1117] border border-white/5 p-6 rounded-2xl hover:border-emerald-500/20 transition-all group shadow-sm flex flex-col h-full"
        >
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{label}</p>

            <div className="flex items-baseline justify-between mb-auto">
                <h3 className="text-3xl font-black text-white font-mono tracking-tighter">{value}</h3>
                {change && (
                    <span className={`text-[10px] font-black font-mono flex items-center gap-1 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? (
                            <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16z" /></svg>
                        ) : (
                            <svg className="w-2 h-2 transform rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16z" /></svg>
                        )}
                        {change}
                    </span>
                )}
            </div>

            <div className="mt-8 h-12 w-full">
                {mounted && (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <AreaChart data={data || defaultData}>
                            <defs>
                                <linearGradient id={`gradient-${label.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={isPositive ? "#10B981" : "#F43F5E"} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={isPositive ? "#10B981" : "#F43F5E"} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke={isPositive ? "#10B981" : "#F43F5E"}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill={`url(#gradient-${label.replace(/\s+/g, '')})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="mt-4 flex justify-between items-center text-[8px] font-mono text-slate-600 uppercase tracking-widest">
                <span>7D Trend</span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">Real-time Telemetry</span>
            </div>
        </motion.div>
    );
};

export default MarketMetricCard;
