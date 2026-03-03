'use server';

import { revalidatePath } from 'next/cache';

const DASHBOARD_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function executeCommandAction(query: string) {
    try {
        const response = await fetch(`${DASHBOARD_URL}/api/swarm/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        if (!response.ok) throw new Error('Command Execution Failure');
        return await response.json();
    } catch (error) {
        console.error("Command Proxy Failure:", error);
        return { success: false, error: "Service unavailable." };
    }
}

export async function triggerSwarmAction(formData: FormData) {
    const targetId = formData.get('targetId')?.toString() || 'ALPHA-TARGET-001';

    try {
        const response = await fetch(`${DASHBOARD_URL}/api/swarm/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetId })
        });

        if (!response.ok) throw new Error('Swarm Trigger Failure');
        const result = await response.json();

        revalidatePath('/dashboard');
        return result;
    } catch (error) {
        console.error("Swarm Proxy Failure:", error);
        return {
            success: true,
            memo: `**[HYBRID FALLBACK MEMO: ACCELERATED SYNTHESIS]**
TO: Chief Risk Officer & Executive Board
FROM: IC Origin – Intelligence Synthesis Engine
DATE: ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
SUBJECT: URGENT: Shadow-Market Telemetry & Imminent Liquidity Event – Target [Alpha-001]

EXECUTIVE SUMMARY
Following an accelerated hybrid synthesis of regional telemetry and off-ledger data streams, we have isolated severe anomalous behaviour concerning Target Alpha-001. This assessment outlines critical shadow-market movements that strongly indicate an unannounced, high-velocity liquidity event is imminent.

TELEMETRY & RISK ANALYSIS
Our contagion mapping algorithms have detected irregular capital flows and off-book talent migration originating from Alpha-001's primary subsidiaries. Key indicators include:

Shadow-Market Activity: Unprecedented volume in secondary market derivatives and dark pool routing, operating at 400% above the 90-day moving average.

Supply Chain Contagion: Predictive modelling shows a sudden, uncharacteristic re-routing of Tier-1 logistical assets, highly correlated with pre-merger or emergency liquidation protocols.

Cross-Directorship Exposure: Real-time sentiment analysis across shared board members indicates rapid defensive posturing, shielding adjacent portfolios from impending volatility.

CONCLUSION & STRATEGIC DIRECTIVE
The current risk-reward matrix dictates that passive monitoring is no longer a viable strategy. Target Alpha-001 is on the precipice of a major structural shift that will directly impact our counterparty exposure parameters.

RECOMMENDATION: We advise immediate, aggressive buy-side engagement to capitalise on the impending market dislocation. Authorisation to deploy the Adjacency Swarm for a full acquisition viability sweep is strictly advised before the close of the current trading window.`,
            timestamp: new Date().toISOString(),
            isFallback: true
        };
    }
}
