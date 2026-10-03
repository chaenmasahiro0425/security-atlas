import { useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  GitPullRequest,
  Code,
  Plug,
} from "lucide-react";
import type { Row } from "./main";
const repo = "https://github.com/chaenmasahiro0425/security-atlas";
import logoAssets from "./logos.json";
export function Logo({ name }: { name: string }) {
  const [failed, setFailed] = useState(false);
  const asset = (
    logoAssets as Record<string, { path?: string; dark?: boolean }>
  )[name];
  return (
    <span className={asset?.dark ? "company-logo logo-dark" : "company-logo"}>
      {asset?.path && !failed ? (
        <img src={asset.path} alt="" onError={() => setFailed(true)} />
      ) : (
        name.slice(0, 1)
      )}
    </span>
  );
}
export function Home({
  rows,
  open,
}: {
  rows: Row[];
  open: (id: string) => void;
}) {
  const recent = [...rows]
    .sort((a, b) => b.disclosedAt.localeCompare(a.disclosedAt))
    .slice(0, 6);
  return (
    <>
      <section className="atlas-hero" id="home">
        <div className="hero-copy">
          <span className="eyebrow">
            <ShieldCheck size={16} /> 公開情報から、次の備えへ
          </span>
          <h1>
            日本企業の
            <br />
            情報漏洩まとめ。
            <br />
            <em>多すぎます。</em>
          </h1>
          <p>
            オープンソースのデータベースで、事件を可視化。
            <br />
            一次情報と点検プロンプトを共有し、同じ被害を防ぐために。
          </p>
          <a className="atlas-cta" href="#database">
            事件データベースを見る <ArrowRight size={18} />
          </a>
          <a className="hero-stat-link" href="#annual-statistics">
            2025年、約3,063万人分の情報が漏えい・紛失。集計範囲と出典を見る ↓
          </a>
        </div>
        <div className="atlas-map">
          <svg className="japan" viewBox="0 0 390 450">
            <g fill="#dce4fc" stroke="#fff" strokeWidth="3">
              <path d="m270 31 26 8 10 27 33 17 22-5 12 27-43 13-32-8-25 14-29-20 13-27-4-27z" />
              <path d="m259 145 24-20 16 12-3 38-17 32-2 32-20 25-21 5-18 20-18 5-24 19-27-2-24 21-44 7-11-14 30-20 27-3 19-23 21-4 5-20 27-9 13-29 20-21z" />
              <path d="m108 345 31-6 23 12-9 12-32 9-24-10z" />
              <path d="m68 346 26 14-9 26-6 38-23-5-17-22 6-31z" />
              <path d="m39 432 8 4-7 9-8-2z" />
            </g>
            <g fill="#244ae0">
              <circle cx="228" cy="263" r="6" />
              <circle cx="199" cy="286" r="5" />
              <circle cx="271" cy="183" r="5" />
              <circle cx="76" cy="367" r="5" />
              <circle cx="305" cy="89" r="5" />
            </g>
            <g fill="none" stroke="#244ae0" opacity=".25">
              <circle cx="228" cy="263" r="17" />
              <circle cx="228" cy="263" r="27" />
            </g>
          </svg>
          <span className="map-label">JAPAN / INCIDENT ATLAS</span>
          <div className="map-counter">
            <b>180</b>
            <span>
              2025年の漏えい・紛失事故
              <br />
              上場企業とその子会社の公表
            </span>
          </div>
          <small>地図はイメージです。発生場所・件数の分布を示しません。</small>
        </div>
      </section>
      <section
        id="annual-statistics"
        className="annual-impact"
        aria-label="2025年の情報漏えい・紛失統計"
      >
        <div className="annual-heading">
          <span className="eyebrow">2025年 / 上場企業・子会社の公表</span>
          <h2>
            1年で、約3,063万人分。
            <br />
            情報の向こうに、暮らしがある。
          </h2>
          <p>漏えいは、サービスの停止や二次被害にもつながります。</p>
        </div>
        <div className="annual-main">
          <span>公表された個人情報の漏えい・紛失（概数）</span>
          <div>
            <b>3,063</b>
            <strong>万人分</strong>
          </div>
          <small>正確な集計値：30,636,910人分 · 前年比 +93.1%</small>
        </div>
        <div className="annual-sub">
          <div>
            <b>
              180<small>件</small>
            </b>
            <span>漏えい・紛失事故 / 158社</span>
          </div>
          <div>
            <b>
              116<small>件</small>
            </b>
            <span>ウイルス感染・不正アクセス / 64.4%</span>
          </div>
        </div>
        <div className="annual-method">
          <p>
            対象：2025年に上場企業とその子会社が公表した事故。漏えいの可能性・不適切な取り扱いを含みます。全国すべての事故や重複を除いた被害人数ではありません。
          </p>
          <a
            href="https://www.tsr-net.co.jp/data/detail/1202348_1527.html"
            target="_blank"
            rel="noreferrer"
          >
            出典：東京商工リサーチ TSRデータインサイト ↗
          </a>
          <details>
            <summary>前年との比較・集計範囲を見る</summary>
            <div className="annual-compare">
              <div>
                <span>2024</span>
                <b>189件</b>
                <span>15,865,611人分</span>
              </div>
              <div>
                <span>2025</span>
                <b>180件</b>
                <span>30,636,910人分</span>
              </div>
            </div>
            <p>
              事故件数は減少しましたが、公表された情報の規模は増えました。件数の増減だけでリスクの大小を判断できません。2026年は年の途中のため、年間値として掲載していません。
            </p>
            <a
              href="https://www.tsr-net.co.jp/data/detail/1200872_1527.html"
              target="_blank"
              rel="noreferrer"
            >
              2024年の一次統計 ↗
            </a>
          </details>
        </div>
      </section>
      <section className="latest">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LATEST DISCLOSURES</span>
            <h2>新しい公表を、ひと目で。</h2>
          </div>
          <a href="#database">すべての記録へ →</a>
        </div>
        <div className="latest-grid">
          {recent.map((r) => (
            <button key={r.id} onClick={() => open(r.id)}>
              <div>
                <Logo name={r.organization} />
                <span>
                  {r.organization}
                  <small>{r.disclosedAt} 公表</small>
                </span>
                <ArrowRight size={16} />
              </div>
              <h3>{r.title}</h3>
              <p>{r.impact}</p>
              <span className="badge">原因：{r.causeStatus}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
export function Community() {
  const [kind, K] = useState("情報追加"),
    [org, O] = useState(""),
    [url, U] = useState(""),
    [detail, D] = useState(""),
    [consent, C] = useState(false);
  const body = `種類: ${kind}\n対象: ${org}\n公開された根拠: ${url}\n内容: ${detail}`;
  return (
    <section className="commons" id="contribute">
      <div className="commons-intro">
        <span className="eyebrow">LEARN TOGETHER</span>
        <h2>
          起きたことを、
          <br />
          次の誰かの備えに。
        </h2>
        <p>
          事件を記録し、根拠を確かめ、点検に活かす。学びをみんなで共有するためのオープンソースのデータベースです。
        </p>
        <div className="roadmap">
          <Code />
          <div>
            <b>事例から生まれる点検プロンプト</b>
            <p>
              新しい公表・続報を確認し、Claude
              Codeなどに貼り付ける点検観点を更新していきます。
            </p>
          </div>
        </div>
        <div className="roadmap">
          <Plug />
          <div>
            <b>MCP連携 · Coming soon</b>
            <p>
              AIツールから事件・出典・点検観点を参照できる仕組みを計画しています。接続機能は未提供です。
            </p>
          </div>
        </div>
        <a href={repo} target="_blank" rel="noreferrer">
          GitHubでコード・データ・利用条件を見る ↗
        </a>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          window.open(
            repo +
              "/issues/new?title=" +
              encodeURIComponent("[" + kind + "] " + org) +
              "&body=" +
              encodeURIComponent(body),
            "_blank",
            "noopener,noreferrer",
          );
        }}
      >
        <GitPullRequest />
        <h3>その情報を、次の記録へ。</h3>
        <p>
          追加・訂正・お問い合わせをGitHub
          Issueで受け付けます。内容は公開され、編集者が確認して反映します。
        </p>
        <label>
          種類
          <select value={kind} onChange={(e) => K(e.target.value)}>
            <option>情報追加</option>
            <option>訂正・続報</option>
            <option>お問い合わせ</option>
          </select>
        </label>
        <label>
          組織名・対象
          <input
            required
            maxLength={100}
            value={org}
            onChange={(e) => O(e.target.value)}
          />
        </label>
        <label>
          公表資料のURL
          <input
            type="url"
            required={kind !== "お問い合わせ"}
            placeholder="https://"
            value={url}
            onChange={(e) => U(e.target.value)}
          />
        </label>
        <label>
          共有したい内容
          <textarea
            required
            maxLength={2000}
            value={detail}
            onChange={(e) => D(e.target.value)}
          />
        </label>
        <label className="consent">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => C(e.target.checked)}
          />
          公開情報のみ記載し、個人情報・秘密情報を含めていません
        </label>
        <button className="atlas-cta" type="submit">
          GitHubで確認して起票 <ArrowRight size={16} />
        </button>
        <small>GitHubログインが必要です。この画面では送信されません。</small>
        <details>
          <summary>起票文を確認・コピーする</summary>
          <textarea readOnly value={body} aria-label="起票文" />
        </details>
      </form>
    </section>
  );
}
