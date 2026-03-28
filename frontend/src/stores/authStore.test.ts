import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock amazon-cognito-identity-js before importing authStore
const mockGetSession = vi.fn();
const mockSignOut = vi.fn();
const mockGetCurrentUser = vi.fn();
const mockSignUp = vi.fn();
const mockConfirmRegistration = vi.fn();
const mockAuthenticateUser = vi.fn();

vi.mock("amazon-cognito-identity-js", () => {
  return {
    CognitoUserPool: vi.fn().mockImplementation(() => ({
      getCurrentUser: mockGetCurrentUser,
      signUp: mockSignUp,
    })),
    CognitoUser: vi.fn().mockImplementation(() => ({
      getSession: mockGetSession,
      signOut: mockSignOut,
      confirmRegistration: mockConfirmRegistration,
      authenticateUser: mockAuthenticateUser,
    })),
    AuthenticationDetails: vi.fn(),
    CognitoUserAttribute: vi.fn(),
  };
});

describe("authStore", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mockGetCurrentUser.mockReturnValue(null);
  });

  it("initializes with no user when no current session", async () => {
    const { useAuthStore } = await import("./authStore");
    const store = useAuthStore.getState();
    store.initialize();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it("initializes with user when valid session exists", async () => {
    const mockCognitoUser = {
      getSession: vi.fn((cb: Function) => {
        const session = {
          isValid: () => true,
          getIdToken: () => ({
            decodePayload: () => ({
              sub: "user-123",
              email: "test@example.com",
            }),
          }),
        };
        cb(null, session);
      }),
    };
    mockGetCurrentUser.mockReturnValue(mockCognitoUser);

    const { useAuthStore } = await import("./authStore");
    const store = useAuthStore.getState();
    store.initialize();

    const state = useAuthStore.getState();
    expect(state.user).toEqual({
      userId: "user-123",
      email: "test@example.com",
    });
    expect(state.isLoading).toBe(false);
  });

  it("logout clears user", async () => {
    const { useAuthStore } = await import("./authStore");
    useAuthStore.setState({
      user: { userId: "user-1", email: "test@test.com" },
    });

    mockGetCurrentUser.mockReturnValue({ signOut: mockSignOut });

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
  });

  it("getIdToken returns null when no user", async () => {
    const { useAuthStore } = await import("./authStore");
    const token = await useAuthStore.getState().getIdToken();
    expect(token).toBeNull();
  });

  it("signup calls cognito signUp", async () => {
    mockSignUp.mockImplementation(
      (_email: string, _pw: string, _attrs: unknown[], _validation: unknown[], cb: Function) => {
        cb(null, { user: {} });
      },
    );

    const { useAuthStore } = await import("./authStore");
    await useAuthStore.getState().signup("test@test.com", "Password1!");

    expect(mockSignUp).toHaveBeenCalled();
  });

  it("signup sets error on failure", async () => {
    mockSignUp.mockImplementation(
      (_email: string, _pw: string, _attrs: unknown[], _validation: unknown[], cb: Function) => {
        cb(new Error("User already exists"));
      },
    );

    const { useAuthStore } = await import("./authStore");
    await expect(
      useAuthStore.getState().signup("test@test.com", "Password1!"),
    ).rejects.toThrow("User already exists");

    expect(useAuthStore.getState().error).toBe("User already exists");
  });
});
