import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Logo } from "./Home";
import type { Row } from "./main";

export function Feed({ rows, open }: { rows: Row[]; open: (id: string) => void }) {
  return (
    <section className="incident-feed" aria-label="新着の事件">
      <div className="feed-heading">
        <span className="eyebrow">DISCLOSURE FEED</span>
        <h3>公表された事件を、タイムラインで。</h3>
        <p>事実と未確認を分けて、次の備えにつなげる。</p>
      </div>
      {rows.map((r) => {
        const source = r.sources.filter((s) => s.kind === "一次情報").sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
        return (
          <article className="feed-card" key={r.id}>
            <div className="feed-identity">
              <Logo name={r.organization} />
              <div><strong>{r.organization}</strong><span>{r.industry}</span></div>
              <time dateTime={r.disclosedAt}>公表 {r.disclosedAt.replaceAll("-", ".")}</time>
            </div>
            <button className="feed-open" onClick={() => open(r.id)} aria-label={`${r.organization}の詳細を開く`}>
              <h3>{r.title}</h3>
              <p>{r.research.headline}</p>
              <div className="feed-impact"><span>影響・規模</span><strong>{r.impact}</strong></div>
              <span className="feed-read">発端・原因・対策を読む <ArrowRight size={16} /></span>
            </button>
            <div className="feed-status"><span className="tag">{r.leakStatus}</span><span className="badge">原因：{r.causeStatus}</span></div>
            {source && <a className="feed-source" href={source.url} target="_blank" rel="noreferrer">
              <div><span>一次情報 · {source.publishedAt}</span><strong>{source.title}</strong></div><ArrowUpRight size={18} />
            </a>}
          </article>
        );
      })}
    </section>
  );
}
