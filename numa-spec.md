# Numa — ロードマップ作成＆共有アプリ 仕様書

## 1. プロジェクト概要

### 1.1 コンセプト
「Numa（沼）」は、熟練者が初心者向けにロードマップを作成・公開し、共有することで"沼に引き摺り込む"ためのWebアプリケーション。ユーザーはマインドマップ形式のノード型ロードマップを自由に作成し、公開・共有できる。

### 1.2 ターゲットユーザー
- **作成者（熟練者）**: 自分の知識・経験をロードマップとして体系化し、初心者に共有したい人
- **閲覧者（初心者）**: 新しい分野の学習パスを探している人

### 1.3 主要機能
- ユーザー登録・ログイン（Cognito認証）
- マインドマップ形式（ノード自由配置）のロードマップ作成・編集
- ロードマップの公開・非公開切り替え
- 公開ロードマップの一覧表示・検索
- カテゴリ・タグによる分類・絞り込み
- いいね・ブックマーク
- X（Twitter）への共有連携

---

## 2. システムアーキテクチャ

### 2.1 全体構成（AWSサーバーレス）

```
User (Browser)
    │
    ▼
CloudFront + S3  ← 静的ホスティング（React SPA）
    │
    ├──► Cognito  ← 認証（JWT発行）
    │
    ▼
API Gateway (REST)  ← Cognito Authorizer で認証チェック
    │
    ▼
Lambda (Go)  ← ビジネスロジック
    │
    ├──► DynamoDB  ← データストア
    │
    └──► X API  ← 共有連携
```

### 2.2 使用AWSサービス一覧

| サービス | 用途 | 備考 |
|---------|------|------|
| CloudFront | CDN / SPA配信 | S3をオリジンに設定 |
| S3 | フロントエンド静的ファイルホスティング | ビルド済みReactアプリを格納 |
| API Gateway | REST APIエンドポイント | Cognito Authorizerで保護 |
| Lambda | バックエンド処理 | Go言語で実装 |
| DynamoDB | データベース | シングルテーブル設計 |
| Cognito | 認証・認可 | ユーザープール + IDプール |
| IAM | 権限管理 | Lambda実行ロール等 |

### 2.3 IaC管理
- **Terraform** で全AWSリソースを管理
- ディレクトリ構成は後述

---

## 3. フロントエンド設計

### 3.1 技術スタック
- **フレームワーク**: React (TypeScript)
- **ビルドツール**: Vite
- **UIライブラリ**: 任意（Tailwind CSS推奨）
- **マインドマップ描画**: React Flow（https://reactflow.dev/）
  - ノードのドラッグ＆ドロップ配置
  - ノード間のエッジ（矢印）接続
  - ズーム・パン操作
- **状態管理**: Zustand or React Context
- **ルーティング**: React Router v6

### 3.2 画面構成

#### 3.2.1 未ログイン画面
| 画面名 | パス | 説明 |
|--------|------|------|
| トップページ | `/` | サービス紹介、公開ロードマップ一覧（人気順） |
| ログイン | `/login` | Cognito Hosted UI or カスタムフォーム |
| サインアップ | `/signup` | メールアドレス + パスワード |
| ロードマップ詳細（閲覧） | `/roadmaps/:id` | 公開ロードマップの閲覧（読み取り専用） |

#### 3.2.2 ログイン後画面
| 画面名 | パス | 説明 |
|--------|------|------|
| ダッシュボード | `/dashboard` | 自分のロードマップ一覧、ブックマーク一覧 |
| ロードマップ作成 | `/roadmaps/new` | マインドマップエディタ |
| ロードマップ編集 | `/roadmaps/:id/edit` | 既存ロードマップの編集 |
| ロードマップ詳細 | `/roadmaps/:id` | 閲覧 + いいね・ブックマーク操作 |
| 探す（検索） | `/explore` | 公開ロードマップ検索（カテゴリ・タグ・キーワード） |
| プロフィール | `/profile` | ユーザー情報編集 |
| ユーザーページ | `/users/:id` | 他ユーザーの公開ロードマップ一覧 |

### 3.3 マインドマップエディタ仕様
- **ノード操作**: 追加、削除、ドラッグ移動、テキスト編集
- **エッジ操作**: ノード間を接続、削除
- **ノード属性**: ラベル（タイトル）、説明文、色、外部URL
- **キャンバス操作**: ズームイン/アウト、パン（ドラッグ移動）
- **自動保存**: 編集中に定期的にAPIへ保存（debounce: 2秒）
- **エクスポート**: 画像（PNG）としてダウンロード可能

---

## 4. バックエンド設計

### 4.1 技術スタック
- **言語**: Go 1.22+
- **Lambda実行環境**: `provided.al2023`（カスタムランタイム）
- **ライブラリ**:
  - `aws-lambda-go` — Lambda ハンドラ
  - `aws-sdk-go-v2` — DynamoDB, Cognito等のAWS操作
  - `github.com/google/uuid` — UUID生成

### 4.2 ディレクトリ構成（Go）

```
backend/
├── cmd/
│   └── api/
│       └── main.go           # Lambda エントリポイント
├── internal/
│   ├── handler/              # APIハンドラ（エンドポイントごと）
│   │   ├── roadmap.go
│   │   ├── node.go
│   │   ├── edge.go
│   │   ├── user.go
│   │   ├── like.go
│   │   ├── bookmark.go
│   │   └── share.go
│   ├── model/                # データモデル（構造体定義）
│   │   ├── roadmap.go
│   │   ├── node.go
│   │   ├── edge.go
│   │   └── user.go
│   ├── repository/           # DynamoDBアクセス層
│   │   ├── dynamo.go         # DynamoDBクライアント初期化
│   │   ├── roadmap_repo.go
│   │   ├── node_repo.go
│   │   ├── edge_repo.go
│   │   ├── user_repo.go
│   │   ├── like_repo.go
│   │   └── bookmark_repo.go
│   ├── service/              # ビジネスロジック
│   │   ├── roadmap_svc.go
│   │   └── share_svc.go
│   └── middleware/           # 認証・ロギング等
│       └── auth.go
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

### 4.3 API エンドポイント設計

#### 認証
全ての `/api/*` エンドポイントは API Gateway の Cognito Authorizer で保護。
JWTトークンを `Authorization: Bearer <token>` ヘッダーで送信。

#### ユーザー API
| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/api/users/me` | 自分のプロフィール取得 | 要 |
| PUT | `/api/users/me` | プロフィール更新 | 要 |
| GET | `/api/users/:userId` | 他ユーザーのプロフィール取得 | 不要 |

#### ロードマップ API
| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| POST | `/api/roadmaps` | ロードマップ作成 | 要 |
| GET | `/api/roadmaps/:id` | ロードマップ詳細取得（META + 全Node + 全Edge） | 条件付 |
| PUT | `/api/roadmaps/:id` | ロードマップMETA更新 | 要（所有者のみ） |
| DELETE | `/api/roadmaps/:id` | ロードマップ削除 | 要（所有者のみ） |
| GET | `/api/roadmaps/my` | 自分のロードマップ一覧 | 要 |
| GET | `/api/roadmaps/explore` | 公開ロードマップ一覧 | 不要 |

**クエリパラメータ（explore）**:
- `category` — カテゴリで絞り込み
- `tag` — タグで絞り込み（将来拡張）
- `sort` — `newest` (default) / `popular`
- `limit` — 取得件数（default: 20, max: 50）
- `cursor` — ページネーション用カーソル（DynamoDB LastEvaluatedKey）

#### ノード API
| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| POST | `/api/roadmaps/:id/nodes` | ノード追加 | 要（所有者のみ） |
| PUT | `/api/roadmaps/:id/nodes/:nodeId` | ノード更新（位置・テキスト等） | 要（所有者のみ） |
| DELETE | `/api/roadmaps/:id/nodes/:nodeId` | ノード削除 | 要（所有者のみ） |
| PUT | `/api/roadmaps/:id/nodes/batch` | ノード一括更新（位置変更等） | 要（所有者のみ） |

#### エッジ API
| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| POST | `/api/roadmaps/:id/edges` | エッジ追加 | 要（所有者のみ） |
| DELETE | `/api/roadmaps/:id/edges/:edgeId` | エッジ削除 | 要（所有者のみ） |

#### いいね・ブックマーク API
| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| POST | `/api/roadmaps/:id/like` | いいねする | 要 |
| DELETE | `/api/roadmaps/:id/like` | いいね取消 | 要 |
| POST | `/api/roadmaps/:id/bookmark` | ブックマークする | 要 |
| DELETE | `/api/roadmaps/:id/bookmark` | ブックマーク取消 | 要 |
| GET | `/api/bookmarks` | 自分のブックマーク一覧 | 要 |

#### X共有 API
| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| GET | `/api/share/x/:roadmapId` | X共有用URLとテキストを生成 | 要 |

---

## 5. データベース設計（DynamoDB）

### 5.1 設計方針
- **シングルテーブル設計**: 1つのテーブルに全エンティティを格納
- **テーブル名**: `numa-main`
- **課金モード**: On-Demand（PAY_PER_REQUEST）

### 5.2 テーブル定義

#### メインテーブル: `numa-main`

| Entity | PK | SK | Attributes |
|--------|----|----|-----------|
| User | `USER#<userId>` | `PROFILE` | displayName, avatarUrl, bio, xHandle, createdAt |
| Roadmap | `ROADMAP#<roadmapId>` | `META` | title, description, userId, category, tags[], isPublic, likeCount, createdAt, updatedAt, GSI1PK, GSI1SK, GSI2PK, GSI2SK |
| Node | `ROADMAP#<roadmapId>` | `NODE#<nodeId>` | label, description, posX, posY, color, url, order |
| Edge | `ROADMAP#<roadmapId>` | `EDGE#<edgeId>` | sourceNodeId, targetNodeId, label |
| Like | `ROADMAP#<roadmapId>` | `LIKE#<userId>` | createdAt |
| Bookmark | `USER#<userId>` | `BOOKMARK#<roadmapId>` | createdAt, GSI3PK, GSI3SK |

#### GSI1: ユーザーのロードマップ一覧
| GSI1PK | GSI1SK | 用途 |
|--------|--------|------|
| `USER#<userId>` | `ROADMAP#<createdAt>` | 自分のロードマップを作成日時降順で取得 |

- Roadmap の META アイテムにのみ GSI1PK/GSI1SK を設定

#### GSI2: 公開ロードマップフィード
| GSI2PK | GSI2SK | 用途 |
|--------|--------|------|
| `PUBLIC` | `<createdAt>` | 全公開ロードマップを新着順で取得 |
| `CAT#<category>` | `<createdAt>` | カテゴリ別に新着順で取得 |

- isPublic=true の Roadmap META にのみ GSI2PK/GSI2SK を設定
- isPublic=false にした場合は GSI2PK/GSI2SK を削除（UpdateItem）

#### GSI3: ブックマーク逆引き
| GSI3PK | GSI3SK | 用途 |
|--------|--------|------|
| `ROADMAP#<roadmapId>` | `BOOKMARK#<userId>` | 特定ロードマップのブックマーク数取得 |

### 5.3 アクセスパターンまとめ

| # | アクセスパターン | 操作 | Key条件 |
|---|----------------|------|---------|
| 1 | ユーザープロフィール取得 | GetItem | PK=`USER#<id>`, SK=`PROFILE` |
| 2 | ロードマップ詳細（META+Nodes+Edges）取得 | Query | PK=`ROADMAP#<id>`, SK begins_with `` |
| 3 | 特定ノード更新 | UpdateItem | PK=`ROADMAP#<id>`, SK=`NODE#<nodeId>` |
| 4 | 自分のロードマップ一覧 | Query (GSI1) | GSI1PK=`USER#<id>`, ScanIndexForward=false |
| 5 | 公開ロードマップ一覧（新着） | Query (GSI2) | GSI2PK=`PUBLIC`, ScanIndexForward=false |
| 6 | カテゴリ別ロードマップ | Query (GSI2) | GSI2PK=`CAT#<cat>`, ScanIndexForward=false |
| 7 | いいねトグル | PutItem / DeleteItem | PK=`ROADMAP#<id>`, SK=`LIKE#<userId>` |
| 8 | ブックマークトグル | PutItem / DeleteItem | PK=`USER#<id>`, SK=`BOOKMARK#<rmId>` |
| 9 | 自分のブックマーク一覧 | Query | PK=`USER#<id>`, SK begins_with `BOOKMARK#` |
| 10 | いいね済みチェック | GetItem | PK=`ROADMAP#<id>`, SK=`LIKE#<userId>` |

### 5.4 likeCount の更新
- いいね追加時: `TransactWriteItems` で Like アイテム PutItem + Roadmap META の likeCount を +1 (UpdateExpression: `ADD likeCount :one`)
- いいね削除時: 同様に TransactWriteItems で DeleteItem + likeCount を -1
- トランザクションにより整合性を保証

---

## 6. 認証設計（Cognito）

### 6.1 Cognito User Pool 設定
- **サインアップ属性**: email（必須）
- **パスワードポリシー**: 最低8文字、大文字・小文字・数字・記号を含む
- **MFA**: オプション（将来対応）
- **メール確認**: 必須（Cognitoデフォルトメール or SES）

### 6.2 認証フロー
1. フロントエンドで Cognito Hosted UI or `amazon-cognito-identity-js` を使用してサインアップ/ログイン
2. ログイン成功時に ID Token / Access Token / Refresh Token を取得
3. API リクエスト時に `Authorization: Bearer <idToken>` を付与
4. API Gateway の Cognito Authorizer が JWT を検証
5. Lambda 内で JWT の `sub` claim からユーザーIDを取得

### 6.3 初回ログイン時の処理
- Cognito の Post Confirmation Lambda Trigger で DynamoDB に User PROFILE アイテムを自動作成
- displayName はメールアドレスの @ 前をデフォルト設定

---

## 7. X（Twitter）連携設計

### 7.1 共有機能（Phase 1 — 簡易実装）
- Web Intent URL を使用（OAuth不要）
- `https://twitter.com/intent/tweet?text=...&url=...` 形式
- フロントエンドで共有ボタンクリック時にURLを組み立てて新規ウィンドウで開く

#### 共有テキストフォーマット
```
📍 「{ロードマップタイトル}」のロードマップを公開しました！
{カテゴリ} の沼へようこそ 🌀

{ロードマップURL}

#Numa #ロードマップ #{カテゴリ}
```

### 7.2 OAuth連携（Phase 2 — 将来拡張）
- X OAuth 2.0 PKCE フローでアカウント連携
- プロフィールにXハンドル表示
- 自動投稿機能

---

## 8. Terraform 構成

### 8.1 ディレクトリ構成

```
infra/
├── main.tf                 # プロバイダー設定
├── variables.tf            # 変数定義
├── outputs.tf              # 出力値
├── terraform.tfvars        # 環境変数（.gitignore対象）
├── modules/
│   ├── s3_cloudfront/      # S3 + CloudFront
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── api_gateway/        # API Gateway
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── lambda/             # Lambda関数
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── dynamodb/           # DynamoDBテーブル
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── cognito/            # Cognito User Pool
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── environments/
    ├── dev/
    │   └── terraform.tfvars
    └── prod/
        └── terraform.tfvars
```

### 8.2 主要リソース定義

#### DynamoDB
- テーブル名: `numa-main`（環境prefix付き: `dev-numa-main`）
- 課金: PAY_PER_REQUEST
- GSI: GSI1, GSI2, GSI3 の3つ
- Point-in-time recovery: 有効

#### Lambda
- ランタイム: `provided.al2023`
- ハンドラ: `bootstrap`（Goバイナリ）
- メモリ: 128MB（初期値）
- タイムアウト: 30秒
- 環境変数: TABLE_NAME, COGNITO_USER_POOL_ID

#### API Gateway
- タイプ: REST API
- ステージ: `dev` / `prod`
- Cognito Authorizer 設定
- CORS設定: CloudFront ドメインを許可

#### CloudFront
- オリジン: S3バケット
- OAC（Origin Access Control）でS3アクセス制限
- デフォルトルートオブジェクト: `index.html`
- カスタムエラーレスポンス: 403/404 → `/index.html`（SPA対応）
- キャッシュポリシー: 静的アセットは長期キャッシュ

#### Cognito
- User Pool + App Client
- Callback URL: CloudFront ドメイン
- Token有効期限: Access 1h, ID 1h, Refresh 30d

---

## 9. カテゴリ定義（初期値）

| カテゴリID | 表示名 |
|-----------|--------|
| `programming` | プログラミング |
| `design` | デザイン |
| `music` | 音楽 |
| `gaming` | ゲーム |
| `cooking` | 料理 |
| `fitness` | フィットネス |
| `language` | 語学 |
| `business` | ビジネス |
| `hobby` | 趣味・その他 |

---

## 10. データモデル（Go構造体）

```go
type User struct {
    PK          string `dynamodbav:"PK"`          // USER#<userId>
    SK          string `dynamodbav:"SK"`          // PROFILE
    UserID      string `dynamodbav:"userId"`
    DisplayName string `dynamodbav:"displayName"`
    AvatarURL   string `dynamodbav:"avatarUrl"`
    Bio         string `dynamodbav:"bio"`
    XHandle     string `dynamodbav:"xHandle"`
    CreatedAt   string `dynamodbav:"createdAt"`   // ISO 8601
}

type RoadmapMeta struct {
    PK          string   `dynamodbav:"PK"`          // ROADMAP#<roadmapId>
    SK          string   `dynamodbav:"SK"`          // META
    RoadmapID   string   `dynamodbav:"roadmapId"`
    Title       string   `dynamodbav:"title"`
    Description string   `dynamodbav:"description"`
    UserID      string   `dynamodbav:"userId"`
    Category    string   `dynamodbav:"category"`
    Tags        []string `dynamodbav:"tags"`
    IsPublic    bool     `dynamodbav:"isPublic"`
    LikeCount   int      `dynamodbav:"likeCount"`
    CreatedAt   string   `dynamodbav:"createdAt"`
    UpdatedAt   string   `dynamodbav:"updatedAt"`
    GSI1PK      string   `dynamodbav:"GSI1PK,omitempty"`
    GSI1SK      string   `dynamodbav:"GSI1SK,omitempty"`
    GSI2PK      string   `dynamodbav:"GSI2PK,omitempty"`
    GSI2SK      string   `dynamodbav:"GSI2SK,omitempty"`
}

type Node struct {
    PK          string  `dynamodbav:"PK"`          // ROADMAP#<roadmapId>
    SK          string  `dynamodbav:"SK"`          // NODE#<nodeId>
    NodeID      string  `dynamodbav:"nodeId"`
    Label       string  `dynamodbav:"label"`
    Description string  `dynamodbav:"description"`
    PosX        float64 `dynamodbav:"posX"`
    PosY        float64 `dynamodbav:"posY"`
    Color       string  `dynamodbav:"color"`
    URL         string  `dynamodbav:"url"`
    Order       int     `dynamodbav:"order"`
}

type Edge struct {
    PK           string `dynamodbav:"PK"`           // ROADMAP#<roadmapId>
    SK           string `dynamodbav:"SK"`           // EDGE#<edgeId>
    EdgeID       string `dynamodbav:"edgeId"`
    SourceNodeID string `dynamodbav:"sourceNodeId"`
    TargetNodeID string `dynamodbav:"targetNodeId"`
    Label        string `dynamodbav:"label"`
}

type Like struct {
    PK        string `dynamodbav:"PK"`        // ROADMAP#<roadmapId>
    SK        string `dynamodbav:"SK"`        // LIKE#<userId>
    CreatedAt string `dynamodbav:"createdAt"`
}

type Bookmark struct {
    PK        string `dynamodbav:"PK"`        // USER#<userId>
    SK        string `dynamodbav:"SK"`        // BOOKMARK#<roadmapId>
    CreatedAt string `dynamodbav:"createdAt"`
    GSI3PK    string `dynamodbav:"GSI3PK,omitempty"`
    GSI3SK    string `dynamodbav:"GSI3SK,omitempty"`
}
```

---

## 11. API レスポンス形式

### 11.1 成功レスポンス
```json
{
  "data": { ... },
  "cursor": "optional-pagination-cursor"
}
```

### 11.2 エラーレスポンス
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Roadmap not found"
  }
}
```

### 11.3 主要エラーコード
| HTTP Status | code | 説明 |
|-------------|------|------|
| 400 | `BAD_REQUEST` | リクエストパラメータ不正 |
| 401 | `UNAUTHORIZED` | 認証なし or トークン無効 |
| 403 | `FORBIDDEN` | 権限なし（他人のロードマップ編集等） |
| 404 | `NOT_FOUND` | リソースが見つからない |
| 409 | `CONFLICT` | 重複操作（いいね済みに再いいね等） |
| 500 | `INTERNAL_ERROR` | サーバーエラー |

---

## 12. 開発フェーズ

### Phase 1: 基盤構築
- [ ] Terraform でインフラ構築（DynamoDB, Cognito, S3, CloudFront）
- [ ] Go Lambda の Hello World デプロイ
- [ ] API Gateway + Cognito Authorizer 設定
- [ ] フロントエンド プロジェクト初期化（Vite + React + TypeScript）
- [ ] Cognito認証フロー実装

### Phase 2: コアCRUD
- [ ] ユーザープロフィール API
- [ ] ロードマップ CRUD API
- [ ] ノード・エッジ CRUD API
- [ ] フロントエンド マインドマップエディタ（React Flow）
- [ ] ロードマップ保存・読み込み

### Phase 3: ソーシャル機能
- [ ] いいね機能（API + UI）
- [ ] ブックマーク機能（API + UI）
- [ ] 公開ロードマップ一覧・検索
- [ ] カテゴリ・タグフィルタリング

### Phase 4: 共有・仕上げ
- [ ] X共有機能（Web Intent）
- [ ] OGP メタタグ設定（SNS共有時のプレビュー）
- [ ] レスポンシブデザイン対応
- [ ] パフォーマンス最適化
- [ ] エラーハンドリング強化

### Phase 5: 拡張（将来）
- [ ] X OAuth連携
- [ ] タグ検索（ElasticSearch or OpenSearch）
- [ ] ロードマップ画像エクスポート
- [ ] PWA対応

---

## 13. 非機能要件

### 13.1 パフォーマンス
- API レスポンスタイム: 500ms以内（p95）
- ページ初期ロード: 3秒以内（LCP）
- マインドマップ操作のレイテンシ: 16ms以内（60fps維持）

### 13.2 セキュリティ
- 全通信 HTTPS
- JWT による認証（Cognito発行）
- API Gateway での認可チェック
- Lambda 内で所有者チェック（自分のロードマップのみ編集可能）
- DynamoDB テーブルへの直接アクセス禁止（Lambda経由のみ）
- S3 バケットへの直接アクセス禁止（CloudFront OAC経由のみ）

### 13.3 可用性
- AWSサーバーレス構成のため、基本的に高可用性
- DynamoDB Point-in-time Recovery 有効
- CloudFront によるエッジキャッシュ

---

## 付録A: 環境変数一覧

### Lambda 環境変数
| 変数名 | 説明 | 例 |
|--------|------|-----|
| `TABLE_NAME` | DynamoDBテーブル名 | `dev-numa-main` |
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID | `ap-northeast-1_xxxxx` |
| `COGNITO_CLIENT_ID` | Cognito App Client ID | `xxxxxxxxxxxxxxxxx` |
| `ENVIRONMENT` | 環境名 | `dev` / `prod` |
| `ALLOWED_ORIGIN` | CORS許可オリジン | `https://dxxxxx.cloudfront.net` |

### フロントエンド環境変数（.env）
| 変数名 | 説明 |
|--------|------|
| `VITE_API_URL` | API Gateway のURL |
| `VITE_COGNITO_USER_POOL_ID` | Cognito User Pool ID |
| `VITE_COGNITO_CLIENT_ID` | Cognito App Client ID |
| `VITE_COGNITO_DOMAIN` | Cognito Hosted UI ドメイン |
| `VITE_CLOUDFRONT_URL` | CloudFront 配信URL |
