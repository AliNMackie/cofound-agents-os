import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Ralph Wuggum Hardening: Basic Session Protection
    // In production, you would verify a JWT or session cookie here
    const dashboardPath = request.nextUrl.pathname.startsWith('/dashboard');
    const apiPath = request.nextUrl.pathname.startsWith('/api');

    if (dashboardPath || apiPath) {
        // Add custom security headers
        const response = NextResponse.next();
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https://sentinel-growth-api.icorigin.ai https://orchestrator-api.icorigin.ai;");

        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/api/:path*'],
};
