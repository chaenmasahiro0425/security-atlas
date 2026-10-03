import { test, expect } from "@playwright/test";
const base = 'http://127.0.0.1:3182';
test('participation button and legal dialogs preserve filters and support keyboard', async ({page}) => {
 await page.goto(base + '/?q=GitHub&view=ギャラリー');
 await expect(page.locator('.gallery-card')).toHaveCount(1);
 await expect(page.locator('.hero-copy')).not.toContainText('資料確認');
 const cta=page.locator('.contribute-nav');
 expect(await cta.evaluate(e=>getComputedStyle(e).backgroundColor)).toBe('rgb(36, 84, 235)');
 await cta.click(); await expect(page.locator('.commons h3')).toBeVisible();
 await page.getByRole('button',{name:'プライバシーポリシー',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 await expect(page.getByRole('dialog')).toContainText('Google Fonts');
 await expect(page.getByRole('button',{name:'案内を閉じる'})).toBeFocused();
 await page.reload(); await expect(page.getByRole('dialog')).toBeVisible();
 await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).not.toBeVisible();
 expect(new URL(page.url()).searchParams.get('q')).toBe('GitHub');
 await expect(page.locator('.gallery-card')).toHaveCount(1);
 for(const title of ['利用規約','運営について']){
  await page.getByRole('button',{name:title,exact:true}).click();
  await expect(page.getByRole('dialog').getByRole('heading',{name:title,exact:true})).toBeVisible();
  await page.getByRole('button',{name:'案内を閉じる'}).click();
 }
});
for(const width of [320,390,1440])test(`legal content fits ${width}px`,async({page})=>{
 await page.setViewportSize({width,height:844}); await page.goto(base+'/#privacy');
 const dialog=page.getByRole('dialog'); await expect(dialog).toBeVisible();
 expect(await dialog.evaluate(e=>e.scrollWidth<=e.clientWidth)).toBe(true);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await dialog.locator('.atlas-cta').scrollIntoViewIfNeeded();
 await expect(dialog.locator('.atlas-cta')).toBeVisible();
});

test('unknown legal hash is ignored safely', async ({page}) => {
 const errors: string[]=[]; page.on('pageerror', error => errors.push(error.message));
 await page.goto(base+'/#constructor');
 await expect(page.locator('tr.incident').first()).toBeVisible();
 await expect(page.getByRole('dialog')).not.toBeVisible();
 await page.getByRole('button',{name:'運営について',exact:true}).click();
 await expect(page.getByRole('dialog')).toContainText('運営：茶圓');
 expect(errors).toEqual([]);
});
