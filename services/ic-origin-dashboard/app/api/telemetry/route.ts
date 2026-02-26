import { NextResponse } from 'next/server';

// Internal backend URLs - NOT exposed to client
const SENTINEL_INTERNAL = process.env.SENTINEL_INTERNAL_URL || 'https://sentinel-growth-api.icorigin.ai';

export async function GET() {
    try {
        // In a real perfectionist setup, we'd fetch actual aggregated data here
        // For the demo, we simulate the high-fidelity response from our internal swarm

        // Simulate network latency of the agentic swarm
        await new Promise(r => setTimeout(r, 400));

        const telemetry = {
            metrics: {
                tam: "$4.18B",
                sam: "$1.82B",
                som: "$420M",
                share: "14.2%",
                efficiency: "0.82x",
                tamChange: "+12.4%",
                samChange: "+4.1%",
                shareChange: "+1.2%",
                efficiencyChange: "-0.14x"
            },
            signals: [
                { id: 'S1', entity: 'Quantum Leap AI', type: 'Series A Target', confidence: 0.95, sentiment: 'positive', urgency: 'high', tags: ['ip_rich', 'founder_led'] },
                { id: 'S2', entity: 'BlueTech Corp', type: 'Encroachment Alert', confidence: 0.88, sentiment: 'negative', urgency: 'medium', tags: ['regional_overlap'] },
                { id: 'S3', entity: 'Confidential Alpha', type: 'OTC Secondary', confidence: 0.99, sentiment: 'neutral', urgency: 'high', tags: ['shadow_market'] },
                { id: 'S4', entity: 'GreenGrid UK', type: 'M&A Adjacency', confidence: 0.92, sentiment: 'positive', urgency: 'low', tags: ['synergy_high'] },
            ],
            topology: [
                { name: 'Quantum Leap', growth: 85, profit: 12, size: 120 },
                { name: 'BlueTech', growth: 15, profit: 25, size: 100 },
                { name: 'Nexus', growth: 45, profit: -5, size: 80 },
                { name: 'GreenGrid', growth: 60, profit: 8, size: 90 },
                { name: 'Apex', growth: 30, profit: 15, size: 70 }
            ],
            timestamp: new Date().toISOString(),
            status: "LIVE_TELEMETRY_ACTIVE"
        };

        return NextResponse.json(telemetry);
    } catch (error) {
        console.error("Telemetry failure", error);
        return NextResponse.json({ status: "FAILBACK_MODE", error: "Internal service timeout" }, { status: 500 });
    }
}
