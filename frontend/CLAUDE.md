# frontend/CLAUDE.md — フロントエンド開発ガイド

## ディレクトリ構成

```
frontend/src/
├── main.tsx                    # エントリポイント (HelmetProvider + BrowserRouter + App)
├── App.tsx                     # ルーティング定義
├── config.ts                   # 環境変数 (VITE_API_URL, VITE_COGNITO_*)
├── api/
│   ├── client.ts               # API クライアント (fetch ラッパー、401 リトライ、リトライ機構)
│   ├── roadmap.ts              # roadmapApi: create, get, update, delete, getMy, explore, nodes, edges, like, bookmark, progress
│   └── user.ts                 # userApi: getMe, updateMe, getUser, getUserRoadmaps
├── components/
│   ├── common/
│   │   ├── AuthGuard.tsx       # 認証ガード (未認証→ /login リダイレクト)
│   │   ├── BookmarkButton.tsx  # ブックマークボタン (aria-label 付き)
│   │   ├── ErrorBoundary.tsx   # エラーバウンダリ (Sentry TODO)
│   │   ├── LikeButton.tsx      # いいねボタン (aria-label 付き)
│   │   ├── LoadingSpinner.tsx  # ローディングスピナー
│   │   ├── PageHead.tsx        # <Helmet> ラッパー (title, description, og:*, twitter:*)
│   │   ├── RoadmapCard.tsx     # ロードマップカード (DEPTH_COLORS 使用)
│   │   └── ShareButton.tsx     # X (Twitter) 共有ボタン
│   ├── editor/
│   │   ├── RoadmapEditor.tsx   # React Flow エディタ本体
│   │   ├── RoadmapNode.tsx     # カスタムノードコンポーネント
│   │   ├── EditorToolbar.tsx   # エディタツールバー
│   │   ├── MetaEditPanel.tsx   # メタ情報編集パネル
│   │   └── NodeEditPanel.tsx   # ノード編集パネル (URL http/https バリデーション、深度名 aria-label)
│   └── layout/
│       ├── Header.tsx          # ヘッダー (aria-controls, aria-expanded 付きモバイルメニュー)
│       └── Layout.tsx          # 共通レイアウト
├── constants/
│   └── depth.ts                # DEFAULT_NODE_COLOR, NODE_COLORS (8色), DEPTH_COLORS (5色), depthColor()
├── hooks/
│   └── useRoadmapDetail.ts     # ロードマップ詳細取得カスタムフック
├── pages/
│   ├── TopPage.tsx             # トップページ
│   ├── ExplorePage.tsx         # 公開ロードマップ一覧 (カテゴリフィルタ)
│   ├── DashboardPage.tsx       # ダッシュボード (マイロードマップ / ブックマーク / 進捗中 タブ)
│   ├── RoadmapCreate.tsx       # ロードマップ新規作成 (beforeunload 警告)
│   ├── RoadmapDetailPage.tsx   # ロードマップ詳細 (閲覧 + 進捗)
│   ├── RoadmapEditPage.tsx     # ロードマップ編集
│   ├── ProfilePage.tsx         # 自分のプロフィール (404 以外エラーでトースト)
│   ├── UserPage.tsx            # 他ユーザーのプロフィール
│   ├── LoginPage.tsx           # ログイン
│   ├── SignupPage.tsx          # サインアップ + 認証コード確認
│   └── NotFoundPage.tsx        # 404
├── stores/
│   ├── authStore.ts            # Zustand: 認証状態 (user, login, logout, signup, getIdToken)
│   └── editorStore.ts          # Zustand: エディタ状態 (nodes, edges, meta, 自動保存, CRUD)
├── types/
│   └── index.ts                # 全型定義 + CATEGORIES + CATEGORY_ICONS + NUMA_LEVELS
├── utils/
│   └── getErrorMessage.ts      # エラーオブジェクトからメッセージ抽出
└── setupTests.ts               # Vitest セットアップ
```

## コマンド

```bash
npm run dev          # Vite 開発サーバー (localhost:5173)
npm run build        # tsc -b && vite build
npm run lint         # ESLint (--max-warnings 0)
npm run format       # Prettier 整形
npm run format:check # Prettier チェック
npm run test         # vitest run
npm run test:watch   # vitest (ウォッチモード)
npm run preview      # vite preview (ビルド結果確認)
```

## 環境変数 (`src/config.ts`)

| 変数 | 必須 | 用途 |
|------|------|------|
| `VITE_API_URL` | ○ | API Gateway ベース URL |
| `VITE_COGNITO_USER_POOL_ID` | ○ | Cognito ユーザープール ID |
| `VITE_COGNITO_CLIENT_ID` | ○ | Cognito クライアント ID |
| `VITE_CLOUDFRONT_URL` | △ | CloudFront URL (空文字許容) |

## 型定義 (`src/types/index.ts`)

### 主要な型

| 型名 | 用途 |
|------|------|
| `User` | ユーザー (userId, displayName, avatarUrl?, bio?, xHandle?, createdAt) |
| `RoadmapMeta` | ロードマップメタ (roadmapId, title, description, userId, category, tags, isPublic, likeCount, createdAt, updatedAt) |
| `RoadmapNode` | ノード (nodeId, label, description?, posX, posY, color?, url?, order) |
| `RoadmapEdge` | エッジ (edgeId, sourceNodeId, targetNodeId, label?) |
| `RoadmapDetail` | ロードマップ全体 (meta, nodes, edges, isLiked, isBookmarked) |
| `Category` | カテゴリ ID のユニオン型 (16 種) |
| `Progress` | 進捗 (roadmapId, completedNodes, totalNodes, numaLevel, startedAt, updatedAt) |
| `ProgressWithRoadmap` | Progress + roadmap? |
| `BookmarkItem` | ブックマーク (roadmapId, createdAt, roadmap?) |
| `APIResponse<T>` | API レスポンスラッパー (data, cursor?) |
| `APIError` | エラーレスポンス (error.code, error.message) |

### 定数

| 定数 | 型 | 用途 |
|------|-----|------|
| `CATEGORIES` | `Record<Category, string>` | カテゴリ ID → 日本語名マッピング |
| `CATEGORY_ICONS` | `Record<Category, string>` | カテゴリ ID → 絵文字マッピング |
| `NUMA_LEVELS` | `readonly array` | 沼レベル定義 (level, name, color, minRate) |

## API クライアント (`src/api/client.ts`)

- `api.get<T>(path)`, `api.post<T>(path, body)`, `api.put<T>(path, body)`, `api.delete<T>(path)`
- 認証: `authStore.getIdToken()` で Cognito ID トークンを取得 → `Authorization: Bearer` ヘッダー
- **401 リトライ**: 初回 401 → `getAuthToken()` で新トークン取得 → 異なるトークンならリトライ
- **リトライ**: 5xx / ネットワークエラーは最大 2 回リトライ（1 秒間隔）
- パスプレフィックス: `config.apiUrl` (VITE_API_URL)

## ストア

### authStore (Zustand)
- `user: AuthUser | null` — ログインユーザー (userId, email)
- `isLoading: boolean` — 初期化中フラグ
- `initialize()` — Cognito セッションから自動ログイン復元
- `signup(email, password)` → `confirmSignup(email, code)` → `login(email, password)`
- `logout()` — Cognito signOut + state クリア
- `getIdToken()` — `cognitoUser.getSession()` で ID トークン取得

### editorStore (Zustand)
- `nodes: Node[]`, `edges: Edge[]`, `meta: RoadmapMeta | null`
- `isDirty: boolean` — 未保存変更あり
- `loadRoadmap(id)` — API からロードマップ読み込み
- `createRoadmap(data)` — 新規作成 → roadmapId 返却
- `addNode(posX, posY)` — ID は `node-${crypto.randomUUID()}`
- `onConnect(connection)` — エッジ追加、ID は `edge-${crypto.randomUUID()}`
- `scheduleSave()` — 2 秒 debounce で `save()` 呼び出し
- `save()` — `batchUpdateNodes` + `updateMeta` を API 送信。エッジ保存失敗時はトースト表示

## デザインルール

### Tailwind カスタムカラー (`tailwind.config.js`)

```
numa-bg: #ede6d8       numa-bg-warm: #e4dbc8
numa-text: #252018     numa-text-muted: #6a6050   numa-text-hint: #9a9080
numa-gold: #6a5230     numa-brown: #3a2e18
numa-border: rgba(80,60,30,.15)    numa-border-light: rgba(80,60,30,.08)
numa-border-subtle: rgba(80,60,30,.10)  numa-border-soft: rgba(80,60,30,.12)
numa-border-medium: rgba(80,60,30,.20)  numa-border-hover: rgba(80,60,30,.25)
numa-50〜900: 緑グラデーション (#f0fdf4 → #14532d)
swamp-50〜900: 沼グラデーション (#e8f0e4 → #1B5E20)
```

### ノード色 (`src/constants/depth.ts`)

- `NODE_COLORS`: 8 段階 — `#bbf7d0`, `#86efac`, `#4ade80`, `#22c55e`, `#16a34a`, `#15803d`, `#166534`, `#14532d`
- `DEFAULT_NODE_COLOR`: `#16a34a`
- `DEPTH_COLORS`: 5 段階 — `#e8dfc8`, `#c8dab8`, `#8aba82`, `#5a9a52`, `#2d5a32`
- `depthColor(index, total)`: インデックスと総数から深度カラーを計算

### フォント

`M PLUS Rounded 1c` (Google Fonts) → system-ui → sans-serif

### パスエイリアス

`@` → `./src` (vite.config.ts で設定)

## コーディングルール

- 関数コンポーネント + hooks のみ。クラスコンポーネント禁止
- 型定義は `src/types/index.ts` に集約。コンポーネント固有の props 型はコンポーネントファイル内で定義
- API 呼び出しは `src/api/` 経由。コンポーネントから直接 fetch しない
- グローバル状態は Zustand (`src/stores/`)。props バケツリレーよりストア参照
- トースト通知は `react-hot-toast` の `toast.success()` / `toast.error()`
- エラーメッセージ抽出は `getErrorMessage()` ユーティリティを使用
- URL バリデーション: `http://` または `https://` のみ許可 (NodeEditPanel の `isValidUrl`)
- ID 生成: `crypto.randomUUID()` を使用（`Date.now()` 禁止）
- `<PageHead>` で全ページに og:title, og:description, og:image を設定
- アクセシビリティ: インタラクティブ要素に `aria-label`、トグルに `aria-expanded`、メニューに `aria-controls` + `id`
