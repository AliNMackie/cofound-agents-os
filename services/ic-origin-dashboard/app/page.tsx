'use client';

import React from 'react';
import Navbar from '../components/marketing/Navbar';
import Hero from '../components/marketing/Hero';
import SocialProof from '../components/marketing/SocialProof';
import HowItWorks from '../components/marketing/HowItWorks';
import Benefits from '../components/marketing/Benefits';
import ProductTour from '../components/marketing/ProductTour';
import UseCases from '../components/marketing/UseCases';
import FinalCTA from '../components/marketing/FinalCTA';
import Footer from '../components/marketing/Footer';
import ContactModal from '../components/marketing/ContactModal';

export default function MarketingPage() {
    const [mounted, setMounted] = React.useState(false);
    const [isContactOpen, setIsContactOpen] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <main className="min-h-screen bg-[#05070A]" />;

    return (
        <main className="min-h-screen bg-[#05070A] selection:bg-emerald-500/30">
            <Navbar onOpenContact={() => setIsContactOpen(true)} />
            <Hero onOpenContact={() => setIsContactOpen(true)} />
            <SocialProof />
            <HowItWorks />
            <Benefits />
            <ProductTour />
            <UseCases />
            <FinalCTA onOpenContact={() => setIsContactOpen(true)} />
            <Footer />

            <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
        </main>
    );
}
