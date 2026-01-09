"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { IndustryContext, DataSource } from '@/types/settings';

// Default mock data to initialize the app
const DEFAULT_INDUSTRIES: IndustryContext[] = [
    {
        id: "private-credit",
        name: "Private Credit",
        macroContext: "Context: 2026 Refi Cliff. Focus: EBITDA, Covenant Breaches.",
        defaultPlaybooks: []
    },
    {
        id: "real-estate",
        name: "Commercial Real Estate",
        macroContext: "Context: Office Vacancy Rates. Focus: Cap Rates, Occupancy.",
        defaultPlaybooks: []
    }
];

interface SaaSContextType {
    currentIndustry: IndustryContext;
    setCurrentIndustry: (industry: IndustryContext) => void;
    availableIndustries: IndustryContext[];
}

const SaaSContext = createContext<SaaSContextType | undefined>(undefined);

export function SaaSProvider({ children }: { children: ReactNode }) {
    const [currentIndustry, setCurrentIndustry] = useState<IndustryContext>(DEFAULT_INDUSTRIES[0]);

    return (
        <SaaSContext.Provider value={{
            currentIndustry,
            setCurrentIndustry,
            availableIndustries: DEFAULT_INDUSTRIES
        }}>
            {children}
        </SaaSContext.Provider>
    );
}

export function useSaaSContext() {
    const context = useContext(SaaSContext);
    if (context === undefined) {
        throw new Error('useSaaSContext must be used within a SaaSProvider');
    }
    return context;
}
