"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
    LayoutDashboard,
    Newspaper,
    Search,
    ChevronLeft,
    ChevronRight,
    Settings,
    HelpCircle,
    Gem,
    Network
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/mission/newsroom", label: "Newsroom", icon: Newspaper },
    { href: "/sources", label: "Sources", icon: Network },
    { href: "/missions", label: "Market Watch", icon: Search },
];

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    // Load state from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem("sidebar-collapsed");
        if (saved !== null) setIsCollapsed(JSON.parse(saved));
    }, []);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("sidebar-collapsed", JSON.stringify(newState));
    };

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCollapsed ? 80 : 256 }}
            className={cn(
                "flex flex-col h-screen bg-white border-r border-brand-border sticky top-0 z-50 transition-colors duration-300",
                "dark:bg-black dark:border-neutral-800"
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-brand-border dark:border-neutral-800">
                <AnimatePresence mode="wait">
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative w-40 h-10"
                        >
                            <Image
                                src="/ic-origin-logo-dark.png"
                                alt="IC Origin Intelligence Terminal"
                                fill
                                className="object-contain object-left dark:hidden"
                                priority
                            />
                            <Image
                                src="/ic-origin-logo-light.png"
                                alt="IC Origin Intelligence Terminal"
                                fill
                                className="object-contain object-left hidden dark:block"
                                priority
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
                {isCollapsed && <Gem className="h-6 w-6 text-black dark:text-white mx-auto" />}
            </div>

            {/* Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="absolute -right-3 top-20 bg-white border border-brand-border rounded-full p-1 hover:bg-brand-background transition-colors dark:bg-black dark:border-neutral-800 dark:hover:bg-neutral-900"
            >
                {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>

            {/* Nav Links */}
            <nav className="flex-1 p-4 space-y-2">
                {sidebarLinks.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;

                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                isActive
                                    ? "bg-black text-white dark:bg-white dark:text-black shadow-lg shadow-black/10"
                                    : "text-brand-text-secondary hover:bg-brand-background dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
                            )}
                            title={isCollapsed ? link.label : ""}
                        >
                            <Icon size={20} className={cn(isActive ? "text-inherit" : "text-brand-text-secondary group-hover:text-black dark:group-hover:text-white")} />
                            {!isCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    {link.label}
                                </motion.span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / User Profile */}
            <div className="p-4 border-t border-brand-border dark:border-neutral-800">
                <div className={cn("flex items-center gap-3 px-4 py-2 rounded-lg transition-all", isCollapsed ? "justify-center" : "")}>
                    <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold border-2 border-brand-border dark:border-white/20">
                        AM
                    </div>
                    {!isCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs"
                        >
                            <p className="font-bold text-brand-text-primary dark:text-white truncate">Alastair Mackie</p>
                            <p className="text-brand-text-secondary dark:text-neutral-500 truncate">alastair@iapetusai.com</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.aside>
    );
}
