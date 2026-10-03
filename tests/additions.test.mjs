import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const original=JSON.parse(readFileSync('public/data/incidents.json'));
const added=JSON.parse(readFileSync('public/data/additions-20261003.json'));
test('additional incidents have unique identifiers and primary-source research',()=>{
 assert.equal(new Set([...original,...added].map(r=>r.id)).size,21);
 for(const r of added){assert.ok(r.organization);assert.match(r.disclosedAt,/^2026-\d{2}-\d{2}$/);assert.ok(r.sources.some(s=>s.kind==='一次情報'));for(const f of r.research.facts)assert.ok(r.sources.some(s=>s.id===f.sourceId&&s.kind==='一次情報'));assert.ok(r.research.unknown.length);assert.ok(r.research.checks.length);}
});
