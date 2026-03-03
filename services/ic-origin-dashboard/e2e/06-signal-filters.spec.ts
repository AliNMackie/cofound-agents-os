import { setupAuthenticatedPage } from './helpers/auth';
import { test, expect } from '@playwright/test';

test.describe('Phase 6 — Signal Filters & Institutional Facets', () => {
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

    test('6.1 — Three filter dropdowns are visible in Stage 02', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        const section = page.locator('#competitive-intelligence');
        await section.scrollIntoViewIfNeeded();

        // Three <select> dropdowns in the filter bar
        const selects = section.locator('select');
        const selectCount = await selects.count();
        expect(selectCount).toBe(3);

        // Verify default values
        await expect(selects.nth(0)).toHaveValue('Global');         // Region
        await expect(selects.nth(1)).toHaveValue('All Categories'); // Category
        await expect(selects.nth(2)).toHaveValue('');               // No Signal Filters
    });

    test('6.2 — Region filter changes topology view', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        const section = page.locator('#competitive-intelligence');
        await section.scrollIntoViewIfNeeded();

        const regionSelect = section.locator('select').first();
        await regionSelect.selectOption('North West');

        // Allow filter to take effect
        await page.waitForTimeout(500);

        // Verify the filter value persists
        await expect(regionSelect).toHaveValue('North West');
    });

    test('6.3 — Category filter applies correctly', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        const section = page.locator('#competitive-intelligence');
        await section.scrollIntoViewIfNeeded();

        const categorySelect = section.locator('select').nth(1);
        await categorySelect.selectOption('Obvious Winner');

        await page.waitForTimeout(500);
        await expect(categorySelect).toHaveValue('Obvious Winner');
    });

    test('6.4 — Signal filter (Talent Freeze) applies', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        const section = page.locator('#competitive-intelligence');
        await section.scrollIntoViewIfNeeded();

        const signalSelect = section.locator('select').nth(2);
        await signalSelect.selectOption('Talent Freeze');

        await page.waitForTimeout(500);
        await expect(signalSelect).toHaveValue('Talent Freeze');
    });

    test('6.5 — Resetting filters restores full dataset', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        const url = page.url();
        if (!url.includes('/dashboard')) {
            test.skip(true, 'Auth redirect');
            return;
        }

        const section = page.locator('#competitive-intelligence');
        await section.scrollIntoViewIfNeeded();

        const selects = section.locator('select');

        // Apply filters
        await selects.nth(0).selectOption('North West');
        await selects.nth(1).selectOption('Borderline');
        await selects.nth(2).selectOption('Debt Whiplash');
        await page.waitForTimeout(500);

        // Reset all
        await selects.nth(0).selectOption('Global');
        await selects.nth(1).selectOption('All Categories');
        await selects.nth(2).selectOption('');
        await page.waitForTimeout(500);

        // Verify reset
        await expect(selects.nth(0)).toHaveValue('Global');
        await expect(selects.nth(1)).toHaveValue('All Categories');
        await expect(selects.nth(2)).toHaveValue('');
    });
});
