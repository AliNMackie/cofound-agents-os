import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json(
        {
            status: 'healthy',
            service: 'travel-agent-frontend',
            timestamp: new Date().toISOString(),
        },
        { status: 200 }
    );
}
