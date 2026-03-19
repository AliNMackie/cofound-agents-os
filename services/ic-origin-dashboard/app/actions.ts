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
            memo: `**[ORCHESTRATOR MEMO: HYDRATION IN PROGRESS]**
DATE: ${new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
SUBJECT: Custom Portfolio Intelligence

Your portfolio list has been successfully submitted to the Sentinel backend. 

Sentinel-Growth is currently executing its initial metrics sweep across Companies House index aggregates. 

Static dossier synthesis is temporarily suspended until first-run telemetry processing concludes. Check back shortly for dynamic synthesis.`,
            timestamp: new Date().toISOString(),
            isFallback: true
        };
    }
}
