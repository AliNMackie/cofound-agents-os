import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AppCardProps {
    title: string;
    subtitle?: string;
    badges?: React.ReactNode[];
    action?: React.ReactNode;
    footer?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export function AppCard({ title, subtitle, badges, action, footer, children, className, onClick }: AppCardProps) {
    return (
        <Card
            className={cn(
                "bg-white border-slate-200 shadow-sm transition-all dark:bg-neutral-900/50 dark:border-neutral-800",
                "hover:shadow-md hover:border-slate-300 dark:hover:border-neutral-700",
                onClick && "cursor-pointer hover:border-blue-400/50",
                className
            )}
            onClick={onClick}
        >
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-sm font-bold leading-none tracking-tight uppercase text-brand-text-primary dark:text-neutral-200">{title}</CardTitle>
                            {badges && <div className="flex gap-1 flex-wrap">{badges}</div>}
                        </div>
                        {subtitle && <CardDescription className="text-xs line-clamp-1 font-medium">{subtitle}</CardDescription>}
                    </div>
                    {action && <div className="shrink-0">{action}</div>}
                </div>
            </CardHeader>
            {children && <CardContent className="text-sm text-muted-foreground pb-4">{children}</CardContent>}
            {footer && <CardFooter className="pt-0 border-t border-slate-100 dark:border-neutral-800/50 mt-auto p-3 bg-slate-50/50 dark:bg-black/20 text-xs text-muted-foreground">{footer}</CardFooter>}
        </Card>
    );
}
