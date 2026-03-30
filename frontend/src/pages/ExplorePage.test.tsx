import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ExplorePage from "./ExplorePage";

vi.mock("../api/roadmap", () => ({
  roadmapApi: {
    explore: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
  },
}));

import { roadmapApi } from "../api/roadmap";

const mockRoadmaps = [
  {
    roadmapId: "r1",
    title: "React Roadmap",
    description: "Learn React",
    userId: "u1",
    category: "programming",
    tags: ["react"],
    isPublic: true,
    likeCount: 10,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  {
    roadmapId: "r2",
    title: "Guitar Roadmap",
    description: "Learn guitar",
    userId: "u2",
    category: "music",
    tags: [],
    isPublic: true,
    likeCount: 3,
    createdAt: "2025-02-01T00:00:00Z",
    updatedAt: "2025-02-01T00:00:00Z",
  },
];

describe("ExplorePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders roadmaps after loading", async () => {
    vi.mocked(roadmapApi.explore).mockResolvedValue({
      data: { roadmaps: mockRoadmaps },
    });
    render(
      <MemoryRouter>
        <ExplorePage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("React Roadmap")).toBeInTheDocument();
      expect(screen.getByText("Guitar Roadmap")).toBeInTheDocument();
    });
  });

  it("renders empty state", async () => {
    vi.mocked(roadmapApi.explore).mockResolvedValue({
      data: { roadmaps: [] },
    });
    render(
      <MemoryRouter>
        <ExplorePage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByText("まだ公開ロードマップがありません"),
      ).toBeInTheDocument();
    });
  });

  it("filters by category", async () => {
    vi.mocked(roadmapApi.explore).mockResolvedValue({
      data: { roadmaps: mockRoadmaps },
    });
    render(
      <MemoryRouter>
        <ExplorePage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(roadmapApi.explore).toHaveBeenCalled();
    });

    vi.mocked(roadmapApi.explore).mockResolvedValue({
      data: { roadmaps: [mockRoadmaps[0]] },
    });
    // Use getAllByText since the category name appears in both filter button and card
    const buttons = screen.getAllByText("プログラミング");
    await userEvent.click(buttons[0]);

    await waitFor(() => {
      expect(roadmapApi.explore).toHaveBeenCalledWith(
        expect.objectContaining({ category: "programming" }),
      );
    });
  });

  it("shows load more button when cursor exists", async () => {
    vi.mocked(roadmapApi.explore).mockResolvedValue({
      data: { roadmaps: mockRoadmaps, cursor: "next-page" },
    });
    render(
      <MemoryRouter>
        <ExplorePage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("もっと見る")).toBeInTheDocument();
    });
  });

  it("shows error toast on API failure", async () => {
    vi.mocked(roadmapApi.explore).mockRejectedValue(new Error("fail"));
    const toast = await import("react-hot-toast");
    render(
      <MemoryRouter>
        <ExplorePage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith(
        "ロードマップの読み込みに失敗しました",
      );
    });
  });
});
