"use client";

import { Sidebar } from "@/components/Sidebar";
import { Plus, Search, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LayoutShellProps {
    children: React.ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
    return (
        <div className="layout-shell">
            <aside className="sidebar-fixed">
                <Sidebar />
            </aside>
            <main className="main-content">
                <header className="header-sticky justify-between">
                    <div className="flex-1 flex justify-center max-w-2xl mx-auto w-full px-8">
                        <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search companies, signals, or intelligence..."
                                className="search-pill pl-10 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="text-gray-400 hover:text-white transition-colors">
                            <Bell className="w-5 h-5" />
                        </button>
                        <button className="btn-primary">
                            <Plus className="w-4 h-4 mr-2" />
                            <span>Create</span>
                        </button>
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
