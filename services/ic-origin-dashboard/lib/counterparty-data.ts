/**
 * Counterparty Risk Intelligence — TypeScript Interfaces & Demo Data
 *
 * Derived from Golden_v2.1 entity schema (api/admin/seed/route.ts)
 * and the Sprint 1/2 backend models (schemas/auctions.py).
 */

// ─── Risk Taxonomy (mirrors backend RiskTier enum) ───────────────────────────

export type RiskTier = 'ELEVATED_RISK' | 'STABLE' | 'IMPROVED' | 'UNSCORED';
export type CounterpartyType = 'BORROWER' | 'SUPPLIER' | 'INSURED';

// ─── Score History (time-series data for RiskTrend chart) ────────────────────

export interface ScoreHistory {
    date: string;           // ISO date string (YYYY-MM-DD)
    adjacency_score: number; // 0–100
    risk_tier: RiskTier;
    event?: string;         // shadow-market event description
}

// ─── Risk Signal (extracted from CH filings via LLM) ─────────────────────────

export interface RiskSignal {
    date: string;
    signal_type: string;    // e.g. 'NEW_CHARGE', 'DIRECTOR_RESIGNED', 'PSC_CHANGE'
    description: string;
    severity: 'critical' | 'warning' | 'info';
}

// ─── Counterparty Entity ─────────────────────────────────────────────────────

export interface Counterparty {
    company_id: string;
    company_name: string;
    company_number: string;
    counterparty_type: CounterpartyType;
    risk_tier: RiskTier;
    region: string;
    conviction_score: number;       // 0–100
    last_signal_date: string;       // ISO date
    last_signal_description: string;
    statutory_signals: {
        total_active_charges: number;
        director_churn_index: number;  // 0.0–1.0
        recent_mr01_count_24mo: number;
        recent_mr04_count_24mo: number;
    };
    score_history: ScoreHistory[];
}

// ─── Portfolio Summary (computed) ────────────────────────────────────────────

export interface PortfolioSummary {
    total_entities: number;
    elevated_count: number;
    stable_count: number;
    improved_count: number;
    unscored_count: number;
    avg_conviction: number;
    elevated_pct: number;
}

// ─── Demo Data ───────────────────────────────────────────────────────────────
// Realistic counterparty portfolio for institutional pitch demos.
// Mirrors the Golden_v2.1 entity schema structure.

function generateScoreHistory(
    baseScore: number,
    riskTier: RiskTier,
    events: { dayOffset: number; delta: number; event: string }[]
): ScoreHistory[] {
    const history: ScoreHistory[] = [];
    const today = new Date();
    let score = baseScore;

    for (let i = 90; i >= 0; i -= 7) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Apply events
        const matchedEvent = events.find(e => Math.abs(e.dayOffset - i) < 4);
        if (matchedEvent) {
            score = Math.max(0, Math.min(100, score + matchedEvent.delta));
        }

        let tier: RiskTier = 'STABLE';
        if (score >= 75) tier = 'ELEVATED_RISK';
        else if (score >= 40) tier = 'STABLE';
        else tier = 'IMPROVED';

        history.push({
            date: date.toISOString().split('T')[0],
            adjacency_score: Math.round(score + (Math.random() * 4 - 2)),
            risk_tier: tier,
            event: matchedEvent?.event,
        });
    }
    return history;
}

export const DEMO_COUNTERPARTIES: Counterparty[] = [
    {
        company_id: 'cp-001',
        company_name: 'Meridian Capital Holdings Ltd',
        company_number: '09847231',
        counterparty_type: 'BORROWER',
        risk_tier: 'ELEVATED_RISK',
        region: 'North West',
        conviction_score: 88,
        last_signal_date: '2026-02-25',
        last_signal_description: 'New debenture registered — Barclays Bank PLC',
        statutory_signals: {
            total_active_charges: 4,
            director_churn_index: 0.72,
            recent_mr01_count_24mo: 3,
            recent_mr04_count_24mo: 1,
        },
        score_history: generateScoreHistory(65, 'ELEVATED_RISK', [
            { dayOffset: 56, delta: 12, event: 'New charge: Barclays floating debenture' },
            { dayOffset: 35, delta: 8, event: 'Director resignation: CFO departed' },
            { dayOffset: 14, delta: 5, event: 'PSC change: PE fund acquired 25% stake' },
        ]),
    },
    {
        company_id: 'cp-002',
        company_name: 'Helix Infrastructure Group PLC',
        company_number: '11234567',
        counterparty_type: 'SUPPLIER',
        risk_tier: 'ELEVATED_RISK',
        region: 'Midlands',
        conviction_score: 82,
        last_signal_date: '2026-02-24',
        last_signal_description: 'Annual accounts overdue — HMRC filing default',
        statutory_signals: {
            total_active_charges: 5,
            director_churn_index: 0.85,
            recent_mr01_count_24mo: 2,
            recent_mr04_count_24mo: 2,
        },
        score_history: generateScoreHistory(55, 'ELEVATED_RISK', [
            { dayOffset: 70, delta: 10, event: 'Overdue accounts: 3 months past deadline' },
            { dayOffset: 42, delta: 15, event: 'New charge: HSBC fixed & floating charge' },
            { dayOffset: 21, delta: 5, event: 'Director churn: 2 resignations in 30 days' },
        ]),
    },
    {
        company_id: 'cp-003',
        company_name: 'Sterling Advanced Materials Ltd',
        company_number: 'SC456789',
        counterparty_type: 'INSURED',
        risk_tier: 'STABLE',
        region: 'Scotland',
        conviction_score: 45,
        last_signal_date: '2026-02-20',
        last_signal_description: 'Annual confirmation statement filed on time',
        statutory_signals: {
            total_active_charges: 1,
            director_churn_index: 0.15,
            recent_mr01_count_24mo: 0,
            recent_mr04_count_24mo: 0,
        },
        score_history: generateScoreHistory(42, 'STABLE', [
            { dayOffset: 45, delta: -3, event: 'Routine: Annual return filed' },
        ]),
    },
    {
        company_id: 'cp-004',
        company_name: 'Apex Logistics Partners Ltd',
        company_number: '08765432',
        counterparty_type: 'BORROWER',
        risk_tier: 'IMPROVED',
        region: 'North West',
        conviction_score: 30,
        last_signal_date: '2026-02-22',
        last_signal_description: 'Charge fully satisfied — Lloyds Banking Group',
        statutory_signals: {
            total_active_charges: 0,
            director_churn_index: 0.08,
            recent_mr01_count_24mo: 0,
            recent_mr04_count_24mo: 1,
        },
        score_history: generateScoreHistory(70, 'IMPROVED', [
            { dayOffset: 60, delta: -15, event: 'Charge satisfied: Lloyds floating debenture released' },
            { dayOffset: 30, delta: -10, event: 'Positive: Revenue growth YoY +18%' },
        ]),
    },
    {
        company_id: 'cp-005',
        company_name: 'Cobalt Ventures International Ltd',
        company_number: '12345678',
        counterparty_type: 'SUPPLIER',
        risk_tier: 'ELEVATED_RISK',
        region: 'Midlands',
        conviction_score: 91,
        last_signal_date: '2026-02-26',
        last_signal_description: 'PSC change: New controlling entity registered',
        statutory_signals: {
            total_active_charges: 3,
            director_churn_index: 0.92,
            recent_mr01_count_24mo: 4,
            recent_mr04_count_24mo: 0,
        },
        score_history: generateScoreHistory(50, 'ELEVATED_RISK', [
            { dayOffset: 80, delta: 8, event: 'New charge: RBS debenture registration' },
            { dayOffset: 50, delta: 12, event: 'PSC change: ownership transferred to BVI entity' },
            { dayOffset: 28, delta: 10, event: 'Director appointed: interim CEO from turnaround firm' },
            { dayOffset: 7, delta: 8, event: 'MR01 filing: new mortgage charge registered' },
        ]),
    },
    {
        company_id: 'cp-006',
        company_name: 'Northern Quay Property Holdings PLC',
        company_number: '07654321',
        counterparty_type: 'BORROWER',
        risk_tier: 'STABLE',
        region: 'North West',
        conviction_score: 52,
        last_signal_date: '2026-02-18',
        last_signal_description: 'Routine: New director appointment',
        statutory_signals: {
            total_active_charges: 2,
            director_churn_index: 0.38,
            recent_mr01_count_24mo: 1,
            recent_mr04_count_24mo: 0,
        },
        score_history: generateScoreHistory(48, 'STABLE', [
            { dayOffset: 40, delta: 5, event: 'New charge: standard floating debenture' },
            { dayOffset: 20, delta: -3, event: 'Routine: confirmation statement filed' },
        ]),
    },
    {
        company_id: 'cp-007',
        company_name: 'Ironclad Defence Systems Ltd',
        company_number: 'SC123456',
        counterparty_type: 'INSURED',
        risk_tier: 'STABLE',
        region: 'Scotland',
        conviction_score: 40,
        last_signal_date: '2026-02-15',
        last_signal_description: 'Full accounts filed — no anomalies',
        statutory_signals: {
            total_active_charges: 1,
            director_churn_index: 0.10,
            recent_mr01_count_24mo: 0,
            recent_mr04_count_24mo: 0,
        },
        score_history: generateScoreHistory(38, 'STABLE', []),
    },
    {
        company_id: 'cp-008',
        company_name: 'Vantage Digital Services Ltd',
        company_number: '13579246',
        counterparty_type: 'SUPPLIER',
        risk_tier: 'IMPROVED',
        region: 'Midlands',
        conviction_score: 25,
        last_signal_date: '2026-02-19',
        last_signal_description: 'Debt cleared: all charges fully satisfied',
        statutory_signals: {
            total_active_charges: 0,
            director_churn_index: 0.05,
            recent_mr01_count_24mo: 0,
            recent_mr04_count_24mo: 1,
        },
        score_history: generateScoreHistory(65, 'IMPROVED', [
            { dayOffset: 75, delta: -12, event: 'Charge satisfied: NatWest debenture released' },
            { dayOffset: 45, delta: -10, event: 'Charge satisfied: second debenture cleared' },
            { dayOffset: 20, delta: -8, event: 'Positive earnings: EBITDA margin +14%' },
        ]),
    },
];

// ─── Computed Summary ────────────────────────────────────────────────────────

export function computePortfolioSummary(entities: Counterparty[]): PortfolioSummary {
    const elevated = entities.filter(e => e.risk_tier === 'ELEVATED_RISK').length;
    const stable = entities.filter(e => e.risk_tier === 'STABLE').length;
    const improved = entities.filter(e => e.risk_tier === 'IMPROVED').length;
    const unscored = entities.filter(e => e.risk_tier === 'UNSCORED').length;
    const avgConviction = entities.length > 0
        ? Math.round(entities.reduce((sum, e) => sum + e.conviction_score, 0) / entities.length)
        : 0;

    return {
        total_entities: entities.length,
        elevated_count: elevated,
        stable_count: stable,
        improved_count: improved,
        unscored_count: unscored,
        avg_conviction: avgConviction,
        elevated_pct: entities.length > 0 ? Math.round((elevated / entities.length) * 100) : 0,
    };
}
