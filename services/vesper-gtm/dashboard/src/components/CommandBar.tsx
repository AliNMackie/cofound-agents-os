"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Hash, Globe, TrendingUp, AlertCircle, X, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandBarProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (query: string) => void;
    results: any[];
    onSelect: (item: any) => void;
    isLoading?: boolean;
}

export const CommandBar: React.FC<CommandBarProps> = ({
    isOpen,
    onClose,
    onSearch,
    results,
    onSelect,
    isLoading = false
}) => {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery("");
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                // Handled by parent to toggle
            }
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleChange = (val: string) => {
        setQuery(val);
        onSearch(val);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
            <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-brand-border dark:border-neutral-800 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center px-4 py-4 border-b border-brand-border dark:border-neutral-800">
                    <Search className="text-neutral-400 mr-3" size={20} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => handleChange(e.target.value)}
                        placeholder="Search signals, companies, or sectors... (Press Esc to close)"
                        className="flex-1 bg-transparent border-none outline-none text-base font-medium placeholder:text-neutral-400 dark:text-white"
                    />
                    {isLoading && (
                        <div className="flex items-center justify-center mr-4">
                            <Hash className="animate-spin text-brand-primary" size={16} />
                        </div>
                    )}
                    <div className="flex items-center gap-1 ml-4">
                        <kbd className="px-2 py-1 text-[10px] bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 font-sans">ESC</kbd>
                    </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto p-2">
                    {query === "" && results.length === 0 && (
                        <div className="p-4 space-y-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 px-2">Quick Navigation</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left group">
                                    <TrendingUp size={18} className="text-green-500" />
                                    <div>
                                        <p className="text-xs font-bold dark:text-white">Growth Pulse</p>
                                        <p className="text-[10px] text-neutral-500">View latest expansion signals</p>
                                    </div>
                                </button>
                                <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left group">
                                    <AlertCircle size={18} className="text-red-500" />
                                    <div>
                                        <p className="text-xs font-bold dark:text-white">Rescue Pulse</p>
                                        <p className="text-[10px] text-neutral-500">Monitor distressed lead flow</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {results.length > 0 ? (
                        <div className="space-y-1">
                            {results.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSelect(item)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-left group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center",
                                            item.signal_type === "GROWTH" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                        )}>
                                            <Hash size={14} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold dark:text-white">{item.company_name}</p>
                                            <p className="text-[10px] text-neutral-500 truncate max-w-[400px]">{item.company_description || item.headline}</p>
                                        </div>
                                    </div>
                                    <div className="text-[8px] font-black uppercase tracking-tighter bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                                        {item.signal_type}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query !== "" && (
                        <div className="p-12 text-center">
                            <Terminal size={32} className="mx-auto text-neutral-300 mb-4" />
                            <p className="text-sm font-medium text-neutral-500">No signals matching "{query}"</p>
                        </div>
                    )}
                </div>

                <div className="p-3 border-t border-brand-border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-between items-center">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-neutral-400">Sentinel Search Protocol v2.4</p>
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-neutral-400">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> 5,204 Signals Indexed
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
