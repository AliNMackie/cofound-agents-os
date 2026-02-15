// API client for Sentinel Growth service

import { AuctionData, AuctionIngestRequest, IntelligenceSignal } from '@/types/sentinel';
import { DataSource, IndustryContext } from '@/types/settings';

import { getAuth } from "firebase/auth";

const SENTINEL_API_URL = process.env.NEXT_PUBLIC_SENTINEL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://sentinel-growth-hc7um252na-nw.a.run.app';

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

export async function ingestAuction(request: AuctionIngestRequest): Promise<AuctionData> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SENTINEL_API_URL}/ingest/auction`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
}

export async function getSources(): Promise<DataSource[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SENTINEL_API_URL}/sources`, {
        headers: headers
    });
    if (!response.ok) {
        // Return empty if 404/server error to avoid crashing UI completely? 
        // Or throw to show error state.
        throw new Error(`Failed to fetch sources: ${response.statusText}`);
    }
    return response.json();
}

export async function addSource(source: Omit<DataSource, 'id' | 'lastChecked'>): Promise<DataSource> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SENTINEL_API_URL}/sources`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(source),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to add source: ${response.statusText}`);
    }

    return response.json();
}

export async function deleteSource(url: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SENTINEL_API_URL}/sources?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
        headers: headers
    });

    if (!response.ok) {
        throw new Error(`Failed to delete source: ${response.statusText}`);
    }
}

export async function getIndustries(): Promise<IndustryContext[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SENTINEL_API_URL}/industries`, {
        headers: headers
    });
    if (!response.ok) {
        console.error(`Failed to fetch industries: ${response.statusText}`);
        return []; // Fail safe default (empty list will trigger fallback to defaults in Context)
    }
    return response.json();
}

export async function getSignals(industryId?: string, days?: number, query?: string, sourceFamily?: string): Promise<IntelligenceSignal[]> {
    const url = new URL(`${SENTINEL_API_URL}/signals`);
    if (industryId) {
        url.searchParams.append('industry_id', industryId);
    }
    if (days) {
        url.searchParams.append('days', days.toString());
    }
    if (query) {
        url.searchParams.append('q', query);
    }
    if (sourceFamily) {
        url.searchParams.append('source_family', sourceFamily);
    }

    const headers = await getAuthHeaders();
    const response = await fetch(url.toString(), {
        headers: headers
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Signal fetch failed: ${response.statusText}`);
    }
    return response.json();
}

export async function triggerSweep(): Promise<{ status: string; task_id?: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SENTINEL_API_URL}/tasks/sweep`, {
        method: 'POST',
        headers: headers
    });

    if (!response.ok) {
        throw new Error('Failed to trigger sweep');
    }
    return response.json();
}

export async function getTaskStatus(taskId: string): Promise<{ status: string; progress?: number; message?: string; error?: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SENTINEL_API_URL}/tasks/${taskId}`, {
        headers: headers
    });

    if (!response.ok) {
        throw new Error('Failed to get task status');
    }
    return response.json();
}

export async function generateDossier(signalId: string): Promise<Blob> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SENTINEL_API_URL}/signals/generate/dossier`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ signal_id: signalId })
    });

    if (!response.ok) {
        throw new Error(`Failed to generate dossier: ${response.statusText}`);
    }

    return response.blob();
}

export async function generateMorningBriefing(): Promise<{ status: string; url: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SENTINEL_API_URL}/pulses/generate-briefing`, {
        method: 'POST',
        headers: headers
    });

    if (!response.ok) {
        throw new Error('Failed to generate briefing');
    }
    return response.json();
}

// API Keys
export interface ApiKey {
    id: string;
    label: string;
    prefix: string;
    created_at: string;
    status: string;
    key?: string; // Only returned on creation
}

export async function getApiKeys(): Promise<ApiKey[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SENTINEL_API_URL}/api-keys`, {
        headers
    });
    if (!response.ok) throw new Error("Failed to fetch API keys");
    return response.json();
}

export async function createApiKey(label: string): Promise<ApiKey> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SENTINEL_API_URL}/api-keys`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ label, scopes: ["read"] })
    });
    if (!response.ok) throw new Error("Failed to create API key");
    return response.json();
}

export async function revokeApiKey(keyId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SENTINEL_API_URL}/api-keys/${keyId}`, {
        method: "DELETE",
        headers
    });
    if (!response.ok) throw new Error("Failed to revoke API key");
}


// Re-export types
export type { IntelligenceSignal } from '@/types/sentinel';

export async function getLatestPulse(): Promise<any> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SENTINEL_API_URL}/pulses/latest`, {
        headers
    });
    if (!response.ok) throw new Error("Failed to fetch latest pulse");
    return response.json();
}

export async function triggerMorningPulse(): Promise<any> {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SENTINEL_API_URL}/pulses/trigger`, {
        method: "POST",
        headers
    });
    if (!response.ok) throw new Error("Failed to trigger pulse");
    return response.json();
}

// Mock data for development
export function getMockAuction(): AuctionData {
    return {
        company_name: "GameNation",
        company_description: "Leading gaming venue operator across the UK",
        ebitda: "£5.5m",
        ownership: "Morgan Stanley Private Equity",
        advisor: "Global Leisure Partners",
        process_status: "Postponed - H1 2024",
        company_profile: {
            registration_number: "12345678",
            incorporation_date: "2010-05-20",
            sic_codes: ["92000 - Gambling and betting activities"],
            registered_address: "123 High Street, London, SW1A 1AA",
            company_status: "active",
            company_type: "ltd"
        }
    };
}
