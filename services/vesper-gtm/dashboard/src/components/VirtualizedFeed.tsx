// @ts-ignore
import { FixedSizeList } from 'react-window';
import { cn } from "@/lib/utils";
import { IntelligenceSignal } from "@/types/sentinel";
import { Badge } from "@/components/ui/badge";
import { SourceAttribution } from "@/components/SourceAttribution";
import { ExternalLink, CheckSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VirtualizedFeedProps {
    items: any[];
    height: number;
    width: number | string;
    onToggleSelect: (id: string) => void;
    onAddToNotebook: (item: any) => void;
    selectedIds: string[];
}

export const VirtualizedFeed: React.FC<VirtualizedFeedProps> = ({ items, height, width, onToggleSelect, onAddToNotebook, selectedIds }) => {
    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const item = items[index];
        const isSelected = selectedIds.includes(item.company_name || item.id);

        return (
            <div style={style} className="border-b border-brand-border dark:border-neutral-800 flex items-center px-4 hover:bg-brand-background dark:hover:bg-neutral-900 transition-colors">
                <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold truncate">{item.company_name || "Unknown"}</span>
                        {item.signal_type && (
                            <Badge variant={item.signal_type === "GROWTH" ? "secondary" : "destructive"} className="text-[8px] uppercase">
                                {item.signal_type}
                            </Badge>
                        )}
                    </div>
                    <p className="text-[10px] text-brand-text-secondary truncate">{item.company_description || item.analysis || "M&A Signal"}</p>
                </div>

                <div className="flex items-center gap-4">
                    <SourceAttribution
                        sourceName={item.source || "Sentinel"}
                        category={item.source?.includes("Gazette") ? "REGULATOR" : "ADVISOR"}
                    />

                    <button
                        onClick={() => onToggleSelect(item.company_name || item.id)}
                        className={cn(
                            "h-6 w-6 rounded border flex items-center justify-center transition-colors",
                            isSelected ? "bg-black border-black text-white dark:bg-white dark:text-black" : "border-brand-border"
                        )}
                    >
                        {isSelected && <CheckSquare className="h-3 w-3" />}
                    </button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-brand-primary"
                        onClick={() => onAddToNotebook(item)}
                    >
                        <FileText size={14} />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => window.open(item.source_link || `https://www.google.com/search?q=${item.company_name}`, "_blank")}
                    >
                        <ExternalLink size={14} />
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <FixedSizeList
            height={height}
            itemCount={items.length}
            itemSize={60}
            width={width}
        >
            {Row}
        </FixedSizeList>
    );
};
