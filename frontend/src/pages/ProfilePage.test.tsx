import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import ProfilePage from "./ProfilePage";

vi.mock("../api/user", () => ({
  userApi: {
    getMe: vi.fn(),
    updateMe: vi.fn(),
  },
}));

vi.mock("../stores/authStore", () => ({
  useAuthStore: vi.fn(() => ({
    user: { userId: "u1", email: "test@example.com" },
  })),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { userApi } from "../api/user";

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and displays profile data", async () => {
    vi.mocked(userApi.getMe).mockResolvedValue({
      data: {
        userId: "u1",
        displayName: "Test User",
        bio: "Hello",
        xHandle: "testuser",
        createdAt: "2025-01-01T00:00:00Z",
      },
    });

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Hello")).toBeInTheDocument();
      expect(screen.getByDisplayValue("testuser")).toBeInTheDocument();
    });
  });

  it("saves profile successfully", async () => {
    vi.mocked(userApi.getMe).mockResolvedValue({
      data: {
        userId: "u1",
        displayName: "Test",
        bio: "",
        xHandle: "",
        createdAt: "2025-01-01T00:00:00Z",
      },
    });
    vi.mocked(userApi.updateMe).mockResolvedValue({ data: {} });
    const toast = await import("react-hot-toast");

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(userApi.updateMe).toHaveBeenCalled();
      expect(toast.default.success).toHaveBeenCalledWith(
        "プロフィールを更新しました",
      );
    });
  });

  it("shows error toast on save failure", async () => {
    vi.mocked(userApi.getMe).mockResolvedValue({
      data: {
        userId: "u1",
        displayName: "Test",
        bio: "",
        xHandle: "",
        createdAt: "2025-01-01T00:00:00Z",
      },
    });
    vi.mocked(userApi.updateMe).mockRejectedValue(new Error("fail"));
    const toast = await import("react-hot-toast");

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("保存"));

    await waitFor(() => {
      expect(toast.default.error).toHaveBeenCalledWith("更新に失敗しました");
    });
  });

  it("shows email as read-only", async () => {
    vi.mocked(userApi.getMe).mockResolvedValue({
      data: {
        userId: "u1",
        displayName: "Test",
        bio: "",
        xHandle: "",
        createdAt: "2025-01-01T00:00:00Z",
      },
    });

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      const emailInput = screen.getByDisplayValue("test@example.com");
      expect(emailInput).toBeDisabled();
    });
  });
});
