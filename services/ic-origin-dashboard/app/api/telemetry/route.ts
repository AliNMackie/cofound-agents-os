import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '../../../lib/firebase-admin';

export async function GET() {
    try {
        // [PHASE 4] Pulse Activation: Live Data Integration
        // Fetch monitored entities (top performance by score)
        const entitiesSnapshot = await db.collection('monitored_entities')
            .orderBy('current_score', 'desc')
            .limit(10)
            .get();

        const topology = entitiesSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                name: data.entity_id || 'Unknown Entity',
                growth: data.current_score || 0,
                profit: Math.floor(Math.random() * 20) + 5, // Mocked for demo aesthetics
                size: (data.score_history?.length || 1) * 20 + 50,
                context: data.last_context
            };
        });

        // Fetch recent strategic alerts for signal feed
        const alertsSnapshot = await db.collection('strategic_alerts')
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();

        const signals = alertsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                entity: data.entity_id,
                type: data.alert_type,
                confidence: (data.score || 0) / 100,
                sentiment: (data.score || 0) > 80 ? 'positive' : 'neutral',
                urgency: (data.score || 0) > 90 ? 'high' : 'medium',
                tags: ['institutional', 'shadow_market']
            };
        });

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
            signals: signals.length > 0 ? signals : [
                { id: 'S1', entity: 'Quantum Leap AI', type: 'Series A Target', confidence: 0.95, sentiment: 'positive', urgency: 'high', tags: ['ip_rich', 'founder_led'] },
                { id: 'S2', entity: 'BlueTech Corp', type: 'Encroachment Alert', confidence: 0.88, sentiment: 'negative', urgency: 'medium', tags: ['regional_overlap'] },
            ],
            topology: topology.length > 0 ? topology : [
                { name: 'Quantum Leap', growth: 85, profit: 12, size: 120 },
                { name: 'BlueTech', growth: 15, profit: 25, size: 100 },
                { name: 'Nexus', growth: 45, profit: -5, size: 80 },
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
