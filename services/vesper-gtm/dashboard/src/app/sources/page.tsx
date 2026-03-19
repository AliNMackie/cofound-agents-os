"use client";

import { useState, useEffect, useMemo } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { ProgressiveMetricCard } from "@/components/ui/progressive-metric-card";
import { ListingsTable, ListingsRow, ListingsCell } from "@/components/ui/listings-table";
import { StatusBadgePill } from "@/components/ui/status-badge-pill";
import { Activity, Database, Globe, Server, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { getSources } from "@/lib/api/sentinel";
import { DataSource } from "@/types/settings";

export default function SourcesPage() {
    const [sources, setSources] = useState<DataSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getSources();
            setSources(data);
        } catch (err: any) {
            console.error("Failed to fetch sources:", err);
            setError(err.message || "Failed to load data sources.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // KPI cards — computed dynamically from live data
    const kpis = useMemo(() => {
        const total = sources.length;
        const active = sources.filter(s => s.active).length;
        const healthPct = total > 0 ? Math.round((active / total) * 100) : 0;
        const uniqueTypes = new Set(sources.map(s => s.type)).size;

        return { total, active, healthPct, uniqueTypes };
    }, [sources]);

    return (
        <LayoutShell>
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-1">Network &amp; Sources</h1>
                <p className="text-gray-500">Manage data ingestion pipelines and source health.</p>
            </div>

            {/* KPI Band */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <ProgressiveMetricCard
                    label="Active Nodes"
                    value={isLoading ? "—" : String(kpis.active)}
                    subValue={isLoading ? "" : `of ${kpis.total} total`}
                    progress={kpis.healthPct}
                    icon={<Server className="w-5 h-5" />}
                />
                <ProgressiveMetricCard
                    label="Source Types"
                    value={isLoading ? "—" : String(kpis.uniqueTypes)}
                    subValue="Distinct"
                    progress={100}
                    icon={<Database className="w-5 h-5" />}
                />
                <ProgressiveMetricCard
                    label="System Health"
                    value={isLoading ? "—" : `${kpis.healthPct}%`}
                    progress={kpis.healthPct}
                    trend={kpis.healthPct >= 80 ? "up" : kpis.healthPct >= 50 ? "neutral" : "down"}
                    icon={<Activity className="w-5 h-5" />}
                />
                <ProgressiveMetricCard
                    label="Global Coverage"
                    value="UK/EU"
                    subValue="Region"
                    progress={100}
                    icon={<Globe className="w-5 h-5" />}
                />
            </div>

            {/* Sources Table */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Ingestion Nodes</h2>
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="text-xs uppercase tracking-wider text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {isLoading && (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
                </div>
            )}

            {!isLoading && error && (
                <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
                    <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
                    <button onClick={fetchData} className="mt-4 underline text-sm text-red-500 hover:text-red-700">
                        Retry
                    </button>
                </div>
            )}

            {!isLoading && !error && sources.length === 0 && (
                <div className="p-12 text-center text-neutral-500 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)]">
                    <Database className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-semibold mb-1">No Sources Configured</h3>
                    <p className="text-sm max-w-md mx-auto">
                        Add data sources in Settings &gt; Sources to start ingesting intelligence.
                    </p>
                </div>
            )}

            {!isLoading && !error && sources.length > 0 && (
                <ListingsTable headers={["Source Name", "URL", "Type", "Status"]}>
                    {sources.map((source, idx) => (
                        <ListingsRow key={source.id || idx}>
                            <ListingsCell>
                                <span className="font-semibold text-white">{source.name}</span>
                            </ListingsCell>
                            <ListingsCell>
                                <span className="text-xs text-gray-400 font-mono truncate max-w-[200px] block" title={source.url}>
                                    {source.url}
                                </span>
                            </ListingsCell>
                            <ListingsCell>
                                <span className="text-xs uppercase tracking-wider text-gray-500">{source.type}</span>
                            </ListingsCell>
                            <ListingsCell>
                                <StatusBadgePill status={source.active ? 'success' : 'critical'}>
                                    {source.active ? 'ACTIVE' : 'INACTIVE'}
                                </StatusBadgePill>
                            </ListingsCell>
                        </ListingsRow>
                    ))}
                </ListingsTable>
            )}
        </LayoutShell>
    );
}
