import { test, expect, devices } from '@playwright/test';

test.describe('Phase 15 - Marketing Frontend Lockdown (Desktop)', () => {

    test('15.1 - Navbar Layout & Navigation', async ({ page }) => {
        await page.goto('/');

        // Assert Logo
        await expect(page.locator('text=IC ORIGIN').first()).toBeVisible();

        // Assert Desktop Links
        const howItWorks = page.locator('a:has-text("How it works")').first();
        await expect(howItWorks).toBeVisible();

        const benefits = page.locator('a:has-text("Benefits")').first();
        await expect(benefits).toBeVisible();

        const useCases = page.locator('a:has-text("Use Cases")').first();
        await expect(useCases).toBeVisible();

        // Assert Auth & CTA
        const loginBtn = page.locator('button:has-text("Log in")').first();
        await expect(loginBtn).toBeVisible();

        const bookDemoBtn = page.locator('button:has-text("Book Demo")').first();
        await expect(bookDemoBtn).toBeVisible();

        // Assert Hamburger is NOT visible on desktop
        const hamburgerBtn = page.locator('button[aria-label="Toggle mobile menu"]');
        await expect(hamburgerBtn).toBeHidden();
    });

    test('15.2 - Viewport & Layout Integrity (Desktop)', async ({ page }) => {
        await page.goto('/');

        // Scroll down
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Mathematically prove no horizontal layout breakage
        const noHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth === document.documentElement.clientWidth;
        });
        expect(noHorizontalScroll).toBe(true);
    });

});

test.describe('Phase 15 - Marketing Frontend Lockdown (Mobile)', () => {

    // Apply mobile emulation to this describe block, stripping out defaultBrowserType to avoid Chromium conflicts
    const iPhone = devices['iPhone 13'];
    test.use({
        viewport: iPhone.viewport,
        userAgent: iPhone.userAgent,
        deviceScaleFactor: iPhone.deviceScaleFactor,
        isMobile: iPhone.isMobile,
        hasTouch: iPhone.hasTouch
    });

    test('15.3 - Responsive Navbar & Hamburger Toggle', async ({ page }) => {
        await page.goto('/');

        // Desktop nav links should be hidden
        const desktopHowItWorks = page.locator('div.hidden.md\\:flex >> a:has-text("How it works")');
        await expect(desktopHowItWorks).toBeHidden();

        // Desktop Log in should be hidden
        const desktopLogin = page.locator('div.hidden.md\\:flex >> button:has-text("Log in")');
        await expect(desktopLogin).toBeHidden();

        // Hamburger icon should be visible
        const hamburgerBtn = page.locator('button[aria-label="Toggle mobile menu"]');
        await expect(hamburgerBtn).toBeVisible();

        // "Demo" short button should be visible
        const shortDemoBtn = page.locator('button:has-text("Demo")').last();
        await expect(shortDemoBtn).toBeVisible();
    });

    test('15.4 - Mobile Menu Functionality', async ({ page }) => {
        await page.goto('/');

        const hamburgerBtn = page.locator('button[aria-label="Toggle mobile menu"]');
        const mobileMenu = page.getByTestId('mobile-menu');

        // Menu should start hidden
        await expect(mobileMenu).toBeHidden();

        // Click to open
        await hamburgerBtn.click();

        // Menu should be visible
        await expect(mobileMenu).toBeVisible();

        // "Log in" link inside mobile menu should be visible
        const mobileLogin = mobileMenu.locator('button:has-text("Log in")');
        await expect(mobileLogin).toBeVisible();

        // Other links inside mobile menu should be visible
        await expect(mobileMenu.locator('a:has-text("How it works")')).toBeVisible();

        // Click to close
        await hamburgerBtn.click();
        await expect(mobileMenu).toBeHidden();
    });

    test('15.5 - Viewport Overflow Verification (Mobile)', async ({ page }) => {
        await page.goto('/');

        // Wait for fonts/layout to settle
        await page.waitForLoadState('networkidle');

        // Scroll down
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Mathematically prove no horizontal layout breakage on mobile
        const noHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth === document.documentElement.clientWidth;
        });

        expect(noHorizontalScroll, "Mobile viewport has horizontal overflow!").toBe(true);
    });

});
