# 毎日のセキュリティ情報取得

毎日08:17（日本時間）にGitHub Actionsで起動する。GitHub側の混雑で遅延する場合がある。default branchへのmerge後にscheduleが有効になる。Actionsから手動実行も可能。

取得元はJPCERT/CCの公式RSSとpiyologのRSS。取得対象は見出し、URL、公表日時、取得元のみ。piyologは二次情報であり、事件追加には当事者の一次情報の確認が必要。

前回成功したActions artifactを読み取り、URLで重複除去し、新規の見出しを追加する。同じURLの既存内容を上書きしない。初回はrepository内のsnapshotを使う。artifactは90日保存し、翌日の実行へ引き継ぐ。長期停止でartifactが失効した場合は手動復旧が必要。全取得元の失敗では新しい結果を作らない。部分失敗では取得できた結果を保存し、workflowを失敗扱いにする。

取得結果はActions artifactと専用 `feat-security-feed` ブランチの新規snapshotファイルに保存する。既存snapshotと承認済み事件データは上書きしない。2026年10月4日に本人が本番反映を承認。毎日の成功結果を本番の `/api/security-news` が読み取り、最大約1時間のキャッシュで表示する。mainへの自動push・mergeは行わない。API失敗時は同梱snapshotに戻し、保存済み情報である旨を表示する。48時間以上経過した場合も注意表示する。自動取得情報はすべて未確認であり、事件DBの収録件数には含めない。

ローカル取得は `python3 scripts/collect-security.py --previous public/data/security-news.json --output /tmp/security-news-new.json` 。outputが既存なら停止する。一次資料のある事件だけを、新しいデータファイルへ編集確認後に追加する。
