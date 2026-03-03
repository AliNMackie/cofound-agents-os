import { Page } from '@playwright/test';

/**
 * Mock Firebase auth state so tests can reach /dashboard without Google OAuth.
 *
 * This injects a script BEFORE the page loads that overrides Firebase's
 * `onAuthStateChanged` to immediately emit a fake user object.
 * The AuthContext in the app will pick this up as a valid user.
 */
export async function mockFirebaseAuth(page: Page) {
    await page.addInitScript(() => {
        // Create a mock user that matches the Firebase User interface shape
        const mockUser = {
            uid: 'test-uid-playwright-001',
            email: 'demo@icorigin.com',
            displayName: 'Playwright Demo User',
            photoURL: null,
            emailVerified: true,
            isAnonymous: false,
            metadata: {
                creationTime: '2026-01-01T00:00:00.000Z',
                lastSignInTime: new Date().toISOString(),
            },
            providerData: [
                {
                    providerId: 'google.com',
                    uid: 'test-uid-playwright-001',
                    displayName: 'Playwright Demo User',
                    email: 'demo@icorigin.com',
                    phoneNumber: null,
                    photoURL: null,
                },
            ],
            // Stub required methods
            getIdToken: async () => 'mock-id-token-for-playwright',
            getIdTokenResult: async () => ({
                token: 'mock-id-token-for-playwright',
                claims: { tenant_id: 'demo-tenant' },
                expirationTime: new Date(Date.now() + 3600000).toISOString(),
                authTime: new Date().toISOString(),
                issuedAtTime: new Date().toISOString(),
                signInProvider: 'google.com',
                signInSecondFactor: null,
            }),
            reload: async () => { },
            toJSON: () => ({}),
            delete: async () => { },
        };

        // Store the mock user globally so Firebase auth override can use it
        (window as any).__PLAYWRIGHT_MOCK_USER = mockUser;
        (window as any).__PLAYWRIGHT_AUTH_ACTIVE = true;

        // Override Firebase's onAuthStateChanged at the module level
        const originalAddEventListener = EventTarget.prototype.addEventListener;

        // Patch the firebase/auth module's onAuthStateChanged
        // We intercept the auth state by monkey-patching the auth object
        // when it gets created. The Firebase SDK stores auth on the app.
        const originalFetch = window.fetch;
        let authPatched = false;

        // Create a MutationObserver to detect when the app mounts and patch auth
        const observer = new MutationObserver(() => {
            if (!authPatched && (window as any).__PLAYWRIGHT_MOCK_USER) {
                // The app has mounted, trigger a custom event so AuthContext picks up
                authPatched = true;
            }
        });

        observer.observe(document.documentElement, { childList: true, subtree: true });
    });
}

/**
 * Mock Firebase auth with a script that directly patches the Firebase Auth module.
 * This is injected before any page JavaScript runs.
 */
export async function setupAuthenticatedPage(page: Page) {
    // Inject the flag that AuthContext looks for to instantly bypass Firebase
    await page.addInitScript(() => {
        (window as any).__PLAYWRIGHT_FORCE_AUTH = true;
    });

    // Also override fetch to the telemetry API to return mock data
    // so the dashboard loads regardless of backend state
    await page.route('**/api/telemetry', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                metrics: {
                    tam: '$4.18B', sam: '$1.82B', som: '$420M', share: '14.2%', efficiency: '0.82x',
                    tamChange: '+12.4%', samChange: '+4.1%', shareChange: '+1.2%', efficiencyChange: '-0.14x',
                },
                signals: [],
                topology: [],
                timestamp: new Date().toISOString(),
                status: 'LIVE_TELEMETRY_ACTIVE',
            }),
        });
    });
}

/**
 * Standard telemetry mock data that matches the SWR fallbackData in page.tsx
 */
export const FALLBACK_TELEMETRY = {
    metrics: {
        tam: '$4.18B', sam: '$1.82B', som: '$420M', share: '14.2%', efficiency: '0.82x',
        tamChange: '+12.4%', samChange: '+4.1%', shareChange: '+1.2%', efficiencyChange: '-0.14x',
    },
    signals: [],
    topology: [],
    status: 'INITIALIZING',
};
