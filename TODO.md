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
