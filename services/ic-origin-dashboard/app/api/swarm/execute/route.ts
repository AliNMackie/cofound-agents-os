import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '../../../../lib/firebase-admin';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        const systemPrompt = `
        You are the IC Origin Strategic Assistant.
        Parse the following natural language query into a structured search intent for institutional market data.
        Query: "${query}"
        
        Focus on identifying:
        1. Sector or Region.
        2. Category (Obvious Winner, Borderline, Distressed / Contrarian).
        3. Shadow Market signals: 
           - "Talent Freeze" (hiring velocity < 0 and no postings)
           - "Debt Whiplash" (recent charges and satisfactions)
           - "Board Volatility" (high director churn)
           - "Leverage Creep" (high active charges)

        Return exactly this JSON format:
        {
            "region": "string|null",
            "sector": "string|null",
            "category": "string|null",
            "signals": ["Talent Freeze", "Debt Whiplash", "Board Volatility", "Leverage Creep"],
            "urgency": "high|medium|low|null",
            "intent": "string"
        }`;

        const genResult = await model.generateContent(systemPrompt);
        const intentData = JSON.parse(genResult.response.text().replace(/```json|```/g, ''));

        // [INSTITUTIONAL DATA FETCH]
        const entitiesRef = db.collection('monitored_entities');
        const snapshot = await entitiesRef.limit(50).get();
        let matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Strategic Filtering Loop
        matches = matches.map((m: any) => {
            const activeSignals: string[] = [];

            // 1. Talent Freeze
            if ((m.human_capital?.hiring_velocity_6mo_pct || 0) < 0 && (m.human_capital?.active_job_postings || 0) === 0) {
                activeSignals.push("Talent Freeze");
            }

            // 2. Debt Whiplash
            if ((m.statutory_signals?.recent_mr01_count_24mo || 0) > 0 && (m.statutory_signals?.recent_mr04_count_24mo || 0) > 0) {
                activeSignals.push("Debt Whiplash");
            }

            // 3. Board Volatility
            if ((m.statutory_signals?.director_churn_index || 0) > 0.5) {
                activeSignals.push("Board Volatility");
            }

            // 4. Leverage Creep (Normalized threshold: 3)
            if ((m.statutory_signals?.total_active_charges || 0) > 3) {
                activeSignals.push("Leverage Creep");
            }

            return { ...m, detected_signals: activeSignals };
        });

        // Filter by intent
        if (intentData.region) {
            matches = matches.filter((m: any) => m.region?.toLowerCase().includes(intentData.region.toLowerCase()));
        }
        if (intentData.category) {
            matches = matches.filter((m: any) => m.ic_origin_classification?.category === intentData.category);
        }
        if (intentData.signals && intentData.signals.length > 0) {
            matches = matches.filter((m: any) =>
                m.detected_signals.some((s: string) => intentData.signals.includes(s))
            );
        }

        return NextResponse.json({
            success: true,
            intent: intentData.intent,
            matches: matches.map((m: any) => ({
                id: m.company_id,
                name: m.company_name,
                score: m.ic_origin_classification?.distress_probability_score || 0,
                tags: [...(m.detected_signals || []), m.ic_origin_classification?.category],
                thesis: m.ic_origin_classification?.primary_thesis
            })).slice(0, 5),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Command execution error:", error);
        return NextResponse.json({ success: false, error: "Internal service error" }, { status: 500 });
    }
}
