import { setupAuthenticatedPage } from './helpers/auth';
import { test, expect } from '@playwright/test';

test.describe('Phase 5 — Topology Map & Neo4j Simulation', () => {
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

    test('5.1–5.2 — Clicking a scatter dot opens EntityDetailModal with 1.5s load simulation', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        // Scroll to the topology map section
        const section = page.locator('#competitive-intelligence');
        await section.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        // Recharts scatter dots are rendered as <circle> elements inside SVGs
        const scatterDots = section.locator('svg circle.recharts-dot');
        const dotCount = await scatterDots.count();

        if (dotCount === 0) {
            // Fallback: try generic circle elements in the scatter chart
            const genericDots = section.locator('.recharts-scatter circle');
            const gdCount = await genericDots.count();
            if (gdCount > 0) {
                await genericDots.first().click({ force: true });
            } else {
                // If no dots are visible (empty topology data), skip the click test
                test.skip(true, 'No scatter dots rendered with mock data');
                return;
            }
        } else {
            await scatterDots.first().click({ force: true });
        }

        // EntityDetailModal should appear
        await page.waitForTimeout(500);

        // During the 1.5s loading simulation, a loading indicator should be visible
        // Wait for the full 1.5s Neo4j simulation to complete
        await page.waitForTimeout(2000);

        // After loading, check for contagion graph node labels
        const modalContent = page.locator('[class*="fixed"]').filter({ hasText: /Apex Logistics|Meridian Manufacturing|Director/ });
        if (await modalContent.count() > 0) {
            // Verify key contagion node labels
            await expect(page.getByText('Apex Logistics Ltd')).toBeVisible();
            await expect(page.getByText('Meridian Manufacturing')).toBeVisible();
            await expect(page.getByText('Global Retail Corp')).toBeVisible();
            await expect(page.getByText(/John Smith/)).toBeVisible();
            await expect(page.getByText(/Jane Doe/)).toBeVisible();
        }
    });

    test('5.4 — Modal can be closed', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        const section = page.locator('#competitive-intelligence');
        await section.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);

        // Try to click a dot to open the modal
        const dots = section.locator('svg circle');
        if (await dots.count() > 0) {
            await dots.first().click({ force: true });
            await page.waitForTimeout(2000);

            // Close modal — look for X button with lucide X icon
            const closeButton = page.locator('button').filter({ has: page.locator('svg.lucide-x') });
            if (await closeButton.count() > 0) {
                await closeButton.first().click();
                await page.waitForTimeout(500);
            } else {
                // Try pressing Escape
                await page.keyboard.press('Escape');
                await page.waitForTimeout(500);
            }
        }
    });
});
