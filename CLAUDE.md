# CLAUDE.md — Numa 開発ガイド

## プロジェクト概要

Numa（沼）— マインドマップ形式のロードマップ作成・共有アプリ。緑の沼テーマで、深さ（色の濃さ）が学習の深度を表現。

## 技術スタック

- **FE**: React 18 + TypeScript + Vite + Tailwind CSS + React Flow + Zustand + React Router v6 + amazon-cognito-identity-js
- **BE**: Go 1.22 + aws-lambda-go + aws-sdk-go-v2 (provided.al2023)
- **Infra**: AWS サーバーレス (CloudFront+S3, API Gateway+WAF, Lambda, DynamoDB, Cognito, Route 53, ACM) + Terraform
- **CI/CD**: GitHub Actions (lint + test + security scan + deploy + rollback)
- **監視**: CloudWatch アラーム + X-Ray + 構造化ログ (slog)

## ローカル開発

```bash
# DynamoDB Local
docker compose up -d dynamodb-local

# フロントエンド
cd frontend && npm install && npm run dev    # localhost:5173
npm run build / lint / format / test

# バックエンド
cd backend && go mod tidy
make build / test / lint
```

## コーディング規約

- **Go**: golangci-lint, テーブル駆動テスト, `fmt.Errorf("context: %w", err)`, ハンドラは薄く repository 層に DB アクセスを閉じ込め
- **TS/React**: ESLint + Prettier, 関数コンポーネント + hooks, 型は `src/types/`, API は `src/api/`
- **共通**: コミットは英語 conventional commits (`feat:`, `fix:`, `chore:` 等), 1 PR = 1 機能

## テーマ・デザイン

- カラーパレット: 緑基調の沼テーマ（`numa-50` #f0fdf4 〜 `numa-900` #14532d）
- ノードの色 = 沼の深さ（浅い #bbf7d0 → 深い #14532d、8段階）
- デフォルトカラー: `#16a34a`
- 装飾: 生物シルエット（カエル・魚・亀）、泡アニメーション

## 主要機能

### ロードマップ CRUD
- 作成・編集・削除・公開/非公開切り替え
- React Flow によるマインドマップエディタ（ノード・エッジの追加/編集/削除）
- 自動保存（2秒 debounce）、一括ノード更新（batch API）

### ソーシャル機能
- いいね（TransactWriteItems でアトミック更新）
- ブックマーク
- X(Twitter) 共有（Web Intent）
- ユーザープロフィール

### 進捗トラッキング（沼レベル）
- ログインユーザーがロードマップのノードをクリックで完了/未完了を切り替え
- 沼レベル 0〜5（沼の入口 → 完全に沼）で進捗を可視化
- DynamoDB: `PK=USER#<userId>, SK=PROGRESS#<roadmapId>`, completedNodes は StringSet
- API: `GET/PUT/DELETE /api/roadmaps/:id/progress/nodes/:nodeId`, `GET /api/progress`
- ダッシュボードに「進捗中」タブ、詳細ページに進捗ダッシュボード表示

### OGP 対応
- `/api/ogp/:roadmapId` で bot 向け HTML（og:title, og:description 等）を返却
- `robots.txt`, `sitemap.xml` を `frontend/public/` に配置
- CloudFront Functions は使わずシンプルな Lambda ハンドラ方式

### カテゴリ（16種）
プログラミング / Web開発 / AI・機械学習 / デザイン / 音楽 / DTM・作曲 / ゲーム / 料理 / フィットネス / 語学 / ビジネス / 投資・資産運用 / 写真・映像 / ハンドメイド・DIY / 数学・科学 / 趣味・その他

## 重要な設計判断

- **DynamoDB シングルテーブル設計**: GSI1(ユーザー別), GSI2(公開フィード/カテゴリ別), GSI3(ブックマーク逆引き)
- **Cognito Authorizer**: API Gateway で JWT 検証、Lambda 内で `sub` → userID
- **いいねカウント**: TransactWriteItems でアトミック更新
- **自動保存**: エディタ編集中は 2秒 debounce
- **進捗トラッキング**: DynamoDB UpdateItem の ADD/DELETE（StringSet）でアトミックに completedNodes を更新、NumaLevel は完了率から自動計算
- **セキュリティ**: WAF (API Gateway + CloudFront), MFA (optional), S3 暗号化+バージョニング, CORS 本番は明示的オリジン必須

## API エンドポイント一覧

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | /api/health | 不要 | ヘルスチェック |
| GET/PUT | /api/users/me | 必須 | 自分のプロフィール |
| GET | /api/users/:id | 不要 | ユーザープロフィール |
| GET | /api/users/:id/roadmaps | 不要 | ユーザーの公開ロードマップ |
| POST | /api/roadmaps | 必須 | ロードマップ作成 |
| GET | /api/roadmaps/my | 必須 | マイロードマップ一覧 |
| GET | /api/roadmaps/explore | 不要 | 公開ロードマップ検索 |
| GET/PUT/DELETE | /api/roadmaps/:id | 混合 | ロードマップ詳細/更新/削除 |
| POST/PUT/DELETE | /api/roadmaps/:id/nodes/* | 必須 | ノード操作 |
| PUT | /api/roadmaps/:id/nodes/batch | 必須 | ノード一括更新 |
| POST/DELETE | /api/roadmaps/:id/edges/* | 必須 | エッジ操作 |
| POST/DELETE | /api/roadmaps/:id/like | 必須 | いいね |
| POST/DELETE | /api/roadmaps/:id/bookmark | 必須 | ブックマーク |
| GET | /api/bookmarks | 必須 | ブックマーク一覧 |
| GET | /api/roadmaps/:id/progress | 必須 | 進捗取得 |
| PUT | /api/roadmaps/:id/progress/nodes/:nodeId | 必須 | ノード完了 |
| DELETE | /api/roadmaps/:id/progress/nodes/:nodeId | 必須 | ノード未完了に戻す |
| GET | /api/progress | 必須 | 自分の全進捗一覧 |
| GET | /api/ogp/:id | 不要 | OGP メタタグ HTML |
