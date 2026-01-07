import { Check, Info, Shield, Zap, TrendingUp, Download, Newspaper, Database } from 'lucide-react';

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-50 font-sans selection:bg-blue-500 selection:text-white">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tighter text-white leading-none">
                                IC ORIGIN
                            </h1>
                            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                                Market Intelligence
                            </p>
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
                        <a href="#" className="hover:text-white transition-colors">Platform</a>
                        <a href="#" className="hover:text-white transition-colors">Research</a>
                        <a href="#" className="text-white">Pricing</a>
                        <a href="#" className="ml-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs uppercase tracking-wide transition-colors">
                            Client Login
                        </a>
                    </nav>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
                {/* Hero */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-white">
                        The Source of <span className="text-blue-500">Deal Flow</span>
                    </h2>
                    <p className="text-lg text-slate-400 leading-relaxed">
                        Institutional-grade market intelligence for deal originators.
                        <br className="hidden md:block" />
                        Real-time auction tracking, deep enrichment, and AI-driven thesis generation.
                    </p>
                </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto relative">

                    {/* Scout Tier */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 flex flex-col hover:border-slate-600 transition-colors">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Origin Scout</h3>
                            <p className="text-sm text-slate-400">For Analysts & Researchers</p>
                        </div>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-white">£0</span>
                            <span className="text-slate-500 ml-2">/ month</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-8 pb-8 border-b border-slate-700">
                            Essential market monitoring. Join the waitlist for free weekly intelligence.
                        </p>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-blue-500 shrink-0" />
                                <span className="text-sm text-slate-300">Weekly "Failed Auction" PDF</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-blue-500 shrink-0" />
                                <span className="text-sm text-slate-300">Top 3 Deal Signals</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-blue-500 shrink-0" />
                                <span className="text-sm text-slate-300">Basic Market Commentary</span>
                            </li>
                            <li className="flex items-start gap-3 opacity-50">
                                <Shield className="w-5 h-5 text-slate-600 shrink-0" />
                                <span className="text-sm text-slate-500">No Dashboard Access</span>
                            </li>
                        </ul>
                        <button className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors text-sm uppercase tracking-wide">
                            Join Scout List
                        </button>
                    </div>

                    {/* Pro Tier - Popular */}
                    <div className="bg-slate-800 border-2 border-blue-600 rounded-xl p-8 flex flex-col relative shadow-2xl shadow-blue-900/20 transform scale-105 z-10">
                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg uppercase tracking-wider">
                            Most Popular
                        </div>
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Origin Pro</h3>
                            <p className="text-sm text-blue-200">For Deal Partners & Originators</p>
                        </div>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-white">£250</span>
                            <span className="text-slate-400 ml-2">/ month</span>
                        </div>
                        <p className="text-sm text-slate-300 mb-8 pb-8 border-b border-slate-700">
                            The core platform. Complete access to real-time intelligence and enrichment.
                        </p>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-start gap-3">
                                <TrendingUp className="w-5 h-5 text-blue-400 shrink-0" />
                                <span className="text-sm text-white font-medium">IC Origin Dashboard (Real-time)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Database className="w-5 h-5 text-blue-400 shrink-0" />
                                <span className="text-sm text-slate-300">Deep Enrichment (Companies House + Financials)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Newspaper className="w-5 h-5 text-blue-400 shrink-0" />
                                <span className="text-sm text-slate-300">The Newsroom (AI-Generated Memos)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Download className="w-5 h-5 text-blue-400 shrink-0" />
                                <span className="text-sm text-slate-300">Unlimited CSV Exports</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-blue-400 shrink-0" />
                                <span className="text-sm text-slate-300">Priority Support</span>
                            </li>
                        </ul>
                        <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-sm uppercase tracking-wide shadow-lg shadow-blue-900/50">
                            Request Access
                        </button>
                    </div>

                    {/* Enterprise Tier */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 flex flex-col hover:border-slate-600 transition-colors">
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Origin Enterprise</h3>
                            <p className="text-sm text-slate-400">For Investment Committees</p>
                        </div>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-white">Custom</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-8 pb-8 border-b border-slate-700">
                            Bespoke intelligence solutions for large investment teams and funds.
                        </p>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-slate-400 shrink-0" />
                                <span className="text-sm text-slate-300">White-Label Newsletters (Your Logo)</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-slate-400 shrink-0" />
                                <span className="text-sm text-slate-300">Custom AI Thesis Training</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-slate-400 shrink-0" />
                                <span className="text-sm text-slate-300">Full API Access</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-slate-400 shrink-0" />
                                <span className="text-sm text-slate-300">Dedicated Account Manager</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-slate-400 shrink-0" />
                                <span className="text-sm text-slate-300">SLA & Enterprise Security</span>
                            </li>
                        </ul>
                        <button className="w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors text-sm uppercase tracking-wide">
                            Contact IR
                        </button>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto mt-24 border-t border-slate-800 pt-16">
                    <h3 className="text-2xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h3>
                    <div className="space-y-6">
                        <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-800">
                            <h4 className="flex items-center gap-2 text-lg font-semibold text-white mb-2">
                                <Info className="w-5 h-5 text-blue-500" />
                                Where does the data come from?
                            </h4>
                            <p className="text-slate-400 text-sm leading-relaxed ml-7">
                                Our platform performs real-time market sweeps of thousands of news sources and auction announcements daily.
                                We then enrich this raw data using direct integration with Companies House and other financial registries
                                to provide a complete picture of every opportunity.
                            </p>
                        </div>

                        <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-800">
                            <h4 className="flex items-center gap-2 text-lg font-semibold text-white mb-2">
                                <Info className="w-5 h-5 text-blue-500" />
                                How often is the intelligence updated?
                            </h4>
                            <p className="text-slate-400 text-sm leading-relaxed ml-7">
                                Origin Pro dashboard updates in real-time as signals are detected. The "Failed Auction" reports
                                and Scout newsletters are generated and distributed weekly on Monday mornings.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Start Trial CTA */}
                <div className="mt-24 text-center">
                    <p className="text-slate-500 text-sm mb-4">Ready to see what you're missing?</p>
                    <button className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                        Start your 14-day Pro trial
                        <TrendingUp className="w-4 h-4" />
                    </button>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-12 bg-slate-900">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-center md:text-left">
                        <h2 className="text-sm font-bold text-white tracking-widest uppercase mb-1">IC ORIGIN</h2>
                        <p className="text-xs text-slate-500">© 2026 IC Origin Ltd. All rights reserved.</p>
                    </div>
                    <div className="flex gap-6 text-xs text-slate-500">
                        <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
