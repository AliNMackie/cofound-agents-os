import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Globe,
    Building2,
    Landmark,
    Briefcase,
    ExternalLink
} from "lucide-react";

type SourceCategory = "AUCTION" | "ADVISOR" | "INSTITUTION" | "REGULATOR";

interface SourceAttributionProps {
    sourceName: string;
    category?: SourceCategory;
    className?: string;
    url?: string;
}

const CATEGORY_ICONS: Record<SourceCategory, React.ElementType> = {
    AUCTION: Globe,
    ADVISOR: Briefcase,
    INSTITUTION: Building2,
    REGULATOR: Landmark,
};

const CATEGORY_COLORS: Record<SourceCategory, string> = {
    AUCTION: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    ADVISOR: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
    INSTITUTION: "text-amber-600 bg-amber-50 dark:bg-amber-900/20",
    REGULATOR: "text-green-600 bg-green-50 dark:bg-green-900/20",
};

export function SourceAttribution({ sourceName, category = "AUCTION", className, url }: SourceAttributionProps) {
    const Icon = CATEGORY_ICONS[category];
    const colorClass = CATEGORY_COLORS[category];

    const Content = (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-opacity hover:opacity-80",
                colorClass,
                className
            )}
        >
            <Icon className="h-3 w-3" />
            <span className="truncate max-w-[120px]">Found via: {sourceName}</span>
            {url && <ExternalLink className="h-2.5 w-2.5 ml-0.5 opacity-50" />}
        </div>
    );

    if (url) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                {Content}
            </a>
        );
    }

    return Content;
}

// Pre-defined source mappings for common sources
export const SOURCE_MAPPINGS: Record<string, { name: string; category: SourceCategory }> = {
    "the_gazette": { name: "The Gazette", category: "REGULATOR" },
    "companies_house": { name: "Companies House", category: "REGULATOR" },
    "rothschild": { name: "Rothschild & Co", category: "ADVISOR" },
    "kpmg": { name: "KPMG Restructuring", category: "ADVISOR" },
    "deloitte": { name: "Deloitte", category: "ADVISOR" },
    "allsop": { name: "Allsop Auctions", category: "AUCTION" },
    "acuitus": { name: "Acuitus", category: "AUCTION" },
    "euro_auctions": { name: "Euro Auctions", category: "AUCTION" },
    "exponent": { name: "Exponent PE", category: "INSTITUTION" },
    "ldc": { name: "LDC", category: "INSTITUTION" },
};

export function getSourceInfo(sourceKey: string): { name: string; category: SourceCategory } {
    return SOURCE_MAPPINGS[sourceKey] || { name: sourceKey, category: "AUCTION" };
}
