import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, setToken } from "@/lib/api";
import type { AuthData, Org, User } from "@/lib/types";

interface AuthState {
  user: User | null;
  org: Org | null;
  token: string;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { name: string; email: string; password: string; orgName: string }) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setOrg: (orgId: string) => Promise<void>;
}

const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      org: null,
      token: "",
      ready: false,

      login: async (email, password) => {
        const data = await api<{ token: string; user: User; org: Org }>("/api/auth/login", {
          body: { email, password },
        });
        setToken(data.token);
        set({ user: data.user, org: data.org, token: data.token });
      },

      register: async (payload) => {
        const data = await api<{ token: string; user: User; org: Org }>("/api/auth/register", {
          body: payload,
        });
        setToken(data.token);
        set({ user: data.user, org: data.org, token: data.token });
      },

      logout: async () => {
        try {
          await api("/api/auth/logout");
        } catch {
          /* ignore */
        }
        setToken("");
        set({ user: null, org: null, token: "" });
      },

      hydrate: async () => {
        try {
          const data = await api<{ user: User; org: Org }>("/api/auth/me");
          set({ user: data.user, org: data.org, ready: true });
        } catch {
          setToken("");
          set({ user: null, org: null, token: "", ready: true });
        }
      },

      setOrg: async (orgId) => {
        const data = await api<{ token: string; user: User; org: Org }>("/api/auth/switch", {
          body: { orgId },
        });
        setToken(data.token);
        set({ user: data.user, org: data.org, token: data.token });
      },
    }),
    {
      name: "flowpilot-auth",
      partialize: (s) => ({ user: s.user, org: s.org, token: s.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setToken(state.token);
      },
    },
  ),
);

export default useAuth;