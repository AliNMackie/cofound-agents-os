import React from 'react';

const SummaryHeader: React.FC = () => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-6 px-1 border-b border-white/5 mb-10">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Executive Overview</h1>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Live Market Telemetry // Session IC-0226</p>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter text-nowrap">System: Online</span>
                </div>
                <div className="text-[10px] font-mono text-slate-600">Last Updated: 14:32:01</div>
            </div>
        </div>
    );
};

export default SummaryHeader;
