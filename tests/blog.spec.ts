import {test,expect} from '@playwright/test';
const base = process.env.ATLAS_BASE || 'http://127.0.0.1:3182';
test('article and two distinct incidents are reachable', async({page})=>{
 await page.goto(base + '/blog/nikkei-cloud-2026/index.html');
 await expect(page.getByRole('heading',{level:1})).toContainText('日経新聞へのサイバー攻撃とは？');
 await expect(page.locator('#source1 a')).toHaveAttribute('href', /1554.html/);
 await page.screenshot({path: '.artifacts/nikkei-article-desktop.png'});
 await page.getByRole('link',{name:'事件データを見る →'}).first().click();
 await expect(page.locator('dialog.detail-dialog')).toBeVisible();
 await expect(page.locator('dialog.detail-dialog')).toContainText('約9,000件');
});
test('article fits narrow mobile screens', async({page})=>{
 await page.setViewportSize({width:320,height:780});
 await page.goto(base + '/blog/nikkei-cloud-2026/index.html');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
 await page.screenshot({path:'.artifacts/nikkei-article-mobile.png'});
});
