"use client";

import { useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { AppCard } from "@/components/ui/app-card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, ChevronRight, Wand2 } from "lucide-react";
import { StatusBadgePill } from "@/components/ui/status-badge-pill";

export default function NewsroomPage() {
    const [step, setStep] = useState(1);

    return (
        <LayoutShell>
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-1">Deal Intelligence</h1>
                <p className="text-gray-500">Generate memos, analyze CIMs, and synthesize market data.</p>
            </div>

            {/* 3-Step Flow */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                <div className={`p-6 rounded-2xl border ${step >= 1 ? 'bg-[var(--color-surface)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)]'} relative`}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Step 1</span>
                        {step > 1 && <StatusBadgePill status="success">Completed</StatusBadgePill>}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Upload Deal PDF</h3>
                    <p className="text-sm text-gray-400 mb-4">Upload a CIM, Teaser, or Financial Model to begin analysis.</p>
                    <button className="btn-primary w-full" onClick={() => setStep(2)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                    </button>
                    <div className="absolute top-1/2 -right-6 hidden md:block text-gray-600">
                        <ChevronRight />
                    </div>
                </div>

                <div className={`p-6 rounded-2xl border ${step >= 2 ? 'bg-[var(--color-surface)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)]'} relative`}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Step 2</span>
                        {step > 2 && <StatusBadgePill status="success">Completed</StatusBadgePill>}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Select Template</h3>
                    <p className="text-sm text-gray-400 mb-4">Choose a synthesis framework for your memo.</p>
                    <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:text-white hover:border-white" disabled={step < 2} onClick={() => setStep(3)}>
                        Choose Template
                    </Button>
                    <div className="absolute top-1/2 -right-6 hidden md:block text-gray-600">
                        <ChevronRight />
                    </div>
                </div>

                <div className={`p-6 rounded-2xl border ${step >= 3 ? 'bg-[var(--color-surface)] border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border-[var(--color-border)]'}`}>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Step 3</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Generate Memo</h3>
                    <p className="text-sm text-gray-400 mb-4">AI synthesis of uploaded data and market context.</p>
                    <button className="btn-primary w-full" disabled={step < 3}>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate
                    </button>
                </div>
            </div>

            {/* Prompt Library */}
            <h2 className="text-lg font-bold mb-4">Prompt Library</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AppCard
                    title="Maturity Wall Audit"
                    badges={[<StatusBadgePill key="1" status="info">MACRO</StatusBadgePill>]}
                    action={<Button size="sm" variant="ghost"><ChevronRight className="w-4 h-4" /></Button>}
                    footer="Last used: 2 hours ago"
                >
                    Analyzes 2026/27 debt maturity profiles against current cash flow projections to identify refinancing risks.
                </AppCard>

                <AppCard
                    title="PE Hold Analytics"
                    badges={[<StatusBadgePill key="1" status="warning">DEAL</StatusBadgePill>]}
                    action={<Button size="sm" variant="ghost"><ChevronRight className="w-4 h-4" /></Button>}
                    footer="Last used: Yesterday"
                >
                    Evaluates hold period returns and potential exit multiple compression in the current rate environment.
                </AppCard>

                <AppCard
                    title="Covenant Stress Test"
                    badges={[<StatusBadgePill key="1" status="critical">RISK</StatusBadgePill>]}
                    action={<Button size="sm" variant="ghost"><ChevronRight className="w-4 h-4" /></Button>}
                    footer="Last used: 3 days ago"
                >
                    Simulates EBITDA contraction scenarios to predict covenant breaches (Leverage/ICR).
                </AppCard>
            </div>
        </LayoutShell>
    );
}
