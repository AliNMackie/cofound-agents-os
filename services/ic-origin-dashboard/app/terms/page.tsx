'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-[#05070A] text-slate-300 font-sans selection:bg-emerald-500/30">
            <Navbar onOpenContact={() => { }} />

            <main className="max-w-4xl mx-auto px-6 pt-40 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-8 uppercase tracking-tighter">Terms of Service</h1>
                    <p className="text-sm font-mono text-emerald-500 mb-12 uppercase tracking-widest">Last Updated: March 1, 2026</p>

                    <div className="space-y-12 text-slate-400 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">1. Acceptance of Terms</h2>
                            <p>
                                By accessing or using the IC ORIGIN platform (the "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the Service.
                                Our platform provides institutional-grade market understanding and signal synthesis.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">2. User Conduct</h2>
                            <p className="mb-4">
                                You agree to use the Service only for lawful purposes. You are prohibited from:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Attempting to interfere with the security or integrity of our multi-agent swarm.</li>
                                <li>Reverse engineering or attempting to extract the underlying algorithms of the platform.</li>
                                <li>Using the platform context to generate unlawful or harmful market signals.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">3. Intellectual Property</h2>
                            <p>
                                All content, features, and functionality of the Service, including the "Emerald Orchestrator" algorithms and "Golden_v2.1" data models, are the exclusive property of IC ORIGIN and its licensors.
                                You are granted a limited, non-exclusive, non-transferable license to access the Service for your institutional use.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">4. Disclaimer of Warranties</h2>
                            <p>
                                The Service is provided on an "as is" and "as available" basis. While we strive for maximum precision in our signal synthesis, we do not warrant that the Service will be error-free or uninterrupted.
                                Decisions based on platform telemetry are made at your own risk.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">5. Limitation of Liability</h2>
                            <p>
                                In no event shall IC ORIGIN be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">6. Changes to Terms</h2>
                            <p>
                                We reserve the right to modify these Terms of Service at any time. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">7. Governing Law</h2>
                            <p>
                                These Terms shall be governed by and construed in accordance with the laws of the United Kingdom, without regard to its conflict of law principles.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
};

export default TermsOfService;
