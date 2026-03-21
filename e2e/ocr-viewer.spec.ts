import { expect, test } from '@playwright/test';

const E2E_TEST_EMAIL = process.env.E2E_TEST_EMAIL;
const E2E_TEST_PASSWORD = process.env.E2E_TEST_PASSWORD;

if (!E2E_TEST_EMAIL || !E2E_TEST_PASSWORD) {
  throw new Error(
    'E2E_TEST_EMAIL and E2E_TEST_PASSWORD environment variables must be set. ' +
      'See .env.e2e.example for reference.',
  );
}

test.describe('OCR Viewer E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login using credentials from environment variables (E2E_TEST_EMAIL / E2E_TEST_PASSWORD)
    await page.goto('/login');
    await page.fill('input[type="email"]', E2E_TEST_EMAIL);
    await page.fill('input[type="password"]', E2E_TEST_PASSWORD);
    await page.click('button:has-text("Sign in")');
    await page.waitForURL('**/dashboard');
  });

  test('should load OCR viewer and show studio header', async ({ page }) => {
    await page.goto('/ocr-viewer');
    await expect(page.getByText('OCR Studio')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sync' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Metadata' })).toBeVisible();
  });

  test('should show sidebar and loading state', async ({ page }) => {
    await page.goto('/ocr-viewer');
    // Sidebar header for document list
    await expect(page.locator('aside').getByText('Documents')).toBeVisible();
    // It might show "Loading documents..." or the list if it's fast
    await expect(page.getByText(/Loading documents...|OCR Studio/i).first()).toBeVisible();
  });

  test('should open metadata drawer', async ({ page }) => {
    await page.goto('/ocr-viewer');
    await page.getByRole('button', { name: 'Metadata' }).click();
    // Use .first() or be more specific to avoid strict mode violation
    await expect(page.getByText(/Raw Metadata|No metadata available/i).first()).toBeVisible();
  });
});
