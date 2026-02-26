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

export default function MarketingPage() {
    return (
        <main className="min-h-screen bg-[#05070A] selection:bg-emerald-500/30">
            <Navbar />
            <Hero />
            <SocialProof />
            <HowItWorks />
            <Benefits />
            <ProductTour />
            <UseCases />
            <FinalCTA />
            <Footer />
        </main>
    );
}
