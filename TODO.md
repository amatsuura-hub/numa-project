# Numa — 実行計画 TODO

## Phase 1: 基盤構築

### 1.1 プロジェクト初期設定
- [x] `.gitignore` 作成（Go, Node, Terraform, .env, IDE 設定等）
- [x] `docker-compose.yml` 作成（DynamoDB Local）
- [x] README.md 整備（セットアップ手順）

### 1.2 Terraform インフラ構築
- [x] Terraform プロジェクト初期化 (`infra/main.tf`, `variables.tf`, `outputs.tf`)
- [x] DynamoDB モジュール作成（`numa-main` テーブル + GSI1/GSI2/GSI3）
- [x] Cognito モジュール作成（User Pool + App Client）
- [x] S3 + CloudFront モジュール作成（SPA ホスティング + OAC）
- [x] Lambda モジュール作成（Go ランタイム `provided.al2023`）
- [x] API Gateway モジュール作成（REST API + Cognito Authorizer + CORS）
- [x] dev 環境用 `terraform.tfvars` 作成
- [ ] `terraform plan` → `terraform apply` で dev 環境デプロイ確認

### 1.3 バックエンド基盤
- [x] Go プロジェクト初期化 (`go mod init`)
- [x] `backend/cmd/api/main.go` — Lambda エントリポイント作成
- [x] DynamoDB クライアント初期化 (`internal/repository/dynamo.go`)
- [x] ミドルウェア: JWT から userID 抽出 (`internal/middleware/auth.go`)
- [x] エラーレスポンスヘルパー作成
- [x] Makefile 作成（build, test, lint, deploy ターゲット）
- [x] `.golangci.yml` 作成
- [ ] Hello World Lambda デプロイ → API Gateway 経由で動作確認

### 1.4 フロントエンド基盤
- [x] Vite + React + TypeScript プロジェクト初期化 (`npm create vite`)
- [x] Tailwind CSS セットアップ
- [x] ESLint + Prettier セットアップ
- [x] React Router v6 セットアップ（ルーティング定義）
- [x] Zustand ストア雛形作成
- [x] API クライアント基盤 (`src/api/client.ts` — fetch ラッパー + 認証ヘッダ付与)
- [x] `.env.example` 作成
- [x] 共通レイアウトコンポーネント（ヘッダー、ナビゲーション）

### 1.5 Cognito 認証フロー
- [x] `amazon-cognito-identity-js` 導入
- [x] 認証ストア作成 (`src/stores/authStore.ts`)
- [x] サインアップページ (`/signup`)
- [x] メール確認ページ
- [x] ログインページ (`/login`)
- [x] ログアウト処理
- [x] 認証ガード（未ログイン時リダイレクト）
- [x] Cognito Post Confirmation Lambda Trigger（DynamoDB に User PROFILE 自動作成）

### 1.6 CI 基盤
- [x] `.github/workflows/ci.yml` 作成（PR 時: lint + test）
- [x] `.github/workflows/deploy.yml` 作成（main マージ時: ビルド + デプロイ）

---

## Phase 2: コア CRUD

### 2.1 ユーザー API
- [x] `GET /api/users/me` — 自分のプロフィール取得
- [x] `PUT /api/users/me` — プロフィール更新
- [x] `GET /api/users/:userId` — 他ユーザーのプロフィール取得
- [x] ユーザー repository 層実装
- [x] ユーザー API のユニットテスト

### 2.2 ロードマップ CRUD API
- [x] `POST /api/roadmaps` — ロードマップ作成
- [x] `GET /api/roadmaps/:id` — ロードマップ詳細取得（META + 全 Node + 全 Edge）
- [x] `PUT /api/roadmaps/:id` — ロードマップ META 更新（所有者チェック）
- [x] `DELETE /api/roadmaps/:id` — ロードマップ削除（所有者チェック + 関連 Node/Edge 一括削除）
- [x] `GET /api/roadmaps/my` — 自分のロードマップ一覧（GSI1 Query）
- [x] ロードマップ repository 層実装
- [x] ロードマップ API のユニットテスト

### 2.3 ノード・エッジ CRUD API
- [x] `POST /api/roadmaps/:id/nodes` — ノード追加
- [x] `PUT /api/roadmaps/:id/nodes/:nodeId` — ノード更新
- [x] `DELETE /api/roadmaps/:id/nodes/:nodeId` — ノード削除
- [x] `PUT /api/roadmaps/:id/nodes/batch` — ノード一括更新（位置変更等）
- [x] `POST /api/roadmaps/:id/edges` — エッジ追加
- [x] `DELETE /api/roadmaps/:id/edges/:edgeId` — エッジ削除
- [x] ノード/エッジ repository 層実装
- [x] ノード/エッジ API のユニットテスト

### 2.4 マインドマップエディタ（フロントエンド）
- [x] React Flow セットアップ
- [x] カスタムノードコンポーネント（ラベル、色、説明文表示）
- [x] ノード追加 UI（ダブルクリック or ボタン）
- [x] ノード編集 UI（クリックでサイドパネル or モーダル表示）
- [x] ノード削除 UI
- [x] ノードドラッグ移動
- [x] エッジ接続（ノード間をドラッグで接続）
- [x] エッジ削除
- [x] ズーム・パン操作
- [x] ロードマップメタ情報編集（タイトル、説明、カテゴリ、公開/非公開）
- [x] 自動保存（2 秒 debounce）
- [x] API 連携（保存・読み込み）
- [ ] エディタのコンポーネントテスト

### 2.5 ダッシュボード
- [x] ダッシュボードページ (`/dashboard`)
- [x] 自分のロードマップ一覧表示
- [x] 新規作成ボタン → `/roadmaps/new` 遷移
- [x] 既存ロードマップの編集・削除操作

### 2.6 ロードマップ閲覧
- [x] ロードマップ詳細ページ (`/roadmaps/:id`) — 読み取り専用表示
- [x] 非公開ロードマップのアクセス制御（所有者以外は 403）

---

## Phase 3: ソーシャル機能

### 3.1 いいね機能
- [x] `POST /api/roadmaps/:id/like` — いいね（TransactWriteItems で likeCount +1）
- [x] `DELETE /api/roadmaps/:id/like` — いいね取消（TransactWriteItems で likeCount -1）
- [x] いいね済みチェック（GetItem）
- [x] フロントエンド: いいねボタン（トグル UI + カウント表示）
- [x] いいね API のユニットテスト

### 3.2 ブックマーク機能
- [x] `POST /api/roadmaps/:id/bookmark` — ブックマーク
- [x] `DELETE /api/roadmaps/:id/bookmark` — ブックマーク取消
- [x] `GET /api/bookmarks` — 自分のブックマーク一覧
- [x] フロントエンド: ブックマークボタン（トグル UI）
- [x] ダッシュボードにブックマーク一覧タブ追加
- [x] ブックマーク API のユニットテスト

### 3.3 公開ロードマップ一覧・検索
- [x] `GET /api/roadmaps/explore` — 公開ロードマップ一覧（GSI2 Query）
- [x] クエリパラメータ対応（category, sort, limit, cursor）
- [x] カーソルベースページネーション実装
- [x] 探すページ (`/explore`) — カード形式の一覧表示
- [x] カテゴリフィルタ UI
- [x] ソート切り替え（新着順 / 人気順）
- [x] 無限スクロール or 「もっと見る」ボタン

### 3.4 トップページ
- [x] トップページ (`/`) — サービス紹介 + 人気ロードマップ表示
- [x] ユーザーページ (`/users/:id`) — 他ユーザーの公開ロードマップ一覧

### 3.5 プロフィール
- [x] プロフィール編集ページ (`/profile`)
- [x] 表示名、自己紹介、X ハンドル編集

---

## Phase 4: 共有・仕上げ

### 4.1 X 共有機能
- [x] X 共有ボタン（Web Intent URL 生成）
- [x] 共有テキストフォーマット実装

### 4.2 UI / UX 改善
- [x] レスポンシブデザイン対応（モバイル / タブレット）
- [x] ローディング状態の表示（スケルトン UI or スピナー）
- [x] トースト通知（保存成功、エラー等）
- [x] 空状態の表示（ロードマップ 0 件時のガイド表示）
- [x] 404 ページ

### 4.3 エラーハンドリング
- [x] API エラーのフロントエンド統一ハンドリング
- [x] バックエンドのバリデーション強化（制限値チェック）
- [x] ネットワークエラー時のリトライ / ユーザー通知

### 4.4 最終チェック
- [ ] 全 API エンドポイントの動作確認
- [ ] クロスブラウザ確認（Chrome, Safari, Firefox）
- [ ] Lighthouse でパフォーマンス確認
- [ ] セキュリティ確認（認可チェック漏れ、XSS、インジェクション）
- [ ] README.md 最終更新（セットアップ手順、デプロイ手順）

---

## Phase 5: 品質改善・残タスク

### 5.1 バックエンド テスト追加
- [x] handler 層のユニットテスト（user, roadmap, node, edge, like, bookmark）
- [ ] repository 層の統合テスト（DynamoDB Local 使用）
- [x] service 層の導入検討（現在ハンドラにロジックが直書き → MVP では現状維持、Repository インターフェース導入済み）

### 5.2 バックエンド コード品質
- [x] 定義済みバリデーション関数の実際の呼び出し（`validation.go` の関数が未使用）
- [x] `GetRoadmap` の `IsLiked`/`IsBookmarked` エラーハンドリング（現在エラーを無視）
- [x] ノード作成/更新時の追加バリデーション（Color の形式、URL の形式、PosX/PosY の範囲）
- [x] `UpdateRoadmapMeta` が PutItem を使用 → UpdateItem に変更（同時更新時のデータ消失防止）
- [x] カーソルデコード失敗時のエラーハンドリング改善（`cursor.go`）

### 5.3 フロントエンド テスト追加
- [x] 認証フローのテスト（サインアップ、ログイン、ログアウト）
- [ ] ダッシュボード・Explore ページのテスト
- [x] API クライアントのテスト

### 5.4 フロントエンド コード品質
- [x] Error Boundary コンポーネント追加（グローバルエラーハンドリング）
- [x] Cognito セッションリフレッシュ実装（トークン期限切れ対応）
- [x] 未保存変更時のページ離脱確認ダイアログ（エディタ）
- [x] サインアップのパスワードバリデーション強化（大文字・小文字・数字・記号チェック）
- [x] UserPage のユーザー公開ロードマップ取得を専用 API エンドポイントに変更（現在クライアント側フィルタリング）
- [x] Header にプロフィールページへのリンク追加
- [x] `VITE_COGNITO_DOMAIN` 環境変数が定義されているが未使用 → 削除

### 5.5 アクセシビリティ改善
- [x] NodeEditPanel / MetaEditPanel のフォーカス管理（開閉時）
- [x] モーダル/パネルの Escape キーで閉じる対応
- [x] インタラクティブ要素への aria-label 追加（エディタツールバー等）
- [x] フォームの label と input の紐づけ確認

### 5.6 インフラ・デプロイ
- [x] GitHub Actions の vars 設定（API_LAMBDA_NAME, S3_BUCKET_NAME, CLOUDFRONT_DISTRIBUTION_ID 等）→ README に設定手順を記載
- [x] Cognito ↔ Lambda 初回デプロイ時の循環依存対応手順の文書化

---

## Phase 6: クリティカルバグ修正

### 6.1 フロントエンド認証バグ
- [x] `authStore.initialize()` がアプリ起動時に呼ばれていない（`isLoading` が永遠に `true` → AuthGuard がスピナー表示のまま）
- [x] `getIdToken()` の非同期コールバック問題（`cognitoUser.getSession` がトークンリフレッシュ時に非同期になり `null` を返す → API 認証ヘッダが欠落する可能性）

### 6.2 バックエンド データ整合性
- [x] `main.go` の `json.Marshal` エラーが無視されている（L181: `body, _ := json.Marshal(...)` → レスポンスが空になる可能性）
- [x] `BookmarkRoadmap` の ConditionExpression が `PK` のみチェック（`attribute_not_exists(PK) AND attribute_not_exists(SK)` にすべき）
- [x] Repository 層のエラーラップ不足（`node_repo.go`, `edge_repo.go` で `fmt.Errorf` 未使用）

### 6.3 バックエンド 安全性
- [x] `postconfirmation/main.go` の `email` 属性が空の場合のバリデーション不足
- [x] CORS デフォルト値が `*`（ワイルドカード）→ 本番環境では明示的に設定を必須化

---

## Phase 7: セキュリティ強化

### 7.1 API セキュリティ
- [ ] API Gateway にスロットリング / レート制限設定追加
- [ ] API Gateway に WAF（Web Application Firewall）追加
- [ ] API Gateway のアクセスログ有効化（CloudWatch Logs）
- [ ] ヘルスチェックエンドポイント追加（`GET /health`）
- [ ] リクエスト ID をレスポンスヘッダとログに含める（トレーサビリティ）

### 7.2 Cognito セキュリティ
- [ ] MFA 設定追加（`OPTIONAL` 以上）
- [ ] アドバンスドセキュリティ機能の有効化（アカウント乗っ取り検知）

### 7.3 インフラセキュリティ
- [ ] S3 バケット暗号化（サーバーサイド暗号化設定）
- [ ] S3 バージョニング有効化（誤削除対策）
- [ ] CloudFront にセキュリティヘッダ追加（CSP, X-Frame-Options, X-Content-Type-Options）
- [ ] CloudFront に WAF 追加
- [ ] DynamoDB テーブル暗号化設定の明示

### 7.4 バックエンド バリデーション追加
- [ ] タグの一意性チェック・個別文字数制限（最大30文字）・空文字チェック
- [ ] カテゴリフィールドの文字数制限（最大50文字）
- [ ] Explore API の `limit` パラメータ上限バリデーション（1〜100）

---

## Phase 8: 可観測性（Observability）

### 8.1 ログ強化
- [ ] バックエンドに構造化ログ導入（`log/slog` 等）
- [ ] API リクエスト/レスポンスログ（メソッド、パス、ステータスコード、レイテンシ）
- [ ] 認可失敗・エラー発生時の警告ログ
- [ ] CloudFront アクセスログ有効化
- [ ] S3 アクセスログ有効化

### 8.2 監視・アラート
- [ ] CloudWatch アラーム設定（Lambda エラー率、DynamoDB スロットリング、API Gateway 5xx）
- [ ] Lambda に X-Ray トレーシング有効化
- [ ] API Gateway に X-Ray トレーシング有効化

---

## Phase 9: インフラ改善

### 9.1 Terraform 状態管理
- [ ] Terraform リモートバックエンド設定（S3 + DynamoDB ロック）
- [ ] dev/prod 環境分離（環境別 state ファイル）
- [ ] prod 用 `terraform.tfvars` 作成

### 9.2 Lambda 改善
- [ ] Lambda に Dead Letter Queue（DLQ）設定
- [ ] Lambda の予約同時実行数設定
- [ ] Lambda のメモリ・タイムアウトを環境変数で設定可能に

### 9.3 CI/CD 改善
- [ ] CI に `terraform validate` / `terraform fmt --check` 追加
- [ ] CI にセキュリティスキャン追加（`gosec`, `trivy` 等）
- [ ] CI にコードカバレッジレポート追加
- [ ] Deploy ワークフローに手動承認ゲート追加（本番デプロイ時）
- [ ] Deploy 失敗時の通知設定（Slack or メール）
- [ ] Deploy ワークフローにロールバック戦略追加

### 9.4 その他インフラ
- [ ] S3 ライフサイクルポリシー設定（古いバージョンの自動削除）
- [ ] CloudFront キャッシュポリシーを最新方式に変更（`forwarded_values` → `cache_policy_id`）
- [ ] CORS プリフライトに `Access-Control-Max-Age` ヘッダ追加（ブラウザキャッシュ）

---

## Phase 10: フロントエンド品質改善

### 10.1 テスト追加
- [ ] ダッシュボードページのテスト
- [ ] Explore ページのテスト
- [ ] エディタコンポーネントのテスト（React Flow 操作含む）
- [ ] プロフィールページのテスト
- [ ] ログイン/サインアップページのテスト
- [ ] EditorStore のテスト

### 10.2 パフォーマンス改善
- [ ] `RoadmapCard` の `React.memo` ラップ
- [ ] エディタ内のコールバック関数に `useCallback` 追加（`handleNodeClick`, `handlePaneClick`）
- [ ] コード分割（React.lazy）によるバンドルサイズ削減（エディタページ等）

### 10.3 UX 改善
- [ ] エラー表示に「再試行」ボタン追加（RoadmapDetailPage 等）
- [ ] 削除操作を「取り消し付きトースト」に変更（`confirm()` ダイアログ置き換え）
- [ ] X ハンドルのフォーマットバリデーション（`@` なしのユーザー名形式）
- [ ] SignupPage のパスワードエラーに `aria-describedby` 追加

### 10.4 SEO 対策
- [ ] `react-helmet-async` 導入（ページごとの title/meta タグ設定）
- [ ] OGP メタタグ追加（ロードマップ共有時のプレビュー表示）

---

## Phase 11: 残テスト・最終チェック

### 11.1 バックエンド テスト
- [ ] Repository 層の統合テスト（DynamoDB Local 使用）
- [ ] カーソルページネーションのエッジケーステスト（空結果、最終ページ、不正カーソル）
- [ ] 大量バッチ操作テスト（100ノード一括更新）

### 11.2 最終チェック（Phase 4.4 再掲）
- [ ] 全 API エンドポイントの動作確認
- [ ] クロスブラウザ確認（Chrome, Safari, Firefox）
- [ ] Lighthouse でパフォーマンス確認
- [ ] セキュリティ確認（認可チェック漏れ、XSS、インジェクション）
- [ ] README.md 最終更新（セットアップ手順、デプロイ手順）
