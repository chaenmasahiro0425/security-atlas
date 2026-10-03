import { test, expect } from "@playwright/test";
const base = process.env.ATLAS_BASE || "http://127.0.0.1:3182";
test("clean home URL, safe defaults and legal hash survive repeat reloads", async ({ page }) => {
  await page.goto(base + "/?sort=newest&view=テーブル");
  await expect(page.locator("tr.incident")).toHaveCount(30);
  expect(new URL(page.url()).search).toBe("");
  await page.goto(base + "/?sort=invalid&view=invalid#privacy");
  await expect(page.getByRole("dialog")).toBeVisible();
  for (let i = 0; i < 2; i++) {
    await page.reload();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(new URL(page.url()).hash).toBe("#privacy");
    expect(new URL(page.url()).search).toBe("");
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("combobox", { name: "並び順" })).toHaveValue("newest");
});
test("feed chronological ordering, source attribution, filtering and full screen detail", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto(base);
  await expect(page.locator("tr.incident")).toHaveCount(30);
  await page.getByRole("button", { name: "新着", exact: true }).click();
  const cards = page.locator(".feed-card");
  await expect(cards).toHaveCount(30);
  const dates = await cards.locator("time").evaluateAll(es => es.map(e => e.getAttribute("datetime")));
  expect(dates).toEqual([...dates].sort().reverse());
  await expect(cards.first()).toContainText("アバハウス");
  const sources = await cards.locator(".feed-source").evaluateAll(es => es.map(e => ({ href: e.getAttribute("href"), target: e.getAttribute("target"), text: e.textContent })));
  expect(sources).toHaveLength(30);
  expect(sources.every(s => s.href?.startsWith("https://") && s.target === "_blank" && s.text?.includes("一次情報"))).toBe(true);
  await page.getByRole("combobox", { name: "公表年" }).selectOption("2024");
  await expect(cards).toHaveCount(4);
  await page.reload();
  await expect(cards).toHaveCount(4);
  expect(new URL(page.url()).searchParams.get("view")).toBe("新着");
  await cards.first().locator(".feed-open").focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate(e => e.getBoundingClientRect().width === innerWidth)).toBe(true);
  await page.getByRole("button", { name: "次の事件", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("textbox", { name: "事件を検索" }).fill("存在しないxyz");
  await expect(cards).toHaveCount(0);
  await expect(page.getByText("条件に一致する事例がありません")).toBeVisible();
  await page.getByRole("button", { name: "すべての事例を見る" }).click();
  await expect(cards).toHaveCount(30);
  await page.getByRole("combobox", { name: "並び順" }).selectOption("oldest");
  await expect(cards.first()).toContainText("イセトー");
  expect(errors).toEqual([]);
});
test("annual statistics distinguish approximate scale, exact total and coverage", async ({ page }) => {
  await page.goto(base);
  const annual = page.locator("#annual-statistics");
  await expect(annual.locator(".annual-main b")).toHaveText("3,063");
  await expect(annual.locator(".annual-main strong")).toHaveText("万人分");
  await expect(annual).toContainText("30,636,910人分");
  await expect(annual).toContainText("全国すべての事故や重複を除いた被害人数ではありません");
  await expect(annual.locator(".annual-sub")).toContainText("180");
  await expect(annual.locator(".annual-sub")).toContainText("158社");
  await expect(annual.locator(".annual-sub")).toContainText("116");
  await annual.locator("summary").click();
  await expect(annual.locator(".annual-compare")).toContainText("15,865,611人分");
  expect(Math.round((30636910 / 15865611 - 1) * 1000) / 10).toBe(93.1);
  await expect(annual.locator("a").first()).toHaveAttribute("href", "https://www.tsr-net.co.jp/data/detail/1202348_1527.html");
});
for (const width of [320, 390, 768, 900, 1126, 1280, 1440])
  test(`feed, navigation and statistics fit after fonts load at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + "/?view=新着");
    await expect(page.locator(".feed-card")).toHaveCount(30);
    await page.evaluate(() => document.fonts.ready);
    const fits = await page.evaluate(() => {
      const inside = (e: Element) => { const b = e.getBoundingClientRect(); return b.left >= -1 && b.right <= innerWidth + 1; };
      return {
        page: document.documentElement.scrollWidth <= innerWidth,
        number: inside(document.querySelector(".annual-main b")!),
        unit: inside(document.querySelector(".annual-main strong")!),
        tabs: inside(document.querySelector(".views")!),
        nav: [...document.querySelectorAll(".sidebar > button, .sidebar > a")].filter(e => (e as HTMLElement).offsetWidth).every(inside),
      };
    });
    expect(fits).toEqual({ page: true, number: true, unit: true, tabs: true, nav: true });
    await page.locator(".feed-open").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
  });
