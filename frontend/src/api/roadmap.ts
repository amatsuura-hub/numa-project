import { api } from "./client";
import type {
  RoadmapMeta,
  RoadmapDetail,
  RoadmapNode,
  RoadmapEdge,
  Progress,
  ProgressWithRoadmap,
} from "../types";

export const roadmapApi = {
  create: (data: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    isPublic: boolean;
  }) => api.post<RoadmapMeta>("/api/roadmaps", data),

  get: (id: string) => api.get<RoadmapDetail>(`/api/roadmaps/${id}`),

  update: (
    id: string,
    data: {
      title: string;
      description: string;
      category: string;
      tags: string[];
      isPublic: boolean;
    },
  ) => api.put<RoadmapMeta>(`/api/roadmaps/${id}`, data),

  delete: (id: string) => api.delete(`/api/roadmaps/${id}`),

  getMy: (params?: { limit?: number; cursor?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.cursor) query.set("cursor", params.cursor);
    const qs = query.toString();
    return api.get<{ roadmaps: RoadmapMeta[]; cursor?: string }>(
      `/api/roadmaps/my${qs ? `?${qs}` : ""}`,
    );
  },

  explore: (params?: { category?: string; limit?: number; cursor?: string }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set("category", params.category);
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.cursor) query.set("cursor", params.cursor);
    const qs = query.toString();
    return api.get<{ roadmaps: RoadmapMeta[]; cursor?: string }>(
      `/api/roadmaps/explore${qs ? `?${qs}` : ""}`,
    );
  },

  // Nodes
  createNode: (roadmapId: string, data: Omit<RoadmapNode, "nodeId">) =>
    api.post<RoadmapNode>(`/api/roadmaps/${roadmapId}/nodes`, data),

  updateNode: (roadmapId: string, nodeId: string, data: Omit<RoadmapNode, "nodeId">) =>
    api.put<RoadmapNode>(`/api/roadmaps/${roadmapId}/nodes/${nodeId}`, data),

  deleteNode: (roadmapId: string, nodeId: string) =>
    api.delete(`/api/roadmaps/${roadmapId}/nodes/${nodeId}`),

  batchUpdateNodes: (roadmapId: string, nodes: RoadmapNode[]) =>
    api.put<{ nodes: RoadmapNode[] }>(`/api/roadmaps/${roadmapId}/nodes/batch`, {
      nodes,
    }),

  // Edges
  createEdge: (
    roadmapId: string,
    data: { sourceNodeId: string; targetNodeId: string; label?: string },
  ) => api.post<RoadmapEdge>(`/api/roadmaps/${roadmapId}/edges`, data),

  deleteEdge: (roadmapId: string, edgeId: string) =>
    api.delete(`/api/roadmaps/${roadmapId}/edges/${edgeId}`),

  // Likes
  like: (roadmapId: string) =>
    api.post(`/api/roadmaps/${roadmapId}/like`, {}),

  unlike: (roadmapId: string) =>
    api.delete(`/api/roadmaps/${roadmapId}/like`),

  // Bookmarks
  bookmark: (roadmapId: string) =>
    api.post(`/api/roadmaps/${roadmapId}/bookmark`, {}),

  unbookmark: (roadmapId: string) =>
    api.delete(`/api/roadmaps/${roadmapId}/bookmark`),

  getBookmarks: (params?: { limit?: number; cursor?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.cursor) query.set("cursor", params.cursor);
    const qs = query.toString();
    return api.get<{
      bookmarks: Array<{
        roadmapId: string;
        createdAt: string;
        roadmap?: RoadmapMeta;
      }>;
      cursor?: string;
    }>(`/api/bookmarks${qs ? `?${qs}` : ""}`);
  },

  // Progress
  getProgress: (roadmapId: string) =>
    api.get<Progress>(`/api/roadmaps/${roadmapId}/progress`),

  completeNode: (roadmapId: string, nodeId: string) =>
    api.put<Progress>(`/api/roadmaps/${roadmapId}/progress/nodes/${nodeId}`, {}),

  uncompleteNode: (roadmapId: string, nodeId: string) =>
    api.delete<Progress>(`/api/roadmaps/${roadmapId}/progress/nodes/${nodeId}`),

  getMyProgress: () =>
    api.get<{ progress: ProgressWithRoadmap[] }>("/api/progress"),
};
