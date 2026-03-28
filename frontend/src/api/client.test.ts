import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "./client";

// Mock authStore
vi.mock("../stores/authStore", () => ({
  useAuthStore: {
    getState: () => ({
      getIdToken: () => Promise.resolve("mock-token"),
    }),
  },
}));

describe("api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("GET request sends auth header", async () => {
    const mockResponse = { data: { id: 1 } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await api.get("/api/test");
    expect(result).toEqual(mockResponse);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/test"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer mock-token",
        }),
      }),
    );
  });

  it("POST sends JSON body", async () => {
    const body = { title: "test" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: body }),
    });

    await api.post("/api/test", body);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
      }),
    );
  });

  it("handles 204 No Content", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });

    const result = await api.delete("/api/test");
    expect(result).toEqual({ data: {} });
  });

  it("throws on error response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          error: { code: "BAD_REQUEST", message: "Invalid input" },
        }),
    });

    await expect(api.get("/api/test")).rejects.toThrow("Invalid input");
  });

  it("retries on 500 errors", async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () =>
            Promise.resolve({
              error: { code: "INTERNAL", message: "Server error" },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: "ok" }),
      });
    });

    const result = await api.get("/api/test");
    expect(result).toEqual({ data: "ok" });
    expect(callCount).toBe(2);
  });

  it("PUT sends correct method", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: {} }),
    });

    await api.put("/api/test", { key: "value" });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "PUT",
      }),
    );
  });

  it("DELETE sends correct method", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });

    await api.delete("/api/test");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });
});
