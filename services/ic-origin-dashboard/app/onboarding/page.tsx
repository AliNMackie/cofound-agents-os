'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Building2, Key, Users, Check, Copy, AlertTriangle,
    ArrowRight, ArrowLeft, Shield, Sparkles
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────

interface TeamMember {
    email: string;
    role: 'ANALYST' | 'VIEWER';
}

// ── Component ──────────────────────────────────────────────────

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [tenantName, setTenantName] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiKeyId, setApiKeyId] = useState('');
    const [apiKeyCopied, setApiKeyCopied] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
        { email: '', role: 'ANALYST' },
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [completed, setCompleted] = useState(false);

    // ── Step 1: Confirm Tenant ──

    const handleConfirmTenant = useCallback(async () => {
        if (!tenantName.trim()) {
            setError('Please enter your company name.');
            return;
        }
        setError('');
        setStep(2);
    }, [tenantName]);

    // ── Step 2: Generate API Key ──

    const handleGenerateKey = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('authToken') || '';
            const response = await fetch('/api/v1/keys/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    label: `${tenantName} — Onboarding Key`,
                    scopes: ['read', 'write'],
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to generate key: ${response.statusText}`);
            }

            const data = await response.json();
            setApiKey(data.key);
            setApiKeyId(data.id);
        } catch (err: any) {
            setError(err.message || 'Failed to generate API key.');
        } finally {
            setLoading(false);
        }
    }, [tenantName]);

    const handleCopyKey = useCallback(() => {
        navigator.clipboard.writeText(apiKey);
        setApiKeyCopied(true);
        setTimeout(() => setApiKeyCopied(false), 3000);
    }, [apiKey]);

    // ── Step 3: Invite Team ──

    const addTeamMember = useCallback(() => {
        setTeamMembers((prev) => [...prev, { email: '', role: 'ANALYST' }]);
    }, []);

    const updateTeamMember = useCallback(
        (index: number, field: keyof TeamMember, value: string) => {
            setTeamMembers((prev) =>
                prev.map((m, i) =>
                    i === index ? { ...m, [field]: value } : m
                )
            );
        },
        []
    );

    const removeTeamMember = useCallback((index: number) => {
        setTeamMembers((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleInviteTeam = useCallback(async () => {
        const validMembers = teamMembers.filter((m) => m.email.includes('@'));
        if (validMembers.length === 0) {
            // Allow skipping — no team members is fine
            setCompleted(true);
            return;
        }

        setLoading(true);
        setError('');

        try {
            // In production, this would call a backend invitation API
            // For now, we simulate success
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setCompleted(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send invitations.');
        } finally {
            setLoading(false);
        }
    }, [teamMembers]);

    // ── Step Indicators ──

    const steps = [
        { num: 1, label: 'Company', icon: Building2 },
        { num: 2, label: 'API Key', icon: Key },
        { num: 3, label: 'Team', icon: Users },
    ];

    // ── Render ──

    if (completed) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-lg w-full text-center"
                >
                    <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-3">
                        Welcome to IC Origin
                    </h1>
                    <p className="text-slate-400 mb-8">
                        Your tenant <span className="text-white font-bold">{tenantName}</span> is ready.
                        Your team invitations have been sent.
                    </p>
                    <a
                        href="/dashboard"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors"
                    >
                        Enter Dashboard
                        <ArrowRight className="w-4 h-4" />
                    </a>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-8">
            <div className="max-w-xl w-full">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="w-12 h-12 mx-auto mb-4 bg-violet-500/10 border border-violet-500/20 rounded-2xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-violet-400" />
                    </div>
                    <h1 className="text-2xl font-black text-white">
                        Set Up Your Workspace
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Complete these steps to activate your IC Origin tenant
                    </p>
                </div>

                {/* Step Indicators */}
                <div className="flex items-center justify-center gap-4 mb-10">
                    {steps.map((s, i) => (
                        <React.Fragment key={s.num}>
                            <div className="flex flex-col items-center gap-1.5">
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${step > s.num
                                            ? 'bg-emerald-500/20 border-emerald-500/30'
                                            : step === s.num
                                                ? 'bg-white/10 border-white/20'
                                                : 'bg-white/5 border-white/5'
                                        }`}
                                >
                                    {step > s.num ? (
                                        <Check className="w-4 h-4 text-emerald-400" />
                                    ) : (
                                        <s.icon
                                            className={`w-4 h-4 ${step === s.num ? 'text-white' : 'text-slate-600'
                                                }`}
                                        />
                                    )}
                                </div>
                                <span
                                    className={`text-[9px] font-bold uppercase tracking-wider ${step >= s.num ? 'text-slate-300' : 'text-slate-600'
                                        }`}
                                >
                                    {s.label}
                                </span>
                            </div>
                            {i < steps.length - 1 && (
                                <div
                                    className={`w-12 h-px ${step > s.num ? 'bg-emerald-500/30' : 'bg-white/5'
                                        }`}
                                />
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3"
                        >
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            <p className="text-xs text-rose-300">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    {/* ── Step 1: Confirm Tenant ── */}
                    {step === 1 && (
                        <motion.div
                            key="step-1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-[#0d1117] border border-white/10 rounded-2xl p-8"
                        >
                            <h2 className="text-lg font-bold text-white mb-1">
                                Confirm Your Company
                            </h2>
                            <p className="text-xs text-slate-500 mb-6">
                                This will be your tenant name across IC Origin.
                            </p>

                            <label className="block mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Company / Tenant Name
                            </label>
                            <input
                                type="text"
                                value={tenantName}
                                onChange={(e) => setTenantName(e.target.value)}
                                placeholder="e.g. Barclays Capital, BlueCrest Partners"
                                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                                autoFocus
                            />

                            <button
                                onClick={handleConfirmTenant}
                                className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}

                    {/* ── Step 2: Generate API Key ── */}
                    {step === 2 && (
                        <motion.div
                            key="step-2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-[#0d1117] border border-white/10 rounded-2xl p-8"
                        >
                            <h2 className="text-lg font-bold text-white mb-1">
                                Generate Your API Key
                            </h2>
                            <p className="text-xs text-slate-500 mb-6">
                                For programmatic access. This key will only be shown once.
                            </p>

                            {!apiKey ? (
                                <button
                                    onClick={handleGenerateKey}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-violet-500 text-white font-bold rounded-xl hover:bg-violet-400 transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Key className="w-4 h-4" />
                                    )}
                                    {loading ? 'Generating...' : 'Generate API Key'}
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-black/50 border border-emerald-500/20 rounded-xl">
                                        <label className="block mb-2 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                                            Your API Key (shown once)
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 text-xs text-emerald-300 font-mono break-all bg-emerald-500/5 px-3 py-2 rounded-lg">
                                                {apiKey}
                                            </code>
                                            <button
                                                onClick={handleCopyKey}
                                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors"
                                            >
                                                {apiKeyCopied ? (
                                                    <Check className="w-4 h-4 text-emerald-400" />
                                                ) : (
                                                    <Copy className="w-4 h-4 text-emerald-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl flex items-start gap-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-amber-300">
                                            Store this key securely. It cannot be retrieved after you leave this page.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3 mt-6">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex items-center gap-1 px-4 py-3 text-slate-400 hover:text-white transition-colors text-sm"
                                >
                                    <ArrowLeft className="w-3 h-3" />
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={!apiKey}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Continue
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── Step 3: Invite Team ── */}
                    {step === 3 && (
                        <motion.div
                            key="step-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-[#0d1117] border border-white/10 rounded-2xl p-8"
                        >
                            <h2 className="text-lg font-bold text-white mb-1">
                                Invite Your Team
                            </h2>
                            <p className="text-xs text-slate-500 mb-6">
                                Add analysts and viewers. You can always add more later.
                            </p>

                            <div className="space-y-3">
                                {teamMembers.map((member, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <input
                                            type="email"
                                            value={member.email}
                                            onChange={(e) =>
                                                updateTeamMember(idx, 'email', e.target.value)
                                            }
                                            placeholder="colleague@company.com"
                                            className="flex-1 px-3 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                                        />
                                        <select
                                            value={member.role}
                                            onChange={(e) =>
                                                updateTeamMember(idx, 'role', e.target.value)
                                            }
                                            className="px-3 py-2.5 bg-black/50 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-violet-500/50 appearance-none"
                                        >
                                            <option value="ANALYST">Analyst</option>
                                            <option value="VIEWER">Viewer</option>
                                        </select>
                                        {teamMembers.length > 1 && (
                                            <button
                                                onClick={() => removeTeamMember(idx)}
                                                className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={addTeamMember}
                                className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                            >
                                + Add Another Member
                            </button>

                            <div className="flex items-center gap-3 mt-6">
                                <button
                                    onClick={() => setStep(2)}
                                    className="flex items-center gap-1 px-4 py-3 text-slate-400 hover:text-white transition-colors text-sm"
                                >
                                    <ArrowLeft className="w-3 h-3" />
                                    Back
                                </button>
                                <button
                                    onClick={handleInviteTeam}
                                    disabled={loading}
                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4" />
                                    )}
                                    {loading ? 'Setting Up...' : 'Complete Setup'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
