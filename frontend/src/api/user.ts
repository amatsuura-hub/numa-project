import { api } from "./client";
import type { User } from "../types";

export const userApi = {
  getMe: () => api.get<User>("/api/users/me"),

  updateMe: (data: { displayName: string; bio: string; xHandle: string }) =>
    api.put<User>("/api/users/me", data),

  getUser: (userId: string) => api.get<User>(`/api/users/${userId}`),
};
