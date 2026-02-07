"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Copy, Trash2, FileText, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotebookSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    content: string;
    onChange: (val: string) => void;
    onSave: () => void;
    onClear: () => void;
}

export const NotebookSidebar: React.FC<NotebookSidebarProps> = ({
    isOpen,
    onToggle,
    content,
    onChange,
    onSave,
    onClear
}) => {
    return (
        <div className={cn(
            "fixed right-0 top-0 h-full bg-white dark:bg-black border-l border-brand-border dark:border-neutral-800 transition-all duration-300 z-50 flex shadow-2xl",
            isOpen ? "w-[450px]" : "w-0"
        )}>
            {/* Toggle Tab */}
            <button
                onClick={onToggle}
                className="absolute -left-10 top-1/2 -translate-y-1/2 w-10 h-24 bg-black dark:bg-neutral-900 border border-brand-border dark:border-neutral-800 border-r-0 rounded-l-xl flex items-center justify-center text-white cursor-pointer hover:bg-neutral-800 transition-colors"
            >
                {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>

            {/* Sidebar Content */}
            <div className={cn("flex-1 flex flex-col overflow-hidden", !isOpen && "invisible")}>
                <Card className="h-full border-0 rounded-none flex flex-col">
                    <CardHeader className="border-b border-brand-border dark:border-neutral-800 px-6 py-4 bg-neutral-50 dark:bg-neutral-950">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                <FileText size={14} className="text-brand-primary" />
                                Executive Notebook
                            </CardTitle>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={onClear}>
                                    <Trash2 size={14} />
                                </Button>
                                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigator.clipboard.writeText(content)}>
                                    <Copy size={14} />
                                </Button>
                                <Button size="sm" className="h-8 gap-2 bg-black text-white dark:bg-white dark:text-black" onClick={onSave}>
                                    <Save size={14} />
                                    Save
                                </Button>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 p-0 flex flex-col">
                        <div className="flex-1 overflow-auto p-6 font-serif">
                            <textarea
                                value={content}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
                                placeholder="Your strategic briefing starts here... Add signals to fuse macro-micro insights."
                                className="w-full h-full border-0 shadow-none focus-visible:ring-0 outline-none resize-none text-[13px] leading-relaxed p-0 bg-transparent"
                            />
                        </div>

                        <div className="p-4 border-t border-brand-border dark:border-neutral-800 bg-brand-background/30 dark:bg-neutral-950/50">
                            <div className="flex items-center justify-between text-[10px] text-neutral-500 uppercase font-bold tracking-tighter">
                                <span>Word Count: {content.split(/\s+/).filter(Boolean).length}</span>
                                <span className="flex items-center gap-1">
                                    <Sparkles size={10} /> AIC Autocomplete: ACTIVE
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
