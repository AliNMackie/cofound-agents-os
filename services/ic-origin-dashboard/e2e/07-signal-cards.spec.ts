import { setupAuthenticatedPage } from './helpers/auth';
import { test, expect } from '@playwright/test';

test.describe('Phase 7 — Signal Cards & Fallback Data', () => {
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
                    // Empty signals to trigger frontend fallback cards
                    signals: [],
                    topology: [],
                    timestamp: new Date().toISOString(),
                    status: 'LIVE_TELEMETRY_ACTIVE',
                }),
            });
        });
    });

    test('7.1 — Stage 03 "Where We Can Go Next" renders', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        const section = page.locator('#strategic-signals');
        await section.scrollIntoViewIfNeeded();

        await expect(page.getByText('Strategy // Stage 03')).toBeVisible();
        await expect(page.getByText('Where We Can Go Next')).toBeVisible();
    });

    test('7.2 — Four fallback signal cards render with correct entities', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        const section = page.locator('#strategic-signals');
        await section.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        // When signals array is empty, the dashboard renders 4 hardcoded fallback cards
        await expect(page.getByText('Quantum Leap AI')).toBeVisible();
        await expect(page.getByText('BlueTech Corp')).toBeVisible();
        await expect(page.getByText('Confidential Alpha')).toBeVisible();
        await expect(page.getByText('GreenGrid UK')).toBeVisible();

        // Verify signal types
        await expect(page.getByText('Series A Target')).toBeVisible();
        await expect(page.getByText('Encroachment Alert')).toBeVisible();
        await expect(page.getByText('OTC Secondary')).toBeVisible();
        await expect(page.getByText('M&A Adjacency')).toBeVisible();
    });

    test('7.3 — "Trigger Adjacency Swarm" button visible on desktop', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        const section = page.locator('#strategic-signals');
        await section.scrollIntoViewIfNeeded();

        // The button is hidden on mobile (hidden sm:block) — our viewport is 1440px so it should be visible
        const swarmButton = page.getByRole('button', { name: /trigger adjacency swarm/i });
        await expect(swarmButton).toBeVisible();
    });
});
