# infra/CLAUDE.md — インフラ開発ガイド

> Terraform モジュール構成・CI/CD ワークフロー・AWS リソース詳細をまとめる。横断ルールは [CLAUDE.md](../CLAUDE.md)、外部向け情報は [README.md](../README.md) を参照。

## 構成

```
infra/
├── main.tf              # モジュール呼び出し (DNS は domain_name 非空時のみ有効化)
├── variables.tf         # ルート変数 (environment, project_name, aws_region, domain_name)
├── outputs.tf           # 主要出力値 (DNS 有効時は dns_name_servers, frontend_url, api_custom_domain_url)
├── backend.tf           # S3 + DynamoDB リモートステート (コメントで有効化手順記載)
├── terraform.tfvars     # デフォルト値 (dev, ドメインなし)
├── environments/
│   ├── dev/
│   │   ├── backend.hcl
│   │   └── terraform.tfvars.example
│   └── prod/
│       ├── backend.hcl
│       └── terraform.tfvars  # domain_name = "numa-roadmap.com"
└── modules/
    ├── dynamodb/        # シングルテーブル + GSI1/GSI2/GSI3
    ├── cognito/         # ユーザープール + クライアント + PostConfirmation トリガー
    ├── s3_cloudfront/   # S3 (フロントエンド + ログ) + CloudFront + OAC + セキュリティヘッダー (aliases / ACM 対応)
    ├── lambda/          # API Lambda + PostConfirmation Lambda + IAM + DLQ + ログ
    ├── api_gateway/     # REST API + Cognito Authorizer + CORS + スロットリング + ステージ
    ├── monitoring/      # CloudWatch アラーム + SNS 通知
    └── dns/             # Route 53 ゾーン + ACM (CloudFront:us-east-1 / API:regional) + API Gateway カスタムドメイン
```

## Terraform バージョン

- Terraform >= 1.5.0
- AWS Provider ~> 5.0
- リージョン: `ap-northeast-1` (メイン) + `us-east-1` (CloudFront 用 ACM 証明書)

## 命名規則

リソース名は `${local.prefix}-<resource>` 形式:
- `local.prefix` = `"${var.environment}-${var.project_name}"` (例: `dev-numa`)
- テーブル: `dev-numa-main`
- Lambda: `dev-numa-api`, `dev-numa-post-confirmation`
- API Gateway: `dev-numa-api`
- S3: `dev-numa-frontend`, `dev-numa-logs`
- Cognito: `dev-numa-user-pool`, `dev-numa-client`
- SNS: `dev-numa-alarms`
- SQS DLQ: `dev-numa-api-dlq`

## モジュール詳細

### dynamodb
- **テーブル**: `${prefix}-main` (PAY_PER_REQUEST)
- **キー**: PK (String) + SK (String)
- **GSI**: GSI1 (GSI1PK/GSI1SK), GSI2 (GSI2PK/GSI2SK), GSI3 (GSI3PK/GSI3SK) — すべて ALL projection
- **機能**: Point-in-time recovery 有効、サーバーサイド暗号化有効
- **TTL**: コメントアウト済み（将来 `ExpiresAt` 属性で有効化予定）

### cognito
- **ユーザープール**: メール認証、MFA=OPTIONAL (TOTP)
- **パスワードポリシー**: 8 文字以上、大文字・小文字・数字・記号必須
- **トークン有効期限**: アクセス/ID = 1 時間、リフレッシュ = 30 日
- **認証フロー**: ALLOW_USER_SRP_AUTH, ALLOW_REFRESH_TOKEN_AUTH
- **PostConfirmation**: Lambda トリガー（条件付き設定）

### s3_cloudfront
- **フロントエンド S3**: 暗号化 (AES256)、バージョニング有効、30 日で非現行バージョン削除
- **ログ S3**: 90 日でログ期限切れ
- **CloudFront**: HTTP/2+3、IPv6、OAC アクセス、SPA ルーティング (403/404 → index.html)
- **カスタムドメイン**: `aliases` + `acm_certificate_arn` (us-east-1) が設定されていれば SNI / TLSv1.2_2021 で適用。未設定時は CloudFront 既定証明書 (`*.cloudfront.net`)
- **セキュリティヘッダー**: HSTS, X-Content-Type-Options, X-Frame-Options (DENY), XSS-Protection, Referrer-Policy, CSP
- **CSP 注意**: `style-src 'unsafe-inline'` は Tailwind CSS のランタイムスタイル挿入に必要なため許容

### lambda
- **API Lambda**: provided.al2023、メモリ 256MB (設定可)、タイムアウト 30 秒、X-Ray 有効、DLQ (SQS) 付き
- **PostConfirmation Lambda**: provided.al2023、メモリ 128MB、タイムアウト 10 秒
- **IAM**: DynamoDB (GetItem, PutItem, UpdateItem, DeleteItem, Query, BatchWriteItem, BatchGetItem) + SQS DLQ + CloudWatch + X-Ray
- **ログ保持**: 30 日
- **Reserved Concurrency**: デフォルト -1 (無制限)、推奨値は tfvars.example 参照

### api_gateway
- **REST API** + `{proxy+}` リソース (ANY メソッド → Lambda プロキシ統合)
- **Cognito Authorizer**: `method.request.header.Authorization` から JWT 検証
- **OPTIONS**: MOCK 統合で CORS プリフライト応答
- **スロットリング**: burst=50, rate=100 (デフォルト)。WAF はコスト削減のため廃止済み
- **X-Ray**: ステージレベルで有効
- **ログ**: CloudWatch に詳細アクセスログ (30 日保持)
- **再デプロイ トリガー**: `aws_api_gateway_deployment.triggers` の hash には `aws_api_gateway_method`, `aws_api_gateway_integration`, `aws_api_gateway_method_response`, `aws_api_gateway_integration_response` を全て含める。response 系を漏らすと CORS origin 変更など response 変数の差分があってもステージに配備されず、古いレスポンスが返り続ける

### monitoring
- **CloudWatch アラーム**: Lambda エラー (>5)、DynamoDB スロットル (>0)、API Gateway 5xx (>5)、4xx (>50)、DLQ メッセージ (>0)
- **SNS トピック**: アラーム通知先。`alert_email` 設定時はメールサブスクリプション追加

### dns (`var.domain_name` 非空時のみ有効)
- Route 53 ゾーン + ACM 証明書 (CloudFront 用 us-east-1 + API 用 regional)
- カスタムドメイン: フロントエンド `domain_name` → CloudFront、API `api.domain_name` → API Gateway
- prod では `domain_name = "numa-roadmap.com"` を `environments/prod/terraform.tfvars` で設定
- 初回 apply 後、`terraform output dns_name_servers` で取得した NS レコードをドメインレジストラ側に登録する必要あり

## CI/CD ワークフロー

### ci.yml (PR → main)
1. **backend**: go mod tidy チェック → golangci-lint → gosec → test + coverage → build
2. **frontend**: npm ci → npm audit → lint → test → build
3. **terraform**: fmt check → init (-backend=false) → validate

### deploy.yml (push → main)
1. **ci-backend** / **ci-frontend**: テスト
2. **validate-env**: 必須変数チェック (API_LAMBDA_NAME, POST_CONFIRMATION_LAMBDA_NAME, S3_BUCKET_NAME, CLOUDFRONT_DISTRIBUTION_ID, VITE_API_URL)
3. **deploy-backend**: ビルド → 旧バージョン保存 → Lambda 更新 (api + postconfirmation)
4. **deploy-frontend**: ビルド → S3 sync → CloudFront invalidation
5. **smoke-test**: `/api/health` エンドポイント疎通確認
6. **notify-on-failure**: 失敗時通知

### deploy-prod.yml (手動実行)
- `confirm: "deploy"` 入力必須
- `environment: production` で backend + frontend デプロイ
- **失敗時通知**: notify-on-failure ジョブ

## 環境ファイルの運用ルール

現状、実稼働インフラは root 直下の `infra/terraform.tfvars`（`environment = "dev"` 命名だが本番相当として使用）で管理している。`environments/` ディレクトリは将来の dev / prod 完全分離に備えた雛形。

| 目的 | 実行コマンド（`infra/` 直下） |
|------|-----|
| 現稼働環境（デフォルト dev 命名）を apply | `terraform apply`（root `terraform.tfvars` が自動適用される） |
| 将来 prod を別 state で切り出す場合 | `terraform init -backend-config=environments/prod/backend.hcl -reconfigure` → `terraform apply -var-file=environments/prod/terraform.tfvars` |
| ローカル開発者の初期化 | `environments/dev/terraform.tfvars.example` を root `terraform.tfvars` にコピーして値を調整 |

`terraform.tfvars` と `environments/*/terraform.tfvars` は **`.gitignore` で除外**。`backend.hcl` と `terraform.tfvars.example` だけがリポジトリにコミットされる。

## 注意事項

- **リモートステート**: state bucket `numa-terraform-state`（バージョニング + SSE 有効）と lock table `numa-terraform-lock` は 2026-04-16 の Phase 1 apply で **bootstrap 完了済み**。`backend.tf` の `backend "s3"` ブロックはまだコメントアウトのままで、state は local ファイル (`infra/terraform.tfstate`) 管理。有効化は backend ブロックのコメント解除 → `terraform init -backend-config=environments/dev/backend.hcl -migrate-state` で S3 に移行する（未実施。TODO.md 4 節参照）
- **`.terraform.lock.hcl`**: Git にコミットする（.gitignore から除外済み）
- **CloudFront 用 ACM 証明書**: `us-east-1` プロバイダで作成する必要がある（CloudFront の制約）
- **Lambda デプロイ**: 初回は placeholder zip。CI/CD で実バイナリに置換される
- **DNS モジュール**: `var.domain_name` 非空時のみ `count=1` で有効化。dev は既定の CloudFront/API Gateway ドメインをそのまま使用
- **NS レコード登録**: 初回 apply 後にレジストラ側へ Route 53 NS を設定（Terraform 管理外の手動作業）
- **手動ロールバック**: deploy.yml で旧バージョンを保存しているため、`aws lambda update-function-code --zip-file` で復元可能
