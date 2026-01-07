// Sentinel Growth types

export interface CompanyProfile {
    registration_number: string | null;
    incorporation_date: string | null;
    sic_codes: string[] | null;
    registered_address: string | null;
    company_status: string | null;
    company_type: string | null;
}

export interface AuctionData {
    company_name: string;
    company_description: string | null;
    ebitda: string | null;
    ownership: string | null;
    advisor: string | null;
    process_status: string;
    company_profile: CompanyProfile | null;
}

export interface AuctionIngestRequest {
    source_text: string;
    source_origin?: string;
}
