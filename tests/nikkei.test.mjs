import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const rows=JSON.parse(readFileSync('public/data/nikkei-20261004.json'));
test('Nikkei separates distinct incidents and count units without asserting confirmed leakage',()=>{
 assert.equal(rows.length,2);
 for(const row of rows){assert.equal(row.leakStatus,'漏えいの可能性');assert.equal(row.causeStatus,'一部公表');assert.ok(row.research.unknown.some(x=>x.includes('多要素認証')));}
 assert.match(rows[0].impact,/メール約9,000件/);assert.match(rows[0].impact,/調査中/);
 assert.match(rows[1].impact,/1,646人分/);assert.equal(rows[1].occurredAt,null);
 assert.equal(rows[0].sources[0].url.endsWith('1554.html'),true);
 assert.equal(rows[1].sources[0].url.endsWith('1547.html'),true);
});
