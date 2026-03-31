import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TopPage from "./TopPage";

vi.mock("../api/roadmap", () => ({
  roadmapApi: {
    explore: vi.fn(),
  },
}));

vi.mock("../stores/authStore", () => ({
  useAuthStore: vi.fn(() => ({ user: null })),
}));

import { roadmapApi } from "../api/roadmap";

describe("TopPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders hero section and CTA", async () => {
    vi.mocked(roadmapApi.explore).mockResolvedValue({
      data: { roadmaps: [] },
    });
    render(
      <MemoryRouter>
        <TopPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("沼を探しに行く")).toBeInTheDocument();
    });
    expect(screen.getAllByText(/好きなこと/).length).toBeGreaterThan(0);
  });

  it("renders fallback roadmaps when API returns empty", async () => {
    vi.mocked(roadmapApi.explore).mockResolvedValue({
      data: { roadmaps: [] },
    });
    render(
      <MemoryRouter>
        <TopPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByText("格ゲー初心者脱出ロードマップ"),
      ).toBeInTheDocument();
    });
  });

  it("renders API roadmaps when available", async () => {
    vi.mocked(roadmapApi.explore).mockResolvedValue({
      data: {
        roadmaps: [
          {
            roadmapId: "r1",
            title: "Live Roadmap",
            description: "desc",
            userId: "u1",
            category: "programming",
            tags: [],
            isPublic: true,
            likeCount: 5,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z",
          },
        ],
      },
    });
    render(
      <MemoryRouter>
        <TopPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Live Roadmap")).toBeInTheDocument();
    });
  });

  it("renders category links", async () => {
    vi.mocked(roadmapApi.explore).mockResolvedValue({
      data: { roadmaps: [] },
    });
    render(
      <MemoryRouter>
        <TopPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("カテゴリから沼を探す")).toBeInTheDocument();
    });
  });

  it("renders how-it-works section", async () => {
    vi.mocked(roadmapApi.explore).mockResolvedValue({
      data: { roadmaps: [] },
    });
    render(
      <MemoryRouter>
        <TopPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Numaの使い方")).toBeInTheDocument();
      expect(screen.getByText("沼を見つける")).toBeInTheDocument();
    });
  });
});
