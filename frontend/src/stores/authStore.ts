import { create } from "zustand";
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const userPool = new CognitoUserPool({
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || "",
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || "",
});

interface AuthUser {
  userId: string;
  email: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;

  initialize: () => void;
  signup: (email: string, password: string) => Promise<void>;
  confirmSignup: (email: string, code: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  getIdToken: () => string | null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  initialize: () => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      set({ isLoading: false });
      return;
    }

    cognitoUser.getSession(
      (err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session?.isValid()) {
          set({ user: null, isLoading: false });
          return;
        }

        const payload = session.getIdToken().decodePayload();
        set({
          user: {
            userId: payload["sub"] as string,
            email: payload["email"] as string,
          },
          isLoading: false,
        });
      },
    );
  },

  signup: async (email: string, password: string) => {
    set({ error: null });
    return new Promise<void>((resolve, reject) => {
      const attributes = [
        new CognitoUserAttribute({ Name: "email", Value: email }),
      ];

      userPool.signUp(email, password, attributes, [], (err) => {
        if (err) {
          set({ error: err.message });
          reject(err);
          return;
        }
        resolve();
      });
    });
  },

  confirmSignup: async (email: string, code: string) => {
    set({ error: null });
    return new Promise<void>((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) {
          set({ error: err.message });
          reject(err);
          return;
        }
        resolve();
      });
    });
  },

  login: async (email: string, password: string) => {
    set({ error: null });
    return new Promise<void>((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool,
      });

      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password,
      });

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => {
          const payload = session.getIdToken().decodePayload();
          set({
            user: {
              userId: payload["sub"] as string,
              email: payload["email"] as string,
            },
            error: null,
          });
          resolve();
        },
        onFailure: (err) => {
          set({ error: err.message });
          reject(err);
        },
      });
    });
  },

  logout: () => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
    set({ user: null });
  },

  getIdToken: () => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) return null;

    let token: string | null = null;
    cognitoUser.getSession(
      (err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session) {
          // Session expired and refresh failed — clear user state
          set({ user: null });
          return;
        }
        if (session.isValid()) {
          token = session.getIdToken().getJwtToken();
        } else {
          // Session invalid — clear user state
          set({ user: null });
        }
      },
    );
    return token;
  },
}));
