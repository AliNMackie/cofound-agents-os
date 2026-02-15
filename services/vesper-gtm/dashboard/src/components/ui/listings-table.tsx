import { cn } from "@/lib/utils";

interface ListingsTableProps {
    headers: string[];
    children: React.ReactNode;
    className?: string;
}

export function ListingsTable({ headers, children, className }: ListingsTableProps) {
    return (
        <div className={cn("w-full overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl", className)}>
            <div className="overflow-x-auto">
                <table className="listings-table w-full">
                    <thead>
                        <tr>
                            {headers.map((h, i) => (
                                <th key={i}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function ListingsRow({ children, className, onClick }: { children: React.ReactNode, className?: string, onClick?: () => void }) {
    return (
        <tr
            className={cn(onClick && "cursor-pointer", className)}
            onClick={onClick}
        >
            {children}
        </tr>
    );
}

export function ListingsCell({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <td className={className}>
            {children}
        </td>
    );
}
