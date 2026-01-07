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
                raw_data: selectedData,
                template_id: selectedTemplate,
                free_form_instruction: instructions,
                user_signature: includeSignature
                    ? '<br><strong>Alastair Mackie</strong><br><em>Partner, IC Origin</em><br><a href="mailto:ali@icorigin.com">ali@icorigin.com</a>'
                    : null,
            };

            const apiUrl = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL || "http://localhost:8089";
            const endpoint = `${apiUrl}/draft`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error("API Request Failed");

            const data = await response.json();
            setGeneratedDraft(data.draft || "No draft content returned.");
        } catch (error) {
            console.error(error);
            setGeneratedDraft("Error generating draft. Please check console.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        IC Origin Newsroom
                    </h1>
                    <p className="mt-1 text-gray-500">
                        AI-Powered Failed Auction Analysis & Deal Origination
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* LEFT COLUMN: Source Data */}
                <div className="flex flex-col gap-6">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
                            <FilePenLine className="h-5 w-5 text-indigo-600" />
                            Source: Failed Auctions
                        </h2>
                        <div className="space-y-3">
                            {MOCK_FAILED_LOTS.map((lot) => {
                                const isSelected = selectedLotIds.includes(lot.lot_number);
                                return (
                                    <div
                                        key={lot.lot_number}
                                        onClick={() => toggleLot(lot.lot_number)}
                                        className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-indigo-300 ${isSelected
                                            ? "border-indigo-600 bg-indigo-50/50"
                                            : "border-gray-200 bg-white"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900">
                                                        Lot {lot.lot_number}: {lot.auction_house}
                                                    </span>
                                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                                        {lot.sector}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-sm text-gray-600">{lot.address}</p>
                                                <div className="mt-2 text-xs text-gray-500">
                                                    Guide: {lot.guide_price} | Bid:{" "}
                                                    <span className="font-medium text-red-600">
                                                        {lot.final_bid}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-1">
                                                {isSelected ? (
                                                    <CheckSquare className="h-5 w-5 text-indigo-600" />
                                                ) : (
                                                    <Square className="h-5 w-5 text-gray-300" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 flex justify-between text-sm text-gray-500">
                            <span>{selectedLotIds.length} lots selected</span>
                            <button onClick={() => setSelectedLotIds([])} className="hover:text-indigo-600">Clear All</button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: The Writer */}
                <div className="flex flex-col gap-6">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold">Configuration</h2>

                        {/* Template Selector */}
                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Analysis Persona
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {TEMPLATES.map((tmpl) => (
                                    <button
                                        key={tmpl.id}
                                        onClick={() => setSelectedTemplate(tmpl.id)}
                                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${selectedTemplate === tmpl.id
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                            }`}
                                    >
                                        {tmpl.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Instructions */}
                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Additional Instructions
                            </label>
                            <textarea
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="e.g. Focus on the Leeds deal specifically..."
                                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                rows={3}
                            />
                        </div>

                        {/* Signature Toggle */}
                        <div className="mb-6 flex items-center gap-3">
                            <button
                                onClick={() => setIncludeSignature(!includeSignature)}
                                className={`flex items-center justify-center rounded-lg border p-2 transition-colors ${includeSignature
                                    ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                                    : "border-gray-200 text-gray-400 hover:border-gray-300"
                                    }`}
                            >
                                <Stamp className="h-5 w-5" />
                            </button>
                            <div className="text-sm">
                                <span className="block font-medium text-gray-700">Append Signature</span>
                                <span className="text-gray-500">Automatically sign as Alastair Mackie</span>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={handleGenerate}
                            disabled={loading || selectedLotIds.length === 0}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Analysing...
                                </>
                            ) : (
                                "Generate Draft"
                            )}
                        </button>
                    </div>

                    {/* Output Preview */}
                    {generatedDraft && (
                        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
                            <div className="prose prose-indigo max-w-none">
                                <ReactMarkdown>{generatedDraft}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
