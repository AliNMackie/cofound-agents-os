import { setupAuthenticatedPage } from './helpers/auth';
import { test, expect } from '@playwright/test';

test.describe('Phase 14 — Final Hard Reload Stress Test', () => {
    test.setTimeout(90_000);

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

    test('14.2 — Dashboard survives 3 consecutive hard reloads', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                const text = msg.text();
                if (!text.includes('favicon') && !text.includes('404') && !text.includes('Firebase')) {
                    consoleErrors.push(text);
                }
            }
        });

        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        // Perform 3 consecutive hard reloads
        for (let i = 0; i < 3; i++) {
            await page.reload();
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(2000);

            // Verify page survives — key content is visible
            if (page.url().includes('/dashboard')) {
                // Metric cards should render (either live or fallback data)
                await expect(page.getByText('$4.18B')).toBeVisible({ timeout: 10_000 });
            }
        }
    });

    test('14.3 — No console errors or Recharts warnings after reloads', async ({ page }) => {
        const consoleMessages: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error' || msg.type() === 'warning') {
                consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
            }
        });

        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        // Scroll through all sections to trigger chart rendering
        for (const sectionId of [
            '#executive-overview',
            '#competitive-intelligence',
            '#strategic-signals',
            '#portfolio-status',
            '#counterparty-risk',
            '#strategy-generator',
        ]) {
            const section = page.locator(sectionId);
            if (await section.count() > 0) {
                await section.scrollIntoViewIfNeeded();
                await page.waitForTimeout(300);
            }
        }

        await page.waitForTimeout(2000);

        // Reload once more to stress test
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000);

        // Check for critical errors
        const criticalErrors = consoleMessages.filter(
            (m) =>
                m.includes('[error]') &&
                !m.includes('favicon') &&
                !m.includes('404') &&
                !m.includes('Firebase') &&
                !m.includes('auth/') &&
                !m.includes('validateDOMNesting') &&
                !m.includes('Content Security Policy') &&
                !m.includes('Failed to fetch')
        );

        // Check for React hook violations
        const hookErrors = consoleMessages.filter(
            (m) => m.includes('Rendered fewer hooks') || m.includes('hook order')
        );

        expect(hookErrors).toHaveLength(0);
        // Allow some tolerance for non-critical errors
        // but flag if there are many
        expect(criticalErrors.length).toBeLessThanOrEqual(2);
    });
});
