# Numa — ロードマップ作成＆共有アプリ

熟練者が初心者向けにマインドマップ形式のロードマップを作成・公開・共有するWebアプリケーション。

## 技術スタック

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + React Flow
- **Backend**: Go 1.22 + AWS Lambda
- **Database**: DynamoDB (シングルテーブル設計)
- **Auth**: Amazon Cognito
- **Infra**: Terraform + AWS サーバーレス
- **CI/CD**: GitHub Actions

## セットアップ

### 前提ツール

- Go 1.22+
- Node.js 20 LTS
- Docker
- Terraform 1.5+
- AWS CLI v2

### ローカル開発

```bash
# DynamoDB Local 起動
docker compose up -d

# フロントエンド
cd frontend
npm install
npm run dev

# バックエンド
cd backend
go mod tidy
make build
make test
```

### テーブル作成（初回のみ）

```bash
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

## 開発コマンド

| コマンド | 説明 |
|---------|------|
| `docker compose up -d` | DynamoDB Local 起動 |
| `cd frontend && npm run dev` | フロントエンド開発サーバー |
| `cd frontend && npm run lint` | ESLint |
| `cd frontend && npm run format` | Prettier |
| `cd frontend && npm run test` | Vitest |
| `cd backend && make build` | Go ビルド |
| `cd backend && make test` | Go テスト |
| `cd backend && make lint` | golangci-lint |

## デプロイ

### GitHub Actions の設定

以下の **Secrets** をリポジトリの Settings > Secrets and variables > Actions に設定:

| Secret | 説明 |
|--------|------|
| `AWS_ACCESS_KEY_ID` | デプロイ用 IAM ユーザーのアクセスキー |
| `AWS_SECRET_ACCESS_KEY` | デプロイ用 IAM ユーザーのシークレットキー |

以下の **Variables** を同画面の Variables タブに設定:

| Variable | 説明 | 例 |
|----------|------|-----|
| `API_LAMBDA_NAME` | API Lambda 関数名 | `dev-numa-api` |
| `POST_CONFIRMATION_LAMBDA_NAME` | Cognito トリガー Lambda 関数名 | `dev-numa-post-confirmation` |
| `S3_BUCKET_NAME` | フロントエンド用 S3 バケット名 | `dev-numa-frontend` |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront ディストリビューション ID | `E1234567890ABC` |
| `VITE_API_URL` | API Gateway URL | `https://xxx.execute-api.ap-northeast-1.amazonaws.com/dev` |
| `VITE_COGNITO_USER_POOL_ID` | Cognito User Pool ID | `ap-northeast-1_xxxxxxxxx` |
| `VITE_COGNITO_CLIENT_ID` | Cognito App Client ID | `xxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `VITE_CLOUDFRONT_URL` | CloudFront URL | `https://dxxxxxxxxxx.cloudfront.net` |

### Terraform 初回デプロイ手順

Cognito と Lambda の間に循環依存があるため、初回デプロイは2段階で行う:

```bash
cd infra

# 1. Cognito モジュールの post_confirmation_lambda_arn を空にして適用
#    infra/main.tf の cognito モジュール呼び出しで
#    post_confirmation_lambda_arn = "" に一時変更
terraform plan
terraform apply

# 2. Lambda ARN が生成された後、元に戻して再適用
#    post_confirmation_lambda_arn = module.lambda.post_confirmation_arn に戻す
terraform plan
terraform apply
```

2回目以降は `terraform apply` 一発で OK。
