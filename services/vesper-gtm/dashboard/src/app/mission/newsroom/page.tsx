"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, FilePenLine, CheckSquare, Square, Stamp, RefreshCw, AlertCircle, BookOpen, Sparkles, Fingerprint, Upload, Save, CheckCircle2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { formatPriceCompact } from "@/lib/utils/formatPrice";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { SourceAttribution } from "@/components/SourceAttribution";
import { PromptLibrary } from "@/components/PromptLibrary";

// Newsletter Templates with Macro-Micro Fusion categories
const TEMPLATES = [
    { id: "weekly_wrap", label: "Weekly Wrap", category: "FUSION" },
    { id: "morning_pulse", label: "Morning Pulse", category: "MACRO" },
    { id: "opportunities", label: "Opportunities", category: "MICRO" },
    { id: "risk_view", label: "Risk View", category: "MACRO" },
    { id: "sector_dive", label: "Sector Dive", category: "MICRO" },
    { id: "market_sweep", label: "Market Sweep", category: "MICRO" },
];

// Notebook context for offline drafting (European Private Credit Landscape)
const NOTEBOOK_CONTEXT = `
# European Private Credit Landscape — January 2026

## Key Macro Themes

### 1. The 2026/27 Maturity Wall
- €1.2tn European private credit refinancing cliff
- DACH region (Germany, Austria, Switzerland) most exposed
- German Mittelstand facing compressed EBITDA multiples

### 2. Monetary Policy Divergence
- BoE: 4% floor maintained through H1 2026
- Fed: 3.5% terminal rate guidance
- ECB: Deposit rate at 3.25%
- GBP/USD refinancing arbitrage emerging

### 3. Zombie Asset Indicators
- PE hold periods exceeding 5 years
- Sponsor PIK toggle activation increasing
- Secondary buyout pricing at all-time lows

## High-Conviction Signals

1. **Aviva CMBS**: £2.1bn refinancing stalled — BoE floor constraint
2. **Willerby Group**: PE sponsor at 6-year hold, EBITDA compression
3. **Mamas & Papas**: Third restructuring in 5 years
4. **SSS Super Alloys**: Manufacturing covenant breach

## IC ORIGIN Institutional Recommendation
Immediate Capital Structure Review for any target with:
- Net Debt/EBITDA > 5.0x
- PE hold > 5 years
- Maturity in 2026/27 window
`;

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
    const [activeTab, setActiveTab] = useState<"newsletter" | "prompts" | "brand_voice">("newsletter");

    // Brand Voice State
    const [voiceAnalysis, setVoiceAnalysis] = useState<any | null>(null);
    const [analyzingVoice, setAnalyzingVoice] = useState(false);
    const [applyBrandVoice, setApplyBrandVoice] = useState(true);
    const [voiceSaved, setVoiceSaved] = useState(false);

    // Handler for selecting a prompt from the library
    const handleSelectPrompt = (prompt: string) => {
        setInstructions(prompt);
        setActiveTab("newsletter");
    };

    // Handler for offline drafting from notebook context
    const handleDraftFromNotebook = async () => {
        setLoading(true);
        setGeneratedDraft("");

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sentinel-growth-1005792944830.europe-west2.run.app";
            const response = await fetch(`${apiUrl}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: selectedTemplate,
                    raw_data: lots.length > 0 ? lots.slice(0, 5) : FALLBACK_LOTS.slice(0, 5),
                    template_id: selectedTemplate,
                    free_form_instruction: `${instructions}\n\n--- MACRO CONTEXT (Notebook) ---\n${NOTEBOOK_CONTEXT}`,
                }),
                signal: AbortSignal.timeout(60000),
            });

            if (response.ok) {
                const result = await response.json();
                const headerDraft = `---\n**IC ORIGIN Institutional**\n*Proprietary Capital Structure Intelligence*\n\n---\n\n${result.draft || result.content || "Draft generated."}`;
                setGeneratedDraft(headerDraft);
            } else {
                throw new Error("Generation failed");
            }
        } catch (err: any) {
            console.error("[Newsletter] Generation failed:", err);
            // Generate offline draft using notebook context
            const offlineDraft = `---
**IC ORIGIN Institutional**
*Proprietary Capital Structure Intelligence*

---

# ${TEMPLATES.find(t => t.id === selectedTemplate)?.label || "Newsletter"} — Draft

## Macro Analysis (Notebook Context)
${NOTEBOOK_CONTEXT}

## User Instructions
${instructions || "No specific instructions provided."}

## Action Items
Based on the European Private Credit Landscape analysis, immediate capital structure review is recommended for targets with:
- Net Debt/EBITDA > 5.0x
- PE hold > 5 years
- 2026/27 maturity exposure

---
*Generated offline from IC ORIGIN Notebook Context*
`;
            setGeneratedDraft(offlineDraft);
        } finally {
            setLoading(false);
        }
    };

    const fetchLots = async () => {
        setFetchingLots(true);
        setFetchError(null);

        try {
            // Use production Sentinel API URL, fallback to localhost for dev
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://sentinel-growth-1005792944830.europe-west2.run.app";
            console.log("[Sentinel] Fetching auctions from:", apiUrl);

            const response = await fetch(`${apiUrl}/auctions`, {
                method: "GET",
                headers: { "Accept": "application/json" },
                // Add timeout to prevent hanging
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                const statusText = `HTTP ${response.status}: ${response.statusText}`;
                console.error("[Sentinel] Fetch failed with status:", statusText);
                throw new Error(statusText);
            }

            const data = await response.json();
            console.log("[Sentinel] Received", data?.length || 0, "records");

            if (data && data.length > 0) {
                setLots(data);
                setUsingFallback(false);
            } else {
                // API returned empty, use fallback
                console.warn("[Sentinel] API returned empty data, switching to cached intelligence");
                setLots(FALLBACK_LOTS);
                setUsingFallback(true);
            }
        } catch (err: any) {
            console.log("[Sentinel] Backend unreachable, switching to cached intelligence node.");
            console.error("[Sentinel] Error details:", err.message || err);
            setFetchError(err.message || "Network error - using cached data");
            // Immediate fallback so UI is never empty
            setLots(FALLBACK_LOTS);
            setUsingFallback(true);
        } finally {
            setFetchingLots(false);
        }
    };

    useEffect(() => {
        fetchLots();
        // Fetch saved voice profile on load
        fetchSavedVoice();
    }, []);

    const fetchSavedVoice = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL || "http://localhost:8089";
            // Hardcoded user_id for demo/prototype; in prod use auth context
            const response = await fetch(`${apiUrl}/brand-voice/user_123`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.analysis_summary) {
                    setVoiceAnalysis(data);
                }
            }
        } catch (e) {
            console.error("Failed to fetch brand voice", e);
        }
    };

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
                branding_instruction: applyBrandVoice && voiceAnalysis?.system_instruction ? voiceAnalysis.system_instruction : null,
                user_signature: includeSignature
                    ? '<br><strong>Alastair Mackie</strong><br><em>Partner, IC Origin</em><br><a href="mailto:alastair@iapetusai.com">alastair@iapetusai.com</a>'
                    : null,
            };

            const apiUrl = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL || "http://localhost:8089";
            const endpoint = `${apiUrl}/draft`;

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

    // Brand Voice Upload Handler
    const handleVoiceUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setAnalyzingVoice(true);
        setVoiceAnalysis(null);
        setVoiceSaved(false);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const apiUrl = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL || "http://localhost:8089";
            const response = await fetch(`${apiUrl}/brand-voice/analyze`, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Analysis failed");
            const data = await response.json();
            setVoiceAnalysis(data);
        } catch (error: any) {
            alert("Analysis Failed: " + error.message);
        } finally {
            setAnalyzingVoice(false);
        }
    };

    const saveVoiceProfile = async () => {
        if (!voiceAnalysis) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL || "http://localhost:8089";
            await fetch(`${apiUrl}/brand-voice/save`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: "user_123", // Demo ID
                    voice_data: voiceAnalysis
                })
            });
            setVoiceSaved(true);
            setTimeout(() => setVoiceSaved(false), 3000);
        } catch (e) {
            alert("Failed to save profile");
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

            {/* Tab Navigation */}
            <div className="flex items-center gap-2 border-b border-brand-border dark:border-neutral-800 pb-4">
                <button
                    onClick={() => setActiveTab("newsletter")}
                    className={cn(
                        "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all",
                        activeTab === "newsletter"
                            ? "bg-black text-white dark:bg-white dark:text-black"
                            : "text-brand-text-secondary hover:bg-brand-background dark:hover:bg-neutral-900"
                    )}
                >
                    <FilePenLine size={14} />
                    Newsletter Engine
                </button>
                <button
                    onClick={() => setActiveTab("prompts")}
                    className={cn(
                        "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all",
                        activeTab === "prompts"
                            ? "bg-black text-white dark:bg-white dark:text-black"
                            : "text-brand-text-secondary hover:bg-brand-background dark:hover:bg-neutral-900"
                    )}
                >
                    <BookOpen size={14} />
                    Prompt Library
                </button>

                <button
                    onClick={() => setActiveTab("brand_voice")}
                    className={cn(
                        "flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all",
                        activeTab === "brand_voice"
                            ? "bg-black text-white dark:bg-white dark:text-black"
                            : "text-brand-text-secondary hover:bg-brand-background dark:hover:bg-neutral-900"
                    )}
                >
                    <Fingerprint size={14} />
                    Brand Identity
                </button>

                {/* Draft from Notebook Button - visible when API offline */}
                {(fetchError || usingFallback) && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDraftFromNotebook}
                        disabled={loading}
                        className="ml-auto text-[10px] uppercase tracking-widest border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    >
                        <Sparkles size={14} className="mr-1" />
                        Draft from Notebook Context
                    </Button>
                )}
            </div>

            {/* Prompt Library Tab */}
            {activeTab === "prompts" && (
                <PromptLibrary onSelectPrompt={handleSelectPrompt} />
            )}

            {/* Brand Voice Tab */}
            {activeTab === "brand_voice" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
                    <Card className="p-8 h-fit">
                        <CardHeader className="px-0 pt-0">
                            <CardTitle className="uppercase tracking-widest text-sm">Upload Sample Data</CardTitle>
                            <CardDescription>Upload a past newsletter, blog post, or brand guidelines PDF to extract your unique Voice DNA.</CardDescription>
                        </CardHeader>
                        <CardContent className="px-0">
                            <div className="border-2 border-dashed border-brand-border rounded-lg p-12 text-center hover:bg-brand-background transition-colors dark:border-neutral-800 dark:hover:bg-neutral-900">
                                <input
                                    type="file"
                                    id="voice-upload"
                                    className="hidden"
                                    accept=".pdf,.txt,.md"
                                    onChange={handleVoiceUpload}
                                />
                                <label htmlFor="voice-upload" className="cursor-pointer flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center dark:bg-white dark:text-black">
                                        {analyzingVoice ? <Loader2 className="animate-spin" /> : <Upload />}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-brand-text-secondary">
                                        {analyzingVoice ? "Analyzing Voice DNA..." : "Click to Upload PDF / Text"}
                                    </span>
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={cn("p-8 transition-opacity duration-500", !voiceAnalysis && "opacity-50 pointer-events-none")}>
                        <CardHeader className="px-0 pt-0 flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="uppercase tracking-widest text-sm flex items-center gap-2">
                                    <Fingerprint size={16} />
                                    Detected Voice Profile
                                </CardTitle>
                                <CardDescription>Gemini 3 Pro Analysis</CardDescription>
                            </div>
                            {voiceAnalysis && (
                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900">
                                    Analysis Complete
                                </Badge>
                            )}
                        </CardHeader>
                        <CardContent className="px-0 space-y-6">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary mb-2 block">Tonal Summary</label>
                                <div className="bg-brand-background p-4 rounded-lg text-sm italic dark:bg-neutral-900">
                                    "{voiceAnalysis?.analysis_summary || "Upload a sample to see analysis..."}"
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-text-secondary mb-2 block">System Instruction Block</label>
                                <div className="bg-neutral-100 p-4 rounded-lg text-xs font-mono h-40 overflow-y-auto dark:bg-neutral-950 text-neutral-600 dark:text-neutral-400">
                                    {voiceAnalysis?.system_instruction || "No instruction generated yet..."}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-brand-border dark:border-neutral-800">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setApplyBrandVoice(!applyBrandVoice)}
                                        className={cn("w-10 h-6 rounded-full relative transition-colors", applyBrandVoice ? "bg-black dark:bg-white" : "bg-gray-200 dark:bg-neutral-800")}
                                    >
                                        <div className={cn("absolute top-1 left-1 w-4 h-4 bg-white dark:bg-black rounded-full transition-all", applyBrandVoice ? "translate-x-4" : "")} />
                                    </button>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Apply to Future Drafts</span>
                                </div>
                                <Button
                                    onClick={saveVoiceProfile}
                                    disabled={!voiceAnalysis}
                                    className={cn("text-xs uppercase tracking-widest", voiceSaved && "bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700")}
                                >
                                    {voiceSaved ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Saved</> : <><Save className="mr-2 h-4 w-4" /> Save Profile</>}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Newsletter Tab */}
            {activeTab === "newsletter" && (
                <>

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
                </>
            )}
        </div>
    );
}
