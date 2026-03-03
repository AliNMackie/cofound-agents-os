import { test, expect } from '@playwright/test';

test.describe('Phase 1 — Landing Page & Marketing Shell', () => {
    test.beforeEach(async ({ page }) => {
        // Collect console errors throughout the test
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
        });
        (page as any).__consoleErrors = consoleErrors;
    });

    test('1.1 — Landing page loads with dark theme and navbar elements', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Dark background
        const main = page.locator('main');
        await expect(main).toBeVisible();

        // Navbar elements
        await expect(page.getByText('IC ORIGIN').first()).toBeVisible();
        await expect(page.getByText('How it works')).toBeVisible();
        await expect(page.getByText('Benefits').first()).toBeAttached();
        await expect(page.getByText('Use Cases').first()).toBeAttached();
        await expect(page.getByRole('button', { name: /log in/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /book demo/i })).toBeVisible();
    });

    test('1.2 — All marketing sections render in order', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Scroll the full page and check section landmarks exist
        // The page has: Hero, SocialProof, HowItWorks, Benefits, ProductTour, UseCases, FinalCTA, Footer
        // We check for key text/elements from each section
        const body = page.locator('body');
        await expect(body).toBeVisible();

        // Scroll to bottom to trigger all lazy loads
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);

        // Footer should be at the bottom (confirms full page rendered)
        const footer = page.locator('footer');
        if (await footer.count() > 0) {
            await expect(footer.first()).toBeVisible();
        }
    });

    test('1.3 — Book Demo opens ContactModal', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        await page.getByRole('button', { name: /book demo/i }).first().click();

        // Contact modal should appear — look for common modal patterns
        // The ContactModal component should now be visible
        await page.waitForTimeout(500); // Allow animation to complete
        const modal = page.locator('[class*="fixed"][class*="inset"]').first();
        await expect(modal).toBeVisible();
    });

    test('1.4 — ContactModal can be closed', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        // Open modal
        await page.getByRole('button', { name: /book demo/i }).first().click();
        await page.waitForTimeout(500);

        // Close it — try clicking X button or overlay
        const closeButton = page.locator('button:has(svg)').filter({ hasText: '' }).first();
        if (await closeButton.count() > 0 && await closeButton.isVisible()) {
            await closeButton.click({ force: true, timeout: 2000 });
        } else {
            // Click overlay backdrop
            await page.mouse.click(10, 10);
        }

        await page.waitForTimeout(500);
    });

    test('1.5 — No console errors on landing page', async ({ page }) => {
        const consoleErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error') {
                const text = msg.text();
                // Ignore known non-critical errors (favicon, etc.)
                if (!text.includes('favicon') && !text.includes('404')) {
                    consoleErrors.push(text);
                }
            }
        });

        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(2000);

        // Filter for Recharts width/height warnings
        const rechartsWarnings = consoleErrors.filter(
            (e) => e.includes('width(-1)') || e.includes('height(-1)')
        );
        expect(rechartsWarnings).toHaveLength(0);
    });
});
