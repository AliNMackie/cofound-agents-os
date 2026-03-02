'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { name: 'Mon', share: 12.4 },
    { name: 'Tue', share: 13.1 },
    { name: 'Wed', share: 12.8 },
    { name: 'Thu', share: 14.2 },
    { name: 'Fri', share: 13.9 },
    { name: 'Sat', share: 14.5 },
    { name: 'Sun', share: 14.2 },
];

interface MarketShareChartProps {
    isLoading?: boolean;
}

const MarketShareChart: React.FC<MarketShareChartProps> = ({ isLoading }) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (isLoading || !mounted) {
        return (
            <div className="w-full h-full flex flex-col justify-end gap-2 relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/10 animate-pulse rounded-2xl" />
                <div className="flex items-end justify-between h-48 w-full px-4 opacity-20">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="w-8 bg-emerald-500 rounded-t-lg animate-pulse" style={{
                            height: `${30 + Math.random() * 60}%`,
                            animationDelay: `${i * 100}ms`
                        }} />
                    ))}
                </div>
                <div className="h-px w-full bg-white/5" />
            </div>
        );
    }

    return (
        <div className="w-full h-full" style={{ width: '100%', minHeight: '192px' }}>
            {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorShare" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#0d1117',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#10B981' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="share"
                            stroke="#10B981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorShare)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default MarketShareChart;
