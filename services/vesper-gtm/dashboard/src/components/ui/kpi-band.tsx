import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiItem {
    label: string;
    value: string | number;
    delta?: string;
    deltaType?: "positive" | "negative" | "neutral";
    icon?: React.ReactNode;
}

interface KpiBandProps {
    items: KpiItem[];
    className?: string;
}

export function KpiBand({ items, className }: KpiBandProps) {
    return (
        <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-6", className)}>
            {items.map((item, idx) => (
                <Card key={idx} className="bg-white/50 backdrop-blur-sm dark:bg-black/40 border-slate-200 dark:border-neutral-800 shadow-none">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="text-2xl font-bold tracking-tight text-brand-text-primary dark:text-white">{item.value}</span>
                                {item.delta && (
                                    <span className={cn("text-[10px] font-bold uppercase",
                                        item.deltaType === "positive" ? "text-emerald-600 dark:text-emerald-400" :
                                            item.deltaType === "negative" ? "text-rose-600 dark:text-rose-400" : "text-slate-500"
                                    )}>
                                        {item.delta}
                                    </span>
                                )}
                            </div>
                        </div>
                        {item.icon && <div className="text-muted-foreground/30">{item.icon}</div>}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
