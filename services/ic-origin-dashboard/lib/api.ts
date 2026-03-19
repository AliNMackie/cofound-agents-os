export const SENTINEL_API = process.env.NEXT_PUBLIC_SENTINEL_API_URL || 'https://sentinel-growth-api.icorigin.ai';
export const ORCHESTRATOR_API = process.env.NEXT_PUBLIC_ORCHESTRATOR_API_URL || 'https://orchestrator-api.icorigin.ai';

export interface Signal {
    id: string;
    entity: string;
    type: string;
    confidence: number;
    sentiment: 'positive' | 'negative' | 'neutral';
    urgency: 'high' | 'medium' | 'low';
    tags: string[];
}

export interface MarketMetrics {
    tam: string;
    sam: string;
    som: string;
    share: string;
    efficiency: string;
    tamChange: string;
    samChange: string;
    shareChange: string;
    efficiencyChange: string;
}

export const fetchMarketMetrics = async (): Promise<MarketMetrics> => {
    try {
        // In a real scenario, this would hit Sentinel's /industries or /signals summary
        // For the demo, we'll simulate the live fetch with a slight delay
        await new Promise(r => setTimeout(r, 800));
        return {
            tam: "$4.2B",
            sam: "$1.8B",
            som: "$420M",
            share: "14.2%",
            efficiency: "0.82x",
            tamChange: "12.4%",
            samChange: "4.1%",
            shareChange: "1.2%",
            efficiencyChange: "0.14x"
        };
    } catch (e) {
        console.error("Failed to fetch market metrics", e);
        throw e;
    }
};

export const fetchSignals = async (): Promise<Signal[]> => {
    try {
        const response = await fetch(`${SENTINEL_API}/signals`);
        if (!response.ok) throw new Error('Sentinel signals unreachable');
        const data = await response.json();

        // Map backend schema to UI schema if necessary
        return data.map((s: any) => ({
            id: s.id || Math.random().toString(),
            entity: s.entity_name || s.entity || "Unknown Entity",
            type: s.signal_type || "Market Movement",
            confidence: s.confidence_score || 0.85,
            sentiment: s.sentiment || 'neutral',
            urgency: s.urgency || 'medium',
            tags: s.tags || ['strategic_alpha']
        })).slice(0, 4);
    } catch (e) {
        console.warn("Sentinel signals unreachable, returning empty set", e);
        return [];
    }
};

export const triggerStrategize = async (entityId: string) => {
    const response = await fetch(`${ORCHESTRATOR_API}/strategize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id: entityId })
    });
    if (!response.ok) throw new Error('Orchestrator unreachable');
    return response.json();
};
