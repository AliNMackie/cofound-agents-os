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
        response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
        response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');

        // Define the production API origins
        const RUN_APP_ORIGIN = "https://*.run.app";
        const FIREBASE_ORIGINS = "https://*.firebaseapp.com https://*.googleapis.com https://*.firebaseio.com";

        const csp = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            `img-src 'self' data: https://*.googleusercontent.com`,
            `frame-src 'self' ${FIREBASE_ORIGINS}`,
            `connect-src 'self' ${RUN_APP_ORIGIN} ${FIREBASE_ORIGINS}`
        ].join('; ');

        response.headers.set('Content-Security-Policy', csp);

        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/api/:path*'],
};
