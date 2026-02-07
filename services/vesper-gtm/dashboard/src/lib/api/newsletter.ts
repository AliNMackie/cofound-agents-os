// Client for Newsletter Engine API

import { getAuth } from "firebase/auth";

const NEWSLETTER_API_URL = process.env.NEXT_PUBLIC_NEWSLETTER_API_URL || "https://newsletter-engine-193875309190.europe-west2.run.app";

async function getAuthHeaders(): Promise<HeadersInit> {
    const auth = getAuth();
    const user = auth.currentUser;
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export async function getBrandVoice(userId: string): Promise<{ analysis_summary: string; system_instruction: string } | null> {
    // Note: This endpoint is public currently but good to wrap
    const response = await fetch(`${NEWSLETTER_API_URL}/brand-voice/${userId}`);
    if (!response.ok) {
        console.warn("Failed to fetch brand voice");
        return null;
    }
    return response.json();
}

export async function generateMemoDraft(payload: any): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${NEWSLETTER_API_URL}/draft`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error("Generation failed");
    }

    // Response contains the draft. Ideally we return it or handle it.
    // For now the existing UI seems to rely on side effects (newsroom update?) 
    // or just alerts success. The previous code didn't use the return value other than OK check.
    return response.json();
}
