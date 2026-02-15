import { test, expect } from '@playwright/test';

test.describe('IC Origin Smoke Tests', () => {

    // 1. Newsroom / Morning Pulse
    test('Newsroom loads and shows Morning Pulse', async ({ page }) => {
        await page.goto('/mission/newsroom');

        // Assert page title or header
        await expect(page).toHaveTitle(/Sentinel|Newsroom/);

        // Check for "Morning Pulse" elements
        // Look for "Run Sweep" button or status indicators
        const sweepButton = page.getByRole('button', { name: /Run Sweep/i });
        // Or specific text
        const pulseHeader = page.getByText('Morning Pulse');

        // Either button or header should be visible
        if (await sweepButton.count() > 0) {
            await expect(sweepButton).toBeVisible();
        } else {
            await expect(pulseHeader).toBeVisible();
        }
    });

    // 2. Market Watch / Shadow Market
    test('Market Watch loads Shadow Market tab', async ({ page }) => {
        await page.goto('/missions'); // Mapped to Market Watch

        // Assert header
        await expect(page.getByRole('heading', { name: 'Market Watch' })).toBeVisible();

        // Assert Tabs
        const shadowTab = page.getByRole('tab', { name: 'Shadow Market' });
        await expect(shadowTab).toBeVisible();

        const analystTab = page.getByRole('tab', { name: 'Analyst Workbench' });
        await expect(analystTab).toBeVisible();

        // Click Shadow Market and check for feed/empty state
        await shadowTab.click();
        // Check for "No Shadow Market Signals" or list of signals
        // We expect at least the container
        const feedContainer = page.locator('main').first();
        await expect(feedContainer).toBeVisible();
    });

});
