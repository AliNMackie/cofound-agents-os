'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield,
    Plus,
    Upload,
    Trash2,
    Building2,
    UserCircle,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Entity {
    company_number: string;
    company_name?: string;
    counterparty_type: string;
    risk_tier: string;
}

interface PortfolioManagerProps {
    apiBaseUrl?: string;
}

type UserRole = 'ADMIN' | 'ANALYST' | 'VIEWER';

// ─── Role Badge ────────────────────────────────────────────────────────────────

const RoleBadge = ({ role }: { role: UserRole }) => {
    const config = {
        ADMIN: {
            label: 'Admin',
            classes: 'border-violet-500/30 text-violet-400 bg-violet-500/10',
        },
        ANALYST: {
            label: 'Analyst',
            classes: 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10',
        },
        VIEWER: {
            label: 'Viewer',
            classes: 'border-slate-500/30 text-slate-400 bg-slate-500/10',
        },
    }[role];

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border ${config.classes}`}
        >
            <Shield className="w-3 h-3" />
            {config.label}
        </span>
    );
};

// ─── Risk Tier Badge ───────────────────────────────────────────────────────────

const RiskBadge = ({ tier }: { tier: string }) => {
    const styles: Record<string, string> = {
        ELEVATED_RISK: 'border-rose-500/30 text-rose-400 bg-rose-500/10',
        STABLE: 'border-amber-500/30 text-amber-400 bg-amber-500/10',
        IMPROVED: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
        UNSCORED: 'border-slate-700 text-slate-500 bg-slate-800',
    };
    const label = tier.replace('_', ' ');

    return (
        <span
            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${styles[tier] || styles.UNSCORED}`}
        >
            {label}
        </span>
    );
};

// ─── Type Badge ────────────────────────────────────────────────────────────────

const TypeBadge = ({ type }: { type: string }) => {
    const colorMap: Record<string, string> = {
        BORROWER: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
        SUPPLIER: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
        INSURED: 'text-violet-400 border-violet-500/20 bg-violet-500/5',
    };

    return (
        <span
            className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${colorMap[type] || 'text-slate-500 border-slate-700'}`}
        >
            {type}
        </span>
    );
};

// ─── Component ─────────────────────────────────────────────────────────────────

const PortfolioManager: React.FC<PortfolioManagerProps> = ({
    apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
}) => {
    const { user } = useAuth();

    // State
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Add entity form
    const [showAddForm, setShowAddForm] = useState(false);
    const [newCompanyNumber, setNewCompanyNumber] = useState('');
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newType, setNewType] = useState<string>('BORROWER');
    const [addLoading, setAddLoading] = useState(false);

    // CSV upload
    const [uploadLoading, setUploadLoading] = useState(false);

    // Derive role from user custom claims (defaults to VIEWER)
    const userRole: UserRole =
        ((user as any)?.customClaims?.role as UserRole) ||
        ((user as any)?.role as UserRole) ||
        'VIEWER';
    const isAdmin = userRole === 'ADMIN';
    const isAnalystOrAbove = userRole === 'ADMIN' || userRole === 'ANALYST';

    // ── Helpers ────────────────────────────────────────

    const getAuthHeaders = useCallback(async () => {
        if (!user) return {};
        const token = await user.getIdToken();
        return { Authorization: `Bearer ${token}` };
    }, [user]);

    const showMessage = (msg: string, isError = false) => {
        if (isError) {
            setError(msg);
            setTimeout(() => setError(null), 5000);
        } else {
            setSuccess(msg);
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    // ── Fetch Entities ─────────────────────────────────

    const fetchEntities = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${apiBaseUrl}/api/v1/portfolio/entities`, {
                headers: { ...headers, 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            setEntities(data.entities || []);
        } catch (err: any) {
            showMessage(err.message || 'Failed to fetch entities', true);
        } finally {
            setLoading(false);
        }
    }, [user, apiBaseUrl, getAuthHeaders]);

    useEffect(() => {
        fetchEntities();
    }, [fetchEntities]);

    // ── Add Entity ─────────────────────────────────────

    const handleAddEntity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCompanyNumber.trim()) return;
        setAddLoading(true);
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`${apiBaseUrl}/api/v1/portfolio/entities`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_number: newCompanyNumber.trim(),
                    company_name: newCompanyName.trim() || null,
                    counterparty_type: newType,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || `HTTP ${res.status}`);
            }
            showMessage(`Added ${newCompanyNumber.trim()} to monitoring`);
            setNewCompanyNumber('');
            setNewCompanyName('');
            setShowAddForm(false);
            fetchEntities();
        } catch (err: any) {
            showMessage(err.message || 'Failed to add entity', true);
        } finally {
            setAddLoading(false);
        }
    };

    // ── Remove Entity ──────────────────────────────────

    const handleRemoveEntity = async (entityId: string) => {
        if (!confirm(`Remove ${entityId} from monitoring?`)) return;
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(
                `${apiBaseUrl}/api/v1/portfolio/entities/${entityId}`,
                { method: 'DELETE', headers },
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            showMessage(`Removed ${entityId}`);
            fetchEntities();
        } catch (err: any) {
            showMessage(err.message || 'Failed to remove entity', true);
        }
    };

    // ── CSV Upload ─────────────────────────────────────

    const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadLoading(true);
        try {
            const headers = await getAuthHeaders();
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`${apiBaseUrl}/api/v1/portfolio/upload`, {
                method: 'POST',
                headers,
                body: formData,
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || `HTTP ${res.status}`);
            }
            const data = await res.json();
            showMessage(
                `Portfolio ${data.portfolio_id} created: ${data.entities_parsed} entities`,
            );
            fetchEntities();
        } catch (err: any) {
            showMessage(err.message || 'Upload failed', true);
        } finally {
            setUploadLoading(false);
            e.target.value = '';
        }
    };

    // ── Render ─────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* ── Header Bar ──────────────────────────────────────── */}
            <div className="bg-[#0d1117] border border-white/5 rounded-3xl p-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                            <Shield className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">
                                Portfolio Manager
                            </h2>
                            <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                                {user?.email || 'Not authenticated'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <RoleBadge role={userRole} />

                        {isAnalystOrAbove && (
                            <button
                                id="btn-add-entity"
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.15em] hover:bg-cyan-500/20 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Entity
                            </button>
                        )}

                        {isAdmin && (
                            <label
                                id="btn-upload-csv"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-[0.15em] hover:bg-violet-500/20 transition-colors cursor-pointer"
                            >
                                {uploadLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Upload className="w-3.5 h-3.5" />
                                )}
                                Upload CSV
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleCsvUpload}
                                    className="hidden"
                                    disabled={uploadLoading}
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* ── Status Messages ─────────────────────────────── */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-center gap-2"
                        >
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            {success}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── Add Entity Form ─────────────────────────────────── */}
            <AnimatePresence>
                {showAddForm && isAnalystOrAbove && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <form
                            onSubmit={handleAddEntity}
                            className="bg-[#161b22] border border-white/5 rounded-2xl p-6 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                    Add Counterparty
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="text-slate-500 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                                        Company Number *
                                    </label>
                                    <input
                                        id="input-company-number"
                                        type="text"
                                        value={newCompanyNumber}
                                        onChange={(e) => setNewCompanyNumber(e.target.value)}
                                        placeholder="e.g. 12345678 or SC123456"
                                        required
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#0d1117] border border-white/10 text-sm text-white placeholder-slate-600 font-mono focus:border-cyan-500/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                                        Company Name
                                    </label>
                                    <input
                                        id="input-company-name"
                                        type="text"
                                        value={newCompanyName}
                                        onChange={(e) => setNewCompanyName(e.target.value)}
                                        placeholder="Optional"
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#0d1117] border border-white/10 text-sm text-white placeholder-slate-600 focus:border-cyan-500/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">
                                        Counterparty Type
                                    </label>
                                    <select
                                        id="select-counterparty-type"
                                        value={newType}
                                        onChange={(e) => setNewType(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl bg-[#0d1117] border border-white/10 text-sm text-white focus:border-cyan-500/50 focus:outline-none transition-colors appearance-none"
                                    >
                                        <option value="BORROWER">Borrower</option>
                                        <option value="SUPPLIER">Supplier</option>
                                        <option value="INSURED">Insured</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    id="btn-submit-entity"
                                    type="submit"
                                    disabled={addLoading || !newCompanyNumber.trim()}
                                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 text-black text-[10px] font-black uppercase tracking-[0.15em] hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    {addLoading ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Plus className="w-3.5 h-3.5" />
                                    )}
                                    Add to Monitoring
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Entity Table ────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-[#0d1117] border border-white/5 rounded-3xl overflow-hidden shadow-2xl"
            >
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                    <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">
                        Monitored Entities // {entities.length} Active
                    </h3>
                    {loading && (
                        <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-slate-600 text-[9px] uppercase font-black tracking-[0.2em] border-b border-white/5 bg-white/[0.005]">
                                <th className="px-8 py-5">Entity</th>
                                <th className="px-6 py-5">CH Number</th>
                                <th className="px-6 py-5">Type</th>
                                <th className="px-6 py-5">Risk Tier</th>
                                {isAdmin && <th className="px-6 py-5 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-xs">
                            {entities.length === 0 && !loading && (
                                <tr>
                                    <td
                                        colSpan={isAdmin ? 5 : 4}
                                        className="px-8 py-12 text-center text-slate-600 text-sm"
                                    >
                                        <Building2 className="w-8 h-8 mx-auto mb-3 text-slate-700" />
                                        No entities monitored yet.
                                        {isAnalystOrAbove && ' Add one above.'}
                                    </td>
                                </tr>
                            )}
                            {entities.map((entity, idx) => (
                                <motion.tr
                                    key={entity.company_number}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className={`hover:bg-white/[0.02] transition-colors group ${entity.risk_tier === 'ELEVATED_RISK'
                                            ? 'bg-rose-500/[0.03] border-l-2 border-l-rose-500/40'
                                            : ''
                                        }`}
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="w-4 h-4 text-slate-600 flex-shrink-0" />
                                            <span className="font-bold text-slate-300 group-hover:text-white transition-colors whitespace-nowrap">
                                                {entity.company_name || entity.company_number}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-slate-500 font-mono text-[10px]">
                                        {entity.company_number}
                                    </td>
                                    <td className="px-6 py-5">
                                        <TypeBadge type={entity.counterparty_type} />
                                    </td>
                                    <td className="px-6 py-5">
                                        <RiskBadge tier={entity.risk_tier} />
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() =>
                                                    handleRemoveEntity(entity.company_number)
                                                }
                                                className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-rose-500/10 text-slate-600 hover:text-rose-400 transition-all"
                                                title="Remove entity"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    )}
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default PortfolioManager;
