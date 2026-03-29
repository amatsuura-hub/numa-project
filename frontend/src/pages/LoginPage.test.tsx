import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../stores/authStore", () => ({
  useAuthStore: vi.fn(() => ({
    login: mockLogin,
    error: null,
    isLoading: false,
  })),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "ログイン" })).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
  });

  it("submits login form", async () => {
    mockLogin.mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText("メールアドレス"), "test@test.com");
    await userEvent.type(screen.getByLabelText("パスワード"), "Password1!");
    await userEvent.click(screen.getByRole("button", { name: "ログイン" }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("test@test.com", "Password1!");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows error message from store", async () => {
    const { useAuthStore } = await import("../stores/authStore");
    vi.mocked(useAuthStore).mockReturnValue({
      login: mockLogin,
      error: "Invalid credentials",
      isLoading: false,
    } as ReturnType<typeof useAuthStore>);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
  });

  it("has link to signup page", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("サインアップ")).toHaveAttribute("href", "/signup");
  });
});
