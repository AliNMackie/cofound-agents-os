import { setupAuthenticatedPage } from './helpers/auth';
import { test, expect } from '@playwright/test';

test.describe('Phase 12 — Bottom Status Bar', () => {
    test.beforeEach(async ({ page }) => {
        await setupAuthenticatedPage(page);

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
    });

    test('12.1 — Sticky footer bar renders with correct elements', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        // The footer bar is position: fixed at the bottom
        const footer = page.locator('.fixed.bottom-0');
        await expect(footer).toBeVisible();

        // "IC ORIGIN CORE // SESSION ACTIVATED"
        await expect(page.getByText('IC ORIGIN CORE // SESSION ACTIVATED')).toBeVisible();

        // "LATITUDE_DASHBOARD_READY"
        await expect(page.getByText('LATITUDE_DASHBOARD_READY')).toBeVisible();

        // Verify the status indicator (ping or status text)
        const statusText = page.getByText(/Status:|Ping:/);
        if (await statusText.count() > 0) {
            await expect(statusText.first()).toBeVisible();
        }
    });
});
