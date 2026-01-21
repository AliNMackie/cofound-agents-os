// API client for Sentinel Growth service

import { AuctionData, AuctionIngestRequest, IntelligenceSignal } from '@/types/sentinel';
import { DataSource, IndustryContext } from '@/types/settings';

const SENTINEL_API_URL = process.env.NEXT_PUBLIC_SENTINEL_API_URL || 'https://sentinel-growth-hc7um252na-nw.a.run.app';

export async function ingestAuction(request: AuctionIngestRequest): Promise<AuctionData> {
    const response = await fetch(`${SENTINEL_API_URL}/ingest/auction`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
}

export async function getSources(): Promise<DataSource[]> {
    const response = await fetch(`${SENTINEL_API_URL}/sources`);
    if (!response.ok) {
        // Return empty if 404/server error to avoid crashing UI completely? 
        // Or throw to show error state.
        throw new Error(`Failed to fetch sources: ${response.statusText}`);
    }
    return response.json();
}

export async function addSource(source: Omit<DataSource, 'id' | 'lastChecked'>): Promise<DataSource> {
    const response = await fetch(`${SENTINEL_API_URL}/sources`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(source),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to add source: ${response.statusText}`);
    }

    return response.json();
}

export async function deleteSource(url: string): Promise<void> {
    const response = await fetch(`${SENTINEL_API_URL}/sources?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`Failed to delete source: ${response.statusText}`);
    }
}

export async function getIndustries(): Promise<IndustryContext[]> {
    const response = await fetch(`${SENTINEL_API_URL}/industries`);
    if (!response.ok) {
        console.error(`Failed to fetch industries: ${response.statusText}`);
        return []; // Fail safe default (empty list will trigger fallback to defaults in Context)
    }
    return response.json();
}

export async function getSignals(industryId?: string): Promise<IntelligenceSignal[]> {
    const url = new URL(`${SENTINEL_API_URL}/signals`);
    if (industryId) {
        url.searchParams.append('industry_id', industryId);
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
        console.error(`Failed to fetch signals: ${response.statusText}`);
        return [];
    }
    return response.json();
}

export async function triggerSweep(): Promise<{ status: string }> {
    const response = await fetch(`${SENTINEL_API_URL}/tasks/sweep`, {
        method: 'POST'
    });

    if (!response.ok) {
        throw new Error('Failed to trigger sweep');
    }
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
