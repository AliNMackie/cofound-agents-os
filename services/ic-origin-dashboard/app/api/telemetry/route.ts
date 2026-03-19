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
                company_id: doc.id,
                company_name: data.company_name || 'Unknown',
                company_number: data.company_number || 'N/A',
                counterparty_type: data.counterparty_type || 'BORROWER',
                risk_tier: data.risk_tier || 'UNSCORED',
                region: data.region || 'UK',
                conviction_score: data.conviction_score || 0,
                last_signal_date: data.last_signal_date || '-',
                last_signal_description: data.last_signal_description || 'Pending Analysis',
                statutory_signals: {
                    total_active_charges: data.statutory_signals?.total_active_charges || 0,
                    director_churn_index: data.statutory_signals?.director_churn_index || 0,
                    recent_mr01_count_24mo: data.statutory_signals?.recent_mr01_count_24mo || 0,
                    recent_mr04_count_24mo: data.statutory_signals?.recent_mr04_count_24mo || 0,
                },
                score_history: data.score_history || []
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
            signals: signals,
            topology: topology,
            timestamp: new Date().toISOString(),
            status: "LIVE_TELEMETRY_ACTIVE"
        };

        return NextResponse.json(telemetry);
    } catch (error) {
        console.error("Telemetry failure", error);
        // Return graceful fallback so dashboard never crashes
        return NextResponse.json({
            metrics: {
                tam: "$4.18B", sam: "$1.82B", som: "$420M", share: "14.2%", efficiency: "0.82x",
                tamChange: "+12.4%", samChange: "+4.1%", shareChange: "+1.2%", efficiencyChange: "-0.14x"
            },
            signals: [],
            topology: [],
            timestamp: new Date().toISOString(),
            status: "FAILBACK_MODE"
        });
    }
}
