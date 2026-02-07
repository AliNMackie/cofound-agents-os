import { test, expect } from '@playwright/test';

test.describe('Sentinel Growth Service', () => {
    test('health check returns ok', async ({ request }) => {
        const response = await request.get('/health');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body).toEqual({ status: 'ok' });
    });

    test('version check returns valid version', async ({ request }) => {
        const response = await request.get('/version');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body).toHaveProperty('version');
        expect(body.version).toContain('1.2.2'); // Current version
    });

    test('signals endpoint is accessible', async ({ request }) => {
        // This endpoint might be protected or require specific headers in production,
        // but for now checking it's reachable (even 401/403 would mean service is up, 
        // but we expect 200 based on recent verification).
        const response = await request.get('/signals');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();
        expect(body.length).toBeGreaterThan(0);
    });
});
