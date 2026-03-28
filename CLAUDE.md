# CLAUDE.md — Numa プロジェクト開発ガイド

## プロジェクト概要

Numa（沼）は、熟練者が初心者向けにマインドマップ形式のロードマップを作成・公開・共有するWebアプリケーション。
詳細仕様は `numa-spec.md` を参照。

## 技術スタック

### フロントエンド
- React 18 + TypeScript
- Vite (ビルドツール)
- React Flow (マインドマップ描画)
- Tailwind CSS (スタイリング)
- Zustand (状態管理)
- React Router v6 (ルーティング)
- amazon-cognito-identity-js (認証)

### バックエンド
- Go 1.22
- aws-lambda-go (Lambda ハンドラ)
- aws-sdk-go-v2 (AWS SDK)
- ランタイム: provided.al2023

### インフラ
- AWS サーバーレス (CloudFront + S3, API Gateway, Lambda, DynamoDB, Cognito)
- Terraform (IaC)
- リージョン: ap-northeast-1 (東京)
- MVP ではカスタムドメインなし（CloudFront デフォルトドメインを使用）

### CI/CD
- GitHub Actions

## ディレクトリ構成

```
numa-project/
├── CLAUDE.md
├── numa-spec.md
├── frontend/          # React SPA
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── stores/       # Zustand stores
│   │   ├── api/          # API クライアント
│   │   ├── types/
│   │   └── utils/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
├── backend/           # Go Lambda
│   ├── cmd/
│   │   └── api/
│   │       └── main.go
│   ├── internal/
│   │   ├── handler/
│   │   ├── model/
│   │   ├── repository/
│   │   ├── service/
│   │   └── middleware/
│   ├── go.mod
│   └── Makefile
├── infra/             # Terraform
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── modules/
│   │   ├── s3_cloudfront/
│   │   ├── api_gateway/
│   │   ├── lambda/
│   │   ├── dynamodb/
│   │   └── cognito/
│   └── environments/
│       ├── dev/
│       └── prod/
├── .github/
│   └── workflows/
│       ├── ci.yml         # lint + test
│       └── deploy.yml     # デプロイ
└── docker-compose.yml     # DynamoDB Local
```

## ローカル開発環境

### 前提ツール
- Go 1.22+
- Node.js 20 LTS
- Docker (DynamoDB Local 用)
- Terraform 1.5+
- AWS CLI v2

### DynamoDB Local
```bash
# 起動
docker compose up -d dynamodb-local

# テーブル作成（初回のみ）
aws dynamodb create-table \
  --endpoint-url http://localhost:8000 \
  --table-name dev-numa-main \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
    AttributeName=GSI1PK,AttributeType=S \
    AttributeName=GSI1SK,AttributeType=S \
    AttributeName=GSI2PK,AttributeType=S \
    AttributeName=GSI2SK,AttributeType=S \
    AttributeName=GSI3PK,AttributeType=S \
    AttributeName=GSI3SK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes \
    '[{"IndexName":"GSI1","KeySchema":[{"AttributeName":"GSI1PK","KeyType":"HASH"},{"AttributeName":"GSI1SK","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},{"IndexName":"GSI2","KeySchema":[{"AttributeName":"GSI2PK","KeyType":"HASH"},{"AttributeName":"GSI2SK","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},{"IndexName":"GSI3","KeySchema":[{"AttributeName":"GSI3PK","KeyType":"HASH"},{"AttributeName":"GSI3SK","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' \
  --billing-mode PAY_PER_REQUEST
```

### フロントエンド
```bash
cd frontend
npm install
npm run dev          # 開発サーバー起動 (localhost:5173)
npm run build        # プロダクションビルド
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # Vitest
```

### バックエンド
```bash
cd backend
go mod tidy
make build           # ビルド（Linux向けバイナリ）
make test            # テスト実行
make lint            # golangci-lint
```

## ブランチ戦略 (Trunk-based)

- `main` — 常にデプロイ可能な状態を維持
- `feature/<機能名>` — 機能開発ブランチ（main から分岐、main へ PR マージ）
- `fix/<修正名>` — バグ修正ブランチ
- PR マージは Squash merge を推奨
- マージ前に CI (lint + test) を必ず通す

## コーディング規約

### Go
- golangci-lint を使用（設定は `.golangci.yml`）
- テーブル駆動テスト (table-driven tests) を基本とする
- エラーは `fmt.Errorf("context: %w", err)` でラップ
- ハンドラは薄く、ロジックは service 層に置く
- DynamoDB アクセスは repository 層に閉じ込める

### TypeScript / React
- ESLint + Prettier でフォーマット統一
- コンポーネントは関数コンポーネント + hooks
- 型定義は `src/types/` に集約
- API クライアントは `src/api/` に集約
- Vitest + React Testing Library でコンポーネントテスト

### 共通
- コミットメッセージは英語、conventional commits 形式: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`
- 1 PR = 1 機能/修正を原則とする

## テスト方針 (MVP)

### バックエンド (Go)
- ユニットテスト: service 層のロジックをテーブル駆動テストで検証
- 統合テスト: DynamoDB Local を使用して repository 層をテスト
- カバレッジ目標: 主要ロジックの 80%+

### フロントエンド (React)
- Vitest + React Testing Library
- 重要なコンポーネント（エディタ、認証フロー）のテストを優先
- E2E テストは MVP では省略

## 制限値 (MVP)

| 項目 | 上限 |
|------|------|
| ロードマップあたりのノード数 | 100 |
| ロードマップあたりのエッジ数 | 200 |
| タイトル文字数 | 100 |
| ノードラベル文字数 | 50 |
| ノード説明文字数 | 500 |
| ロードマップ説明文字数 | 1000 |
| ユーザーあたりのロードマップ数 | 50 |
| タグ数/ロードマップ | 5 |

## GitHub Actions (CI)

### ci.yml (PR時に実行)
1. Go: `golangci-lint run` → `go test ./...`
2. Frontend: `npm run lint` → `npm run test`

### deploy.yml (main マージ時に実行)
1. Go: ビルド → Lambda デプロイ
2. Frontend: ビルド → S3 アップロード → CloudFront キャッシュ無効化
3. Infra: `terraform plan` → 手動承認 → `terraform apply`

## 開発フェーズ (MVP)

### Phase 1: 基盤構築
- Terraform でインフラ構築 (DynamoDB, Cognito, S3, CloudFront, API Gateway, Lambda)
- Go Lambda の Hello World デプロイ
- API Gateway + Cognito Authorizer 設定
- フロントエンド プロジェクト初期化 (Vite + React + TypeScript + Tailwind)
- Cognito 認証フロー実装

### Phase 2: コア CRUD
- ユーザープロフィール API
- ロードマップ CRUD API
- ノード・エッジ CRUD API
- マインドマップエディタ (React Flow)
- ロードマップ保存・読み込み

### Phase 3: ソーシャル機能
- いいね機能
- ブックマーク機能
- 公開ロードマップ一覧・検索
- カテゴリフィルタリング

### Phase 4: 共有・仕上げ
- X 共有機能 (Web Intent)
- レスポンシブデザイン
- エラーハンドリング強化

## 重要な設計判断

- **DynamoDB シングルテーブル設計**: 全エンティティを `numa-main` テーブルに格納。アクセスパターンは `numa-spec.md` セクション5参照
- **Cognito Authorizer**: API Gateway レベルで JWT 検証。Lambda 内で `sub` claim からユーザーID取得
- **いいねカウント**: TransactWriteItems でアトミックに更新（整合性保証）
- **GSI設計**: GSI1(ユーザー別一覧), GSI2(公開フィード/カテゴリ別), GSI3(ブックマーク逆引き)
- **自動保存**: エディタ編集中は 2 秒 debounce で API に保存
