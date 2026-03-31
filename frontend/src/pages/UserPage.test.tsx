import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import UserPage from "./UserPage";

vi.mock("../api/user", () => ({
  userApi: {
    getUser: vi.fn(),
    getUserRoadmaps: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    error: vi.fn(),
  },
}));

import { userApi } from "../api/user";

const mockUser = {
  userId: "u1",
  displayName: "テストユーザー",
  bio: "テストの自己紹介",
  xHandle: "testuser",
  createdAt: "2025-01-01T00:00:00Z",
};

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

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={["/users/u1"]}>
      <Routes>
        <Route path="/users/:id" element={<UserPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("UserPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders user profile and roadmaps", async () => {
    vi.mocked(userApi.getUser).mockResolvedValue({ data: mockUser });
    vi.mocked(userApi.getUserRoadmaps).mockResolvedValue({
      data: { roadmaps: mockRoadmaps },
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("テストユーザー")).toBeInTheDocument();
    });
    expect(screen.getByText("テストの自己紹介")).toBeInTheDocument();
    expect(screen.getByText("@testuser")).toBeInTheDocument();
    expect(screen.getByText("Test Roadmap")).toBeInTheDocument();
  });

  it("renders empty roadmap state", async () => {
    vi.mocked(userApi.getUser).mockResolvedValue({ data: mockUser });
    vi.mocked(userApi.getUserRoadmaps).mockResolvedValue({
      data: { roadmaps: [] },
    });

    renderWithRouter();

    await waitFor(() => {
      expect(
        screen.getByText("公開されているロードマップはありません。"),
      ).toBeInTheDocument();
    });
  });

  it("renders error state on API failure", async () => {
    vi.mocked(userApi.getUser).mockRejectedValue(new Error("not found"));

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText("not found")).toBeInTheDocument();
    });
  });
});
