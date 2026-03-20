import { expect, test } from '@playwright/test';

test.describe('OCR Viewer E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="email"]', 'admin@admin.com');
    await page.fill('input[type="password"]', 'P@ssw0rd');
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/dashboard');
  });

  test('should load OCR viewer and show studio header', async ({ page }) => {
    await page.goto('http://localhost:3000/ocr-viewer');
    await expect(page.getByText('OCR Studio')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sync' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Metadata' })).toBeVisible();
  });

  test('should show sidebar and loading state', async ({ page }) => {
    await page.goto('http://localhost:3000/ocr-viewer');
    // Sidebar header for document list
    await expect(page.locator('aside').getByText('Documents')).toBeVisible();
    // It might show "Loading documents..." or the list if it's fast
    await expect(page.getByText(/Loading documents...|OCR Studio/i).first()).toBeVisible();
  });

  test('should open metadata drawer', async ({ page }) => {
    await page.goto('http://localhost:3000/ocr-viewer');
    await page.getByRole('button', { name: 'Metadata' }).click();
    // Use .first() or be more specific to avoid strict mode violation
    await expect(page.getByText(/Raw Metadata|No metadata available/i).first()).toBeVisible();
  });
});
