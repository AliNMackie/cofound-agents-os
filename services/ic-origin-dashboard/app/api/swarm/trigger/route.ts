import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '../../../../lib/firebase-admin';

const ORCHESTRATOR_INTERNAL = process.env.ORCHESTRATOR_INTERNAL_URL || 'https://orchestrator-api.icorigin.ai';

export async function POST(req: Request) {
    try {
        const { targetId } = await req.json();

        // [PHASE 4] Institutional Deep-Dive logic
        const entityDoc = await db.collection('monitored_entities').doc(targetId).get();
        const entityData = entityDoc.exists ? entityDoc.data() : null;

        const alertsSnapshot = await db.collection('strategic_alerts')
            .where('entity_id', '==', targetId)
            .orderBy('timestamp', 'desc')
            .limit(3)
            .get();

        const recentSignals = alertsSnapshot.docs.map(d => d.data().context).join("; ");

        // Securely call the internal orchestrator
        const response = await fetch(`${ORCHESTRATOR_INTERNAL}/strategize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                entity_id: targetId,
                context: {
                    score: entityData?.current_score,
                    recent_signals: recentSignals,
                    last_observed: entityData?.updated_at
                }
            })
        });

        if (!response.ok) throw new Error('Orchestrator Swarm Failure');

        const result = await response.json();

        // [INSTITUTIONAL AUDIT TRAIL]
        await db.collection('audit_logs').add({
            action: 'SWARM_TRIGGER_DEEP_DIVE',
            target_id: targetId,
            timestamp: new Date().toISOString(),
            status: 'SUCCESS',
        });

        return NextResponse.json({
            success: true,
            memo: result.memo_snippet,
            strategies: result.strategies,
            discoveryTags: result.discovery_tags,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Swarm trigger error:", error);
        return NextResponse.json({ success: false, error: "Internal service error" }, { status: 500 });
    }
}
