import { test, expect } from "@playwright/test";
test("database search, dates, sources, prompts and MCP", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("http://127.0.0.1:3182");
  await expect(page.locator("tr.incident")).toHaveCount(11);
  await page.getByRole("combobox", { name: "並び順" }).selectOption("oldest");
  await expect(page.locator("tr.incident").first()).toContainText(
    "アットホーム",
  );
  await page.getByRole("textbox", { name: "事件を検索" }).fill("ＧｉｔＨｕｂ");
  await expect(page.locator("tr.incident")).toHaveCount(1);
  await page.locator(".incident-link").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "まだわからないこと" }),
  ).toBeVisible();
  await expect(
    page
      .locator(".sources")
      .getByRole("heading", { name: "二次情報", exact: false }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "対策・プロンプト" }).click();
  await page
    .getByRole("button", { name: "プロンプトをコピー", exact: true })
    .click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "読み取り専用",
  );
  await page.reload();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "絞り込みをリセット" }).click();
  await page
    .getByRole("combobox", { name: "原因の公表状況" })
    .selectOption("未公表");
  await expect(page.locator("tr.incident")).toHaveCount(6);
  await page.getByRole("button", { name: "絞り込みをリセット" }).click();
  await page.getByRole("button", { name: "時系列", exact: true }).click();
  await expect(page.locator("article.incident")).toHaveCount(11);
  await page
    .getByRole("button", { name: "点検プロンプト", exact: true })
    .click();
  await expect(page.locator(".prompt-grid article")).toHaveCount(4);
  await page.getByRole("button", { name: /MCP Coming soon/ }).click();
  await expect(
    page.getByRole("button", { name: "接続設定は準備中" }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
test("desktop and mobile layout", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("http://127.0.0.1:3182");
  await expect(page.locator("tr.incident")).toHaveCount(11);
  await page.screenshot({ path: "docs/desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "docs/mobile.png", fullPage: true });
  await page.locator(".incident-link").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: "docs/detail-mobile.png" });
});
