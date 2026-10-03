import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("all research facts resolve to primary evidence and preserve uncertainty", () => {
  const rows = JSON.parse(readFileSync("public/data/incidents.json"));
  const research = JSON.parse(readFileSync("public/data/research.json"));
  assert.equal(Object.keys(research).length, rows.length);
  for (const r of rows) {
    const x = research[r.id];
    const sources = [...r.sources, ...x.sources];
    assert.ok(x.unknown.length > 0);
    assert.ok(x.checks.length > 0);
    assert.ok(sources.some((s) => s.kind === "二次情報"));
    for (const f of x.facts)
      assert.equal(sources.find((s) => s.id === f.sourceId)?.kind, "一次情報");
  }
});
