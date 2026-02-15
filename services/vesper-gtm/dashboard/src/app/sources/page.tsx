"use client";

import { LayoutShell } from "@/components/layout-shell";
import { ProgressiveMetricCard } from "@/components/ui/progressive-metric-card";
import { ListingsTable, ListingsRow, ListingsCell } from "@/components/ui/listings-table";
import { StatusBadgePill } from "@/components/ui/status-badge-pill";
import { Activity, Database, Globe, Server } from "lucide-react";

export default function SourcesPage() {
    // Mock Data
    const sources = [
        { id: 1, name: "UK Companies House", type: "GOV_REGISTRY", status: "active", lastSync: "10 mins ago", items: 1240 },
        { id: 2, name: "The Gazette (Insolvency)", type: "GOV_REGISTRY", status: "active", lastSync: "1 hour ago", items: 85 },
        { id: 3, name: "Financial Times (M&A)", type: "RSS_NEWS", status: "warning", lastSync: "4 hours ago", items: 32 },
        { id: 4, name: "Bloomberg Private Equity", type: "RSS_NEWS", status: "active", lastSync: "15 mins ago", items: 210 },
        { id: 5, name: "Court Filings (Winding Up)", type: "LEGAL", status: "critical", lastSync: "1 day ago", items: 0 },
    ];

    return (
        <LayoutShell>
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-1">Network & Sources</h1>
                <p className="text-gray-500">Manage data ingestion pipelines and source health.</p>
            </div>

            {/* KPI Band */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <ProgressiveMetricCard
                    label="Active Nodes"
                    value="12"
                    subValue="Total"
                    progress={100}
                    icon={<Server className="w-5 h-5" />}
                />
                <ProgressiveMetricCard
                    label="Items Ingested"
                    value="24.5k"
                    subValue="This Week"
                    progress={85}
                    trend="up"
                    icon={<Database className="w-5 h-5" />}
                />
                <ProgressiveMetricCard
                    label="System Health"
                    value="98.2%"
                    progress={98}
                    trend="up"
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
            <h2 className="text-lg font-bold mb-4">Ingestion Nodes</h2>
            <ListingsTable headers={["Source Name", "Type", "Status", "Last Sync", "Items"]}>
                {sources.map(source => (
                    <ListingsRow key={source.id}>
                        <ListingsCell>
                            <span className="font-semibold text-white">{source.name}</span>
                        </ListingsCell>
                        <ListingsCell>
                            <span className="text-xs uppercase tracking-wider text-gray-500">{source.type}</span>
                        </ListingsCell>
                        <ListingsCell>
                            <StatusBadgePill status={
                                source.status === 'active' ? 'success' :
                                    source.status === 'warning' ? 'warning' : 'critical'
                            }>
                                {source.status.toUpperCase()}
                            </StatusBadgePill>
                        </ListingsCell>
                        <ListingsCell>
                            <span className="text-sm text-gray-400">{source.lastSync}</span>
                        </ListingsCell>
                        <ListingsCell>
                            <span className="font-mono text-white">{source.items}</span>
                        </ListingsCell>
                    </ListingsRow>
                ))}
            </ListingsTable>
        </LayoutShell>
    );
}
