import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const rows = JSON.parse(
  readFileSync(new URL("../public/data/incidents.json", import.meta.url)),
);
test("unique incident IDs, required fields, source attribution and valid dates", () => {
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length);
  for (const r of rows) {
    for (const k of [
      "id",
      "organization",
      "industry",
      "disclosedAt",
      "title",
      "cause",
      "technical",
      "lesson",
      "impact",
    ])
      assert.ok(r[k], `${r.id}: ${k}`);
    assert.match(r.disclosedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(["公表", "一部公表", "未公表"].includes(r.causeStatus));
    assert.ok(["漏えい確認", "漏えいの可能性"].includes(r.leakStatus));
    assert.ok(r.sources.length);
    assert.equal(new Set(r.sources.map((s) => s.id)).size, r.sources.length);
    for (const s of r.sources) {
      assert.equal(new URL(s.url).protocol, "https:");
      assert.equal(s.kind, "一次情報");
    }
    for (const t of r.timeline)
      assert.ok(r.sources.some((s) => s.id === t.sourceId));
  }
});
test("distinct attacks remain distinct; later reports update the same Times incident", () => {
  assert.equal(
    rows.filter((r) => r.organization === "ニッポンレンタカー").length,
    2,
  );
  assert.equal(rows.filter((r) => r.organization === "タイムズカー").length, 1);
  assert.equal(
    rows.filter((r) => r.organization === "さくらインターネット").length,
    2,
  );
  assert.match(rows.find((r) => r.id === "timescar-2026").impact, /660万/);
  assert.match(rows.find((r) => r.id === "timescar-2026").impact, /160万/);
});
test("historical incidents preserve attribution and distinguish overlapping counts", () => {
  const historical = JSON.parse(
    readFileSync(
      new URL("../public/data/history-2024-2025.json", import.meta.url),
    ),
  );
  const all = [...rows, ...historical];
  assert.equal(new Set(all.map((r) => r.id)).size, all.length);
  assert.deepEqual(
    new Set(historical.map((r) => r.disclosedAt.slice(0, 4))),
    new Set(["2024", "2025"]),
  );
  for (const r of historical) {
    assert.ok(r.research.flow.length >= 3);
    assert.ok(r.research.unknown.length);
    for (const f of [...r.research.facts, ...r.timeline])
      assert.ok(
        r.sources.some((s) => s.id === f.sourceId),
        r.id,
      );
    for (const s of r.sources) assert.equal(new URL(s.url).protocol, "https:");
  }
  const a = historical.find((r) => r.id === "asahi-2025");
  assert.match(a.impact, /228/);
  assert.ok(a.sources.some((s) => s.publishedAt === "2026-07-17"));
  assert.match(historical.find((r) => r.id === "iij-2025").impact, /311,288/);
  assert.match(
    historical.find((r) => r.id === "askul-2025").research.unknown.join(""),
    /固有/,
  );
});
