"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Globe,
    Building2,
    Landmark,
    Briefcase,
    RefreshCw,
    CheckCircle2,
    AlertCircle,
    Clock,
    ExternalLink,
    Wifi,
    WifiOff
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Source Categories
type SourceCategory = "AUCTION" | "ADVISOR" | "INSTITUTION" | "REGULATOR";
type SourceStatus = "CONNECTED" | "RECONNECTING" | "OFFLINE";

interface IntelligenceSource {
    id: string;
    name: string;
    category: SourceCategory;
    status: SourceStatus;
    lastScanned: Date;
    totalDeals: number;
    description: string;
    website?: string;
}

// Mock Intelligence Network Data
const MOCK_SOURCES: IntelligenceSource[] = [
    // Auction Nodes
    { id: "s-001", name: "Euro Auctions", category: "AUCTION", status: "CONNECTED", lastScanned: new Date(Date.now() - 14 * 60000), totalDeals: 127, description: "Industrial equipment & commercial vehicles", website: "euroauctions.com" },
    { id: "s-002", name: "Ritchie Bros", category: "AUCTION", status: "CONNECTED", lastScanned: new Date(Date.now() - 8 * 60000), totalDeals: 89, description: "Heavy machinery & construction assets", website: "rbauction.com" },
    { id: "s-003", name: "BidSpotter", category: "AUCTION", status: "CONNECTED", lastScanned: new Date(Date.now() - 22 * 60000), totalDeals: 156, description: "Multi-category industrial auctions", website: "bidspotter.co.uk" },
    { id: "s-004", name: "Allsop", category: "AUCTION", status: "CONNECTED", lastScanned: new Date(Date.now() - 5 * 60000), totalDeals: 234, description: "Commercial real estate auctions", website: "allsop.co.uk" },
    { id: "s-005", name: "Acuitus", category: "AUCTION", status: "CONNECTED", lastScanned: new Date(Date.now() - 11 * 60000), totalDeals: 78, description: "Investment property specialists", website: "acuitus.co.uk" },
    { id: "s-006", name: "SDL Auctions", category: "AUCTION", status: "RECONNECTING", lastScanned: new Date(Date.now() - 45 * 60000), totalDeals: 45, description: "Residential & commercial property", website: "sdlauctions.co.uk" },

    // Advisor Nodes
    { id: "s-007", name: "Rothschild & Co", category: "ADVISOR", status: "CONNECTED", lastScanned: new Date(Date.now() - 3 * 60000), totalDeals: 34, description: "Tombstone monitoring & deal announcements", website: "rothschildandco.com" },
    { id: "s-008", name: "KPMG Restructuring", category: "ADVISOR", status: "CONNECTED", lastScanned: new Date(Date.now() - 7 * 60000), totalDeals: 56, description: "Insolvency & restructuring mandates", website: "kpmg.com" },
    { id: "s-009", name: "Deloitte Financial Advisory", category: "ADVISOR", status: "CONNECTED", lastScanned: new Date(Date.now() - 12 * 60000), totalDeals: 41, description: "Corporate finance & distressed M&A", website: "deloitte.co.uk" },
    { id: "s-010", name: "Houlihan Lokey", category: "ADVISOR", status: "CONNECTED", lastScanned: new Date(Date.now() - 9 * 60000), totalDeals: 28, description: "Mid-market M&A advisory", website: "hl.com" },
    { id: "s-011", name: "Grant Thornton", category: "ADVISOR", status: "CONNECTED", lastScanned: new Date(Date.now() - 18 * 60000), totalDeals: 67, description: "Restructuring & recovery services", website: "grantthornton.co.uk" },
    { id: "s-012", name: "FTI Consulting", category: "ADVISOR", status: "RECONNECTING", lastScanned: new Date(Date.now() - 35 * 60000), totalDeals: 23, description: "Corporate finance & restructuring", website: "fticonsulting.com" },

    // Institutional Nodes (PE Firms)
    { id: "s-013", name: "Exponent PE", category: "INSTITUTION", status: "CONNECTED", lastScanned: new Date(Date.now() - 6 * 60000), totalDeals: 12, description: "Mid-market buyouts portfolio tracking", website: "exponentpe.com" },
    { id: "s-014", name: "LDC", category: "INSTITUTION", status: "CONNECTED", lastScanned: new Date(Date.now() - 15 * 60000), totalDeals: 19, description: "UK mid-market private equity", website: "ldc.co.uk" },
    { id: "s-015", name: "Synova Capital", category: "INSTITUTION", status: "CONNECTED", lastScanned: new Date(Date.now() - 10 * 60000), totalDeals: 8, description: "Lower mid-market investments", website: "synovacapital.com" },
    { id: "s-016", name: "Inflexion", category: "INSTITUTION", status: "CONNECTED", lastScanned: new Date(Date.now() - 4 * 60000), totalDeals: 15, description: "Private equity & growth capital", website: "inflexion.com" },
    { id: "s-017", name: "Livingbridge", category: "INSTITUTION", status: "CONNECTED", lastScanned: new Date(Date.now() - 20 * 60000), totalDeals: 11, description: "UK Mid Market buyouts", website: "livingbridge.com" },
    { id: "s-018", name: "August Equity", category: "INSTITUTION", status: "OFFLINE", lastScanned: new Date(Date.now() - 120 * 60000), totalDeals: 7, description: "Healthcare & business services", website: "augustequity.co.uk" },

    // Regulator Nodes
    { id: "s-019", name: "The Gazette", category: "REGULATOR", status: "CONNECTED", lastScanned: new Date(Date.now() - 2 * 60000), totalDeals: 312, description: "Official insolvency notices", website: "thegazette.co.uk" },
    { id: "s-020", name: "Companies House", category: "REGULATOR", status: "CONNECTED", lastScanned: new Date(Date.now() - 1 * 60000), totalDeals: 89, description: "Director changes & filings", website: "companieshouse.gov.uk" },
    { id: "s-021", name: "FCA Register", category: "REGULATOR", status: "CONNECTED", lastScanned: new Date(Date.now() - 30 * 60000), totalDeals: 24, description: "Regulatory status monitoring", website: "fca.org.uk" },
    { id: "s-022", name: "Insolvency Service", category: "REGULATOR", status: "CONNECTED", lastScanned: new Date(Date.now() - 16 * 60000), totalDeals: 178, description: "Official insolvency records", website: "gov.uk/insolvency-service" },
];

const CATEGORY_CONFIG: Record<SourceCategory, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
    AUCTION: { label: "Auction", icon: Globe, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" },
    ADVISOR: { label: "Advisor", icon: Briefcase, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/30" },
    INSTITUTION: { label: "PE Firm", icon: Building2, color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" },
    REGULATOR: { label: "Regulator", icon: Landmark, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30" },
};

const STATUS_CONFIG: Record<SourceStatus, { label: string; color: string; pulse: boolean }> = {
    CONNECTED: { label: "Connected", color: "bg-green-500", pulse: true },
    RECONNECTING: { label: "Reconnecting...", color: "bg-amber-500", pulse: true },
    OFFLINE: { label: "Offline", color: "bg-red-500", pulse: false },
};

function formatTimeAgo(date: Date): string {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function SourceCard({ source }: { source: IntelligenceSource }) {
    const categoryConfig = CATEGORY_CONFIG[source.category];
    const statusConfig = STATUS_CONFIG[source.status];
    const Icon = categoryConfig.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group"
        >
            <Card className="h-full hover:border-black dark:hover:border-white transition-colors duration-300 overflow-hidden">
                <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", categoryConfig.bgColor)}>
                            <Icon className={cn("h-5 w-5", categoryConfig.color)} />
                        </div>

                        {/* Status Indicator */}
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "relative flex h-2.5 w-2.5",
                            )}>
                                {statusConfig.pulse && (
                                    <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", statusConfig.color)} />
                                )}
                                <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", statusConfig.color)} />
                            </span>
                            {source.status === "RECONNECTING" && (
                                <RefreshCw className="h-3 w-3 animate-spin text-amber-500" />
                            )}
                        </div>
                    </div>

                    {/* Name & Description */}
                    <h3 className="font-bold text-sm mb-1 dark:text-white group-hover:text-black dark:group-hover:text-white truncate">
                        {source.name}
                    </h3>
                    <p className="text-[10px] text-brand-text-secondary dark:text-neutral-400 line-clamp-2 mb-3 h-8">
                        {source.description}
                    </p>

                    {/* Stats Row */}
                    <div className="flex items-center justify-between text-[10px] mb-3">
                        <div className="flex items-center gap-1.5 text-brand-text-secondary">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(source.lastScanned)}</span>
                        </div>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                            {source.totalDeals} deals
                        </Badge>
                    </div>

                    {/* Category Badge */}
                    <div className="flex items-center justify-between">
                        <Badge className={cn("text-[9px] uppercase tracking-wider border-0", categoryConfig.bgColor, categoryConfig.color)}>
                            {categoryConfig.label}
                        </Badge>
                        {source.website && (
                            <a
                                href={`https://${source.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-brand-text-secondary hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
                            >
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function SourcesPage() {
    const [sources, setSources] = useState<IntelligenceSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<SourceCategory | "ALL">("ALL");

    useEffect(() => {
        // Simulate API fetch
        const fetchSources = async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
            setSources(MOCK_SOURCES);
            setLoading(false);
        };
        fetchSources();
    }, []);

    const filteredSources = filter === "ALL"
        ? sources
        : sources.filter(s => s.category === filter);

    const stats = {
        total: sources.length,
        connected: sources.filter(s => s.status === "CONNECTED").length,
        reconnecting: sources.filter(s => s.status === "RECONNECTING").length,
        offline: sources.filter(s => s.status === "OFFLINE").length,
        totalDeals: sources.reduce((acc, s) => acc + s.totalDeals, 0),
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin text-brand-text-secondary" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text-secondary mb-2">Network Topology</p>
                <h1 className="text-4xl font-bold tracking-tighter text-black dark:text-white">Intelligence Network</h1>
                <p className="mt-2 text-brand-text-secondary text-sm max-w-xl dark:text-neutral-400">
                    Real-time monitoring of {stats.total} institutional-grade intelligence nodes across the UK M&A landscape.
                </p>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="p-4 dark:bg-black dark:border-neutral-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary mb-1">Total Nodes</p>
                    <p className="text-3xl font-bold dark:text-white">{stats.total}</p>
                </Card>
                <Card className="p-4 dark:bg-black dark:border-neutral-800">
                    <div className="flex items-center gap-2 mb-1">
                        <Wifi className="h-3 w-3 text-green-500" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Connected</p>
                    </div>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.connected}</p>
                </Card>
                <Card className="p-4 dark:bg-black dark:border-neutral-800">
                    <div className="flex items-center gap-2 mb-1">
                        <RefreshCw className="h-3 w-3 text-amber-500" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Reconnecting</p>
                    </div>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.reconnecting}</p>
                </Card>
                <Card className="p-4 dark:bg-black dark:border-neutral-800">
                    <div className="flex items-center gap-2 mb-1">
                        <WifiOff className="h-3 w-3 text-red-500" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary">Offline</p>
                    </div>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.offline}</p>
                </Card>
                <Card className="p-4 dark:bg-black dark:border-neutral-800">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary mb-1">Deals Tracked</p>
                    <p className="text-3xl font-bold dark:text-white">{stats.totalDeals.toLocaleString()}</p>
                </Card>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 flex-wrap">
                {(["ALL", "AUCTION", "ADVISOR", "INSTITUTION", "REGULATOR"] as const).map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={cn(
                            "text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg border transition-all",
                            filter === cat
                                ? "bg-black text-white border-black dark:bg-white dark:text-black"
                                : "bg-white text-brand-text-secondary border-brand-border hover:border-black dark:bg-neutral-900 dark:border-neutral-700 dark:hover:border-white"
                        )}
                    >
                        {cat === "ALL" ? `All (${stats.total})` : `${CATEGORY_CONFIG[cat].label}s`}
                    </button>
                ))}
            </div>

            {/* Source Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSources.map((source, index) => (
                    <motion.div
                        key={source.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <SourceCard source={source} />
                    </motion.div>
                ))}
            </div>

            {/* Footer */}
            <div className="py-8 border-t border-brand-border dark:border-neutral-800">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-widest text-brand-text-secondary">
                        IC ORIGIN: Proprietary Capital Structure Intelligence
                    </p>
                    <p className="text-[10px] text-brand-text-secondary">
                        Last network sweep: {formatTimeAgo(new Date(Date.now() - 60000))}
                    </p>
                </div>
            </div>
        </div>
    );
}
