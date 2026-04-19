import { create } from "zustand";
import { authService } from "@/services/auth";
import { registerAuthSessionHandlers } from "@/services/auth-session";
import { chatService } from "@/services/chat";
import { tokenStorage, userSnapshotStorage } from "@/utils/storage";
import { User } from "@/types/domain";
import { getErrorMessage, isConnectionError } from "@/utils/errors";
import { logger } from "@/utils/logger";

type AuthState = {
  user: User | null;
  accessToken: string | null;
  isHydrated: boolean;
  isRefreshing: boolean;
  bootError: string | null;
  setUser: (user: User) => void;
  setSession: (payload: { user: User; accessToken: string }) => void;
  clearBootError: () => void;
  refreshSession: () => Promise<string | null>;
  clearSession: () => Promise<void>;
  signIn: (payload: { identifier: string; password: string }) => Promise<void>;
  signUp: (payload: {
    name?: string;
    email: string;
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  hydrate: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isHydrated: false,
  isRefreshing: false,
  bootError: null,
  setUser(user) {
    void userSnapshotStorage.setUser(user);
    set({ user });
  },
  setSession({ user, accessToken }) {
    void userSnapshotStorage.setUser(user);
    set({ user, accessToken, isHydrated: true, bootError: null });
  },
  clearBootError() {
    set({ bootError: null });
  },
  async signIn(payload) {
    const result = await authService.login(payload);
    await Promise.all([
      tokenStorage.setTokens(result.accessToken, result.refreshToken),
      userSnapshotStorage.setUser(result.user),
    ]);
    set({ user: result.user, accessToken: result.accessToken, isHydrated: true, bootError: null });
  },
  async signUp(payload) {
    const result = await authService.register(payload);
    await Promise.all([
      tokenStorage.setTokens(result.accessToken, result.refreshToken),
      userSnapshotStorage.setUser(result.user),
    ]);
    set({ user: result.user, accessToken: result.accessToken, isHydrated: true, bootError: null });
  },
  async hydrate() {
    set({ bootError: null });

    try {
      const accessToken = await tokenStorage.getAccessToken();

      if (!accessToken) {
        set({ isHydrated: true, bootError: null });
        return;
      }

      try {
        const user = await authService.fetchMe();
        await userSnapshotStorage.setUser(user);
        set({ user, accessToken, isHydrated: true, bootError: null });
      } catch (error) {
        if (isConnectionError(error)) {
          const message = getErrorMessage(error, "Connection error. Check your network and try again.");
          const cachedUser = await userSnapshotStorage.getUser();
          logger.error("Auth hydration failed due to connection error", message);
          set({ user: cachedUser, accessToken, isHydrated: true, bootError: message });
          return;
        }

        const nextAccessToken = await useAuthStore.getState().refreshSession();

        if (!nextAccessToken) {
          await useAuthStore.getState().clearSession();
          set({ isHydrated: true, bootError: null });
          return;
        }

        try {
          const user = await authService.fetchMe();
          await userSnapshotStorage.setUser(user);
          set({ user, accessToken: nextAccessToken, isHydrated: true, bootError: null });
        } catch (retryError) {
          if (isConnectionError(retryError)) {
            const message = getErrorMessage(retryError, "Connection error. Check your network and try again.");
            const cachedUser = await userSnapshotStorage.getUser();
            logger.error("Auth hydration retry failed due to connection error", message);
            set({ user: cachedUser, accessToken: nextAccessToken, isHydrated: true, bootError: message });
            return;
          }

          await useAuthStore.getState().clearSession();
          set({ isHydrated: true, bootError: null });
        }
      }
    } catch (error) {
      logger.error("Auth hydration crashed", error);
      await useAuthStore.getState().clearSession();
      set({ isHydrated: true, bootError: null });
    }
  },
  async refreshSession() {
    const state = useAuthStore.getState();

    if (state.isRefreshing) {
      return new Promise((resolve) => {
        const poll = async () => {
          const nextState = useAuthStore.getState();

          if (!nextState.isRefreshing) {
            resolve(nextState.accessToken);
            return;
          }

          setTimeout(poll, 100);
        };

        void poll();
      });
    }

    const refreshToken = await tokenStorage.getRefreshToken();

    if (!refreshToken) {
      return null;
    }

    set({ isRefreshing: true });

    try {
      const result = await authService.refresh(refreshToken);
      await tokenStorage.setTokens(result.accessToken, result.refreshToken);
      set({ accessToken: result.accessToken, isRefreshing: false });
      return result.accessToken;
    } catch {
      await useAuthStore.getState().clearSession();
      set({ isRefreshing: false });
      return null;
    }
  },
  async clearSession() {
    chatService.disconnect();
    await tokenStorage.clear();
    set({ user: null, accessToken: null, isRefreshing: false });
  },
  async signOut() {
    const refreshToken = await tokenStorage.getRefreshToken();

    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      // Local sign-out should still complete if the session is already invalid server-side.
    } finally {
      await useAuthStore.getState().clearSession();
    }

    set({ isHydrated: true });
  },
}));

registerAuthSessionHandlers({
  refreshSession: () => useAuthStore.getState().refreshSession(),
  clearSession: () => useAuthStore.getState().clearSession(),
});
