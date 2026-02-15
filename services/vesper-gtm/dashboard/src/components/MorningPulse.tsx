"use client";

import { useEffect, useState } from "react";
import { useSaaSContext } from "@/context/SaaSContext";
import {
    getLatestPulse,
    generateMorningBriefing,
    triggerMorningPulse,
    IntelligenceSignal
} from "@/lib/api/sentinel";
import { LayoutShell } from "@/components/layout-shell";
import { ProgressiveMetricCard } from "@/components/ui/progressive-metric-card";
import { ListingsTable, ListingsRow, ListingsCell } from "@/components/ui/listings-table";
import { StatusBadgePill } from "@/components/ui/status-badge-pill";
import { toast } from "sonner";
import { Loader2, FileDown, RefreshCw, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PulseData {
    id: string;
    generated_at: string;
    signals: IntelligenceSignal[];
    executive_summary?: string;
}

export function MorningPulse() {
    const { currentIndustry } = useSaaSContext();
    const [pulse, setPulse] = useState<PulseData | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [briefingLoading, setBriefingLoading] = useState(false);

    useEffect(() => {
        loadPulse();
    }, [currentIndustry]);

    async function loadPulse() {
        setLoading(true);
        try {
            // In a real app, we'd filter by industry here if the backend supports it
            const data = await getLatestPulse();
            setPulse(data);
        } catch (err) {
            console.error(err);
            // Don't show error toast on initial load if just empty
        } finally {
            setLoading(false);
        }
    }

    async function handleGeneratePulse() {
        setGenerating(true);
        try {
            await triggerMorningPulse();
            // Poll or wait a bit, then reload
            setTimeout(loadPulse, 3000);
            toast.success("Morning Pulse generation started");
        } catch (err) {
            toast.error("Failed to trigger pulse");
        } finally {
            setGenerating(false);
        }
    }

    async function handleDownloadBriefing() {
        setBriefingLoading(true);
        try {
            const res = await generateMorningBriefing();
            if (res.url) {
                window.open(res.url, "_blank");
                toast.success("Briefing generated");
            } else {
                toast.error("No URL returned");
            }
        } catch (err) {
            toast.error("Failed to generate briefing");
        } finally {
            setBriefingLoading(false);
        }
    }

    if (loading) {
        return (
            <LayoutShell>
                <div className="flex h-96 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
            </LayoutShell>
        );
    }

    // Derived Metrics
    const signals = pulse?.signals || [];
    const rescueSignals = signals.filter(s => s.category === "DISTRESSED_ASSET" || s.category === "REFINANCING");
    const growthSignals = signals.filter(s => s.category === "FOMC_PIVOT" || s.signal_type === "GROWTH");

    // KPI Data
    const totalSignals = signals.length;
    const rescueCount = rescueSignals.length;
    const growthCount = growthSignals.length;
    const lastSweepTime = pulse?.generated_at ? new Date(pulse.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A";

    return (
        <LayoutShell>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold mb-1 border-b-0">Morning Pulse</h1>
                    <p className="text-gray-500">
                        {currentIndustry.name} • {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleGeneratePulse} disabled={generating} className="border-[var(--color-border)] bg-transparent hover:bg-[var(--color-surface)] text-white">
                        {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Refresh
                    </Button>
                    <button className="btn-primary" onClick={handleDownloadBriefing} disabled={briefingLoading}>
                        {briefingLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
                        Daily Briefing
                    </button>
                </div>
            </div>

            {/* KPI Band */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <ProgressiveMetricCard
                    label="Signals Today"
                    value={totalSignals}
                    subValue={totalSignals > 0 ? "+12% WoW" : ""}
                    progress={100}
                    trend="up"
                    icon={<TrendingUp className="w-5 h-5" />}
                />
                <ProgressiveMetricCard
                    label="Rescue Opportunities"
                    value={rescueCount}
                    progress={(rescueCount / (totalSignals || 1)) * 100}
                    trend="down"
                    icon={<AlertTriangle className="w-5 h-5" />}
                />
                <ProgressiveMetricCard
                    label="Growth Signals"
                    value={growthCount}
                    progress={(growthCount / (totalSignals || 1)) * 100}
                    trend="up"
                />
                <ProgressiveMetricCard
                    label="Last Sweep"
                    value={lastSweepTime}
                    subValue="UTC"
                    progress={100}
                />
            </div>

            {/* Signals Table */}
            <h2 className="text-lg font-bold mb-4 mt-8">Market Signals</h2>
            <ListingsTable
                headers={["Company / Asset", "Signal Type", "Conviction", "Analysis", "Source"]}
            >
                {signals.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-500">
                            No signals detected for today's pulse.
                        </td>
                    </tr>
                ) : (
                    signals.map((signal) => (
                        <ListingsRow key={signal.id} onClick={() => { }}>
                            <ListingsCell>
                                <div className="font-semibold text-white">{signal.headline.split(" - ")[0]}</div>
                                <div className="text-xs text-gray-500">{signal.headline.split(" - ")[1] || "Unknown Status"}</div>
                            </ListingsCell>
                            <ListingsCell>
                                <StatusBadgePill status={
                                    signal.category === "DISTRESSED_ASSET" ? "critical" :
                                        signal.category === "REFINANCING" ? "warning" : "success"
                                }>
                                    {signal.category.replace("_", " ")}
                                </StatusBadgePill>
                            </ListingsCell>
                            <ListingsCell>
                                <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-[var(--color-primary)]" style={{ width: `${signal.conviction}%` }}></div>
                                    </div>
                                    <span className="text-xs font-mono">{signal.conviction}%</span>
                                </div>
                            </ListingsCell>
                            <ListingsCell className="max-w-md">
                                <p className="text-sm line-clamp-2 text-gray-400">{signal.analysis}</p>
                            </ListingsCell>
                            <ListingsCell>
                                <span className="text-xs text-gray-500">{signal.source}</span>
                            </ListingsCell>
                        </ListingsRow>
                    ))
                )}
            </ListingsTable>
        </LayoutShell>
    );
}
