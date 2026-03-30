# backend/CLAUDE.md — バックエンド開発ガイド

## アーキテクチャ

```
backend/
├── cmd/
│   ├── api/main.go              # メイン Lambda ハンドラ（API ルーティング）
│   └── postconfirmation/main.go # Cognito PostConfirmation トリガー
├── internal/
│   ├── handler/                 # ビジネスロジック + バリデーション
│   │   ├── handler.go           # Handler 構造体、APIError 型、ErrorResponse()
│   │   ├── validation.go        # 入力バリデーション関数、制限値定数
│   │   ├── roadmap.go           # ロードマップ CRUD + validCategories
│   │   ├── node.go              # ノード CRUD + batch
│   │   ├── edge.go              # エッジ CRUD（ノード存在・自己ループ検証あり）
│   │   ├── like.go              # いいね
│   │   ├── bookmark.go          # ブックマーク
│   │   ├── progress.go          # 進捗トラッキング
│   │   ├── user.go              # ユーザープロフィール
│   │   ├── ogp.go               # OGP HTML 生成
│   │   └── mock_repo_test.go    # テスト用モックリポジトリ
│   ├── middleware/
│   │   └── auth.go              # Cognito JWT からの userID 抽出
│   ├── model/                   # DynamoDB エンティティ + キー定数
│   │   ├── keys.go              # PK/SK プレフィックス、リソース制限定数
│   │   ├── roadmap.go           # RoadmapMeta, RoadmapDetail
│   │   ├── node.go              # Node（CreatedAt/UpdatedAt あり）
│   │   ├── edge.go              # Edge
│   │   ├── user.go              # User
│   │   ├── like.go              # Like
│   │   ├── bookmark.go          # Bookmark
│   │   └── progress.go          # Progress + CalcNumaLevel()
│   └── repository/              # DynamoDB アクセス層
│       ├── interface.go         # Repository インターフェース定義
│       ├── dynamo.go            # DynamoDB クライアント初期化
│       ├── roadmap_repo.go      # ロードマップ CRUD + ExploreRoadmaps (FilterExpression)
│       ├── node_repo.go         # ノード CRUD + BatchPutNodes
│       ├── edge_repo.go         # エッジ CRUD
│       ├── like_repo.go         # いいね（TransactWriteItems）
│       ├── bookmark_repo.go     # ブックマーク
│       ├── progress_repo.go     # 進捗（UpdateItem ADD/DELETE StringSet）
│       ├── user_repo.go         # ユーザー CRUD
│       └── cursor.go            # カーソルベースページネーション
├── Makefile
└── go.mod                       # module: github.com/numa-project/backend
```

## コマンド

```bash
make build    # GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o bin/bootstrap cmd/api/main.go
make test     # go test ./... -v -count=1
make lint     # golangci-lint run ./...
make clean    # rm -rf bin/
make deploy   # build + zip + aws lambda update-function-code
```

## DynamoDB シングルテーブル設計

### キープレフィックス (`model/keys.go`)

| 定数 | 値 | 用途 |
|------|-----|------|
| `PKPrefixRoadmap` | `ROADMAP#` | ロードマップ関連エンティティの PK |
| `PKPrefixUser` | `USER#` | ユーザー関連エンティティの PK |
| `SKMeta` | `META` | ロードマップメタデータの SK |
| `SKProfile` | `PROFILE` | ユーザープロフィールの SK |
| `SKPrefixNode` | `NODE#` | ノードの SK |
| `SKPrefixEdge` | `EDGE#` | エッジの SK |
| `SKPrefixLike` | `LIKE#` | いいねの SK |
| `SKPrefixBookmark` | `BOOKMARK#` | ブックマークの SK |
| `SKPrefixProgress` | `PROGRESS#` | 進捗の SK |
| `GSI2Public` | `PUBLIC` | 公開ロードマップの GSI2PK |

### アクセスパターン

| パターン | PK | SK | GSI |
|---------|-----|-----|-----|
| ロードマップメタ | `ROADMAP#<id>` | `META` | — |
| ロードマップのノード | `ROADMAP#<id>` | `NODE#<nodeId>` | — |
| ロードマップのエッジ | `ROADMAP#<id>` | `EDGE#<edgeId>` | — |
| ロードマップのいいね | `ROADMAP#<id>` | `LIKE#<userId>` | — |
| ユーザープロフィール | `USER#<id>` | `PROFILE` | — |
| ユーザーのブックマーク | `USER#<id>` | `BOOKMARK#<roadmapId>` | — |
| ユーザーの進捗 | `USER#<id>` | `PROGRESS#<roadmapId>` | — |
| ユーザーのロードマップ一覧 | — | — | GSI1: `GSI1PK=USER#<id>`, `GSI1SK=createdAt` |
| 公開ロードマップ一覧 | — | — | GSI2: `GSI2PK=PUBLIC`, `GSI2SK=createdAt` |
| カテゴリ別公開ロードマップ | — | — | GSI2 + FilterExpression (`category = :cat`) |
| ブックマーク逆引き | — | — | GSI3: `GSI3PK=ROADMAP#<id>`, `GSI3SK=USER#<id>` |

### リソース制限 (`model/keys.go`)

| 定数 | 値 | 用途 |
|------|-----|------|
| `BatchWriteMaxItems` | 25 | DynamoDB BatchWriteItem 上限 |
| `MaxRoadmapsPerUser` | 50 | ユーザーあたりロードマップ数上限 |
| `MaxNodesPerRoadmap` | 100 | ロードマップあたりノード数上限 |
| `MaxEdgesPerRoadmap` | 200 | ロードマップあたりエッジ数上限 |
| `MaxNodesPerBatch` | 100 | 一括更新ノード数上限 |
| `DefaultPageLimit` | 20 | デフォルトページサイズ |
| `MaxPageLimitDefault` | 50 | 通常ページサイズ上限 |
| `MaxPageLimitExplore` | 100 | Explore ページサイズ上限 |

## バリデーション制限値 (`handler/validation.go`)

| 定数 | 値 | 対象 |
|------|-----|------|
| `maxTitleLen` | 100 | ロードマップタイトル |
| `maxDescriptionLen` | 1000 | ロードマップ説明 |
| `maxCategoryLen` | 50 | カテゴリ文字列長 |
| `maxNodeLabelLen` | 50 | ノードラベル |
| `maxNodeDescLen` | 500 | ノード説明 |
| `maxTagLen` | 30 | タグ 1 つの文字列長 |
| `maxTagsCount` | 5 | タグ数上限 |
| `maxBatchNodes` | 100 | batch 更新ノード数 |
| `maxNodePos` | 10000.0 | ノード座標の絶対値上限 (±10000) |

## カテゴリホワイトリスト (`handler/roadmap.go`)

```go
var validCategories = map[string]bool{
    "programming": true, "web": true, "ai-ml": true,
    "design": true, "music": true, "dtm": true,
    "gaming": true, "cooking": true, "fitness": true,
    "language": true, "business": true, "finance": true,
    "photography": true, "craft": true, "math-science": true,
    "hobby": true,
}
```

フロントエンドの `CATEGORIES` (src/types/index.ts) と ID を一致させること。

## エラーハンドリング

`handler/handler.go` の `APIError` 型を使用:

```go
var (
    ErrBadRequest   = errors.New("BAD_REQUEST")
    ErrUnauthorized = errors.New("UNAUTHORIZED")
    ErrForbidden    = errors.New("FORBIDDEN")
    ErrNotFound     = errors.New("NOT_FOUND")
    ErrConflict     = errors.New("CONFLICT")
    ErrInternal     = errors.New("INTERNAL_ERROR")
)
```

- `NewAPIError(code, message)` でエラーを生成
- `ErrorResponse(err, headers)` で HTTP ステータスコードにマッピング
- `requireAuth(userID)` で認証チェック（userID 空なら UNAUTHORIZED）
- repository 層のエラーは `fmt.Errorf("context: %w", err)` でラップ

## Repository インターフェース (`repository/interface.go`)

主要メソッド:

| カテゴリ | メソッド |
|---------|---------|
| User | `GetUser`, `PutUser`, `UpdateUser` |
| Roadmap | `PutRoadmap`, `GetRoadmapMeta`, `GetRoadmapDetail`, `UpdateRoadmapMeta`, `DeleteRoadmap`, `GetMyRoadmaps`, `ExploreRoadmaps` |
| Node | `PutNode`, `DeleteNode`, `BatchPutNodes`, `CountNodes` |
| Edge | `PutEdge`, `DeleteEdge` |
| Like | `IsLiked`, `LikeRoadmap`, `UnlikeRoadmap` |
| Bookmark | `IsBookmarked`, `BookmarkRoadmap`, `UnbookmarkRoadmap`, `GetMyBookmarks` |
| Progress | `GetProgress`, `PutProgress`, `GetMyProgress`, `CompleteNode`, `UncompleteNode` |

## コーディングルール

- ハンドラはビジネスロジックのみ。DB アクセスは必ず `repository.Repository` インターフェース経由
- テストはテーブル駆動テスト (`[]struct{...}` + `t.Run`)。モックは `mock_repo_test.go`
- `TABLE_NAME` 環境変数は必須。未設定時は起動エラー (`log.Fatal` / `fmt.Errorf`)
- ノードの `CreatedAt` / `UpdatedAt` は handler 層で `time.Now().UTC().Format(time.RFC3339)` を設定
- エッジ作成時はソース・ターゲットノードの存在検証 + 自己ループ拒否を行う
- 進捗の `CompletedNodes` は DynamoDB StringSet。`CompleteNode` で ADD、`UncompleteNode` で DELETE
- 沼レベルは `CalcNumaLevel(completed, total)` で自動計算: 0%→0, 1-20%→1, 21-40%→2, 41-60%→3, 61-80%→4, 81%+→5

## 環境変数

| 変数 | 必須 | 用途 |
|------|------|------|
| `TABLE_NAME` | ○ | DynamoDB テーブル名 |
| `COGNITO_USER_POOL_ID` | ○ | Cognito ユーザープール ID (API Lambda) |
| `COGNITO_CLIENT_ID` | ○ | Cognito クライアント ID (API Lambda) |
| `ENVIRONMENT` | ○ | 環境名 (dev/prod) |
| `ALLOWED_ORIGIN` | ○ | CORS 許可オリジン (API Lambda) |
