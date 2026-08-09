import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--c-background) / <alpha-value>)",
        base: "rgb(var(--c-background) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--c-surface) / <alpha-value>)",
          soft: "rgb(var(--c-surface-soft) / <alpha-value>)",
          card: "rgb(var(--c-surface) / <alpha-value>)",
        },
        line: {
          DEFAULT: "rgb(var(--c-border) / <alpha-value>)",
          strong: "rgb(var(--c-border-strong) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--c-text) / <alpha-value>)",
          dim: "rgb(var(--c-text-secondary) / <alpha-value>)",
          faint: "rgb(var(--c-text-muted) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--c-brand) / <alpha-value>)",
          soft: "rgb(var(--c-brand-soft) / <alpha-value>)",
          deep: "rgb(var(--c-brand-deep) / <alpha-value>)",
          faint: "rgb(var(--c-brand-faint) / <alpha-value>)",
        },
        violeta: "rgb(var(--c-ai) / <alpha-value>)",
        accent: "rgb(var(--c-info) / <alpha-value>)",
        success: "rgb(var(--c-success) / <alpha-value>)",
        successbg: "rgb(var(--c-success-bg) / <alpha-value>)",
        warn: "rgb(var(--c-warning) / <alpha-value>)",
        warnbg: "rgb(var(--c-warning-bg) / <alpha-value>)",
        danger: "rgb(var(--c-error) / <alpha-value>)",
        dangerbg: "rgb(var(--c-error-bg) / <alpha-value>)",
        infobg: "rgb(var(--c-info-bg) / <alpha-value>)",
        aibg: "rgb(var(--c-ai-bg) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "sans-serif"],
        display: ["Inter", "system-ui", "-apple-system", '"Segoe UI"', "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 1px 2px rgba(16, 24, 40, 0.06)",
        card: "0 1px 2px rgba(16, 24, 40, 0.04)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        flow: {
          "0%": { strokeDashoffset: "0" },
          "100%": { strokeDashoffset: "-32" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.45s ease-out both",
        "fade-in": "fade-in 0.3s ease-out both",
        "pulse-dot": "pulseDot 1.6s ease-in-out infinite",
        flow: "flow 0.8s linear infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;