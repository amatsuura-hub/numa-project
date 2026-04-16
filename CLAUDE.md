# CLAUDE.md — Numa プロジェクト

> プロジェクト横断のルール・設計判断をまとめる。技術スタック・セットアップ・API 一覧は [README.md](README.md)、レイヤー固有の詳細は各ディレクトリの CLAUDE.md を参照。

## プロジェクト概要

Numa（沼）— 熟練者が初心者向けにマインドマップ形式のロードマップを作成・公開・共有するサービス。緑の沼テーマで、ノードの色の濃さが学習の深度を表現する。

## ディレクトリ構成

```
numa-project/
├── frontend/          # React SPA（詳細は frontend/CLAUDE.md）
├── backend/           # Go Lambda（詳細は backend/CLAUDE.md）
├── infra/             # Terraform + CI/CD（詳細は infra/CLAUDE.md）
├── .github/workflows/ # CI/CD パイプライン
├── docker-compose.yml # DynamoDB Local
└── TODO.md            # 課題管理
```

## コーディング規約（横断ルール）

- **コミット**: 英語 conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`)
- **PR**: 1 PR = 1 機能。タイトルは 70 文字以内
- Go 固有ルールは [backend/CLAUDE.md](backend/CLAUDE.md)、TypeScript/React 固有ルールは [frontend/CLAUDE.md](frontend/CLAUDE.md) を参照

## テーマ・デザイン

- **コンセプト**: 緑の沼。ノードの色が濃いほど学習の深みを表す
- **フォント**: M PLUS Rounded 1c
- カラーパレット・ノード色の詳細は [frontend/CLAUDE.md](frontend/CLAUDE.md) を参照

## 重要な設計判断

| 判断 | 理由 |
|------|------|
| DynamoDB シングルテーブル設計 | GSI1(ユーザー別), GSI2(公開フィード), GSI3(ブックマーク逆引き) で全クエリパターンをカバー。スキーマ詳細は backend/CLAUDE.md |
| GSI2 + FilterExpression でカテゴリ絞り込み | GSI2PK は常に `"PUBLIC"`。カテゴリ別パーティションキーではなく FilterExpression 方式 |
| Cognito Authorizer | API Gateway で JWT 検証 → Lambda 内で `requestContext.authorizer.claims.sub` を userID として使用 |
| いいねカウント | TransactWriteItems で Like レコード作成と likeCount インクリメントをアトミック実行 |
| 自動保存 | エディタ変更時に 2 秒 debounce で `scheduleSave()` → `save()` |
| 401 トークンリフレッシュ | API クライアントが 401 受信 → Cognito `getSession()` で新トークン取得 → リトライ |
| カスタムドメイン | prod は `numa-roadmap.com`（フロント）+ `api.numa-roadmap.com`（API）。dev は `domain_name=""` で CloudFront/API Gateway 既定ドメインのまま |
| WAF 不使用 | 維持費削減のため CloudFront/API Gateway の WAFv2 Web ACL は配置しない。レート対策は API Gateway スロットリングで代替 |
| ノード削除時のエッジカスケード | DeleteNode 時に参照エッジを先に削除してから本体を削除 |
| UpdateNode で CreatedAt 保持 | PutItem ではなく UpdateExpression で更新し、CreatedAt を上書きしない |
| OGP 対応 | `/api/ogp/:roadmapId` で bot 向け HTML 返却。`PageHead` コンポーネントで SPA 内の og:* 設定。`robots.txt`, `sitemap.xml` は `frontend/public/` に静的配置 |
| ノード完了ボタン (pointerEvents) | React Flow の `elementsSelectable={false}` + `nodesDraggable={false}` でノード内 `pointer-events: none` が適用されるため、RoadmapNode に `pointerEvents: "all"` を設定 |

## カテゴリ同期ルール

バックエンド (`handler/roadmap.go` の `validCategories`) とフロントエンド (`src/types/index.ts` の `CATEGORIES`) で 16 種のカテゴリ ID を一致させること。一覧は [backend/CLAUDE.md](backend/CLAUDE.md) を参照。

## テスト方針

- **バックエンド**: テーブル駆動テスト (`[]struct{...}` + `t.Run`)。モックは `handler/mock_repo_test.go`。統合テストは DynamoDB Local で実行
- **フロントエンド**: Vitest + React Testing Library。API は `vi.mock` でモック。主要ページ・コンポーネント単位でテスト
- **インフラ**: `terraform fmt -check` + `terraform validate` を CI で実行
- **CI (PR 時)**: lint + test + security scan (gosec) + Terraform validate を自動実行。詳細は infra/CLAUDE.md を参照
