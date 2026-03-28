import { api } from "./client";
import type { User, RoadmapMeta } from "../types";

export const userApi = {
  getMe: () => api.get<User>("/api/users/me"),

  updateMe: (data: { displayName: string; bio: string; xHandle: string }) =>
    api.put<User>("/api/users/me", data),

  getUser: (userId: string) => api.get<User>(`/api/users/${userId}`),

  getUserRoadmaps: (userId: string, params?: { limit?: number; cursor?: string }) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.cursor) query.set("cursor", params.cursor);
    const qs = query.toString();
    return api.get<{ roadmaps: RoadmapMeta[]; cursor?: string }>(
      `/api/users/${userId}/roadmaps${qs ? `?${qs}` : ""}`,
    );
  },
};
