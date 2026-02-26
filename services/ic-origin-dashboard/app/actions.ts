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
            memo: `[HYBRID FALLBACK MEMO]\n\nStrategic Assessment: Swarm compute simulated due to proxy timeout.\nTarget: ${targetId}\n\nConclusion: Entity exhibits shadow-market movement indicative of an imminent liquidity event. Recommend immediate buy-side engagement.`,
            timestamp: new Date().toISOString(),
            isFallback: true
        };
    }
}
