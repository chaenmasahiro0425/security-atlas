import { useEffect, useRef, useState } from "react";
import { X, ArrowUpRight } from "lucide-react";
const repo = "https://github.com/chaenmasahiro0425/security-atlas";
const pages = {
  privacy: {
    title: "プライバシーポリシー",
    sections: [
      ["入力内容は、起票前に確認できます", "情報追加・訂正フォームの入力はこの画面のメモリ内で扱います。当サイトのサーバーへ入力内容を送信・保存する機能はありません。「GitHubで確認して起票」を押すと入力内容を含むGitHubの起票画面を開きます。GitHubへ移動した時点から、同サービスの取扱いが適用されます。投稿の確定はGitHub上で行います。"],
      ["公開Issueに載せてよい情報", "投稿されたIssue・Pull Requestは公開されます。いただいた内容は出典の確認、記録の追加・訂正、お問い合わせへの対応に利用します。氏名・連絡先などの個人情報、顧客データ、認証情報、非公開資料は入力・投稿しないでください。誤って掲載した場合はGitHub上で削除し、対象URLを添えてご連絡ください。"],
      ["アクセス時の外部サービス", "サイト配信にVercel、フォント配信にGoogle Fonts、情報提供の受付にGitHubを利用しています。アクセス時にはIPアドレスやブラウザー情報などが各サービスで処理される場合があります。当サイト独自のアクセス解析、広告、追跡Cookie、会員登録機能は現在導入していません。"],
      ["訂正・削除などのご連絡", "掲載情報や個人情報の取扱いに関するご要望は、GitHubの情報追加・訂正窓口で受け付けます。対象URLとご要望のみを記載し、本人確認書類や非公開情報は投稿しないでください。追加の確認が必要な場合は、対応方法を個別に相談します。"],
      ["改定", "機能や利用サービスを変更する際は、本ポリシーを更新します。制定日：2026年10月3日。"],
    ],
  },
  terms: {
    title: "利用規約",
    sections: [
      ["目的と情報の範囲", "Security Atlasは、公表されたセキュリティ事件を可視化し、同じ被害を防ぐための学びを共有するオープンソースのデータベースです。国内の全事件を網羅する統計ではありません。一次資料、報道、未公表事項を区別して掲載し、続報に応じて更新します。"],
      ["点検プロンプトの利用", "点検プロンプトは自分が権限を持つ環境の確認に利用してください。AIの出力や本サイトの情報だけで安全性を判断せず、実コードと一次情報を確認してください。個別の環境に対する安全性や対策の効果を保証するものではありません。"],
      ["情報の追加・訂正", "公開資料のURLを添えてGitHub Issue・Pull Requestでご提案ください。編集者が根拠と重複を確認して反映します。投稿した内容が必ず掲載されるわけではありません。誹謗中傷、個人情報や秘密情報の掲載、権利侵害、攻撃や不正利用につながる投稿は禁止します。"],
      ["権利と出典", "企業ロゴ・商標・引用資料の権利は各権利者に帰属します。ロゴは対象組織の識別のために表示し、提携・推薦を示すものではありません。ソースコードと編集データの利用条件はGitHubのLICENSE・DATA-LICENSE.mdを確認してください。資料の再利用時は原典の条件も確認してください。"],
      ["更新・停止と責任", "誤りが判明した場合は訂正しますが、すべての情報の完全性・最新性を保証するものではありません。必要に応じて機能を変更・停止する場合があります。利用に関する責任は、適用される法令に従って扱います。制定日：2026年10月3日。"],
    ],
  },
  operator: {
    title: "運営について",
    sections: [
      ["オープンソースで、みんなで育てる", "運営：茶圓。Security AtlasはコードをMIT、独自編集データをCC BY 4.0で公開するオープンソースのデータベースです。事件の発端、わかったこと、まだ公表されていないことを整理し、次の被害を防ぐために共有することが目的です。"],
      ["みなさんの情報を、次の備えに", "情報追加・訂正はGitHubで受け付けています。一次情報のURL、続報、公開された技術的な原因などをお寄せください。点検プロンプトも事例の知見に合わせて改善していきます。"],
      ["MCPは開発予定です", "事件検索・出典確認・点検観点の取得を開発ツールから使える仕組みを計画しています。MCPサーバー・接続URL・インストール設定は現在未提供です。"],
    ],
  },
};
type Page = keyof typeof pages;
function fromHash(): Page | null {
  const value = location.hash.slice(1);
  return Object.prototype.hasOwnProperty.call(pages, value) ? value as Page : null;
}
export function LegalFooter() {
  const [page, setPage] = useState<Page | null>(fromHash);
  const modal = useRef<HTMLDialogElement>(null);
  const close = () => {
    setPage(null);
    if (fromHash()) history.replaceState(null, "", location.pathname + location.search);
  };
  useEffect(() => {
    const listener = () => setPage(fromHash());
    window.addEventListener("hashchange", listener);
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  useEffect(() => {
    if (!page) { modal.current?.close(); return; }
    modal.current?.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [page]);
  return <>
    <footer className="site-footer">
      <span>Security Atlas — 事件を知り、次の被害を防ぐ。</span>
      <nav aria-label="サイトのご案内">
        {(Object.keys(pages) as Page[]).map(key => <button key={key} onClick={() => {
          history.replaceState(null, "", location.pathname + location.search + "#" + key);
          setPage(key);
        }}>{pages[key].title}</button>)}
      </nav>
    </footer>
    <dialog className="legal-dialog" ref={modal} aria-labelledby="legal-title" onCancel={close} onClose={close} onClick={e => { if (e.target === modal.current) close(); }}>
      {page && <article>
        <header><h2 id="legal-title">{pages[page].title}</h2><button autoFocus onClick={close} aria-label="案内を閉じる"><X /></button></header>
        {pages[page].sections.map(([title, text]) => <section key={title}><h3>{title}</h3><p>{text}</p></section>)}
        {page === "operator" && <p className="legal-external">利用条件：<a href={repo + "/blob/main/LICENSE"} target="_blank" rel="noreferrer">コード：MIT</a> · <a href={repo + "/blob/main/DATA-LICENSE.md"} target="_blank" rel="noreferrer">独自編集データ：CC BY 4.0</a></p>}
        {page === "privacy" && <p className="legal-external">外部サービスのポリシー：<a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Vercel</a> · <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google</a> · <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noreferrer">GitHub</a></p>}
        <a className="atlas-cta" href={repo + "/issues/new/choose"} target="_blank" rel="noreferrer">情報追加・訂正の窓口 <ArrowUpRight size={17} /></a>
      </article>}
    </dialog>
  </>;
}
