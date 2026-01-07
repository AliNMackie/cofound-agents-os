/**
 * Vesper Scout - Lead Ingestion Agent
 * 
 * Responsible for ingesting raw leads from LinkedIn/Reddit,
 * filtering them against an ICP score, and saving them to Firestore.
 */

export interface Lead {
    name: string;
    company: string;
    score: number;
    source: string;
    ingestedAt: string;
}

/**
 * Ingest leads from a specified source.
 * 
 * @param source - The lead source (e.g., "linkedin", "reddit")
 * @returns Array of ingested leads
 * 
 * Note: This is a mock implementation. Real scraping requires
 * external API keys (Unipile for LinkedIn, Reddit API, etc.)
 */
export function ingestLeads(source: string): Lead[] {
    // Mock data for development/testing
    const mockLeads: Lead[] = [
        {
            name: "Sarah Chen",
            company: "TechStart AI",
            score: 92,
            source,
            ingestedAt: new Date().toISOString(),
        },
        {
            name: "Marcus Johnson",
            company: "Acme Corp",
            score: 85,
            source,
            ingestedAt: new Date().toISOString(),
        },
        {
            name: "Elena Rodriguez",
            company: "Growth Dynamics",
            score: 78,
            source,
            ingestedAt: new Date().toISOString(),
        },
    ];

    // Filter by ICP score threshold (>= 75)
    const qualifiedLeads = mockLeads.filter((lead) => lead.score >= 75);

    console.log(
        `[Scout] Ingested ${qualifiedLeads.length} leads from ${source}`
    );

    return qualifiedLeads;
}
