"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    RefreshCw,
    AlertTriangle,
    TrendingDown,
    Landmark,
    FileText,
    Loader2,
    ChevronRight,
    Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/formatDate";
import { SourceAttribution } from "@/components/SourceAttribution";
import { useSaaSContext } from "@/context/SaaSContext";
import { getSignals, triggerSweep } from "@/lib/api/sentinel";
import { IntelligenceSignal, SignalCategory } from "@/types/sentinel";

// Category styling
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
    REFINANCING: {
        label: "Refinancing",
        color: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        icon: RefreshCw
    },
    FOMC_PIVOT: {
        label: "FOMC Pivot",
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-100 dark:bg-amber-900/30",
        icon: Landmark
    },
    DISTRESSED_ASSET: {
        label: "Distressed Asset",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-900/30",
        icon: TrendingDown
    },
    // Fallback
    DEFAULT: {
        label: "Intelligence",
        color: "text-neutral-600 dark:text-neutral-400",
        bgColor: "bg-neutral-100 dark:bg-neutral-900/30",
        icon: FileText
    }
};

interface MorningPulseProps {
    className?: string;
}

export function MorningPulse({ className }: MorningPulseProps) {
    const { currentIndustry } = useSaaSContext();
    const [signals, setSignals] = useState<IntelligenceSignal[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedSector, setSelectedSector] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        const fetchSignals = async () => {
            setLoading(true);
            try {
                // Fetch signals relevant to the current industry context
                const data = await getSignals(currentIndustry.id);
                if (mounted) {
                    setSignals(data);
                }
            } catch (error) {
                console.error("Failed to load signals", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (currentIndustry?.id) {
            fetchSignals();
        } else {
            setLoading(false);
        }

        return () => { mounted = false; };
    }, [currentIndustry?.id]);

    const handleGenerateMemo = async (signal: IntelligenceSignal) => {
        setGenerating(signal.id);
        try {
            const payload = {
                type: "morning_pulse",
                raw_data: [signal],
                template_id: "morning_pulse",
                free_form_instruction: `Focus on: ${signal.headline}. Analyse through Neish Capital lens with emphasis on 2026/27 maturity wall implications.`,
                user_sector: selectedSector,
                industry_context: currentIndustry.macroContext
            };

            const apiUrl = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL || "https://newsletter-engine-193875309190.europe-west2.run.app";
            const response = await fetch(`${apiUrl}/draft`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert("Memo generated successfully. Check the Newsroom for the draft.");
            } else {
                throw new Error("Generation failed");
            }
        } catch (error) {
            alert("Failed to generate memo. Please try again.");
        } finally {
            setGenerating(null);
        }
    };

    const getConvictionColor = (conviction: number) => {
        if (conviction >= 85) return "text-green-600 dark:text-green-400";
        if (conviction >= 70) return "text-amber-600 dark:text-amber-400";
        return "text-red-600 dark:text-red-400";
    };

    if (loading) {
        return (
            <Card className={cn("", className)}>
                <CardContent className="py-12 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-text-secondary" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="border-b border-brand-border dark:border-neutral-800 bg-gradient-to-r from-black to-neutral-900 text-white relative">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            {currentIndustry.name} Pulse
                        </CardTitle>
                        <CardDescription className="text-neutral-400 text-xs uppercase tracking-widest mt-1">
                            IC ORIGIN: Proprietary Capital Structure Intelligence
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-[10px] uppercase tracking-wider bg-black/20 hover:bg-black/40 border-neutral-700 hover:text-white transition-all"
                            onClick={async (e) => {
                                e.stopPropagation();
                                if (generating) return;
                                setGenerating("sweep");
                                try {
                                    await triggerSweep();
                                    setTimeout(() => {
                                        setGenerating(null);
                                        // TODO: Trigger actual re-fetch
                                        alert("Sweep started. Signals will update shortly.");
                                    }, 2000);
                                } catch (err) {
                                    console.error(err);
                                    setGenerating(null);
                                }
                            }}
                        >
                            {generating === "sweep" ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                            Run Sweep
                        </Button>
                        <div className="text-right">
                            <p className="text-xs text-neutral-400">Last Updated</p>
                            <p className="text-sm font-mono">{formatDate(new Date())}</p>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                {/* Vertical Timeline */}
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-brand-border via-brand-border to-transparent dark:from-neutral-700" />

                    {signals.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No intelligence signals gathered yet.</p>
                            <p className="text-xs mt-1 opacity-70">Check your data sources or wait for the next market sweep.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {signals.map((signal, index) => {
                                const config = CATEGORY_CONFIG[signal.category] || CATEGORY_CONFIG.DEFAULT;
                                const Icon = config.icon;
                                const isExpanded = expandedId === signal.id;

                                return (
                                    <motion.div
                                        key={signal.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="relative"
                                    >
                                        <div
                                            className={cn(
                                                "flex gap-4 p-4 cursor-pointer hover:bg-brand-background dark:hover:bg-neutral-900/50 transition-colors border-b border-brand-border dark:border-neutral-800 last:border-0",
                                                isExpanded && "bg-brand-background dark:bg-neutral-900/50"
                                            )}
                                            onClick={() => setExpandedId(isExpanded ? null : signal.id)}
                                        >
                                            {/* Timeline node */}
                                            <div className={cn(
                                                "relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                                                config.bgColor
                                            )}>
                                                <Icon className={cn("h-4 w-4", config.color)} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge className={cn("text-[9px] uppercase tracking-wider", config.bgColor, config.color, "border-0")}>
                                                            {config.label}
                                                        </Badge>
                                                        <span className="text-[10px] text-brand-text-secondary dark:text-neutral-500">
                                                            {new Date(signal.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                                                        </span>
                                                    </div>
                                                    <div className={cn("text-xs font-mono font-bold", getConvictionColor(signal.conviction))}>
                                                        {signal.conviction}%
                                                    </div>
                                                </div>

                                                <h3 className="text-sm font-bold text-brand-text-primary dark:text-white leading-snug mb-1">
                                                    {signal.headline}
                                                </h3>

                                                <p className="text-xs text-brand-text-secondary dark:text-neutral-400 line-clamp-2">
                                                    {signal.analysis}
                                                </p>

                                                {/* Expanded content */}
                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="mt-4 pt-4 border-t border-brand-border dark:border-neutral-800"
                                                        >
                                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                                <div>
                                                                    <p className="text-[10px] uppercase tracking-widest text-brand-text-secondary mb-1">Source</p>
                                                                    <SourceAttribution
                                                                        sourceName={signal.source || "Sentinel Live Feed"}
                                                                        category="ADVISOR"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] uppercase tracking-widest text-brand-text-secondary mb-1">Conviction Score</p>
                                                                    <p className={cn("text-xs font-bold font-mono", getConvictionColor(signal.conviction))}>
                                                                        {signal.conviction}% — {signal.conviction >= 85 ? "HIGH" : signal.conviction >= 70 ? "MEDIUM" : "LOW"}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="mb-4">
                                                                <p className="text-[10px] uppercase tracking-widest text-brand-text-secondary mb-1">Full Analysis</p>
                                                                <p className="text-xs text-brand-text-primary dark:text-neutral-300 leading-relaxed">
                                                                    {signal.analysis}
                                                                </p>
                                                            </div>

                                                            <div className="mb-4">
                                                                <label htmlFor="sector-select" className="text-[10px] uppercase tracking-widest text-brand-text-secondary mb-1 block">
                                                                    Extraction Sector
                                                                </label>
                                                                <div className="relative">
                                                                    <select
                                                                        id="sector-select"
                                                                        className="w-full bg-brand-background dark:bg-neutral-800 border border-brand-border dark:border-neutral-700 text-xs text-brand-text-primary dark:text-neutral-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-accent appearance-none cursor-pointer"
                                                                        value={selectedSector || ""}
                                                                        onChange={(e) => setSelectedSector(e.target.value || null)}
                                                                    >
                                                                        <option value="">Real Estate (Default)</option>
                                                                        <option value="marine_logistics">Marine / Logistics</option>
                                                                        <option value="tech_ma">Tech / M&A</option>
                                                                    </select>
                                                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-brand-text-secondary">
                                                                        <ChevronRight className="h-3 w-3 rotate-90" />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <Button
                                                                size="sm"
                                                                className="w-full uppercase text-[10px] tracking-widest"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleGenerateMemo(signal);
                                                                }}
                                                                disabled={generating === signal.id}
                                                            >
                                                                {generating === signal.id ? (
                                                                    <>
                                                                        <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                                                        Generating Memo...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FileText className="h-3 w-3 mr-2" />
                                                                        Generate Client Memo
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {!isExpanded && (
                                                    <div className="flex items-center gap-1 mt-2 text-[10px] text-brand-text-secondary">
                                                        <span>Click to expand</span>
                                                        <ChevronRight className="h-3 w-3" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-brand-background dark:bg-neutral-900/50 border-t border-brand-border dark:border-neutral-800">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-widest text-brand-text-secondary">
                            {signals.length} High Conviction Signals
                        </p>
                        <p className="text-[9px] text-brand-text-secondary/60 italic">
                            Next synthesis: Friday 16:00 GMT
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card >
    );
}
