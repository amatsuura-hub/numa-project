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
  | "design"
  | "music"
  | "gaming"
  | "cooking"
  | "fitness"
  | "language"
  | "business"
  | "hobby";

export const CATEGORIES: Record<Category, string> = {
  programming: "プログラミング",
  design: "デザイン",
  music: "音楽",
  gaming: "ゲーム",
  cooking: "料理",
  fitness: "フィットネス",
  language: "語学",
  business: "ビジネス",
  hobby: "趣味・その他",
};
