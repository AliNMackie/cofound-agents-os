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

const MarketMapScatter: React.FC = () => {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="w-full h-full">
            {mounted && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <ScatterChart
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            type="number"
                            dataKey="growth"
                            name="Growth"
                            unit="%"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 10 }}
                            label={{ value: 'Growth →', position: 'insideBottomRight', offset: -10, fill: '#475569', fontSize: 8, fontWeight: 'bold' }}
                        />
                        <YAxis
                            type="number"
                            dataKey="profit"
                            name="Profitability"
                            unit="%"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 10 }}
                            label={{ value: 'Profitability ↑', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 8, fontWeight: 'bold' }}
                        />
                        <ZAxis type="number" range={[64, 144]} />
                        <Tooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            contentStyle={{
                                backgroundColor: '#0d1117',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                fontSize: '10px'
                            }}
                        />
                        <Scatter name="Competitors" data={data} fill="#6366F1">
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.profit > 10 ? '#10B981' : '#6366F1'} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            )}
        </div>
    );
};

export default MarketMapScatter;
