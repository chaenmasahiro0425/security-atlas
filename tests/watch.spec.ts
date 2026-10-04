import { test, expect } from '@playwright/test';
const base = process.env.ATLAS_BASE || 'http://127.0.0.1:3182';
test('watch separates unverified feed metadata and supports filtering', async ({ page }) => {
  await page.goto(base);
  await page.getByRole('button', { name: 'セキュリティ情報ウォッチ', exact: true }).click();
  await expect(page.locator('.news-card')).toHaveCount(66);
  await expect(page.locator('.coverage')).toContainText('未確認');
  await page.getByRole('combobox', { name: '取得元', exact: true }).selectOption('JPCERT/CC');
  expect(await page.locator('.news-card').count()).toBeGreaterThan(0);
  await expect(page.locator('.news-card').first()).toContainText('JPCERT/CC');
  await page.getByRole('textbox', { name: '取得情報を検索' }).fill('存在しないxyz');
  await expect(page.locator('.news-card')).toHaveCount(0);
  await expect(page.getByText('条件に一致する取得情報がありません。')).toBeVisible();
});
test('watch fetch failure does not break incident database', async ({ page }) => {
  await page.route('**/data/security-news.json', route => route.abort());
  await page.goto(base);
  await page.getByRole('button', { name: 'セキュリティ情報ウォッチ', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: '事件データベース', exact: true }).click();
  await expect(page.locator('tr.incident')).toHaveCount(45);
});
for (const width of [320, 390, 1280]) test(`watch fits at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(base);
  await page.getByRole('button', { name: 'セキュリティ情報ウォッチ', exact: true }).click();
  await expect(page.locator('.news-card')).toHaveCount(66);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
