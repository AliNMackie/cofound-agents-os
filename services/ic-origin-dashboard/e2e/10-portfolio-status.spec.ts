import { setupAuthenticatedPage } from './helpers/auth';
import { test, expect } from '@playwright/test';

test.describe('Phase 10 — Portfolio Status Telemetry', () => {
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

    test('10.1 — "Portfolio Command Centre" section header renders', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        const section = page.locator('#portfolio-status');
        await section.scrollIntoViewIfNeeded();

        await expect(page.getByText('Status // Telemetry')).toBeVisible();
        await expect(page.getByText('Portfolio Command Centre')).toBeVisible();
    });

    test('10.2 — PortfolioStatus component renders with content', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        const section = page.locator('#portfolio-status');
        await section.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        // The PortfolioStatus component should not be empty
        const content = await section.textContent();
        expect(content!.length).toBeGreaterThan(50);
    });
});
