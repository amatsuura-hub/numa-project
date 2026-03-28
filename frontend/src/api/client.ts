import type { APIResponse, APIError } from "../types";
import { useAuthStore } from "../stores/authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

function getAuthToken(): string | null {
  return useAuthStore.getState().getIdToken();
}

function isRetryable(status: number): boolean {
  return status >= 500 || status === 429;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retries = MAX_RETRIES,
): Promise<APIResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        if (isRetryable(response.status) && attempt < retries) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY * (attempt + 1)));
          continue;
        }

        let message = "エラーが発生しました";
        try {
          const errorBody: APIError = await response.json();
          message = errorBody.error.message;
        } catch {
          // response wasn't JSON
        }
        throw new Error(message);
      }

      if (response.status === 204) {
        return { data: {} as T };
      }

      return response.json();
    } catch (e) {
      lastError = e as Error;
      if (
        e instanceof TypeError &&
        attempt < retries
      ) {
        // Network error (fetch failed) — retry
        await new Promise((r) => setTimeout(r, RETRY_DELAY * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }

  throw lastError ?? new Error("リクエストに失敗しました");
}

export const api = {
  get: <T>(path: string) => request<T>(path),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};
