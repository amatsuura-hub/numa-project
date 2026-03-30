# infra/CLAUDE.md — インフラ開発ガイド

## 構成

```
infra/
├── main.tf              # モジュール呼び出し + CloudFront WAF (us-east-1)
├── variables.tf         # ルート変数 (environment, project_name, aws_region, domain_name, cloudfront_waf_rate_limit)
├── outputs.tf           # 主要出力値
├── backend.tf           # S3 + DynamoDB リモートステート (コメントで有効化手順記載)
├── terraform.tfvars     # デフォルト値 (dev)
├── environments/
│   ├── dev/terraform.tfvars.example
│   └── prod/terraform.tfvars
└── modules/
    ├── dynamodb/        # シングルテーブル + GSI1/GSI2/GSI3
    ├── cognito/         # ユーザープール + クライアント + PostConfirmation トリガー
    ├── s3_cloudfront/   # S3 (フロントエンド + ログ) + CloudFront + OAC + セキュリティヘッダー
    ├── lambda/          # API Lambda + PostConfirmation Lambda + IAM + DLQ + ログ
    ├── api_gateway/     # REST API + Cognito Authorizer + WAF + CORS + ステージ
    ├── monitoring/      # CloudWatch アラーム + SNS 通知
    └── dns/             # Route 53 + ACM (現在無効)
```

## Terraform バージョン

- Terraform >= 1.5.0
- AWS Provider ~> 5.0
- リージョン: `ap-northeast-1` (メイン) + `us-east-1` (CloudFront WAF・ACM)

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
- **WAF** (REGIONAL): `AWSManagedRulesCommonRuleSet` + レート制限 (デフォルト 2000/5分)
- **スロットリング**: burst=50, rate=100 (デフォルト)
- **X-Ray**: ステージレベルで有効
- **ログ**: CloudWatch に詳細アクセスログ (30 日保持)

### monitoring
- **CloudWatch アラーム**: Lambda エラー (>5)、DynamoDB スロットル (>0)、API Gateway 5xx (>5)、4xx (>50)、DLQ メッセージ (>0)
- **SNS トピック**: アラーム通知先。`alert_email` 設定時はメールサブスクリプション追加

### dns (現在無効)
- Route 53 ゾーン + ACM 証明書 (CloudFront 用 us-east-1 + API 用 ap-northeast-1)
- カスタムドメイン: フロントエンド `domain_name` → CloudFront、API `api.domain_name` → API Gateway

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

## 注意事項

- **リモートステート**: `backend.tf` にリソース定義済み。有効化は S3 バケット作成後にコメント解除 → `terraform init -migrate-state`
- **`.terraform.lock.hcl`**: Git にコミットする（.gitignore から除外済み）
- **CloudFront WAF**: `us-east-1` プロバイダで作成する必要がある（CloudFront の制約）
- **Lambda デプロイ**: 初回は placeholder zip。CI/CD で実バイナリに置換される
- **DNS モジュール**: 本番でカスタムドメインが必要な場合に `main.tf` のコメントを解除して有効化
- **手動ロールバック**: deploy.yml で旧バージョンを保存しているため、`aws lambda update-function-code --zip-file` で復元可能
