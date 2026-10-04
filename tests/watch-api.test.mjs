import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import handler, { readJson, validateNews } from '../api/security-news.js';
const baseline = JSON.parse(readFileSync('public/data/security-news.json'));
test('watch rejects executable links and confirmed status in unverified feed', () => {
 assert.equal(validateNews(baseline), baseline);
 for (const patch of [{url:'javascript:alert(1)'}, {status:'確認済み'}, {publishedAt:'invalid'}]) {
  const bad = structuredClone(baseline); Object.assign(bad.items[0], patch);
  assert.throws(() => validateNews(bad));
 }
});
test('upstream responses enforce a size bound', async () => {
 await assert.rejects(readJson('https://example.org', async () => new Response('x'.repeat(4*1024*1024+1))), /size/);
});
test('watch API serves immutable snapshot and fails closed', async () => {
 const original = globalThis.fetch; let count = 0;
 const response = { headers:{}, statusCode:0, setHeader(k,v){this.headers[k]=v;}, status(v){this.statusCode=v;return this;}, json(v){this.body=v;return this;} };
 try {
  globalThis.fetch = async url => {count++; return Response.json(count === 1 ? {sha:'a'.repeat(40),files:[{filename:'feed-snapshots/security-news-123-1.json',status:'added'}]} : baseline);};
  await handler({method:'GET'}, response); assert.equal(response.statusCode,200); assert.equal(response.body.items.length,66);
  globalThis.fetch = async () => {throw new Error('offline');};
  await handler({method:'GET'}, response); assert.equal(response.statusCode,503); assert.equal(response.headers['Cache-Control'],'no-store');
  await handler({method:'POST'}, response); assert.equal(response.statusCode,405);
 } finally {globalThis.fetch=original;}
});
