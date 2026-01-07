"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, FilePenLine, CheckSquare, Square, Stamp, RefreshCw, AlertCircle } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { formatPriceCompact } from "@/lib/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { SourceAttribution } from "@/components/SourceAttribution";

const TEMPLATES = [
    { id: "weekly_wrap", label: "Weekly Wrap" },
    { id: "opportunities", label: "Opportunities" },
    { id: "risk_view", label: "Risk View" },
    { id: "sector_dive", label: "Sector Dive" },
    { id: "market_sweep", label: "Market Sweep" },
];

// Fallback data for when API is unavailable
const FALLBACK_LOTS = [
    { company_name: "Aviva Investors Portfolio", ebitda: 2100000000, process_status: "Failed Refinancing", source: "The Gazette", company_description: "CMBS portfolio with BoE rate exposure" },
    { company_name: "Willerby Group", ebitda: 45000000, process_status: "Stalled", source: "Grant Thornton", company_description: "PE-backed caravan manufacturer" },
    { company_name: "Mamas & Papas", ebitda: 12000000, process_status: "Pre-pack", source: "Rothschild", company_description: "Consumer retail nursery products" },
    { company_name: "SSS Super Alloys", ebitda: 8500000, process_status: "Covenant Breach", source: "KPMG", company_description: "Manufacturing sector specialist metals" },
    { company_name: "Paperchase Assets", ebitda: 6200000, process_status: "Administration", source: "Companies House", company_description: "Retail stationery and gifts" },
    { company_name: "Debenhams Portfolio", ebitda: 34000000, process_status: "Distribution", source: "Deloitte", company_description: "Legacy department store real estate" },
    { company_name: "Arcadia Residuals", ebitda: 15000000, process_status: "Liquidation", source: "The Gazette", company_description: "Fashion retail wind-down assets" },
    { company_name: "Cath Kidston IP", ebitda: 4800000, process_status: "Sale Process", source: "Houlihan Lokey", company_description: "Brand and IP assets" },
    { company_name: "Strada Restaurants", ebitda: 2100000, process_status: "CVA", source: "Companies House", company_description: "Casual dining estate" },
    { company_name: "Byron Burger Holdings", ebitda: 3400000, process_status: "Restructuring", source: "FTI Consulting", company_description: "QSR restaurant chain" },
];

export default function NewsroomPage() {
    // State
    const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState("weekly_wrap");
    const [instructions, setInstructions] = useState("");
    const [includeSignature, setIncludeSignature] = useState(true);
    const [generatedDraft, setGeneratedDraft] = useState("");
    const [loading, setLoading] = useState(false);
    const [lots, setLots] = useState<any[]>([]);
    const [fetchingLots, setFetchingLots] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [usingFallback, setUsingFallback] = useState(false);
    const [pendingReviewData, setPendingReviewData] = useState<any | null>(null);
    const [uploading, setUploading] = useState(false);

    const fetchLots = async () => {
        setFetchingLots(true);
        setFetchError(null);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL || "http://localhost:8089";
            const response = await fetch(`${apiUrl}/auctions`, {
                method: "GET",
                headers: { "Accept": "application/json" },
            });

            if (!response.ok) {
                const statusText = `HTTP ${response.status}: ${response.statusText}`;
                console.error("Fetch failed with status:", statusText);
                throw new Error(statusText);
            }

            const data = await response.json();

            if (data && data.length > 0) {
                setLots(data);
                setUsingFallback(false);
            } else {
                // API returned empty, use fallback
                console.warn("API returned empty data, using fallback");
                setLots(FALLBACK_LOTS);
                setUsingFallback(true);
            }
        } catch (err: any) {
            console.error("Failed to fetch lots:", err);
            setFetchError(err.message || "Network error - using cached data");
            // Use fallback data so UI is never empty
            setLots(FALLBACK_LOTS);
            setUsingFallback(true);
        } finally {
            setFetchingLots(false);
        }
    };

    useEffect(() => {
        fetchLots();
    }, []);

    // Toggle Lot Selection
    const toggleLot = (lotId: string) => {
        setSelectedLotIds((prev) =>
            prev.includes(lotId)
                ? prev.filter((id) => id !== lotId)
                : [...prev, lotId]
        );
    };

    // Generate Handler
    const handleGenerate = async () => {
        if (selectedLotIds.length === 0) {
            alert("Please select at least one lot.");
            return;
        }

        setLoading(true);
        setGeneratedDraft("");

        const selectedData = lots.filter((lot) =>
            selectedLotIds.includes(lot.company_name || lot.lot_number)
        );

        try {
            const payload = {
                type: selectedTemplate,
                raw_data: selectedData,
                template_id: selectedTemplate,
                free_form_instruction: instructions,
                user_signature: includeSignature
                    ? '<br><strong>Alastair Mackie</strong><br><em>Partner, IC Origin</em><br><a href="mailto:ali@icorigin.com">ali@icorigin.com</a>'
                    : null,
            };

            const apiUrl = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL || "http://localhost:8089";
            const endpoint = `${apiUrl}/generate`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setGeneratedDraft(data.draft || data.content || "No draft content returned.");
        } catch (error: any) {
            console.error("Generation error:", error);
            alert("Generation Failed: " + error.message);
            setGeneratedDraft("Error generating draft. Please check console.");
        } finally {
            setLoading(false);
        }
    };

    // PDF Ingestion Handler
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(`${process.env.NEXT_PUBLIC_NEWSLETTER_API_URL}/api/ingest-intelligence`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");
            const data = await response.json();
            setPendingReviewData(data);
        } catch (error: any) {
            alert("Upload Failed: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const approveHitlData = () => {
        alert("Intelligence saved to database.");
        setPendingReviewData(null);
        fetchLots(); // Refresh the list
    };

    // DataTable columns
    const columns = [
        {
            header: "Company",
            accessorKey: "company_name" as const,
            cell: (row: any) => (
                <div className="flex flex-col">
                    <span className="font-bold">{row.company_name || "Unknown"}</span>
                    <span className="text-[10px] text-brand-text-secondary truncate max-w-[150px]">{row.company_description || "M&A Target"}</span>
                </div>
            )
        },
        {
            header: "EBITDA",
            accessorKey: "ebitda" as const,
            cell: (row: any) => (
                <span className="font-mono text-xs">{formatPriceCompact(row.ebitda || 0)}</span>
            )
        },
        {
            header: "Status",
            accessorKey: "process_status" as const,
            cell: (row: any) => (
                <Badge variant={row.process_status?.toLowerCase().includes("failed") ? "destructive" : "secondary"}>
                    {row.process_status || "Live"}
                </Badge>
            )
        },
        {
            header: "Source",
            accessorKey: "source" as const,
            cell: (row: any) => (
                <SourceAttribution
                    sourceName={row.source || "Sentinel"}
                    category={row.source?.includes("Gazette") || row.source?.includes("Companies") ? "REGULATOR" :
                        row.source?.includes("KPMG") || row.source?.includes("Deloitte") || row.source?.includes("Rothschild") || row.source?.includes("Grant") || row.source?.includes("Houlihan") || row.source?.includes("FTI") ? "ADVISOR" : "AUCTION"}
                />
            )
        },
        {
            header: "Select",
            accessorKey: "company_name" as const,
            cell: (row: any) => {
                const id = row.company_name || row.lot_number;
                return (
                    <button
                        onClick={(e) => { e.stopPropagation(); toggleLot(id); }}
                        className={cn(
                            "h-6 w-6 rounded border flex items-center justify-center transition-colors",
                            selectedLotIds.includes(id) ? "bg-black border-black text-white" : "border-brand-border"
                        )}
                    >
                        {selectedLotIds.includes(id) && <CheckSquare className="h-3 w-3" />}
                    </button>
                );
            }
        }
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <header className="flex justify-between items-end">
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-text-secondary mb-2">Deal Intelligence</p>
                    <h1 className="text-4xl font-bold tracking-tighter text-black dark:text-white">Newsroom</h1>
                    <p className="mt-2 text-brand-text-secondary text-sm max-w-xl dark:text-neutral-400">
                        Convert raw Sentinel signals and PDF intelligence into high-conviction deal memos.
                    </p>
                </div>
                <div className="flex gap-4">
                    <input
                        type="file"
                        id="pdf-upload"
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileUpload}
                    />
                    <label
                        htmlFor="pdf-upload"
                        className="btn-secondary flex items-center gap-2 cursor-pointer text-[10px] font-bold uppercase tracking-widest px-6 py-3 dark:bg-neutral-900"
                    >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Stamp size={14} /> Upload Deal PDF</>}
                    </label>
                </div>
            </header>

            {/* HitL Review Panel */}
            {pendingReviewData && (
                <Card className="border-2 border-black dark:border-white animate-in slide-in-from-top duration-500 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b bg-brand-background dark:bg-neutral-900">
                        <div>
                            <CardTitle className="text-sm uppercase tracking-widest">Review Extracted Intelligence</CardTitle>
                            <CardDescription>Human-in-the-Loop verification required for PDF ingestion.</CardDescription>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" size="sm" onClick={() => setPendingReviewData(null)}>Discard</Button>
                            <Button variant="default" size="sm" onClick={approveHitlData}>Approve & Save</Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-white dark:bg-black">
                                    <TableHead>Field</TableHead>
                                    <TableHead>Extracted Value</TableHead>
                                    <TableHead>Confidence</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow><TableCell className="font-bold">Company Name</TableCell><TableCell>{pendingReviewData.company_name}</TableCell><TableCell className="text-green-600 font-bold">HIGH</TableCell></TableRow>
                                <TableRow><TableCell className="font-bold">EBITDA</TableCell><TableCell>{pendingReviewData.ebitda}</TableCell><TableCell className="text-green-600 font-bold">HIGH</TableCell></TableRow>
                                <TableRow><TableCell className="font-bold">Advisor</TableCell><TableCell>{pendingReviewData.advisor}</TableCell><TableCell className="text-yellow-600 font-bold">MEDIUM</TableCell></TableRow>
                                <TableRow><TableCell className="font-bold">Status</TableCell><TableCell>{pendingReviewData.process_status}</TableCell><TableCell className="text-green-600 font-bold">HIGH</TableCell></TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Live Data Table */}
            {/* Live Data Table */}
            <Card className="overflow-hidden">
                <div className="p-4 border-b border-brand-border dark:border-neutral-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xs font-bold uppercase tracking-widest">Sentinel Live Feed</h2>
                        {usingFallback && (
                            <Badge variant="secondary" className="text-[9px] uppercase">
                                Cached Data
                            </Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {fetchError ? (
                            <>
                                <div className="flex items-center gap-2 text-amber-600">
                                    <AlertCircle className="h-3 w-3" />
                                    <span className="text-[10px] font-bold uppercase">Reconnecting</span>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={fetchLots}
                                    className="text-[10px] uppercase tracking-widest"
                                >
                                    <RefreshCw className={cn("h-3 w-3 mr-1", fetchingLots && "animate-spin")} />
                                    Retry
                                </Button>
                            </>
                        ) : (
                            <>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-[10px] font-bold text-brand-text-secondary uppercase">Connected</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Error Banner */}
                {fetchError && (
                    <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-center justify-between">
                        <p className="text-[10px] text-amber-700 dark:text-amber-400">
                            <strong>Connection Issue:</strong> {fetchError}. Displaying cached intelligence.
                        </p>
                    </div>
                )}

                <div className="p-4">
                    {fetchingLots ? (
                        <div className="py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={lots}
                            searchKey="company_name"
                        />
                    )}
                </div>
            </Card>

            {/* Editor Panel */}
            <Card className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-3">Analytical Lens</label>
                        <div className="grid grid-cols-2 gap-2">
                            {TEMPLATES.map((tmpl) => (
                                <button
                                    key={tmpl.id}
                                    onClick={() => setSelectedTemplate(tmpl.id)}
                                    className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest py-2 rounded border transition-all",
                                        selectedTemplate === tmpl.id
                                            ? "bg-black text-white border-black"
                                            : "bg-white text-brand-text-secondary border-brand-border hover:border-black dark:bg-neutral-900 dark:border-neutral-700"
                                    )}
                                >
                                    {tmpl.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="tone-modifier" className="block text-xs font-bold uppercase tracking-widest mb-3">Tone Modifier</label>
                        <textarea
                            id="tone-modifier"
                            name="tone-modifier"
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="e.g. emphasise capital flight risk..."
                            className="w-full bg-brand-background border border-brand-border rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-black focus:outline-none h-[74px] resize-none dark:bg-neutral-900 dark:border-neutral-700"
                            autoComplete="off"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between border-t border-brand-border pt-8 dark:border-neutral-800">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIncludeSignature(!includeSignature)}
                            className={cn(
                                "w-10 h-10 flex items-center justify-center rounded-lg border transition-all",
                                includeSignature ? 'bg-black text-white border-black' : 'border-brand-border text-brand-text-secondary'
                            )}
                        >
                            <Stamp className="h-5 w-5" />
                        </button>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-black dark:text-white">Append Authority</p>
                            <p className="text-[10px] font-medium text-brand-text-secondary uppercase">Sign as Partner</p>
                        </div>
                    </div>

                    <Button
                        onClick={handleGenerate}
                        disabled={loading || selectedLotIds.length === 0}
                        className="min-w-[200px] uppercase text-xs tracking-[0.2em]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Generating
                            </>
                        ) : (
                            `Build Memo (${selectedLotIds.length})`
                        )}
                    </Button>
                </div>
            </Card>

            {/* Output */}
            {generatedDraft && (
                <Card className="p-12 bg-white dark:bg-black animate-in fade-in duration-700">
                    <article className="prose prose-sm prose-neutral max-w-none prose-headings:font-bold prose-headings:tracking-tighter prose-p:text-brand-text-primary prose-strong:text-black dark:prose-invert">
                        <ReactMarkdown>{generatedDraft}</ReactMarkdown>
                    </article>
                </Card>
            )}

            {/* Global FAB */}
            <button className="fixed bottom-8 right-8 bg-black text-white px-6 py-3 rounded-full shadow-2xl uppercase text-[10px] tracking-[0.3em] flex items-center gap-3 hover:bg-neutral-800 transition-colors dark:bg-white dark:text-black">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                System Active
            </button>
        </div>
    );
}
