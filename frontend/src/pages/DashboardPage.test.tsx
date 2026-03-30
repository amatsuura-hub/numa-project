import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "./DashboardPage";

vi.mock("../api/roadmap", () => ({
  roadmapApi: {
    getMy: vi.fn(),
    getBookmarks: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => {
  const toast = Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  });
  return { default: toast };
});

import { roadmapApi } from "../api/roadmap";

const mockRoadmaps = [
  {
    roadmapId: "r1",
    title: "Test Roadmap",
    description: "desc",
    userId: "u1",
    category: "programming",
    tags: [],
    isPublic: true,
    likeCount: 5,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
];

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner initially", () => {
    vi.mocked(roadmapApi.getMy).mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("ダッシュボード")).toBeInTheDocument();
  });

  it("renders roadmaps after loading", async () => {
    vi.mocked(roadmapApi.getMy).mockResolvedValue({
      data: { roadmaps: mockRoadmaps },
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(screen.getByText("Test Roadmap")).toBeInTheDocument();
    });
    expect(screen.getByText("公開")).toBeInTheDocument();
  });

  it("renders empty state when no roadmaps", async () => {
    vi.mocked(roadmapApi.getMy).mockResolvedValue({
      data: { roadmaps: [] },
    });
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    await waitFor(() => {
      expect(
        screen.getByText(
          "まだロードマップがありません。最初のロードマップを作成しましょう！",
        ),
      ).toBeInTheDocument();
    });
  });

  it("switches to bookmarks tab", async () => {
    vi.mocked(roadmapApi.getMy).mockResolvedValue({
      data: { roadmaps: [] },
    });
    vi.mocked(roadmapApi.getBookmarks).mockResolvedValue({
      data: { bookmarks: [] },
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(roadmapApi.getMy).toHaveBeenCalled();
    });

    const bookmarkTab = screen.getByText("ブックマーク");
    await userEvent.click(bookmarkTab);

    await waitFor(() => {
      expect(roadmapApi.getBookmarks).toHaveBeenCalled();
    });
  });

  it("deletes a roadmap with undo toast", async () => {
    vi.mocked(roadmapApi.getMy).mockResolvedValue({
      data: { roadmaps: mockRoadmaps },
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Test Roadmap")).toBeInTheDocument();
    });

    // Click "削除" to show confirmation
    await userEvent.click(screen.getByText("削除"));

    // Click "削除する" to confirm deletion
    await userEvent.click(screen.getByText("削除する"));

    // Roadmap should be optimistically removed from the UI
    await waitFor(() => {
      expect(screen.queryByText("Test Roadmap")).not.toBeInTheDocument();
    });
  });
});
