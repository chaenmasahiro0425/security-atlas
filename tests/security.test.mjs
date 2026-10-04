import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = (path) => readFileSync(path, 'utf8');
function validateUrls(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    if (key === 'url') {
      const url = new URL(entry);
      assert.equal(url.protocol, 'https:', entry);
      assert.equal(url.username + url.password, '', 'URLs must not contain credentials');
    }
    validateUrls(entry);
  }
}
test('all published sources use HTTPS without embedded credentials', () => {
  for (const file of readdirSync('public/data')) {
    if (file.endsWith('.json')) validateUrls(JSON.parse(read(`public/data/${file}`)));
  }
});
test('all incident IDs and combined source IDs are unique and evidence resolves', () => {
  const initial = JSON.parse(read('public/data/incidents.json'));
  const research = JSON.parse(read('public/data/research.json'));
  const rows = [
    ...initial.map((row) => ({ ...row, research: research[row.id], sources: [...row.sources, ...research[row.id].sources] })),
    ...JSON.parse(read('public/data/additions-20261003.json')),
    ...JSON.parse(read('public/data/history-2024-2025.json')),
    ...JSON.parse(read('public/data/history-2017-2023.json')),
    ...JSON.parse(read('public/data/additions-20261004.json')),
    ...JSON.parse(read('public/data/nikkei-20261004.json')),
  ];
  assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
  for (const row of rows) {
    assert.equal(new Set(row.sources.map((source) => source.id)).size, row.sources.length, row.id);
    for (const item of [...row.timeline, ...row.research.facts]) {
      assert.ok(row.sources.some((source) => source.id === item.sourceId), row.id);
    }
  }
});
test('published SVGs contain no active content or external resource references', () => {
  for (const file of ['public/favicon.svg', ...readdirSync('public/logos').filter((file) => file.endsWith('.svg')).map((file) => `public/logos/${file}`)]) {
    const svg = read(file);
    assert.doesNotMatch(svg, /<\s*(?:script|foreignObject|iframe|object|embed)\b|\bon\w+\s*=|<!ENTITY|<!DOCTYPE|javascript\s*:|@import/i, file);
    for (const match of svg.matchAll(/(?:href\s*=\s*["']([^"']+)|url\(\s*["']?([^\s)'";]+))/gi)) {
      assert.ok((match[1] || match[2]).startsWith('#'), file);
    }
  }
});
test('CSP permits exactly the current inline metadata and blocks active embedding', () => {
  const config = JSON.parse(read('vercel.json'));
  const headers = config.headers.find((rule) => rule.source === '/(.*)').headers;
  const csp = headers.find((header) => header.key === 'Content-Security-Policy').value;
  const scripts = [...read('index.html').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter((match) => !/\bsrc=/.test(match[1]));
  const hashes = scripts.map((match) => `'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`);
  const scriptPolicy = csp.split(';').find((part) => part.trim().startsWith('script-src '));
  assert.deepEqual(scriptPolicy.trim().split(/\s+/).slice(1).sort(), ["'self'", ...hashes].sort());
  for (const directive of ["object-src 'none'", "frame-ancestors 'none'", "form-action 'self'"]) assert.ok(csp.includes(directive));
  assert.ok(headers.some((header) => header.key === 'X-Content-Type-Options' && header.value === 'nosniff'));
});
