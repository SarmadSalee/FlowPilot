import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", t === "dark");
  root.style.colorScheme = t;
}

export const useTheme = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      toggle: () =>
        set((s) => {
          const next: Theme = s.theme === "light" ? "dark" : "light";
          applyTheme(next);
          return { theme: next };
        }),
      setTheme: (t) => {
        applyTheme(t);
        set({ theme: t });
      },
    }),
    { name: "flowpilot-theme" },
  ),
);

if (typeof document !== "undefined") {
  applyTheme(useTheme.getState().theme);
}