import { useEffect, useState } from "react";
import { ArrowUpRight, Newspaper } from "lucide-react";

type News = { fetchedAt: string; feeds: { name: string; status: string }[]; items: { id: string; title: string; url: string; publishedAt: string; source: string; kind: string; status: string }[] };
const safeUrl = (value: string) => {
  try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password; } catch { return false; }
};
export function SecurityNews() {
  const [news, setNews] = useState<News | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch("./data/security-news.json", { signal: controller.signal }).then(r => {
      if (!r.ok) throw new Error("fetch");
      return r.json();
    }).then((value: News) => {
      if (!value || !Array.isArray(value.items) || !Array.isArray(value.feeds) || !Number.isFinite(Date.parse(value.fetchedAt)) || !value.items.every(item => typeof item.title === "string" && typeof item.source === "string" && safeUrl(item.url) && Number.isFinite(Date.parse(item.publishedAt)))) throw new Error("invalid data");
      setNews(value);
    }).catch(e => { if (e.name !== "AbortError") setError(true); });
    return () => controller.abort();
  }, []);
  const stale = news && Date.now() - Date.parse(news.fetchedAt) > 48 * 60 * 60 * 1000;
  const visible = news?.items.filter(item => (!source || item.source === source) && item.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())) || [];
  return <section className="security-news" aria-label="自動取得したセキュリティ情報">
    <div className="page-title"><Newspaper size={35} /><div><small>SECURITY WATCH</small><h2>セキュリティ情報ウォッチ</h2><p>公式の注意喚起と事件の調査記事を、出典から読む。</p></div></div>
    <p className="coverage">自動取得した見出しは未確認です。脆弱性の注意喚起や調査記事を含み、事件データベースの収録件数には含めません。記事の事実確認・事件の追加は編集確認後に行います。</p>
    {error ? <p role="alert">取得情報を読み込めませんでした。事件データベースは引き続き利用できます。</p> : !news ? <p role="status">取得情報を読み込んでいます…</p> : <>
      <p className="news-fetched">最終取得：<time dateTime={news.fetchedAt}>{new Date(news.fetchedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}（日本時間）</time> · {news.items.length}件</p>
      {stale && <p role="status" className="news-warning">最終取得から48時間以上経過しています。新しい取得結果がまだ反映されていません。</p>}
      {news.feeds.some(f => f.status !== "ok") && <p role="status" className="news-warning">一部の取得元で失敗しています：{news.feeds.filter(f => f.status !== "ok").map(f => f.name).join("、")}</p>}
      <div className="toolbar"><label><input aria-label="取得情報を検索" placeholder="見出しを検索…" value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label="取得元" value={source} onChange={e => setSource(e.target.value)}><option value="">取得元：すべて</option>{[...new Set(news.items.map(item => item.source))].map(name => <option key={name}>{name}</option>)}</select></div>
      <div className="news-list">{visible.map(item => <article className="news-card" key={item.id}><div className="news-meta"><span>{item.source} · {item.kind}</span><time dateTime={item.publishedAt}>{new Date(item.publishedAt).toLocaleDateString("ja-JP", { timeZone: "Asia/Tokyo" })}</time><span className="tag">未確認</span></div><a href={item.url} target="_blank" rel="noreferrer"><h3>{item.title}</h3><ArrowUpRight size={18} /></a></article>)}</div>
      {!visible.length && <p role="status">条件に一致する取得情報がありません。</p>}
    </>}
  </section>;
}
