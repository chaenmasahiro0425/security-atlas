# 公開前提のセキュリティ点検

確認日：2026年10月3日（JST）。対象：公開main d06f1e2とfix-security-hardeningの変更。秘密情報の値を出力する検査や、外部サイトへの攻撃は実施していません。

## 確認した結果

| 対象 | 結果・範囲 |
| --- | --- |
| Git履歴・作業ファイル | Gitleaks 8.30.1で取得済み全ref、14コミットと作業ファイルを検査。秘密情報の検出0件。未取得refやGitHub側の削除済みオブジェクトは対象外 |
| npm依存関係 | 最新mainのlockに対するnpm ci・npm auditで既知の脆弱性0件。未知の脆弱性や依存先の全コード監査は対象外 |
| React実装 | データ・検索語はReactの文字列として描画。dangerouslySetInnerHTML、eval、独自API、認証、DB処理は見つからず。外部リンクはHTTPS。新規タブにはnoreferrerまたはnoopenerを使用 |
| 公開データ | 全30事例のID、結合後の出典ID、事実・時系列の出典参照、全JSON内URLのHTTPSとcredential不在を検査。各一次資料の本文・数値の全件再照合は今回対象外 |
| 公開SVG | script、イベント属性、foreignObject、外部resource、entity等を検査し検出なし |
| 本番HTTPSヘッダー | securityatlas.orgへの通常のHEADでCSP、nosniff、DENY、Permissions-Policy、Referrer-Policy、HSTSを確認。CSPのinline JSON-LD hashとindex.htmlの整合性も検証 |
| GitHub保護機能 | secret scanning、push protection、Dependabot security updates、非公開の脆弱性報告を有効化し再取得で確認。確認時のsecret scanning・Dependabotアラートは各0件 |

## 今回の改善

- Actionsをcommit SHAに固定。contents: read、credentialの持続保存禁止、実行時間上限、同一refの重複実行停止を設定。
- CIにnpm auditとGitleaksによる履歴検査を追加。未固定のnpx wait-on取得を廃止。
- npmとGitHub Actions向けの週次Dependabot設定を追加。
- 全事例横断の出典参照、HTTPS、SVG、CSP整合性の回帰検査を追加。
- SECURITY.mdに非公開報告先と点検範囲を明記。
- 元のJSONは保持し、build成果物だけcompact化。114,156 → 91,879 bytes、19.5%削減。4ファイルすべてJSONとしての値は完全一致。gzip後の通信量は別の指標。

## 検証

npm test：9件成功。npm run build：成功。production buildをlocalhostの別ポートで配信し、既存E2E 27件すべて成功。検索・出典・JSON取得・フォーム・規約・320〜1440pxの画面幅を確認。

## 残る範囲

安全性を完全保証するものではありません。秘密情報検査は既知パターンを中心とした検査です。外部一次資料の全件再調査、全PNG/ICOの目視によるprivacy監査、ライセンスの法的判断、Vercelアカウント・DNSの管理権限監査、負荷・侵入テストは未実施です。mainのbranch protectionは確認時に未設定でした。

secret scanning等の設定はGitHub上で適用済みです。コード・CI・配信データ圧縮の変更は、mergeと環境への反映まで本番で有効になりません。
