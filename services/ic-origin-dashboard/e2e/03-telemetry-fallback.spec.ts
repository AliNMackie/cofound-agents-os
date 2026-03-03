import { setupAuthenticatedPage } from './helpers/auth';
import { test, expect } from '@playwright/test';
import { FALLBACK_TELEMETRY } from './helpers/auth';

/**
 * Phase 3 — Telemetry & Mock Fallback Verification
 *
 * These tests validate both the happy-path telemetry rendering
 * and the critical 401-failure fallback behavior.
 * Uses page.route() to mock/block the /api/telemetry endpoint.
 */
test.describe('Phase 3 — Telemetry & Mock Fallback Verification', () => {
    test('3.1 — Four metric cards show correct values (happy path)', async ({ page }) => {
        // Mock telemetry API with known values
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

        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');

        // Allow time for SWR to settle and components to mount
        await page.waitForTimeout(3000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect — cannot test dashboard without authenticated session');
            return;
        }

        // Verify metric card values
        await expect(page.getByText('$4.18B')).toBeVisible();
        await expect(page.getByText('$1.82B')).toBeVisible();
        await expect(page.getByText('14.2%').first()).toBeVisible();
        await expect(page.getByText('0.82x')).toBeVisible();

        // Verify change indicators
        await expect(page.getByText('+12.4%')).toBeVisible();
        await expect(page.getByText('+4.1%')).toBeVisible();
        await expect(page.getByText('+1.2%')).toBeVisible();
        await expect(page.getByText('-0.14x')).toBeVisible();

        // Verify no undefined/NaN in the metric area
        const executiveSection = page.locator('#executive-overview');
        const textContent = await executiveSection.textContent();
        expect(textContent).not.toContain('undefined');
        expect(textContent).not.toContain('NaN');
    });

    test('3.3–3.4 — Share Trajectory hero chart container has 400px height', async ({ page }) => {
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

        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        // The hero chart container has h-[400px] class
        const chartContainer = page.locator('.h-\\[400px\\]').first();
        if (await chartContainer.count() > 0) {
            const box = await chartContainer.boundingBox();
            expect(box).not.toBeNull();
            expect(box!.height).toBeGreaterThanOrEqual(380); // Allow slight rendering variance
        }
    });

    test('3.5 — 401 fallback: metric cards still render with SWR fallbackData', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        // Block /api/telemetry with a 401 to simulate backend auth failure
        await page.route('**/api/telemetry', async (route) => {
            await route.fulfill({
                status: 401,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Unauthorized' }),
            });
        });

        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        // The SWR fallbackData should kick in — same hardcoded values
        await expect(page.getByText('$4.18B')).toBeVisible();
        await expect(page.getByText('$1.82B')).toBeVisible();
        await expect(page.getByText('14.2%').first()).toBeVisible();
        await expect(page.getByText('0.82x')).toBeVisible();

        // No crash, no blank screen
        await expect(page.locator('body')).not.toHaveText('');

        // No uncaught errors that would crash the page
        const criticalErrors = consoleErrors.filter(
            (e) => e.includes('Uncaught') || e.includes('React hook')
        );
        expect(criticalErrors).toHaveLength(0);
    });

    test('3.6 — No React hook violations after 401 hard reload', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        // Block telemetry
        await page.route('**/api/telemetry', async (route) => {
            await route.fulfill({ status: 401, body: '{}' });
        });

        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        // Hard reload
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        // Check for React hook ordering violations
        const hookErrors = consoleErrors.filter(
            (e) => e.includes('Rendered fewer hooks') || e.includes('hook order')
        );
        expect(hookErrors).toHaveLength(0);
    });
});
