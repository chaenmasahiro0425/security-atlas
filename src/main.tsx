import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Shield, Database, Code, Plug, X, Copy, Search } from "lucide-react";
import { filterIncidents } from "./search";
import type { Incident } from "./types";
import "./style.css";
type Research = {
  headline: string;
  scope: string;
  flow: string[];
  facts: { text: string; sourceId: string }[];
  unknown: string[];
  checks: { title: string; detail: string }[];
  sources: Incident["sources"];
  promptKey: string;
};
type Row = Incident & { research: Research };
const params = new URLSearchParams(location.search);
const topics: Record<string, string> = {
  auth: "認証・権限・大量取得への対策",
  secrets: "GitHub・秘密情報・トークンの管理",
  nonprod: "テスト環境・個人情報の残置",
  dependencies: "依存関係・脆弱性・更新管理",
};
function prompt(key: string, r?: Row) {
  return `私が管理するリポジトリを読み取り専用でセキュリティレビューしてください。AGENTS.mdを最初に読み、${topics[key]}を重点的に確認してください。\n${
    r
      ? `参考事例: ${r.organization}\n確認された公開情報: ${r.research.headline}\n未確認: ${r.research.unknown.join("／")}\n点検観点:\n${r.research.checks.map((c) => c.title + ": " + c.detail).join("\n")}\n一次情報:\n${r.sources
          .filter((s) => s.kind === "一次情報")
          .map((s) => s.url)
          .join("\n")}`
      : ""
  }\n参考事例の原因がこのコードにも存在すると決めつけないでください。実コードの根拠を確認し、重要度・file:line・成立条件・影響・修正案・検証方法を報告してください。仮説と未確認を明記してください。秘密情報の値を表示せず、秘密設定ファイルや秘密鍵を承認なく読まないでください。ファイル変更、外部サイトへの攻撃、外部データ変更、deployは実行しないでください。`;
}
function App() {
  const [rows, R] = useState<Row[]>([]),
    [error, E] = useState(false),
    [q, Q] = useState(params.get("q") || ""),
    [cause, C] = useState(params.get("cause") || ""),
    [industry, I] = useState(params.get("industry") || ""),
    [leak, L] = useState(params.get("leak") || ""),
    [sort, S] = useState(params.get("sort") || "newest"),
    [view, V] = useState("テーブル"),
    [section, N] = useState("db"),
    [id, D] = useState(params.get("incident") || ""),
    [tab, T] = useState("概要"),
    [copied, B] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    Promise.all([
      fetch("./data/incidents.json").then((r) => r.json()),
      fetch("./data/research.json").then((r) => r.json()),
    ])
      .then(([a, b]) =>
        R(
          a.map((r: Incident) => ({
            ...r,
            research: b[r.id],
            sources: [...r.sources, ...b[r.id].sources],
          })),
        ),
      )
      .catch(() => E(true));
  }, []);
  const current = rows.find((r) => r.id === id);
  useEffect(() => {
    const p = new URLSearchParams();
    Object.entries({ q, cause, industry, leak, sort, incident: id }).forEach(
      ([k, v]) => {
        if (v) p.set(k, v);
      },
    );
    history.replaceState(null, "", "?" + p);
  }, [q, cause, industry, leak, sort, id]);
  useEffect(() => {
    if (current && !dialog.current?.open) dialog.current?.showModal();
    if (!current && dialog.current?.open) dialog.current.close();
  }, [current]);
  const visible = filterIncidents(
    rows,
    q,
    industry,
    cause,
    leak,
    "",
    sort,
  ) as Row[];
  const reset = () => {
    Q("");
    C("");
    I("");
    L("");
  };
  const copy = async (t: string, key: string) => {
    try {
      await navigator.clipboard.writeText(t);
      B(key);
      setTimeout(() => B(""), 2000);
    } catch {
      B("コピーできません。本文を選択してください");
    }
  };
  return (
    <div className="workspace">
      <aside className="sidebar">
        <a className="brand" href="/">
          <Shield />
          Security Atlas
        </a>
        <small>PERSONAL WORKSPACE</small>
        <button
          className={section === "db" ? "active" : ""}
          onClick={() => N("db")}
        >
          <Database size={17} />
          事件データベース
        </button>
        <button
          className={section === "prompts" ? "active" : ""}
          onClick={() => N("prompts")}
        >
          <Code size={17} />
          点検プロンプト
        </button>
        <button
          className={section === "mcp" ? "active" : ""}
          onClick={() => N("mcp")}
        >
          <Plug size={17} />
          MCP <em>Coming soon</em>
        </button>
        <p className="sidebar-note">
          日本のセキュリティ事件簿
          <br />
          公開情報から、次の備えへ。
          <br />
          <br />
          確認日 2026.10.03
          <br />
          初期収録 11件 · 網羅性は未検証
        </p>
      </aside>
      <main>
        <header>
          Security Atlas /{" "}
          {section === "db"
            ? "事件データベース"
            : section === "prompts"
              ? "点検プロンプト"
              : "MCP"}
        </header>
        {section === "db" ? (
          <>
            <div className="page-title">
              <Database size={35} />
              <div>
                <small>INCIDENT DATABASE</small>
                <h1>セキュリティ事件データベース</h1>
                <p>
                  何が起きたか、どこまでわかったか。公開情報から自分の環境での備えにつなげる。
                </p>
              </div>
            </div>
            <div className="stats">
              <span>
                <b>{rows.length}</b>収録事例
              </span>
              <span>
                <b>5</b>原因情報あり
              </span>
              <span>
                <b>6</b>原因未公表
              </span>
              <span>
                <b>一次＋二次</b>出典を併記
              </span>
            </div>
            <div className="db-title">
              <h2>日本のインシデント</h2>
              <button
                onClick={() => {
                  const u = URL.createObjectURL(
                    new Blob([JSON.stringify(visible, null, 2)], {
                      type: "application/json",
                    }),
                  );
                  const a = document.createElement("a");
                  a.href = u;
                  a.download = "security-atlas-incidents.json";
                  a.click();
                  URL.revokeObjectURL(u);
                }}
              >
                JSONを取得
              </button>
            </div>
            <div className="views">
              {["テーブル", "時系列"].map((x) => (
                <button
                  className={view === x ? "selected" : ""}
                  key={x}
                  onClick={() => V(x)}
                >
                  {x}
                </button>
              ))}
              <small>公表日を基準に表示</small>
            </div>
            <div className="toolbar">
              <label>
                <Search size={17} />
                <input
                  aria-label="事件を検索"
                  placeholder="企業名、原因、GitHub、被害で検索…"
                  value={q}
                  onChange={(e) => Q(e.target.value)}
                />
              </label>
              <select
                aria-label="並び順"
                value={sort}
                onChange={(e) => S(e.target.value)}
              >
                <option value="newest">公表日：新しい順</option>
                <option value="oldest">公表日：古い順</option>
                <option value="updated">一次情報：更新順</option>
              </select>
            </div>
            <div className="filters">
              <select
                aria-label="原因の公表状況"
                value={cause}
                onChange={(e) => C(e.target.value)}
              >
                <option value="">原因：すべて</option>
                {["公表", "一部公表", "未公表"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <select
                aria-label="業種"
                value={industry}
                onChange={(e) => I(e.target.value)}
              >
                <option value="">業種：すべて</option>
                {[...new Set(rows.map((r) => r.industry))].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <select
                aria-label="漏えい状況"
                value={leak}
                onChange={(e) => L(e.target.value)}
              >
                <option value="">漏えい：すべて</option>
                {[...new Set(rows.map((r) => r.leakStatus))].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <button onClick={reset}>絞り込みをリセット</button>
              <span>{visible.length}件</span>
            </div>
            {error ? (
              <p role="alert">
                データを読み込めませんでした。再読み込みしてください。
              </p>
            ) : view === "テーブル" ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>企業・事件</th>
                      <th>
                        <button
                          onClick={() =>
                            S(sort === "oldest" ? "newest" : "oldest")
                          }
                        >
                          公表日 {sort === "oldest" ? "↑" : "↓"}
                        </button>
                      </th>
                      <th>業種</th>
                      <th>原因 / 公表状況</th>
                      <th>影響・規模</th>
                      <th>漏えい</th>
                      <th>出典</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => (
                      <tr className="incident" key={r.id}>
                        <td>
                          <button
                            className="incident-link"
                            onClick={() => {
                              D(r.id);
                              T("概要");
                            }}
                          >
                            <strong>{r.organization}</strong>
                            <small>{r.title}</small>
                          </button>
                        </td>
                        <td className="date">{r.disclosedAt}</td>
                        <td>
                          <span className="tag">{r.industry}</span>
                        </td>
                        <td>
                          <span
                            className={
                              "badge " +
                              (r.causeStatus === "未公表" ? "unknown" : "known")
                            }
                          >
                            {r.causeStatus}
                          </span>
                          <small>{r.category}</small>
                        </td>
                        <td className="impact-cell">{r.impact}</td>
                        <td>
                          <span className="tag">{r.leakStatus}</span>
                        </td>
                        <td>{r.sources.length} ↗</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="timeline-list">
                {visible.map((r) => (
                  <article className="incident" key={r.id}>
                    <time>{r.disclosedAt}</time>
                    <button
                      className="incident-link"
                      onClick={() => {
                        D(r.id);
                        T("概要");
                      }}
                    >
                      <strong>{r.organization}</strong>
                      <small>{r.research.headline}</small>
                    </button>
                    <span className="badge">{r.causeStatus}</span>
                  </article>
                ))}
              </div>
            )}
            {rows.length > 0 && !visible.length && (
              <div className="empty">
                <h3>条件に一致する事例がありません</h3>
                <button onClick={reset}>すべての事例を見る</button>
              </div>
            )}
            <p className="db-foot">
              {visible.length} records ·
              発生日と公表日は異なります。原因未公表は、安全性の評価を意味しません。
            </p>
            <details className="policy">
              <summary>このデータベースの読み方・編集方針</summary>
              <p>
                一次情報は被害組織の公表、二次情報は報道・専門家の整理です。侵入経路、影響、対策を分け、未公表の原因を推測で補いません。一般的な点検提案は編集上の提案です。初期調査の11件を収録し、日本全体の発生傾向を示す統計ではありません。可能性と確認済みを区別し、件数を事件間で単純合算しません。
              </p>
              <p>
                参考：<a href="https://piyolog.hatenadiary.jp/">piyolog</a> ·{" "}
                <a href="https://socket.dev/blog">Socket Blog</a>
                。転載せず、独自要約と出典リンクを掲載しています。
              </p>
            </details>
          </>
        ) : section === "prompts" ? (
          <>
            <div className="page-title">
              <Code size={35} />
              <div>
                <small>FROM INCIDENTS TO ACTION</small>
                <h1>自分のコードを、点検する。</h1>
                <p>
                  Claude Codeなどに貼り付けて使う、読み取り専用のレビュー指示。
                </p>
              </div>
            </div>
            <p className="notice">
              事件の原因が自分の環境にも存在するとは限りません。実コードの根拠を確認するためのプロンプトです。
            </p>
            <div className="prompt-grid">
              {Object.entries(topics).map(([key, title]) => (
                <article key={key}>
                  <Code />
                  <h2>{title}</h2>
                  <details>
                    <summary>プロンプトを読む</summary>
                    <pre>{prompt(key)}</pre>
                  </details>
                  <button
                    className="primary"
                    onClick={() => copy(prompt(key), key)}
                  >
                    <Copy size={16} />
                    {copied === key ? "コピーしました" : "プロンプトをコピー"}
                  </button>
                </article>
              ))}
            </div>
            <p className="reference">
              参考：
              <a href="https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html">
                OWASP Authorization
              </a>{" "}
              ·{" "}
              <a href="https://docs.github.com/en/code-security/concepts/secret-security/secret-scanning">
                GitHub Secret scanning
              </a>{" "}
              ·{" "}
              <a href="https://cheatsheetseries.owasp.org/cheatsheets/Vulnerable_Dependency_Management_Cheat_Sheet.html">
                OWASP Dependency Management
              </a>
            </p>
          </>
        ) : (
          <>
            <div className="page-title">
              <Plug size={35} />
              <div>
                <small>COMING SOON</small>
                <h1>事件の知見を、開発ツールへ。</h1>
                <p>
                  MCP経由での検索・出典参照・点検観点の取得を計画しています。
                </p>
              </div>
            </div>
            <div className="mcp-card">
              <span className="badge known">Coming soon · 開発予定</span>
              <h2>検索 → 根拠を確認 → 自分の環境を点検</h2>
              <div className="flow">
                {[
                  "事件・原因を検索",
                  "一次情報と未公表事項を取得",
                  "点検プロンプトに活用",
                ].map((x, i) => (
                  <div key={x}>
                    <b>0{i + 1}</b>
                    <p>{x}</p>
                  </div>
                ))}
              </div>
              <p>
                MCPサーバー、接続URL、インストール設定は現在未提供です。提供時に掲載します。
              </p>
              <button disabled>接続設定は準備中</button>
            </div>
          </>
        )}
        <footer>
          Security Atlas / 個人運営の公開情報データベース · データ確認
          2026.10.03
        </footer>
      </main>
      <dialog
        className="detail-dialog"
        ref={dialog}
        onCancel={() => D("")}
        onClose={() => D("")}
      >
        {current && (
          <>
            <div className="detail-head">
              <small>INCIDENT / {current.disclosedAt}</small>
              <button aria-label="詳細を閉じる" onClick={() => D("")}>
                <X />
              </button>
            </div>
            <h2>{current.organization}</h2>
            <p>{current.title}</p>
            <div className="detail-meta">
              <span className="badge known">{current.causeStatus}</span>
              <span className="tag">{current.leakStatus}</span>
              <button onClick={() => copy(location.href, "link")}>
                {copied === "link" ? "コピーしました" : "詳細リンクをコピー"}
              </button>
            </div>
            <div className="tabs" role="tablist">
              {["概要", "技術的な詳細", "対策・プロンプト"].map((x) => (
                <button
                  role="tab"
                  aria-selected={tab === x}
                  key={x}
                  onClick={() => T(x)}
                >
                  {x}
                </button>
              ))}
            </div>
            <div className="detail-body">
              {tab === "概要" ? (
                <>
                  <small>何が起きた？</small>
                  <h3>{current.research.headline}</h3>
                  <p>{current.summary}</p>
                  <div className="flow">
                    {current.research.flow.map((x, i) => (
                      <div key={x}>
                        <b>0{i + 1}</b>
                        <p>{x}</p>
                      </div>
                    ))}
                  </div>
                  <p className="scope">{current.research.scope}</p>
                  <h3>わかったこと</h3>
                  {current.research.facts.map((f, i) => (
                    <p key={i}>
                      ✓ {f.text}{" "}
                      <a
                        href={
                          current.sources.find((s) => s.id === f.sourceId)?.url
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        一次情報 ↗
                      </a>
                    </p>
                  ))}
                  <h3>被害・影響</h3>
                  <p>{current.impact}</p>
                  <p>{current.dataTypes.join(" / ")}</p>
                  <h3>経緯</h3>
                  {current.timeline.map((x, i) => (
                    <p className="event" key={i}>
                      <time>{x.date}</time>
                      {x.label}
                    </p>
                  ))}
                </>
              ) : tab === "技術的な詳細" ? (
                <>
                  <h3>公開情報から読み取れること</h3>
                  <p>{current.technical}</p>
                  <h3>公表された原因</h3>
                  <p>{current.cause}</p>
                  <p className="scope">{current.research.scope}</p>
                </>
              ) : (
                <>
                  <h3>自分の環境で点検すること</h3>
                  <p className="scope">
                    編集部による一般的な点検提案です。事件の未公表原因を断定するものではありません。
                  </p>
                  {current.research.checks.map((c) => (
                    <div className="check-card" key={c.title}>
                      <Shield size={18} />
                      <div>
                        <b>{c.title}</b>
                        <p>{c.detail}</p>
                      </div>
                    </div>
                  ))}
                  <h3>Claude Code用 点検プロンプト</h3>
                  <button
                    className="primary"
                    onClick={() =>
                      copy(
                        prompt(current.research.promptKey, current),
                        "incident",
                      )
                    }
                  >
                    <Copy size={16} />
                    {copied === "incident"
                      ? "コピーしました"
                      : "プロンプトをコピー"}
                  </button>
                  <pre>{prompt(current.research.promptKey, current)}</pre>
                </>
              )}
              {tab !== "対策・プロンプト" && (
                <div className="unknown-box">
                  <h3>まだわからないこと</h3>
                  <ul>
                    {current.research.unknown.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="sources">
                <h3>出典・確認できる範囲</h3>
                {["一次情報", "二次情報"].map((kind) => (
                  <section key={kind}>
                    <h4>
                      {kind}{" "}
                      <small>
                        {kind === "一次情報"
                          ? "被害組織の公表"
                          : "報道・専門家の整理"}
                      </small>
                    </h4>
                    {current.sources
                      .filter((s) => s.kind === kind)
                      .map((s, i) => (
                        <a
                          href={s.url}
                          key={i}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {s.title}
                          <small>
                            {s.publishedAt} · {new URL(s.url).hostname}
                          </small>
                        </a>
                      ))}
                  </section>
                ))}
                <small>確認日 2026.10.03</small>
              </div>
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
