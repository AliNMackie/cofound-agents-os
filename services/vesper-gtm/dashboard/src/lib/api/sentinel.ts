// API client for Sentinel Growth service

import { AuctionData, AuctionIngestRequest } from '@/types/sentinel';

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
