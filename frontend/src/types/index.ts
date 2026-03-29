export interface User {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  xHandle?: string;
  createdAt: string;
}

export interface RoadmapMeta {
  roadmapId: string;
  title: string;
  description: string;
  userId: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapNode {
  nodeId: string;
  label: string;
  description?: string;
  posX: number;
  posY: number;
  color?: string;
  url?: string;
  order: number;
}

export interface RoadmapEdge {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string;
}

export interface RoadmapDetail {
  meta: RoadmapMeta;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  isLiked: boolean;
  isBookmarked: boolean;
}

export interface APIResponse<T> {
  data: T;
  cursor?: string;
}

export interface APIError {
  error: {
    code: string;
    message: string;
  };
}

export type Category =
  | "programming"
  | "web"
  | "ai-ml"
  | "design"
  | "music"
  | "dtm"
  | "gaming"
  | "cooking"
  | "fitness"
  | "language"
  | "business"
  | "finance"
  | "photography"
  | "craft"
  | "math-science"
  | "hobby";

export const CATEGORIES: Record<Category, string> = {
  programming: "プログラミング",
  web: "Web開発",
  "ai-ml": "AI・機械学習",
  design: "デザイン",
  music: "音楽",
  dtm: "DTM・作曲",
  gaming: "ゲーム",
  cooking: "料理",
  fitness: "フィットネス",
  language: "語学",
  business: "ビジネス",
  finance: "投資・資産運用",
  photography: "写真・映像",
  craft: "ハンドメイド・DIY",
  "math-science": "数学・科学",
  hobby: "趣味・その他",
};

// Category icons for TopPage display
export const CATEGORY_ICONS: Record<Category, string> = {
  programming: "💻",
  web: "🌐",
  "ai-ml": "🤖",
  design: "🎨",
  music: "🎵",
  dtm: "🎹",
  gaming: "🎮",
  cooking: "🍳",
  fitness: "💪",
  language: "📚",
  business: "📊",
  finance: "💰",
  photography: "📷",
  craft: "✂️",
  "math-science": "🔬",
  hobby: "🌱",
};

export interface BookmarkItem {
  roadmapId: string;
  createdAt: string;
  roadmap?: RoadmapMeta;
}

// Progress tracking types
export interface Progress {
  roadmapId: string;
  completedNodes: string[];
  totalNodes: number;
  numaLevel: number;
  startedAt: string;
  updatedAt: string;
}

export interface ProgressWithRoadmap extends Progress {
  roadmap?: RoadmapMeta;
}

export const NUMA_LEVELS = [
  { level: 0, name: "沼の入口", color: "#E8F5E9", minRate: 0 },
  { level: 1, name: "足首まで", color: "#C8E6C9", minRate: 1 },
  { level: 2, name: "膝まで", color: "#81C784", minRate: 21 },
  { level: 3, name: "腰まで", color: "#43A047", minRate: 41 },
  { level: 4, name: "肩まで", color: "#2E7D32", minRate: 61 },
  { level: 5, name: "完全に沼", color: "#1B5E20", minRate: 81 },
] as const;
