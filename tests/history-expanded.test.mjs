import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => JSON.parse(readFileSync(`public/data/${file}`));
const history = read('history-2017-2023.json');
const all = [...read('incidents.json'), ...read('additions-20261003.json'), ...read('history-2024-2025.json'), ...history];
test('ten disclosure years are represented by distinct incidents with primary evidence', () => {
  assert.equal(all.length, 45);
  assert.equal(new Set(all.map(row => row.id)).size, all.length);
  assert.deepEqual([...new Set(all.map(row => row.disclosedAt.slice(0, 4)))].sort(), Array.from({length: 10}, (_, i) => String(2017 + i)));
  for (const row of history) {
    assert.ok(row.research.unknown.length);
    assert.ok(row.research.checks.length);
    for (const fact of [...row.timeline, ...row.research.facts]) assert.ok(row.sources.some(source => source.id === fact.sourceId && source.kind === '一次情報'), row.id);
    assert.ok(row.sources.some(source => source.publishedAt === row.disclosedAt));
  }
});
test('possible exposure and system outage are not upgraded to confirmed personal data leakage', () => {
  assert.equal(history.find(r => r.id === 'toyota-dealers-2019').leakStatus, '漏えいの可能性');
  assert.equal(history.find(r => r.id === 'toyota-tconnect-2022').leakStatus, '漏えいの可能性');
  assert.equal(history.find(r => r.id === 'osaka-hospital-2023-report').leakStatus, '漏えい未確認');
  assert.match(history.find(r => r.id === 'nintendo-nnid-2020').impact, /世界/);
});
test('automatically collected articles remain separate from verified incident counts', () => {
  const news = read('security-news.json');
  assert.ok(Number.isFinite(Date.parse(news.fetchedAt)));
  assert.ok(news.items.length > 0);
  assert.equal(new Set(news.items.map(r => r.url)).size, news.items.length);
  for (const item of news.items) { assert.equal(item.status, '未確認'); assert.equal(new URL(item.url).protocol, 'https:'); }
});
