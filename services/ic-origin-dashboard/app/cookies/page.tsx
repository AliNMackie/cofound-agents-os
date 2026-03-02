'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../../components/marketing/Navbar';
import Footer from '../../components/marketing/Footer';

const CookiePolicy = () => {
    return (
        <div className="min-h-screen bg-[#05070A] text-slate-300 font-sans selection:bg-emerald-500/30">
            <Navbar onOpenContact={() => { }} />

            <main className="max-w-4xl mx-auto px-6 pt-40 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-8 uppercase tracking-tighter">Cookie Policy</h1>
                    <p className="text-sm font-mono text-emerald-500 mb-12 uppercase tracking-widest">Effective Date: March 1, 2026</p>

                    <div className="space-y-12 text-slate-400 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">1. What are Cookies?</h2>
                            <p>
                                Cookies are small text files that are stored on your device when you visit a website. They help us remember your preferences, provide a more personalized experience, and understand how our platform is being used.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">2. How We Use Cookies</h2>
                            <p className="mb-4">
                                We use cookies for the following purposes:
                            </p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Essential Cookies:</strong> Necessary for the Service to function, such as maintaining your authentication session.</li>
                                <li><strong>Performance Cookies:</strong> Help us understand how users interact with our platform to improve performance and user experience.</li>
                                <li><strong>Preference Cookies:</strong> Remember your settings and preferences for future visits.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">3. Managing Cookies</h2>
                            <p>
                                You can manage your cookie preferences through your browser settings. Most browsers allow you to block or delete cookies, but doing so may limit your ability to use certain features of the Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">4. Changes to This Policy</h2>
                            <p>
                                We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated effective date.
                            </p>
                        </section>
                    </div>
                </motion.div>
            </main>

            <Footer />
        </div>
    );
};

export default CookiePolicy;
