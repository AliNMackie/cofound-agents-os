'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-[#05070A] text-slate-300 font-sans selection:bg-emerald-500/30">
            <Navbar onOpenContact={() => { }} />

            <main className="max-w-4xl mx-auto px-6 pt-40 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-8 uppercase tracking-tighter">Privacy Policy</h1>
                    <p className="text-sm font-mono text-emerald-500 mb-12 uppercase tracking-widest">Effective Date: March 1, 2026</p>

                    <div className="space-y-12 text-slate-400 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">1. Overview</h2>
                            <p>
                                IC ORIGIN ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by IC ORIGIN.
                                Our platform is designed for institutional market analysis, and we prioritize the security and confidentiality of all data processed through our multi-agent swarm.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">2. Information Collection</h2>
                            <p className="mb-4">
                                We collect information that you provide directly to us when you:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Request a demo or contact us.</li>
                                <li>Sign in using Google Authentication.</li>
                                <li>Interact with our platform features (e.g., Command Terminal).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">3. Use of Information</h2>
                            <p className="mb-4">
                                We use the information we collect to:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Provide, maintain, and improve our platform services.</li>
                                <li>Respond to your comments, questions, and requests.</li>
                                <li>Understand usage patterns and optimize our multi-agent orchestration.</li>
                                <li>Comply with legal obligations and protect our rights.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">4. Data Security</h2>
                            <p>
                                We implement industry-standard security measures to protect your information from unauthorized access, disclosure, alteration, and destruction.
                                This includes encryption of data at rest and in transit, and strictly controlled access to our production infrastructure.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">5. Contact Us</h2>
                            <p>
                                If you have any questions about this Privacy Policy, please contact us at:
                                <br />
                                <span className="text-emerald-500 font-bold mt-2 block">legal@icorigin.ai</span>
                            </p>
                        </section>
                    </div>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
