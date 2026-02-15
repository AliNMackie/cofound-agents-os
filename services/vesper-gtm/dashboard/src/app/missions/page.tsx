'use client';

import { useState, useEffect } from 'react';
import { AuctionData, IntelligenceSignal } from '@/types/sentinel';
import { ingestAuction, getMockAuction, getSignals } from '@/lib/api/sentinel';
import CompanyProfileCard from '@/components/CompanyProfileCard';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, Building2, FileText, Search, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketWatchPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-black">
            {/* Header */}
            <header className="bg-white dark:bg-black border-b border-brand-border dark:border-neutral-800 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-brand-text-primary dark:text-white flex items-center gap-2">
                                <Search className="h-6 w-6" />
                                Market Watch
                            </h1>
                            <p className="text-sm text-brand-text-secondary dark:text-neutral-400 mt-1">
                                Real-time Shadow Market & Registry Intelligence
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <Tabs defaultValue="shadow-market" className="space-y-6">
                    <TabsList className="bg-white dark:bg-neutral-900 border border-brand-border dark:border-neutral-800 p-1">
                        <TabsTrigger value="shadow-market" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
                            Shadow Market
                        </TabsTrigger>
                        <TabsTrigger value="analyst-tools" className="data-[state=active]:bg-black data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black">
                            Analyst Workbench
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="shadow-market">
                        <ShadowMarketFeed />
                    </TabsContent>

                    <TabsContent value="analyst-tools">
                        <AnalystWorkbench />
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

function ShadowMarketFeed() {
    const [signals, setSignals] = useState<IntelligenceSignal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadSignals = async () => {
        setLoading(true);
        try {
            // Fetch specifically GOV_REGISTRY signals (Shadow Market)
            const data = await getSignals(undefined, 30, undefined, "GOV_REGISTRY");
            setSignals(data);
        } catch (err) {
            console.error("Failed to load shadow market signals", err);
            setError("Failed to load signals. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSignals();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-900">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                <p>{error}</p>
                <button onClick={loadSignals} className="mt-4 underline text-sm">Retry</button>
            </div>
        );
    }

    if (signals.length === 0) {
        return (
            <div className="p-12 text-center text-neutral-500 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-semibold mb-1">No Shadow Market Signals</h3>
                <p className="text-sm max-w-md mx-auto">
                    No registry events (Charges, Winding Up Petitions, PSC Changes) detected in the last 30 days.
                </p>
            </div>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {signals.map((signal) => (
                <ShadowSignalCard key={signal.id} signal={signal} />
            ))}
        </div>
    );
}

function ShadowSignalCard({ signal }: { signal: IntelligenceSignal }) {
    return (
        <Card className="hover:shadow-md transition-shadow dark:bg-neutral-900 dark:border-neutral-800">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 border-0">
                        {signal.category.replace(/_/g, " ")}
                    </Badge>
                    <span className="text-[10px] text-neutral-400 font-mono">
                        {new Date(signal.timestamp).toLocaleDateString()}
                    </span>
                </div>
                <CardTitle className="text-base leading-tight mt-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                    <span className="truncate" title={signal.headline}>{signal.headline}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-3 mb-4 min-h-[3rem]">
                    {signal.analysis}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-neutral-400 uppercase">Conviction</span>
                        <span className={cn(
                            "text-sm font-bold",
                            signal.conviction > 75 ? "text-green-600" : "text-amber-600"
                        )}>{signal.conviction}%</span>
                    </div>

                    {signal.source_link && (
                        <a
                            href={signal.source_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            View Source <ExternalLink className="h-3 w-3" />
                        </a>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function AnalystWorkbench() {
    const [sourceText, setSourceText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AuctionData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!sourceText.trim()) {
            setError('Please enter some text to analyze');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = await ingestAuction({
                source_text: sourceText,
                source_origin: 'manual_input'
            });
            setResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to analyze text');
            console.error('Analysis error:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadMockData = () => {
        setResult(getMockAuction());
        setSourceText('GameNation, owned by Morgan Stanley Private Equity, has postponed its sale process. The business has an EBITDA of £5.5m. Global Leisure Partners is advising on the process, which was expected in H1 2024.');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Input */}
            <div className="lg:col-span-2 space-y-6">
                {/* Input Card */}
                <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-brand-border dark:border-neutral-800 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-brand-text-primary dark:text-white">
                            Raw Intelligence Ingestion
                        </h2>
                        <button
                            onClick={loadMockData}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Load Demo Data
                        </button>
                    </div>

                    <label htmlFor="intelligence-input" className="sr-only">Analyze Market Intelligence</label>
                    <textarea
                        id="intelligence-input"
                        name="intelligence-input"
                        value={sourceText}
                        onChange={(e) => setSourceText(e.target.value)}
                        placeholder="Paste article text, news snippet, or market intelligence here..."
                        className="w-full h-40 px-4 py-3 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white resize-none text-sm"
                        autoComplete="off"
                    />

                    {error && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="mt-4 w-full bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                        {loading ? 'Analyzing...' : 'Extract & Enrich'}
                    </button>
                </div>

                {/* Results Card */}
                {result && (
                    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm border border-brand-border dark:border-neutral-800 p-6">
                        <h2 className="text-lg font-semibold text-brand-text-primary dark:text-white mb-4">
                            Extracted Intelligence
                        </h2>

                        <div className="space-y-4">
                            {/* Company Name */}
                            <div>
                                <dt className="text-xs uppercase text-brand-text-secondary font-medium mb-1">
                                    Company
                                </dt>
                                <dd className="text-lg font-semibold text-brand-text-primary dark:text-white">
                                    {result.company_name}
                                </dd>
                            </div>

                            {/* Description */}
                            {result.company_description && (
                                <div>
                                    <dt className="text-xs uppercase text-brand-text-secondary font-medium mb-1">
                                        Description
                                    </dt>
                                    <dd className="text-sm text-brand-text-primary dark:text-neutral-300">
                                        {result.company_description}
                                    </dd>
                                </div>
                            )}

                            {/* Financial Metrics */}
                            <div className="grid grid-cols-2 gap-4">
                                {result.ebitda && (
                                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                                        <dt className="text-xs uppercase text-brand-text-secondary font-medium mb-1">
                                            EBITDA
                                        </dt>
                                        <dd className="text-xl font-bold text-brand-text-primary dark:text-white">
                                            {result.ebitda}
                                        </dd>
                                    </div>
                                )}

                                {result.ownership && (
                                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                                        <dt className="text-xs uppercase text-brand-text-secondary font-medium mb-1">
                                            Ownership
                                        </dt>
                                        <dd className="text-sm font-semibold text-brand-text-primary dark:text-white">
                                            {result.ownership}
                                        </dd>
                                    </div>
                                )}
                            </div>

                            {/* Advisor & Status */}
                            <div className="grid grid-cols-2 gap-4">
                                {result.advisor && (
                                    <div>
                                        <dt className="text-xs uppercase text-brand-text-secondary font-medium mb-1">
                                            Advisor
                                        </dt>
                                        <dd className="text-sm text-brand-text-primary dark:text-neutral-300">
                                            {result.advisor}
                                        </dd>
                                    </div>
                                )}

                                <div>
                                    <dt className="text-xs uppercase text-brand-text-secondary font-medium mb-1">
                                        Process Status
                                    </dt>
                                    <dd className="text-sm font-medium text-brand-text-primary dark:text-white">
                                        {result.process_status}
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel - Company Profile */}
            <div className="lg:col-span-1">
                {result?.company_profile ? (
                    <CompanyProfileCard profile={result.company_profile} />
                ) : (
                    <div className="bg-neutral-50 dark:bg-neutral-900 border border-brand-border dark:border-neutral-800 rounded-lg p-6 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
                        <Building2 className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-3" />
                        <p className="text-sm text-brand-text-secondary dark:text-neutral-500">
                            Company profile will appear here after analysis
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
