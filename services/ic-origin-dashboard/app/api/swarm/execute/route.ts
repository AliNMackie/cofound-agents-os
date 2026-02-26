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
        
        Return exactly this JSON format:
        {
            "region": "string|null",
            "growthThreshold": number|null,
            "sector": "string|null",
            "urgency": "high|medium|low|null",
            "intent": "string"
        }`;

        const genResult = await model.generateContent(systemPrompt);
        const intentData = JSON.parse(genResult.response.text().replace(/```json|```/g, ''));

        // [INSTITUTIONAL DATA FETCH]
        let entitiesRef = db.collection('monitored_entities');
        const snapshot = await entitiesRef.limit(20).get();
        let matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Simulate agentic filtering
        if (intentData.growthThreshold) {
            matches = matches.filter((m: any) => (m.current_score || 0) >= intentData.growthThreshold);
        }

        return NextResponse.json({
            success: true,
            intent: intentData.intent,
            matches: matches.map((m: any) => ({
                id: m.id,
                name: m.entity_id || m.name,
                score: m.current_score
            })).slice(0, 5),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Command execution error:", error);
        return NextResponse.json({ success: false, error: "Internal service error" }, { status: 500 });
    }
}
