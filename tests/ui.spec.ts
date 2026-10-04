import { test, expect } from "@playwright/test";
const base = process.env.ATLAS_BASE || "http://127.0.0.1:3182";
test("database search, dates, sources, prompts and MCP", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(base);
  await expect(page.locator("tr.incident")).toHaveCount(57);
  await page.getByRole("combobox", { name: "並び順" }).selectOption("oldest");
  await expect(page.locator("tr.incident").first()).toContainText("GMOペイメントゲートウェイ");
  await page.getByRole("textbox", { name: "事件を検索" }).fill("ＧｉｔＨｕｂ");
  await expect(page.locator("tr.incident")).toHaveCount(2);
  await page.getByRole("combobox", { name: "公表年" }).selectOption("2026");
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
  await expect(page.locator("tr.incident")).toHaveCount(18);
  await page.getByRole("button", { name: "絞り込みをリセット" }).click();
  await page.getByRole("button", { name: "時系列", exact: true }).click();
  await expect(page.locator("article.incident")).toHaveCount(57);
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
  await page.goto(base);
  await expect(page.locator("tr.incident")).toHaveCount(57);
  await page.screenshot({ path: `${process.env.ATLAS_SCREENSHOTS || "docs"}/desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: `${process.env.ATLAS_SCREENSHOTS || "docs"}/mobile.png`, fullPage: true });
  await page.locator(".incident-link").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: `${process.env.ATLAS_SCREENSHOTS || "docs"}/detail-mobile.png` });
});
test("landing precedes database and contributions open a reviewable GitHub draft", async ({
  page,
}) => {
  await page.goto(base);
  await expect(page.locator("tr.incident")).toHaveCount(57);
  await expect(page.locator(".atlas-hero h1")).toContainText("情報漏洩まとめ");
  const positions = await page.evaluate(() => [
    document.querySelector(".atlas-hero")!.getBoundingClientRect().top,
    document.querySelector("#database")!.getBoundingClientRect().top,
  ]);
  expect(positions[0]).toBeLessThan(positions[1]);
  await page.locator(".commons input").nth(0).fill("テスト組織");
  await page
    .locator(".commons input")
    .nth(1)
    .fill("https://example.com/notice");
  await page
    .locator(".commons textarea")
    .first()
    .fill("公開資料の追加をお願いします");
  await page.locator(".consent input").check();
  await page.getByText("起票文を確認・コピーする").click();
  await expect(page.getByRole("textbox", { name: "起票文" })).toHaveValue(
    /公開資料/,
  );
});
test("year filters, full screen pager, official logos and annual scope", async ({
  page,
}) => {
  await page.goto(base);
  await expect(page.locator("tr.incident")).toHaveCount(57);
  await page.getByRole("combobox", { name: "公表年" }).selectOption("2024");
  await expect(page.locator("tr.incident")).toHaveCount(5);
  await page.locator(".incident-link").first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const dimensions = await dialog.evaluate((e) => ({
    w: e.getBoundingClientRect().width,
    h: e.getBoundingClientRect().height,
    vw: innerWidth,
    vh: innerHeight,
  }));
  expect(dimensions.w).toBe(dimensions.vw);
  expect(dimensions.h).toBe(dimensions.vh);
  const before = await page.locator("#incident-title").innerText();
  await page.getByRole("button", { name: "次の事件", exact: true }).click();
  expect(await page.locator("#incident-title").innerText()).not.toBe(before);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "絞り込みをリセット" }).click();
  await expect(page.locator("#annual-statistics")).toContainText("3,063");
  await expect(page.locator("#annual-statistics")).toContainText("上場企業");
  await page.waitForTimeout(500);
  const broken = await page
    .locator("img")
    .evaluateAll((es) =>
      es.filter((e) => !e.complete || !e.naturalWidth).map((e) => e.src),
    );
  expect(broken).toEqual([]);
});
