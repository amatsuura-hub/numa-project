import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RoadmapDetailPage from "./RoadmapDetailPage";

// Mock ReactFlow since it requires DOM measurements
vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">{children}</div>
  ),
  Background: () => null,
  Controls: () => null,
  MiniMap: () => null,
}));

vi.mock("../hooks/useRoadmapDetail", () => ({
  useRoadmapDetail: vi.fn(),
}));

import { useRoadmapDetail } from "../hooks/useRoadmapDetail";

const mockDetail = {
  meta: {
    roadmapId: "r1",
    title: "React入門",
    description: "Reactの基礎",
    userId: "owner-1",
    category: "programming",
    tags: [],
    isPublic: true,
    likeCount: 10,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  },
  nodes: [
    {
      nodeId: "n1",
      label: "JSX",
      description: "",
      posX: 0,
      posY: 0,
      color: "#16a34a",
      url: "",
      order: 0,
    },
  ],
  edges: [],
  isLiked: false,
  isBookmarked: false,
};

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={["/roadmaps/r1"]}>
      <Routes>
        <Route path="/roadmaps/:id" element={<RoadmapDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RoadmapDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders roadmap detail", async () => {
    vi.mocked(useRoadmapDetail).mockReturnValue({
      detail: mockDetail,
      isLoading: false,
      error: null,
      progress: null,
      user: null,
      handleToggleComplete: vi.fn(),
      retry: vi.fn(),
    } as ReturnType<typeof useRoadmapDetail>);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("React入門")).toBeInTheDocument();
    });
    expect(screen.getByText("Reactの基礎")).toBeInTheDocument();
    expect(screen.getByTestId("react-flow")).toBeInTheDocument();
  });

  it("renders error state", async () => {
    vi.mocked(useRoadmapDetail).mockReturnValue({
      detail: null,
      isLoading: false,
      error: "ロードマップが見つかりません",
      progress: null,
      user: null,
      handleToggleComplete: vi.fn(),
      retry: vi.fn(),
    } as ReturnType<typeof useRoadmapDetail>);

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText("ロードマップが見つかりません"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("ロードマップを探す")).toBeInTheDocument();
  });

  it("shows edit button for owner", async () => {
    vi.mocked(useRoadmapDetail).mockReturnValue({
      detail: mockDetail,
      isLoading: false,
      error: null,
      progress: null,
      user: { userId: "owner-1", email: "test@test.com" },
      handleToggleComplete: vi.fn(),
      retry: vi.fn(),
    } as ReturnType<typeof useRoadmapDetail>);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("編集")).toBeInTheDocument();
    });
  });

  it("hides edit button for non-owner", async () => {
    vi.mocked(useRoadmapDetail).mockReturnValue({
      detail: mockDetail,
      isLoading: false,
      error: null,
      progress: null,
      user: { userId: "other-user", email: "other@test.com" },
      handleToggleComplete: vi.fn(),
      retry: vi.fn(),
    } as ReturnType<typeof useRoadmapDetail>);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("React入門")).toBeInTheDocument();
    });
    expect(screen.queryByText("編集")).not.toBeInTheDocument();
  });
});
