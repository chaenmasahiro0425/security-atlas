import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const rows=JSON.parse(readFileSync(new URL('../public/data/incidents.json',import.meta.url)));
test('unique incident IDs, required fields, source attribution and valid dates',()=>{
 assert.equal(new Set(rows.map(r=>r.id)).size,rows.length);
 for(const r of rows){for(const k of ['id','organization','industry','disclosedAt','title','cause','technical','lesson','impact'])assert.ok(r[k],`${r.id}: ${k}`);assert.match(r.disclosedAt,/^\d{4}-\d{2}-\d{2}$/);assert.ok(['公表','一部公表','未公表'].includes(r.causeStatus));assert.ok(['漏えい確認','漏えいの可能性'].includes(r.leakStatus));assert.ok(r.sources.length);assert.equal(new Set(r.sources.map(s=>s.id)).size,r.sources.length);for(const s of r.sources){assert.equal(new URL(s.url).protocol,'https:');assert.equal(s.kind,'一次情報')}for(const t of r.timeline)assert.ok(r.sources.some(s=>s.id===t.sourceId));}
});
test('distinct attacks remain distinct; later reports update the same Times incident',()=>{
 assert.equal(rows.filter(r=>r.organization==='ニッポンレンタカー').length,2);
 assert.equal(rows.filter(r=>r.organization==='タイムズカー').length,1);
 assert.equal(rows.filter(r=>r.organization==='さくらインターネット').length,2);
 assert.match(rows.find(r=>r.id==='timescar-2026').impact,/660万/);
 assert.match(rows.find(r=>r.id==='timescar-2026').impact,/160万/);
});
