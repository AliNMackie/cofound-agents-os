'use client';

import { useState } from 'react';
import { AuctionData } from '@/types/sentinel';
import { ingestAuction, getMockAuction } from '@/lib/api/sentinel';
import CompanyProfileCard from '@/components/CompanyProfileCard';

export default function MissionsPage() {
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Sentinel Growth</h1>
                            <p className="text-sm text-slate-600 mt-1">Market Intelligence Platform</p>
                        </div>
                        <button
                            onClick={loadMockData}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Load Demo Data
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Panel - Input */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Input Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                Analyze Market Intelligence
                            </h2>

                            <textarea
                                value={sourceText}
                                onChange={(e) => setSourceText(e.target.value)}
                                placeholder="Paste article text, news snippet, or market intelligence here..."
                                className="w-full h-40 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                            />

                            {error && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                {loading ? 'Analyzing...' : 'Extract & Enrich'}
                            </button>
                        </div>

                        {/* Results Card */}
                        {result && (
                            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                    Extracted Intelligence
                                </h2>

                                <div className="space-y-4">
                                    {/* Company Name */}
                                    <div>
                                        <dt className="text-xs uppercase text-slate-500 font-medium mb-1">
                                            Company
                                        </dt>
                                        <dd className="text-lg font-semibold text-slate-900">
                                            {result.company_name}
                                        </dd>
                                    </div>

                                    {/* Description */}
                                    {result.company_description && (
                                        <div>
                                            <dt className="text-xs uppercase text-slate-500 font-medium mb-1">
                                                Description
                                            </dt>
                                            <dd className="text-sm text-slate-700">
                                                {result.company_description}
                                            </dd>
                                        </div>
                                    )}

                                    {/* Financial Metrics */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {result.ebitda && (
                                            <div className="bg-slate-50 rounded-lg p-4">
                                                <dt className="text-xs uppercase text-slate-500 font-medium mb-1">
                                                    EBITDA
                                                </dt>
                                                <dd className="text-xl font-bold text-slate-900">
                                                    {result.ebitda}
                                                </dd>
                                            </div>
                                        )}

                                        {result.ownership && (
                                            <div className="bg-slate-50 rounded-lg p-4">
                                                <dt className="text-xs uppercase text-slate-500 font-medium mb-1">
                                                    Ownership
                                                </dt>
                                                <dd className="text-sm font-semibold text-slate-900">
                                                    {result.ownership}
                                                </dd>
                                            </div>
                                        )}
                                    </div>

                                    {/* Advisor & Status */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {result.advisor && (
                                            <div>
                                                <dt className="text-xs uppercase text-slate-500 font-medium mb-1">
                                                    Advisor
                                                </dt>
                                                <dd className="text-sm text-slate-700">
                                                    {result.advisor}
                                                </dd>
                                            </div>
                                        )}

                                        <div>
                                            <dt className="text-xs uppercase text-slate-500 font-medium mb-1">
                                                Process Status
                                            </dt>
                                            <dd className="text-sm font-medium text-slate-900">
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
                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                                <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-sm text-slate-500">
                                    Company profile will appear here after analysis
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
