import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProgressiveMetricCardProps {
    label: string;
    value: string | number;
    subValue?: string;
    progress?: number; // 0 to 100
    icon?: React.ReactNode;
    trend?: "up" | "down" | "neutral";
    className?: string;
}

export function ProgressiveMetricCard({ label, value, subValue, progress, icon, trend, className }: ProgressiveMetricCardProps) {
    return (
        <div className={cn("relative overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5", className)}>
            <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</span>
                {icon && <div className="text-gray-600">{icon}</div>}
            </div>

            <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-white">{value}</span>
                {subValue && <span className="text-sm text-gray-400">{subValue}</span>}
            </div>

            {progress !== undefined && (
                <div className="absolute bottom-0 left-0 w-full h-1 bg-[var(--color-border)]">
                    <div
                        className={cn("h-full transition-all duration-500",
                            trend === "down" ? "bg-[var(--color-critical)]" : "bg-[var(--color-primary)]"
                        )}
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                </div>
            )}
        </div>
    );
}
