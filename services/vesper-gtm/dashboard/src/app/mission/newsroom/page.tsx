"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, FilePenLine, CheckSquare, Square, Stamp } from "lucide-react";

// Mock Data for "Failed Auctions"
const MOCK_FAILED_LOTS = [
    {
        lot_number: "205",
        auction_house: "Allsop",
        address: "Unit 3, Industrial Estate, Leeds, LS11 9TY",
        guide_price: "£250,000",
        final_bid: "£210,000",
        sector: "Industrial",
        description: "Freehold industrial investment. Let until 2028. Failed to meet reserve.",
    },
    {
        lot_number: "19",
        auction_house: "Acuitus",
        address: "High Street Retail Parade, Dover, CT16 1AB",
        guide_price: "£400,000",
        final_bid: "£320,000",
        sector: "Retail",
        description: "Parade of 3 shops with upper parts. High vacancy. Receiver sale.",
    },
    {
        lot_number: "55",
        auction_house: "Savills",
        address: "Development Site, Old Road, Oxford, OX3 8TA",
        guide_price: "£1.2m",
        final_bid: "£950,000",
        sector: "Land/Dev",
        description: "0.5 acre site with lapsed planning for 12 flats. Environmental concerns raised.",
    },
    {
        lot_number: "88",
        auction_house: "Barnett Ross",
        address: "12-14 Office Block, Harrow, HA1 2XY",
        guide_price: "£650,000",
        final_bid: "£645,000",
        sector: "Office",
        description: "Vacant office building suitable for PD conversion. Close to station.",
    },
    {
        lot_number: "42",
        auction_house: "Allsop",
        address: "The Old Pub, Village Green, Kent, TN12 5ZZ",
        guide_price: "£350,000",
        final_bid: "£280,000",
        sector: "Leisure",
        description: "Grade II listed pub. Closed since 2023. Potential for residential change of use.",
    },
];

const TEMPLATES = [
    { id: "weekly_wrap", label: "Weekly Wrap" },
    { id: "opportunities", label: "Opportunities" },
    { id: "risk_view", label: "Risk View" },
    { id: "sector_dive", label: "Sector Dive" },
    { id: "market_sweep", label: "Market Sweep" },
];

export default function NewsroomPage() {
    // State
    const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState("weekly_wrap");
    const [instructions, setInstructions] = useState("");
    const [includeSignature, setIncludeSignature] = useState(true);
    const [generatedDraft, setGeneratedDraft] = useState("");
    const [loading, setLoading] = useState(false);

    // Toggle Lot Selection
    const toggleLot = (lotNum: string) => {
        setSelectedLotIds((prev) =>
            prev.includes(lotNum)
                ? prev.filter((id) => id !== lotNum)
                : [...prev, lotNum]
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

        // Filter the raw data based on selection
        const selectedData = MOCK_FAILED_LOTS.filter((lot) =>
            selectedLotIds.includes(lot.lot_number)
        );

        try {
            const payload = {
                type: selectedTemplate, // Matching BUG REPORT requirement: { type: "weekly_wrap" }
                raw_data: selectedData,
                template_id: selectedTemplate,
                free_form_instruction: instructions,
                user_signature: includeSignature
                    ? '<br><strong>Alastair Mackie</strong><br><em>Partner, IC Origin</em><br><a href="mailto:ali@icorigin.com">ali@icorigin.com</a>'
                    : null,
            };

            const apiUrl = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL || "http://localhost:8089";
            const endpoint = `${apiUrl}/generate`;

            console.log(`Triggering generation at ${endpoint}...`);

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

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-12">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-text-secondary mb-2">Editor</p>
                <h1 className="text-black">Intelligence Newsroom</h1>
                <p className="mt-2 text-brand-text-secondary text-sm max-w-xl">
                    Generate high-conviction deal memos from failed auction data. Select your sources and define your analytical lens.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                {/* LEFT: Sources (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="card overflow-hidden">
                        <div className="p-4 border-b border-brand-border bg-brand-background flex items-center justify-between">
                            <h2 className="text-xs font-bold uppercase tracking-widest">Failed Auctions</h2>
                            <span className="text-[10px] font-bold text-brand-text-secondary bg-white px-2 py-0.5 border border-brand-border rounded">LIVE DATA</span>
                        </div>
                        <div className="divide-y divide-brand-border">
                            {MOCK_FAILED_LOTS.map((lot) => {
                                const isSelected = selectedLotIds.includes(lot.lot_number);
                                return (
                                    <div
                                        key={lot.lot_number}
                                        onClick={() => toggleLot(lot.lot_number)}
                                        className={`p-4 cursor-pointer transition-colors group ${isSelected ? 'bg-black text-white' : 'bg-white hover:bg-brand-background'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-gray-400' : 'text-brand-text-secondary'}`}>Lot {lot.lot_number}</span>
                                            {isSelected && <CheckSquare className="h-3 w-3" />}
                                        </div>
                                        <p className="text-sm font-bold truncate">{lot.address.split(',')[0]}</p>
                                        <div className={`flex items-center gap-3 mt-2 text-[10px] font-bold tracking-widest uppercase ${isSelected ? 'text-gray-400' : 'text-brand-text-secondary'}`}>
                                            <span>Guide: {lot.guide_price}</span>
                                            <span className="opacity-30">|</span>
                                            <span className={isSelected ? 'text-red-400' : 'text-red-600'}>Bid: {lot.final_bid}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-4 bg-brand-background border-t border-brand-border flex justify-between items-center text-[10px] font-bold uppercase tracking-tighter">
                            <span>{selectedLotIds.length} Lots selected</span>
                            <button onClick={() => setSelectedLotIds([])} className="hover:underline">Clear</button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Editor & Output (8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="card p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest mb-3">Analytical Lens</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {TEMPLATES.map((tmpl) => (
                                        <button
                                            key={tmpl.id}
                                            onClick={() => setSelectedTemplate(tmpl.id)}
                                            className={`text-[10px] font-bold uppercase tracking-widest py-2 rounded border transition-all ${selectedTemplate === tmpl.id
                                                ? "bg-black text-white border-black"
                                                : "bg-white text-brand-text-secondary border-brand-border hover:border-black"
                                                }`}
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
                                    placeholder="e.g. emphasize capital flight risk..."
                                    className="w-full bg-brand-background border border-brand-border rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-black focus:outline-none h-[74px] resize-none"
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-brand-border pt-8">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIncludeSignature(!includeSignature)}
                                    className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${includeSignature ? 'bg-black text-white border-black' : 'border-brand-border text-brand-text-secondary'}`}
                                >
                                    <Stamp className="h-5 w-5" />
                                </button>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-black">Append Authority</p>
                                    <p className="text-[10px] font-medium text-brand-text-secondary uppercase">Sign as Partner</p>
                                </div>
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={loading || selectedLotIds.length === 0}
                                className="btn-primary min-w-[200px] flex items-center justify-center gap-3 uppercase text-xs tracking-[0.2em]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Generating
                                    </>
                                ) : (
                                    "Build Memo"
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Output */}
                    {generatedDraft && (
                        <div className="card p-12 bg-white animate-in fade-in duration-700">
                            <article className="prose prose-sm prose-neutral max-w-none prose-headings:font-bold prose-headings:tracking-tighter prose-p:text-brand-text-primary prose-strong:text-black">
                                <ReactMarkdown>{generatedDraft}</ReactMarkdown>
                            </article>
                        </div>
                    )}
                </div>
            </div>

            {/* Global FAB */}
            <button className="fab uppercase text-[10px] tracking-[0.3em] flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                System Active
            </button>
        </div>
    );
}
