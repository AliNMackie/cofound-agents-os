import { NextRequest, NextResponse } from "next/server";
import { ingestLeads } from "@/lib/scout";

/**
 * POST /api/scout/ingest
 * 
 * Endpoint to trigger lead ingestion from a specified source.
 * 
 * Request Body:
 *   { "source": "linkedin" | "reddit" }
 * 
 * Response:
 *   { "success": true, "leads": [...], "count": number }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const source = body.source || "unknown";

        const leads = ingestLeads(source);

        return NextResponse.json({
            success: true,
            source,
            leads,
            count: leads.length,
        });
    } catch (error) {
        console.error("[Scout API] Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to ingest leads" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/scout/ingest
 * 
 * Health check for the scout endpoint.
 */
export async function GET() {
    return NextResponse.json({
        status: "ok",
        endpoint: "/api/scout/ingest",
        method: "POST",
        description: "Send { source: 'linkedin' } to ingest leads",
    });
}
