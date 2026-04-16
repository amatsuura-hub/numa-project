# TODO.md — Numa Project（2026-03-30 最新）

ゼロベースのコード監査結果。修正済み項目は含まない。

---

## 1. バグ・不整合

- [x] **[高 / 小 / backend]** `UpdateNode` で `CreatedAt` が消失する — `UpdateNode` リポジトリメソッドを追加し `UpdateExpression` で `CreatedAt` を保持するように修正済み
- [x] **[高 / 中 / backend]** `DeleteNode` で参照エッジが孤立する — ノード削除前にエッジのカスケード削除を実装済み
- [x] **[中 / 中 / backend]** `DeleteRoadmap` でユーザー側データが孤立する — `roadmap_repo.go` に制約と今後の対応方針をコメント追記済み
- [x] **[低 / 小 / backend]** `PutProgress` のエラーラッピング不足 — `fmt.Errorf("putting progress: %w", err)` に修正済み
- [ ] **[低 / 小 / backend]** `ExploreRoadmaps` で無効カテゴリがサイレントに空文字化される — エラーを返さず全件表示にフォールバック。意図的な設計だが未ドキュメント (`handler/roadmap.go:238-241`)

---

## 2. セキュリティ

- [ ] **[高 / 中 / infra]** GitHub Actions で AWS 長期アクセスキー認証を使用 — 本番運用時に OIDC (AssumeRoleWithWebIdentity) に移行すべき。現状はポートフォリオ段階のため現状維持 <!-- スキップ: ポートフォリオ段階のため OIDC 移行は見送り。README に推奨事項として記載済み -->
- [x] **[中 / 小 / infra]** CI の `npm audit` 失敗が `|| true` で無視されている — `continue-on-error: true` に変更済み
- [x] **[中 / 小 / infra]** GitHub Actions に `permissions` ブロックなし — 全ワークフロー (ci.yml, deploy.yml, deploy-prod.yml) に `permissions: contents: read` を追加済み
- [ ] **[中 / 小 / infra]** API Gateway リクエストバリデーション未設定 — Lambda 側でバリデーション済みのため低リスクだが、二重防御として追加検討 <!-- スキップ: Lambda 側で全入力をバリデーション済み。Terraform 変更が大きく、費用対効果が低い -->
- [ ] **[低 / 小 / frontend]** API 呼び出しに `AbortController` 未使用 — コンポーネントアンマウント後もリクエストが完了し、状態更新でメモリリークやレース条件の原因となる

---

## 3. パフォーマンス

- [ ] **[中 / 中 / backend]** `GetMyBookmarks` の N+1 クエリ — 各ブックマークに対して個別に `GetRoadmapMeta` を呼び出し。`BatchGetItem` で改善可能 (`handler/bookmark.go:65-84`、TODO コメント済み) <!-- スキップ: コード内に TODO コメント済み。現状のデータ量では問題なし -->
- [ ] **[中 / 小 / backend]** `GetUserPublicRoadmaps` がインメモリフィルタ — 全ユーザーロードマップを取得後 `isPublic` でフィルタ。GSI2 + userId フィルタで改善可能 (`handler/user.go:88-107`、TODO コメント済み) <!-- スキップ: コード内に TODO コメント済み。ユーザーあたりロードマップ上限 50 件のため影響軽微 -->
- [x] **[中 / 小 / backend]** `GetMyProgress` にページネーション制限なし — `Limit` パラメータ (MaxPageLimitExplore=100) を追加済み
- [ ] **[低 / 小 / frontend]** DashboardPage のタブ切り替えで毎回 API を再取得 — キャッシュや SWR パターンの導入で改善可能
- [ ] **[低 / 中 / frontend]** エディタ系コンポーネント (@xyflow/react, dagre) のコード分割なし — 初期バンドルに含まれており、エディタ非使用ページの読み込みに影響

---

## 4. 監視・運用

- [x] **[中 / 中 / infra]** Lambda 監視三点セット実環境反映 — DLQ (SQS, 14日保持) + X-Ray Active トレーシング + CloudWatch アラーム 6 種 (Lambda Errors / DLQ Messages / DynamoDB RW Throttle / API 5xx / 4xx) + SNS アラームトピック + CloudWatch Log Groups 30 日保持を 2026-04-16 の Phase 1 apply で実環境反映済み (`monitoring` モジュール + `lambda` モジュール)。既存 `/aws/lambda/dev-numa-*` ログ グループは `terraform import` で state に取り込み済み
- [ ] **[中 / 中 / infra]** CloudWatch ダッシュボード未作成 — アラームは設定済みだが、メトリクスの可視化手段がない。Terraform モジュール追加が必要 <!-- スキップ: Terraform モジュール追加が必要で scope out。アラーム自体は設定済み -->
- [ ] **[中 / 小 / infra]** Terraform リモートステート migrate 未実施 — state bucket (`numa-terraform-state`) + lock table (`numa-terraform-lock`) は 2026-04-16 の Phase 1 apply で bootstrap 済み。残タスクは `backend.tf` の `backend "s3"` ブロック有効化 + `terraform init -backend-config=environments/dev/backend.hcl -migrate-state` で local → S3 への移行 <!-- スキップ: 手順コメント済み。実行は AWS アカウント操作が必要。2026-04-16 更新: state bucket + lock table は bootstrap 完了、migrate-state のみ残 -->
- [ ] **[低 / 小 / infra]** GSI スロットリングのアラームなし — メインテーブルのスロットリングアラームはあるが GSI1/GSI2/GSI3 は個別監視なし
- [ ] **[低 / 小 / infra]** Lambda 同時実行数のアラームなし — Reserved Concurrency 設定時にスロットリングを検知するアラームがない

---

## 5. CI/CD

- [x] **[中 / 小 / infra]** CI の Go バージョン (1.22) と go.mod (1.26.1) が不一致 — 全ワークフローを `go-version-file: backend/go.mod` に変更済み
- [ ] **[中 / 中 / infra]** 自動ロールバックメカニズムなし — スモークテスト失敗時は手動対応。誤動作リスクが高いため自動化は見送り。手動手順は notify-on-failure に記載済み <!-- スキップ: 自動ロールバックは誤動作リスクが高い。手動手順を deploy.yml の notify-on-failure に記載済み -->
- [ ] **[中 / 小 / infra]** CI に Terraform plan なし — AWS 認証が必要なため PR CI には不適。スケジュール実行を検討 <!-- スキップ: PR CI で AWS 認証なしに実行する方法がない -->
- [ ] **[低 / 小 / infra]** GitHub Actions のバージョンピニングが major のみ — `@v4` 等。公式アクション以外は SHA ピニング推奨
- [ ] **[低 / 小 / infra]** CI で Go モジュールのキャッシュ未設定 — 毎回 `go mod download` が走る。`setup-go` の `cache: true` で改善可能

---

## 6. フロントエンド

- [x] **[中 / 小 / frontend]** `UserPage.tsx` に `PageHead` コンポーネントなし — PageHead を追加し og:title, og:description を設定済み
- [x] **[中 / 小 / frontend]** `editorStore` の `saveTimer` がアンマウント時にクリアされない — 検証の結果、`reset()` が `clearTimeout(saveTimer)` を実行しており、`RoadmapEditPage` の `useEffect` クリーンアップで `reset()` が呼ばれるため問題なし
- [x] **[低 / 小 / frontend]** Header のモバイルメニューがページ遷移で自動クローズしない — 各リンクの `onClick` で `setMenuOpen(false)` が既に実装済み

---

## 7. バックエンド

- [ ] **[中 / 中 / backend]** ユーザー削除（退会）エンドポイント未実装 — GDPR Article 17 (Right to Erasure) 対応。ロードマップ・進捗・いいね・ブックマーク・Cognito ユーザーのカスケード削除が必要 (`handler/user.go` に TODO コメント済み) <!-- スキップ: カスケード削除の設計が複雑で、handler/user.go に TODO コメントとして記載済み。将来の優先実装候補 -->
- [x] **[低 / 小 / backend]** `handler/edge.go` のテストファイルなし — 検証の結果、`node_test.go` にエッジ CRUD テストが既に存在
- [x] **[低 / 小 / backend]** `handler/ogp.go` のテストファイルなし — `ogp_test.go` を追加済み (4 テストケース: 正常系、説明文なし、HTMLエスケープ、404)

---

## 8. SEO・メタ情報

- [x] **[中 / 小 / frontend]** `UserPage.tsx` に `PageHead` なし — 6. と同一、対応済み
- [ ] **[低 / 小 / frontend]** 構造化データ (JSON-LD) 未実装 — ロードマップやユーザーページの構造化データがない
- [ ] **[低 / 小 / frontend]** `canonical` URL 未設定 — `PageHead` に `<link rel="canonical">` がなく、重複コンテンツの SEO リスク

---

## 9. テスト

- [ ] **[中 / 中 / 全体]** E2E テスト未導入 — Playwright 等による統合テストなし <!-- スキップ: Playwright の導入は scope が大きく、CI 環境の整備も必要 -->
- [x] **[中 / 中 / frontend]** 主要ページのテスト未作成 — TopPage, RoadmapDetailPage, UserPage, NotFoundPage の 4 ページにテストを追加済み (計 16 テストケース)
- [ ] **[低 / 中 / frontend]** エディタコンポーネントのテスト不足 — `NodeEditPanel`, `MetaEditPanel`, `EditorToolbar` にテストなし
- [ ] **[低 / 小 / frontend]** `useRoadmapDetail` フックのテストなし — 非同期データ取得ロジックが未テスト
- [x] **[低 / 小 / backend]** `handler/edge.go`, `handler/ogp.go` のテストなし — edge テストは既存、ogp テストを新規追加済み

---

## 10. 将来拡張（実装予定なし）

- [ ] X (Twitter) OAuth 連携
- [ ] 全文検索（OpenSearch / Algolia）
- [ ] 通知システム（SNS + WebSocket / SSE）
- [ ] コメント機能
- [ ] フォーク機能
- [ ] i18n 対応
- [ ] 画像アップロード（S3 + 署名付き URL）
- [ ] エクスポート（PDF / PNG / Markdown）
- [ ] チーム機能（共同編集）
- [ ] アナリティクス（閲覧数・完了率）
- [ ] タグ編集 UI（モデルのみ存在、UI 未実装）
- [ ] ダークモード
- [ ] キーボードショートカット
- [ ] Undo / Redo
