"use client";

import React from "react";
import {
    Building2,
    TrendingDown,
    Landmark,
    FileText,
    ArrowRight,
    Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PromptTemplate {
    id: string;
    title: string;
    icon: React.ElementType;
    category: string;
    prompt: string;
    description: string;
    color: string;
    bgColor: string;
}

const PROMPT_TEMPLATES: PromptTemplate[] = [
    {
        id: "maturity_wall_audit",
        title: "Maturity Wall Audit",
        icon: TrendingDown,
        category: "MACRO",
        prompt: "Assess [TARGET] against the 2026/27 global maturity wall. Analyse:\n\n1. Current debt structure and maturity profile\n2. Exposure to the €1.2tn European private credit refinancing cliff\n3. DACH region-specific refinancing risks (German Mittelstand exposure)\n4. BoE/Fed/ECB rate divergence impact on refinancing costs\n5. Sponsor covenant headroom and PIK toggle capacity\n\nProvide a Conviction Score (0-100) and recommended action timeline.",
        description: "Cross-reference target against the 2026/27 European refinancing cliff and DACH region stress indicators.",
        color: "text-red-600",
        bgColor: "bg-red-100 dark:bg-red-900/30"
    },
    {
        id: "pe_hold_analytics",
        title: "PE Hold Analytics",
        icon: Building2,
        category: "MICRO",
        prompt: "Cross-reference [TARGET] ownership against typical 5-year PE exit windows. Analyse:\n\n1. Current sponsor and acquisition date\n2. Hold period vs. fund lifecycle constraints\n3. Zombie asset indicators (EBITDA erosion, multiple compression)\n4. Secondary buyout vs. trade sale optionality\n5. Sponsor portfolio concentration risk\n\nFlag if hold period exceeds 5 years with deteriorating fundamentals.",
        description: "Identify Zombie Assets held by PE firms exceeding typical 5-year exit windows with compressed returns.",
        color: "text-purple-600",
        bgColor: "bg-purple-100 dark:bg-purple-900/30"
    },
    {
        id: "monetary_pivot_impact",
        title: "Monetary Pivot Impact",
        icon: Landmark,
        category: "MACRO",
        prompt: "Analyse how a 3.75% BoE base rate impacts [TARGET]'s current debt service coverage. Consider:\n\n1. Current DSCR and interest coverage ratios\n2. Floating vs. fixed rate debt composition\n3. Hedging position and swap mark-to-market\n4. Cash flow waterfall stress test at +75bps\n5. Comparison to Fed 3.5% terminal vs. BoE 4% floor divergence\n\nProject refinancing cliff exposure under sustained rate environment.",
        description: "Model debt service coverage under BoE/Fed divergence scenarios with rate sensitivity analysis.",
        color: "text-amber-600",
        bgColor: "bg-amber-100 dark:bg-amber-900/30"
    },
    {
        id: "capital_structure_review",
        title: "Capital Structure Review",
        icon: FileText,
        category: "ACTION",
        prompt: "Recommend immediate Capital Structure Review for [TARGET]. Structure analysis:\n\n1. Current leverage (Net Debt/EBITDA) vs. sector median\n2. Covenant headroom and amendment capacity\n3. Sponsor support likelihood (follow-on equity injection)\n4. Asset-backed lending alternatives\n5. A&E (Amend & Extend) feasibility pre-maturity\n\nProvide actionable 90-day restructuring roadmap with priority ranking.",
        description: "Generate an immediate action plan with restructuring roadmap and priority ranking.",
        color: "text-green-600",
        bgColor: "bg-green-100 dark:bg-green-900/30"
    },
    {
        id: "distressed_ma_screen",
        title: "Distressed M&A Screen",
        icon: Zap,
        category: "DEAL",
        prompt: "Screen [TARGET] for distressed M&A opportunity. Evaluate:\n\n1. Enterprise value vs. recovery analysis (senior/junior waterfall)\n2. Advisor appointment signals (Rothschild, Houlihan, KPMG)\n3. Recent credit agreement amendments or waivers\n4. Trade creditor behaviour and payment terms stretch\n5. Management incentive alignment post-restructuring\n\nAssign deal conviction score and recommended approach strategy.",
        description: "Screen for distressed acquisition opportunities with advisor signals and recovery analysis.",
        color: "text-blue-600",
        bgColor: "bg-blue-100 dark:bg-blue-900/30"
    }
];

interface PromptLibraryProps {
    onSelectPrompt: (prompt: string) => void;
    className?: string;
}

export function PromptLibrary({ onSelectPrompt, className }: PromptLibraryProps) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="border-b border-brand-border dark:border-neutral-800 bg-gradient-to-r from-neutral-900 to-black text-white">
                <CardTitle className="text-sm font-bold tracking-tight uppercase flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Prompt Library
                </CardTitle>
                <CardDescription className="text-neutral-400 text-xs">
                    Pre-populated analytical frameworks from Neish Capital Markets research.
                </CardDescription>
            </CardHeader>

            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PROMPT_TEMPLATES.map((template) => {
                    const Icon = template.icon;

                    return (
                        <div
                            key={template.id}
                            className="group border border-brand-border dark:border-neutral-800 rounded-lg p-4 hover:border-black dark:hover:border-white transition-all cursor-pointer"
                            onClick={() => onSelectPrompt(template.prompt)}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", template.bgColor)}>
                                    <Icon className={cn("h-5 w-5", template.color)} />
                                </div>
                                <span className="text-[9px] font-bold uppercase tracking-wider text-brand-text-secondary px-2 py-0.5 rounded bg-brand-background dark:bg-neutral-900">
                                    {template.category}
                                </span>
                            </div>

                            <h3 className="font-bold text-sm mb-2 dark:text-white group-hover:text-black dark:group-hover:text-white">
                                {template.title}
                            </h3>

                            <p className="text-[10px] text-brand-text-secondary dark:text-neutral-400 line-clamp-2 mb-3">
                                {template.description}
                            </p>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-between text-[10px] uppercase tracking-widest group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-all"
                            >
                                Use Template
                                <ArrowRight className="h-3 w-3" />
                            </Button>
                        </div>
                    );
                })}
            </CardContent>

            <div className="p-4 border-t border-brand-border dark:border-neutral-800 bg-brand-background dark:bg-neutral-900/50">
                <p className="text-[9px] text-brand-text-secondary text-center uppercase tracking-widest">
                    IC ORIGIN Institutional — Grounded Reasoning Mode
                </p>
            </div>
        </Card>
    );
}
