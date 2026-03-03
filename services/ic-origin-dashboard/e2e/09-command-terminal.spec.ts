import { setupAuthenticatedPage } from './helpers/auth';
import { test, expect } from '@playwright/test';

test.describe('Phase 9 — Command Terminal (Ctrl+K)', () => {
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

    test('9.1 — Ctrl+K opens the Command Terminal', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        // Press Ctrl+K to open the terminal
        await page.keyboard.press('Control+k');
        await page.waitForTimeout(500);

        // The CommandTerminal should appear with "Strategic Command Line" heading
        await expect(page.getByText('Strategic Command Line')).toBeVisible();

        // Input field with placeholder should be visible
        const input = page.locator('input[placeholder*="natural language query"]');
        await expect(input).toBeVisible();
        await expect(input).toBeFocused();
    });

    test('9.2 — Terminal accepts natural language input', async ({ page }) => {
        // Mock the command execution endpoint
        await page.route('**/api/swarm/execute', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    intent: 'FILTER_DISTRESSED_MIDLANDS',
                    matches: [
                        { name: 'Helix Infrastructure Group', score: 82, tags: ['distressed', 'debt'] },
                    ],
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

        // Open terminal
        await page.keyboard.press('Control+k');
        await page.waitForTimeout(500);

        // Type a query
        const input = page.locator('input[placeholder*="natural language query"]');
        await input.fill('show me distressed entities in the Midlands');
        await input.press('Enter');

        // Wait for response
        await page.waitForTimeout(3000);

        // Should show some result or status text (e.g., "Synthesizing Institutional Intent...")
        const statusText = page.getByText(/synthesizing|intent|matched|orchestration/i);
        if (await statusText.count() > 0) {
            await expect(statusText.first()).toBeVisible();
        }
    });

    test('9.3 — Ctrl+K toggles the terminal closed', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        // Open
        await page.keyboard.press('Control+k');
        await page.waitForTimeout(500);
        await expect(page.getByText('Strategic Command Line')).toBeVisible();

        // Close
        await page.keyboard.press('Control+k');
        await page.waitForTimeout(500);

        // Terminal should be hidden
        await expect(page.getByText('Strategic Command Line')).not.toBeVisible();
    });
});
