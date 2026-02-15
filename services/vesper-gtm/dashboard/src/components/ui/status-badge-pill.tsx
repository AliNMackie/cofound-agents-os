import { cn } from "@/lib/utils";

interface StatusBadgePillProps {
    status: "success" | "warning" | "critical" | "info" | "neutral";
    children: React.ReactNode;
    className?: string;
}

export function StatusBadgePill({ status, children, className }: StatusBadgePillProps) {
    const statusClasses = {
        success: "bg-[var(--color-primary-dim)] text-[var(--color-primary)] border-[var(--color-primary-dim)]",
        warning: "bg-[var(--color-warning-dim)] text-[var(--color-warning)] border-[var(--color-warning-dim)]",
        critical: "bg-[var(--color-critical-dim)] text-[var(--color-critical)] border-[var(--color-critical-dim)]",
        info: "bg-[var(--color-info-dim)] text-[var(--color-info)] border-[var(--color-info-dim)]",
        neutral: "bg-gray-800 text-gray-400 border-gray-700",
    };

    return (
        <span className={cn(
            "inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs font-semibold border",
            statusClasses[status],
            className
        )}>
            {children}
        </span>
    );
}
