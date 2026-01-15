"use client"

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { IndustryContext } from '@/types/settings';
import { getIndustries } from '@/lib/api/sentinel';

// Default mock data to initialize the app safely
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
    isRemoteLoaded: boolean;
}

const SaaSContext = createContext<SaaSContextType | undefined>(undefined);

export function SaaSProvider({ children }: { children: ReactNode }) {
    // 1. Safe Initialization: Always start with valid defaults
    const [availableIndustries, setAvailableIndustries] = useState<IndustryContext[]>(DEFAULT_INDUSTRIES);
    const [currentIndustry, setCurrentIndustry] = useState<IndustryContext>(DEFAULT_INDUSTRIES[0]);
    const [isRemoteLoaded, setIsRemoteLoaded] = useState(false);

    useEffect(() => {
        const hydrate = async () => {
            try {
                const liveData = await getIndustries();

                // 2. Safe Update: Only update if we got valid data back
                if (liveData && liveData.length > 0) {
                    setAvailableIndustries(liveData);

                    // Reconcile selection: Keep user's selection if it exists in new list, else reset
                    setCurrentIndustry(prev => {
                        const exists = liveData.find(i => i.id === prev.id);
                        return exists || liveData[0];
                    });
                    setIsRemoteLoaded(true);
                }
            } catch (err) {
                console.warn("Failed to hydrate industries, using fallback:", err);
                // Do nothing; state remains strictly valid with DEFAULT_INDUSTRIES
            }
        };

        hydrate();
    }, []);

    return (
        <SaaSContext.Provider value={{
            currentIndustry,
            setCurrentIndustry,
            availableIndustries,
            isRemoteLoaded
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
