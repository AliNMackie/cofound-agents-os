'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
    const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success'>('idle');

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus('submitting');

        const formData = new FormData(e.currentTarget);
        try {
            await fetch("/", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams(formData as any).toString(),
            });
            setStatus('success');
        } catch (error) {
            console.error("Form submission error:", error);
            setStatus('idle');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#05070A]/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-[#0d1117] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-8"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
                        >
                            <X size={24} />
                        </button>

                        {status === 'success' ? (
                            <div className="py-12 text-center">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <div className="w-8 h-8 bg-emerald-500 rounded-full" />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Request Received</h3>
                                <p className="text-slate-400">Our engineering team will reach out within 24 hours.</p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Book a 15-Minute Demo</h2>
                                <p className="text-slate-400 mb-8">See high-fidelity signal synthesis in action.</p>

                                <form
                                    name="demo-request"
                                    method="POST"
                                    data-netlify="true"
                                    onSubmit={handleSubmit}
                                    className="space-y-4"
                                >
                                    <input type="hidden" name="form-name" value="demo-request" />

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Name</label>
                                        <input
                                            required
                                            type="text"
                                            name="name"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                                            placeholder="Alastair Mackie"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Work Email</label>
                                        <input
                                            required
                                            type="email"
                                            name="email"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                                            placeholder="alastair@iapetusai.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Organization</label>
                                        <input
                                            required
                                            type="text"
                                            name="company"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                                            placeholder="Iapetus AI"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={status === 'submitting'}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-emerald-600/20"
                                    >
                                        {status === 'submitting' ? 'Processing...' : 'Schedule Walkthrough'}
                                    </button>
                                </form>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ContactModal;
