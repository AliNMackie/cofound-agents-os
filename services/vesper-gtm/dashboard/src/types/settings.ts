export interface DataSource {
    id: string;
    name: string;
    url: string;
    type: 'RSS' | 'API' | 'Scrape';
    active: boolean;
    lastChecked?: Date; // Optional field to track health
}

export interface IndustryContext {
    id: string;
    name: string; // e.g., "Private Credit", "Commercial Real Estate"
    macroContext: string; // The "Notebook" text (e.g., "2026 Refi Cliff...")
    defaultPlaybooks: string[]; // IDs of playbooks relevant to this industry
}

export interface UserSettings {
    userId: string;
    currentIndustryId: string;
    dataSources: DataSource[];
    customContexts: IndustryContext[];
}
