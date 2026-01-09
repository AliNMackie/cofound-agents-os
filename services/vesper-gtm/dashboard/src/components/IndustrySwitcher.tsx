"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu" // Assuming we have this, or I'll stub a simple select if not
import { ChevronDown, Building2 } from "lucide-react"
import { IndustryContext } from "@/types/settings"

const MOCK_INDUSTRIES: IndustryContext[] = [
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
]

export function IndustrySwitcher() {
    const [currentIndustry, setCurrentIndustry] = React.useState(MOCK_INDUSTRIES[0])

    return (
        <div className="flex items-center gap-2 border-l border-neutral-800 ml-4 pl-4">
            <span className="text-xs text-brand-text-secondary uppercase tracking-widest font-bold">Context:</span>
            {/* Simple Select as fallback if DropdownMenu complex */}
            <select
                className="bg-transparent text-sm font-medium outline-none cursor-pointer hover:text-white transition-colors"
                value={currentIndustry.id}
                onChange={(e) => {
                    const ind = MOCK_INDUSTRIES.find(i => i.id === e.target.value)
                    if (ind) setCurrentIndustry(ind)
                }}
            >
                {MOCK_INDUSTRIES.map(ind => (
                    <option key={ind.id} value={ind.id} className="bg-black text-white">
                        {ind.name}
                    </option>
                ))}
            </select>
        </div>
    )
}
