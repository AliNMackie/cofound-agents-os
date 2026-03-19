"use client"

import * as React from "react"
import { ChevronDown, Building2 } from "lucide-react"
import { useSaaSContext } from "@/context/SaaSContext"

export function IndustrySwitcher() {
    const { currentIndustry, setCurrentIndustry, availableIndustries } = useSaaSContext()

    return (
        <div className="flex items-center gap-2 border-l border-neutral-800 ml-4 pl-4">
            <span className="text-xs text-brand-text-secondary uppercase tracking-widest font-bold">Context:</span>
            {/* Simple Select as fallback if DropdownMenu complex */}
            <select
                className="bg-transparent text-sm font-medium outline-none cursor-pointer hover:text-white transition-colors"
                value={currentIndustry.id}
                onChange={(e) => {
                    const ind = availableIndustries.find(i => i.id === e.target.value)
                    if (ind) setCurrentIndustry(ind)
                }}
            >
                {availableIndustries.map(ind => (
                    <option key={ind.id} value={ind.id} className="bg-black text-white">
                        {ind.name}
                    </option>
                ))}
            </select>
        </div>
    )
}
