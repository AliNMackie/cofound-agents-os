import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        // [INSTITUTIONAL RESET - GOLDEN_V2.1]
        const categories = [
            { cat: "Obvious Winner", count: 8, base_score: 85 },
            { cat: "Borderline", count: 6, base_score: 60 },
            { cat: "Distressed / Contrarian", count: 6, base_score: 35 }
        ];

        const regions = [
            { name: "North West", cluster: "Manchester Tech Corridor" },
            { name: "Midlands", cluster: "Birmingham industrial Hub" },
            { name: "Scotland", cluster: "Central Belt" }
        ];

        const entities: any[] = [];
        let idCounter = 1;

        categories.forEach(({ cat, count, base_score }) => {
            for (let i = 0; i < count; i++) {
                const region = regions[idCounter % regions.length];
                const id = `alpha-${idCounter.toString().padStart(3, '0')}`;
                const name = `${cat.split(' ')[0]} ${region.name} Entity ${i + 1}`;

                // Simulate statutory signals for "Shadow Market" triggers
                const mr01 = (cat === "Distressed / Contrarian" || Math.random() > 0.7) ? 2 : 0;
                const mr04 = (mr01 > 0 && Math.random() > 0.5) ? 1 : 0; // Debt Whiplash trigger
                const hiring = cat === "Obvious Winner" ? 15 : (cat === "Borderline" ? 5 : -10);
                const jobs = (cat === "Distressed / Contrarian" && hiring < 0) ? 0 : 3; // Talent Freeze check

                entities.push({
                    company_id: id,
                    company_name: name,
                    incorporation_date: "2018-05-12",
                    region: region.name,
                    regional_cluster: region.cluster,
                    primary_sic: ["62010", "70229"],
                    financials: {
                        latest_revenue_gbp: 5000000 + (Math.random() * 20000000),
                        revenue_growth_yoy_pct: base_score + (Math.random() * 20 - 10),
                        ebitda_margin_pct: (base_score / 4) + (Math.random() * 10 - 5),
                        last_accounts_date: "2025-12-31"
                    },
                    statutory_signals: {
                        total_active_charges: Math.floor(Math.random() * 5),
                        recent_mr01_count_24mo: mr01,
                        recent_mr04_count_24mo: mr04,
                        last_mr04_date: mr04 > 0 ? "2025-11-20" : null,
                        director_churn_index: Math.random(),
                        last_sec167_filing: "2025-10-15"
                    },
                    human_capital: {
                        linkedin_headcount: 50 + Math.floor(Math.random() * 200),
                        hiring_velocity_6mo_pct: hiring,
                        tech_ai_talent_concentration: cat === "Obvious Winner" ? "High" : "Medium",
                        active_job_postings: jobs
                    },
                    ic_origin_classification: {
                        category: cat,
                        primary_thesis: `High conviction ${cat} play in ${region.cluster}. Strategic synergy depth: SECOR-9.`,
                        distress_probability_score: 100 - base_score
                    },
                    metadata: {
                        last_scraped: new Date().toISOString(),
                        schema_version: "Golden_v2.1"
                    }
                });
                idCounter++;
            }
        });

        const batch = db.batch();

        entities.forEach(entity => {
            const ref = db.collection('monitored_entities').doc(entity.company_id);
            batch.set(ref, entity);
        });

        // Seed Adjacency Scores (Topology fallback)
        entities.forEach(entity => {
            const ref = db.collection('adjacency_scores').doc(`score_${entity.company_id}`);
            batch.set(ref, {
                entity_id: entity.company_name,
                adjacency_score: entity.ic_origin_classification.distress_probability_score,
                last_updated: new Date().toISOString()
            });
        });

        await batch.commit();

        return NextResponse.json({
            success: true,
            message: "Institutional environment recalibrated.",
            entities_seeded: entities.length
        });
    } catch (error) {
        console.error("Seeding error:", error);
        return NextResponse.json({ success: false, error: "Recalibration failed." }, { status: 500 });
    }
}
