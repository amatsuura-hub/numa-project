import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import SignupPage from "./SignupPage";

const mockSignup = vi.fn();
const mockConfirmSignup = vi.fn();
const mockNavigate = vi.fn();

vi.mock("../stores/authStore", () => ({
  useAuthStore: vi.fn(() => ({
    signup: mockSignup,
    confirmSignup: mockConfirmSignup,
    error: null,
  })),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("SignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders signup form", () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "サインアップ" })).toBeInTheDocument();
    expect(screen.getByLabelText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード")).toBeInTheDocument();
    expect(screen.getByLabelText("パスワード（確認）")).toBeInTheDocument();
  });

  it("shows password validation error for short password", async () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText("パスワード"), "short");

    expect(
      screen.getByText("パスワードは8文字以上にしてください"),
    ).toBeInTheDocument();
  });

  it("shows password validation error for missing uppercase", async () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText("パスワード"), "lowercase1!");

    expect(screen.getByText("大文字を含めてください")).toBeInTheDocument();
  });

  it("shows password mismatch error", async () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText("パスワード"), "Password1!");
    await userEvent.type(
      screen.getByLabelText("パスワード（確認）"),
      "Different1!",
    );

    expect(
      screen.getByText("パスワードが一致しません"),
    ).toBeInTheDocument();
  });

  it("disables submit when password has errors", async () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText("パスワード"), "short");
    await userEvent.type(screen.getByLabelText("パスワード（確認）"), "short");

    expect(
      screen.getByRole("button", { name: "サインアップ" }),
    ).toBeDisabled();
  });

  it("submits signup and shows confirmation step", async () => {
    mockSignup.mockResolvedValue(undefined);
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );

    await userEvent.type(
      screen.getByLabelText("メールアドレス"),
      "test@test.com",
    );
    await userEvent.type(screen.getByLabelText("パスワード"), "Password1!");
    await userEvent.type(
      screen.getByLabelText("パスワード（確認）"),
      "Password1!",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "サインアップ" }),
    );

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith("test@test.com", "Password1!");
      expect(screen.getByText("メール確認")).toBeInTheDocument();
    });
  });

  it("has link to login page", () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("ログイン")).toHaveAttribute("href", "/login");
  });
});
