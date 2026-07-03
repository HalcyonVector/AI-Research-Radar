import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          elevated: "var(--bg-elevated)",
          subtle: "var(--bg-subtle)",
        },
        border: {
          base: "var(--border-base)",
          strong: "var(--border-strong)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
        },
        accent: {
          primary: "var(--accent-primary)",
          hover: "var(--accent-hover)",
          subtle: "var(--accent-subtle)",
          cyan: "var(--accent-2)",
          violet: "var(--accent-3)",
          pink: "var(--accent-4)",
        },
        cat: {
          llms: "#6366f1",
          agents: "#f59e0b",
          reasoning: "#10b981",
          vision: "#3b82f6",
          multimodal: "#8b5cf6",
          robotics: "#ef4444",
          rl: "#ec4899",
          infra: "#6b7280",
          rag: "#14b8a6",
          speech: "#f97316",
          coding: "#84cc16",
          mcp: "#a78bfa",
          synth: "#06b6d4",
          evals: "#fbbf24",
        },
        score: {
          low: "#565656",
          mid: "#8a8a8a",
          high: "#cfcfcf",
          top: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["var(--font-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "0.25rem",
        "2xl": "0.25rem",
      },
      transitionDuration: {
        "150": "150ms",
      },
      backgroundImage: {
        "gradient-brand": "none",
        "gradient-radial": "none",
      },
      boxShadow: {
        glow: "none",
        "glow-cyan": "none",
        "glow-sm": "none",
        card: "none",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-glow": {
          "0%,100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out",
        shimmer: "shimmer 1.5s infinite",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
