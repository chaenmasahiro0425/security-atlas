const repo = 'chaenmasahiro0425/security-atlas';
export async function readJson(url, fetcher = fetch) {
  const response = await fetcher(url, { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json', 'User-Agent': 'SecurityAtlas' }, redirect: 'error' });
  if (!response.ok) throw new Error('upstream');
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length; if (size > 4 * 1024 * 1024) throw new Error('size');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function validateNews(value) {
  if (!value || !Number.isFinite(Date.parse(value.fetchedAt)) || !Array.isArray(value.feeds) || !Array.isArray(value.items)) throw new Error('schema');
  if (!value.feeds.every(f => typeof f.name === 'string' && f.status === 'ok')) throw new Error('feeds');
  for (const item of value.items) {
    const url = new URL(item.url);
    if (url.protocol !== 'https:' || url.username || url.password || typeof item.title !== 'string' || typeof item.source !== 'string' || typeof item.id !== 'string' || item.status !== '未確認' || !Number.isFinite(Date.parse(item.publishedAt))) throw new Error('item');
  }
  return value;
}
export default async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'method' }); }
  try {
    const commit = await readJson(`https://api.github.com/repos/${repo}/commits/feat-security-feed`);
    if (!/^[a-f0-9]{40}$/.test(commit.sha)) throw new Error('commit');
    const file = commit.files?.find(f => /^feed-snapshots\/security-news-\d+-\d+\.json$/.test(f.filename) && f.status === 'added');
    if (!file) throw new Error('snapshot');
    const news = validateNews(await readJson(`https://raw.githubusercontent.com/${repo}/${commit.sha}/${file.filename}`));
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
    return res.status(200).json(news);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).json({ error: '最新の取得情報に接続できません' });
  }
}
