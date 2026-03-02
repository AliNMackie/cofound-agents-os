import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { db } from '../../../../lib/firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

export async function POST(req: Request) {
    try {
        const { targetId } = await req.json();

        // 1. Fetch Board-Ready Context
        const entityDoc = await db.collection('monitored_entities').doc(targetId).get();
        if (!entityDoc.exists) {
            return NextResponse.json({ success: false, error: 'Entity not identified.' }, { status: 404 });
        }
        const entity = entityDoc.data() as any;

        // 2. Synthesize Emerald Memo Prompt
        const prompt = `
        You are the IC ORIGIN Orchestrator. 
        Generate a high-fidelity "Emerald Memo" strategic dossier for: ${entity.company_name} (${entity.company_id}).
        
        Institutional Context:
        - Primary Thesis: ${entity.ic_origin_classification?.primary_thesis}
        - Category: ${entity.ic_origin_classification?.category}
        - financials: Growth ${entity.financials?.revenue_growth_yoy_pct}%, EBITDA ${entity.financials?.ebitda_margin_pct}%, Revenue £${(entity.financials?.latest_revenue_gbp / 1000000).toFixed(1)}M
        - statutory_signals: ${entity.statutory_signals?.total_active_charges} charges, MR01: ${entity.statutory_signals?.recent_mr01_count_24mo}
        - human_capital: Velocity ${entity.human_capital?.hiring_velocity_6mo_pct}%, Job Postings ${entity.human_capital?.active_job_postings}
        
        Instructions:
        1. Start with the existing Primary Thesis.
        2. Expand into a multi-section strategic assessment.
        3. Identify specific "Shadow Market" risks or opportunities (e.g. Debt Whiplash, Talent Freeze).
        4. Use a cold, institutional, high-stakes tone.
        5. Output in professional markdown format.
        `;

        const result = await model.generateContent(prompt);
        const memo = result.response.text();

        // 3. Log Strategic Audit
        await db.collection('audit_logs').add({
            action: 'EMERALD_MEMO_SYNTHESIS',
            target_id: targetId,
            timestamp: new Date().toISOString(),
            status: 'SUCCESS',
        });

        return NextResponse.json({
            success: true,
            memo: memo,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Swarm trigger error:", error);
        return NextResponse.json({ success: false, error: "Internal service error" }, { status: 500 });
    }
}
