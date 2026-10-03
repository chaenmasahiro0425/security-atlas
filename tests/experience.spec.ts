import { test, expect } from "@playwright/test";
const base = "http://127.0.0.1:3182";
test("gallery filters, URL persistence and keyboard detail navigation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await expect(page.locator("tr.incident")).toHaveCount(30);
  await page.getByRole("button", { name: "ギャラリー", exact: true }).click();
  await expect(page.locator(".gallery-card")).toHaveCount(30);
  await expect(
    page.getByRole("button", { name: "ギャラリー", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("combobox", { name: "公表年" }).selectOption("2024");
  await expect(page.locator(".gallery-card")).toHaveCount(4);
  await page.reload();
  await expect(page.locator(".gallery-card")).toHaveCount(4);
  await page.locator(".gallery-card").first().focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "前の事件", exact: true }),
  ).toBeDisabled();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "次の事件", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "次の事件", exact: true }),
  ).toBeDisabled();
  await expect(page.locator("#incident-title")).toContainText("イセトー");
  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "一覧に戻る", exact: false }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".gallery-card")).toHaveCount(4);
  await page
    .getByRole("textbox", { name: "事件を検索" })
    .fill("存在しない事件zzzzz");
  await expect(page.locator(".gallery-card")).toHaveCount(0);
  await expect(page.getByText("条件に一致する事例がありません")).toBeVisible();
  await page.getByRole("button", { name: "すべての事例を見る" }).click();
  await expect(page.locator(".gallery-card")).toHaveCount(30);
  expect(errors).toEqual([]);
});
test("filtered JSON export matches displayed records and evidence links", async ({
  page,
}) => {
  await page.goto(base + "/?year=2025&view=ギャラリー");
  await expect(page.locator(".gallery-card")).toHaveCount(5);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSONを取得" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("security-atlas-incidents.json");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const rows = JSON.parse(Buffer.concat(chunks).toString());
  expect(rows).toHaveLength(5);
  expect(rows.every((r: any) => r.disclosedAt.startsWith("2025"))).toBe(true);
  await page.getByRole("textbox", { name: "事件を検索" }).fill("アサヒ");
  await expect(page.locator(".gallery-card")).toHaveCount(1);
  await page.locator(".gallery-card").click();
  await expect(page.getByRole("dialog")).toContainText("228");
  await expect(page.getByRole("dialog")).toContainText("2026-07-17");
  const hrefs = await page
    .getByRole("dialog")
    .locator("a[href]")
    .evaluateAll((es) => es.map((e) => e.getAttribute("href")));
  expect(hrefs.length).toBeGreaterThan(3);
  expect(hrefs.every((h) => h!.startsWith("https://"))).toBe(true);
});
for (const width of [320, 390, 768, 1440])
  test(`gallery and details fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base + "/?view=ギャラリー");
    await expect(page.locator(".gallery-card")).toHaveCount(30);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.locator(".gallery-card").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(
      await page
        .getByRole("dialog")
        .evaluate((e) => e.scrollWidth <= e.clientWidth),
    ).toBe(true);
    await page.getByRole("tab", { name: "対策・プロンプト" }).click();
    await expect(
      page.getByRole("button", { name: "プロンプトをコピー", exact: true }),
    ).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
test("data failure displays recovery message", async ({ page }) => {
  await page.route("**/data/history-2024-2025.json", (route) => route.abort());
  await page.goto(base);
  await expect(page.getByRole("alert")).toContainText("再読み込み");
  await page.unroute("**/data/history-2024-2025.json");
  await page.reload();
  await expect(page.locator("tr.incident")).toHaveCount(30);
});
test("contribution form validates inputs without sending", async ({ page }) => {
  await page.goto(base);
  await expect(page.locator("tr.incident")).toHaveCount(30);
  const form = page.locator(".commons form");
  expect(await form.evaluate((e: HTMLFormElement) => e.checkValidity())).toBe(
    false,
  );
  await page.getByLabel("組織名・対象").fill("テスト企業");
  await page.getByLabel("公表資料のURL").fill("https://example.com/notice");
  await page.getByLabel("共有したい内容").fill("一次資料を確認してください");
  await page.locator(".consent input").check();
  expect(await form.evaluate((e: HTMLFormElement) => e.checkValidity())).toBe(
    true,
  );
  await page.getByText("起票文を確認・コピーする").click();
  await expect(page.getByRole("textbox", { name: "起票文" })).toHaveValue(
    /https:\/\/example.com\/notice/,
  );
});
