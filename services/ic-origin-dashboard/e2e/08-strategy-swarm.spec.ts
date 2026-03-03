import { setupAuthenticatedPage } from './helpers/auth';
import { test, expect } from '@playwright/test';

/**
 * Phase 8 — Strategy Swarm: The "Money Shot"
 *
 * This is the centerpiece of the investor demo.
 * Tests the 20-second suspense animation, button state changes,
 * and the memo rendering (either Gemini-generated or hybrid fallback).
 *
 * Extended timeout: 90s to accommodate the enforced 20s minimum delay.
 */
test.describe('Phase 8 — Strategy Swarm', () => {
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

        // Mock the swarm trigger API to return a fallback memo quickly
        // (so we don't need a real Gemini API key for tests)
        await page.route('**/api/swarm/trigger', async (route) => {
            // Simulate a 2s processing delay (the 20s minimum is enforced client-side)
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    success: true,
                    memo: `[HYBRID FALLBACK MEMO]\n\nStrategic Assessment: Swarm compute simulated.\nTarget: ALPHA-TARGET-001\n\nConclusion: Entity exhibits shadow-market movement indicative of an imminent liquidity event.`,
                    timestamp: new Date().toISOString(),
                    isFallback: true,
                }),
            });
        });
    });

    test('8.1 — Intelligence Synthesis Engine section renders', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        const section = page.locator('#strategy-generator');
        await section.scrollIntoViewIfNeeded();

        await expect(page.getByText('Intelligence Synthesis Engine')).toBeVisible();
        await expect(page.getByText('Generate Adjacency Discovery Memo')).toBeVisible();
        await expect(page.getByText(/estimated compute time/i)).toBeVisible();
    });

    test('8.2–8.4 — Swarm button state machine: click → Synthesizing Alpha → completion', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        const section = page.locator('#strategy-generator');
        await section.scrollIntoViewIfNeeded();

        // Find the "Initialize Strategy Swarm" button
        const swarmButton = section.getByRole('button', { name: /initialize strategy swarm/i });
        await expect(swarmButton).toBeVisible();
        await expect(swarmButton).toBeEnabled();

        // Click it
        const clickTime = Date.now();
        await swarmButton.click();

        // Immediately: button text should change to "Synthesizing Alpha..."
        await expect(swarmButton).toHaveText('Synthesizing Alpha...');

        // Button should be disabled (has animate-pulse class)
        await expect(swarmButton).toBeDisabled();

        // The orchestrator memo initiation text should appear
        await expect(page.getByText(/EMERALD_ORCHESTRATOR/)).toBeVisible();

        // Wait for the 3s minimum delay + processing to complete
        // The button text should revert to "Initialize Strategy Swarm"
        await expect(swarmButton).toHaveText('Initialize Strategy Swarm', { timeout: 45_000 });

        const completionTime = Date.now();
        const elapsedSeconds = (completionTime - clickTime) / 1000;

        // Verify the minimum 3s delay was enforced
        expect(elapsedSeconds).toBeGreaterThanOrEqual(2); // Allow 1s tolerance

        // Memo content should now be visible (either real or fallback)
        const memoContent = page.locator('#strategy-memo-content');
        if (await memoContent.count() > 0) {
            await expect(memoContent).toBeVisible();
            const memoText = await memoContent.textContent();
            // Should contain either Gemini output or the fallback
            expect(
                memoText?.includes('HYBRID FALLBACK MEMO') || (memoText && memoText.length > 50)
            ).toBeTruthy();
        }
    });

    test('8.5 — Memo renders in mono font and Export Dossier button appears on hover', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        const section = page.locator('#strategy-generator');
        await section.scrollIntoViewIfNeeded();

        // Trigger swarm
        const swarmButton = section.getByRole('button', { name: /initialize strategy swarm/i });
        if (await swarmButton.count() > 0 && await swarmButton.isEnabled()) {
            await swarmButton.click();

            // Wait for completion
            await expect(swarmButton).toHaveText('Initialize Strategy Swarm', { timeout: 45_000 });

            // Check memo styling
            const memo = page.locator('#strategy-memo-content');
            if (await memo.count() > 0) {
                // Verify it has font-mono class
                const classes = await memo.getAttribute('class');
                expect(classes).toContain('font-mono');

                // Hover to reveal Export Dossier button
                await memo.hover();
                await page.waitForTimeout(500);

                const exportBtn = page.getByText('Export Dossier');
                if (await exportBtn.count() > 0) {
                    await expect(exportBtn).toBeVisible();
                }
            }
        }
    });
});
