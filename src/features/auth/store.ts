import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Role } from "@/services/types";
import * as api from "@/services/api";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,
      async login(email, password) {
        set({ loading: true, error: null });
        try {
          const user = await api.login(email, password);
          set({ user, loading: false });
        } catch (e) {
          set({ error: (e as Error).message, loading: false });
          throw e;
        }
      },
      async register(name, email, password, role) {
        set({ loading: true, error: null });
        try {
          const user = await api.register(name, email, password, role);
          set({ user, loading: false });
        } catch (e) {
          set({ error: (e as Error).message, loading: false });
          throw e;
        }
      },
      logout() {
        set({ user: null });
      },
      clearError() {
        set({ error: null });
      },
    }),
    { name: "interviewai-auth" }
  )
);
