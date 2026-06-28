import { create } from "zustand";
import type { User } from "@/types";
import { authApi, setToken } from "@/services/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (account: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  fetchProfile: () => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,

  login: async (account, password) => {
    const { token, user } = await authApi.login({ account, password });
    setToken(token);
    set({ user });
  },

  register: async (username, email, password) => {
    const { token, user } = await authApi.register({ username, email, password });
    setToken(token);
    set({ user });
  },

  fetchProfile: async () => {
    try {
      const user = await authApi.profile();
      set({ user });
    } catch {
      setToken(null);
      set({ user: null });
    }
  },

  logout: () => {
    setToken(null);
    set({ user: null });
  },

  isAdmin: () => get().user?.role === "ADMIN",
}));
