import type { Config } from "tailwindcss";

// Токены из CLAUDE.md, раздел 9. Цвета цехов — общеплатформенные, не зависят
// от того, какие цеха реально задействует конкретный проект.
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dept: {
          dir: "#F5A06A",
          rezh: "#8DB8F2",
          oper: "#86CF9F",
          rekv: "#F5CF4B",
          kost: "#F29BBE",
          grim: "#BCA8F0",
          svet: "#F7E08A",
          zvuk: "#9ED9E0",
          hud: "#D7B48E",
          cast: "#F4A7A0",
          trans: "#B9C4CF",
          other: "#E3E6EA",
        },
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        text: "var(--color-text)",
        muted: "var(--color-muted)",
        accent: "var(--color-accent)",
        danger: "var(--color-danger)",
        border: "var(--color-border)",
      },
      spacing: {
        tap: "48px",
      },
      minHeight: {
        tap: "48px",
      },
      minWidth: {
        tap: "48px",
      },
    },
  },
  plugins: [],
} satisfies Config;
