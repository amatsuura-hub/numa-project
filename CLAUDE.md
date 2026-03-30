# CLAUDE.md — Numa プロジェクト

## プロジェクト概要

Numa（沼）— 熟練者が初心者向けにマインドマップ形式のロードマップを作成・公開・共有するサービス。緑の沼テーマで、ノードの色の濃さが学習の深度を表現する。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | React 18 + TypeScript + Vite 5 + Tailwind CSS 3 + @xyflow/react 12 + Zustand 4 + React Router v6 + amazon-cognito-identity-js |
| バックエンド | Go 1.22 + aws-lambda-go + aws-sdk-go-v2 (runtime: provided.al2023) |
| インフラ | AWS サーバーレス (CloudFront + S3, API Gateway + WAF, Lambda, DynamoDB, Cognito) + Terraform >= 1.5 |
| CI/CD | GitHub Actions (ci.yml / deploy.yml / deploy-prod.yml) |
| 監視 | CloudWatch アラーム + X-Ray + 構造化ログ (slog) + SNS 通知 |

## ディレクトリ構成

```
numa-project/
├── frontend/          # React SPA（詳細は frontend/CLAUDE.md）
├── backend/           # Go Lambda（詳細は backend/CLAUDE.md）
├── infra/             # Terraform（詳細は infra/CLAUDE.md）
├── .github/workflows/ # CI/CD パイプライン
├── docker-compose.yml # DynamoDB Local
└── TODO.md            # 課題管理
```

## ローカル開発コマンド

```bash
# DynamoDB Local 起動
docker compose up -d dynamodb-local    # localhost:8000

# フロントエンド
cd frontend
npm install          # 依存インストール
npm run dev          # 開発サーバー (localhost:5173)
npm run build        # プロダクションビルド (tsc -b && vite build)
npm run lint         # ESLint
npm run format       # Prettier 整形
npm run format:check # Prettier チェック
npm run test         # Vitest 実行
npm run test:watch   # Vitest ウォッチモード

# バックエンド
cd backend
go mod tidy          # 依存整理
make build           # Linux amd64 バイナリ (bin/bootstrap)
make test            # go test ./... -v -count=1
make lint            # golangci-lint run ./...
make clean           # bin/ 削除
make deploy          # build + zip + Lambda 更新
```

## コーディング規約

- **コミット**: 英語 conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`)
- **PR**: 1 PR = 1 機能。タイトルは 70 文字以内
- **Go**: golangci-lint 準拠。テーブル駆動テスト。エラーは `fmt.Errorf("context: %w", err)` でラップ。ハンドラは薄く、DB アクセスは repository 層に閉じ込め
- **TypeScript/React**: ESLint + Prettier 準拠。関数コンポーネント + hooks。型定義は `src/types/`、API 呼び出しは `src/api/`

## テーマ・デザイン

- **コンセプト**: 緑の沼。ノードの色が濃いほど学習の深みを表す
- **Tailwind カスタムカラー**: `numa-50` (#f0fdf4) 〜 `numa-900` (#14532d) + `swamp-50` 〜 `swamp-900`
- **背景色**: `numa-bg` (#ede6d8), `numa-bg-warm` (#e4dbc8)
- **テキスト**: `numa-text` (#252018), `numa-text-muted` (#6a6050), `numa-text-hint` (#9a9080)
- **ノード色**: 8 段階 (`NODE_COLORS` in `src/constants/depth.ts`): #bbf7d0 → #14532d
- **デフォルトノード色**: `DEFAULT_NODE_COLOR` = `#16a34a`
- **深度カラー**: 5 段階 (`DEPTH_COLORS`): #e8dfc8 → #2d5a32
- **フォント**: M PLUS Rounded 1c
- **装飾**: 生物シルエット（カエル・魚・亀）、泡アニメーション

## 主要機能

### ロードマップ CRUD
- 作成・編集・削除・公開/非公開切り替え
- @xyflow/react によるマインドマップエディタ（ノード・エッジの追加/編集/削除）
- 自動保存（2 秒 debounce）、ノード一括更新 (`/nodes/batch`)
- 離脱警告 (`beforeunload`)

### ソーシャル機能
- いいね（TransactWriteItems でアトミック更新）
- ブックマーク（GSI3 で逆引き）
- X (Twitter) 共有（Web Intent）
- ユーザープロフィール

### 進捗トラッキング（沼レベル）
- ノードクリックで完了/未完了を切り替え
- 沼レベル 0〜5: 沼の入口 (0%) → 完全に沼 (81%+)
- DynamoDB StringSet の ADD/DELETE でアトミック更新
- `CalcNumaLevel()` で完了率 → レベル自動計算

### カテゴリ（16 種）
`programming` / `web` / `ai-ml` / `design` / `music` / `dtm` / `gaming` / `cooking` / `fitness` / `language` / `business` / `finance` / `photography` / `craft` / `math-science` / `hobby`

※ バックエンド (`validCategories`) とフロントエンド (`CATEGORIES`) で ID を一致させること

### OGP 対応
- `/api/ogp/:roadmapId` で bot 向け HTML を返却
- `PageHead` コンポーネントで og:title, og:description, og:image, twitter:card を設定
- `robots.txt`, `sitemap.xml` は `frontend/public/` に静的配置

## 重要な設計判断

| 判断 | 理由 |
|------|------|
| DynamoDB シングルテーブル設計 | GSI1(ユーザー別), GSI2(公開フィード), GSI3(ブックマーク逆引き) で全クエリパターンをカバー |
| GSI2 + FilterExpression でカテゴリ絞り込み | GSI2PK は常に `"PUBLIC"`。カテゴリ別パーティションキーではなく FilterExpression 方式 |
| Cognito Authorizer | API Gateway で JWT 検証 → Lambda 内で `requestContext.authorizer.claims.sub` を userID として使用 |
| いいねカウント | TransactWriteItems で Like レコード作成と likeCount インクリメントをアトミック実行 |
| 自動保存 | エディタ変更時に 2 秒 debounce で `scheduleSave()` → `save()` |
| 401 トークンリフレッシュ | API クライアントが 401 受信 → Cognito `getSession()` で新トークン取得 → リトライ |
| WAF | CloudFront (us-east-1) + API Gateway (ap-northeast-1) 両方に `AWSManagedRulesCommonRuleSet` + レート制限 |

## API エンドポイント一覧

| メソッド | パス | 認証 | 説明 |
|---------|------|------|------|
| GET | /api/health | 不要 | ヘルスチェック |
| GET/PUT | /api/users/me | 必須 | 自分のプロフィール |
| GET | /api/users/:id | 不要 | ユーザープロフィール |
| GET | /api/users/:id/roadmaps | 不要 | ユーザーの公開ロードマップ |
| POST | /api/roadmaps | 必須 | ロードマップ作成 |
| GET | /api/roadmaps/my | 必須 | マイロードマップ一覧 |
| GET | /api/roadmaps/explore | 不要 | 公開ロードマップ検索（?category= でフィルタ） |
| GET | /api/roadmaps/:id | 混合 | ロードマップ詳細（非公開は所有者のみ） |
| PUT | /api/roadmaps/:id | 必須 | ロードマップ更新（所有者のみ） |
| DELETE | /api/roadmaps/:id | 必須 | ロードマップ削除（所有者のみ） |
| POST | /api/roadmaps/:id/nodes | 必須 | ノード作成 |
| PUT | /api/roadmaps/:id/nodes/:nodeId | 必須 | ノード更新 |
| DELETE | /api/roadmaps/:id/nodes/:nodeId | 必須 | ノード削除 |
| PUT | /api/roadmaps/:id/nodes/batch | 必須 | ノード一括更新 |
| POST | /api/roadmaps/:id/edges | 必須 | エッジ作成 |
| DELETE | /api/roadmaps/:id/edges/:edgeId | 必須 | エッジ削除 |
| POST | /api/roadmaps/:id/like | 必須 | いいね |
| DELETE | /api/roadmaps/:id/like | 必須 | いいね取り消し |
| POST | /api/roadmaps/:id/bookmark | 必須 | ブックマーク |
| DELETE | /api/roadmaps/:id/bookmark | 必須 | ブックマーク解除 |
| GET | /api/bookmarks | 必須 | ブックマーク一覧 |
| GET | /api/roadmaps/:id/progress | 必須 | 進捗取得 |
| PUT | /api/roadmaps/:id/progress/nodes/:nodeId | 必須 | ノード完了 |
| DELETE | /api/roadmaps/:id/progress/nodes/:nodeId | 必須 | ノード未完了に戻す |
| GET | /api/progress | 必須 | 自分の全進捗一覧 |
| GET | /api/ogp/:id | 不要 | OGP メタタグ HTML |
