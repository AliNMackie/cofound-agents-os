'use client';

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
    { growth: 12, profit: 5, name: 'BlueTech' },
    { growth: 28, profit: -2, name: 'Nexus' },
    { growth: 5, profit: 18, name: 'SilverLine' },
    { growth: 15, profit: 8, name: 'Apex' },
    { growth: 8, profit: 12, name: 'Fortress' },
    { growth: 22, profit: 2, name: 'Iapetus' },
];

interface MarketMapScatterProps {
    onNodeClick?: (entity: any) => void;
    isLoading?: boolean;
    data?: any[];
}

const MarketMapScatter: React.FC<MarketMapScatterProps> = ({ onNodeClick, isLoading, data }) => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const handleClick = (point: any) => {
        if (onNodeClick) {
            onNodeClick(point);
        }
    };

    if (isLoading || !mounted) {
        return (
            <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/20 animate-pulse rounded-2xl" />
                <div className="grid grid-cols-6 grid-rows-6 w-full h-full gap-4 p-8 opacity-20">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{
                            gridColumnStart: Math.floor(Math.random() * 6) + 1,
                            gridRowStart: Math.floor(Math.random() * 6) + 1,
                            animationDelay: `${i * 150}ms`
                        }} />
                    ))}
                </div>
                <span className="text-[10px] font-mono font-black text-indigo-500/50 uppercase tracking-[0.3em] animate-pulse">Syncing Golden Topology...</span>
            </div>
        );
    }

    // [BOARD-READY DATA MAPPING]
    const currentData = (data && data.length > 0) ? data.map(m => ({
        growth: m.financials?.revenue_growth_yoy_pct || 0,
        profit: m.financials?.ebitda_margin_pct || 0,
        size: m.financials?.latest_revenue_gbp || 1000000,
        name: m.company_name,
        cat: m.ic_origin_classification?.category,
        id: m.company_id
    })) : [
        { growth: 92, profit: 24, size: 25000000, name: 'Quantum Leap AI', cat: 'Obvious Winner' },
        { growth: 45, profit: 12, size: 12000000, name: 'GreenGrid UK', cat: 'Borderline' },
        { growth: 12, profit: 28, size: 8000000, name: 'BlueTech Corp', cat: 'Distressed / Contrarian' }
    ];

    const getEntityColor = (cat: string) => {
        if (cat === 'Obvious Winner') return '#10B981'; // Emerald
        if (cat === 'Borderline') return '#6366F1'; // Indigo
        return '#F59E0B'; // Amber
    };

    return (
        <div className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        type="number"
                        dataKey="growth"
                        name="Growth"
                        unit="%"
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#475569', fontSize: 10 }}
                        label={{ value: 'Revenue Growth (YoY) →', position: 'insideBottomRight', offset: -10, fill: '#475569', fontSize: 8, fontWeight: 'bold' }}
                    />
                    <YAxis
                        type="number"
                        dataKey="profit"
                        name="Profitability"
                        unit="%"
                        domain={[-20, 50]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#475569', fontSize: 10 }}
                        label={{ value: 'EBITDA Margin (%) ↑', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 8, fontWeight: 'bold' }}
                    />
                    <ZAxis type="number" dataKey="size" range={[100, 1000]} />
                    <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{
                            backgroundColor: '#0d1117',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                        }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const entity = payload[0].payload;
                                return (
                                    <div className="bg-[#0d1117] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-xl">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">{entity.cat}</p>
                                        <p className="text-xs font-bold text-white mb-2">{entity.name}</p>
                                        <div className="grid grid-cols-2 gap-4 text-[8px] font-mono text-slate-400">
                                            <div>GROWTH: {entity.growth}%</div>
                                            <div>PROFIT: {entity.profit}%</div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Scatter
                        name="Monitored Entities"
                        data={currentData}
                        onClick={(e) => handleClick(e)}
                        className="cursor-pointer"
                    >
                        {currentData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={getEntityColor(entry.cat)}
                                className="hover:stroke-white transition-all duration-300"
                                strokeWidth={2}
                            />
                        ))}
                    </Scatter>
                </ScatterChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MarketMapScatter;
