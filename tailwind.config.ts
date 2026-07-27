import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.{js,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Design-system tokens (revamp) — namespaced under `lui` so existing
        // utilities are unaffected. Values resolve to the ported CSS variables.
        lui: {
          bg: "var(--bg)",
          panel: "var(--panel)",
          sidebar: "var(--sidebar)",
          border: "var(--border)",
          "border-strong": "var(--border-strong)",
          divider: "var(--divider)",
          text: "var(--text)",
          "text-2": "var(--text-2)",
          "text-3": "var(--text-3)",
          brand: "var(--brand)",
          "brand-strong": "var(--brand-strong)",
          "brand-ink": "var(--brand-ink)",
          "brand-soft": "var(--brand-soft)",
          navy: "var(--navy)",
          ok: "var(--ok)",
          warn: "var(--warn)",
          danger: "var(--danger)",
        },
      },
      fontFamily: {
        "lui-sans": ["var(--font-lui-sans)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        "lui-serif": ["var(--font-lui-serif)", "Source Serif 4", "Georgia", "serif"],
      },
      borderRadius: {
        "lui-lg": "var(--r-lg)",
        lui: "var(--r)",
        "lui-sm": "var(--r-sm)",
      },
      boxShadow: {
        "lui-sm": "var(--sh-sm)",
        lui: "var(--sh)",
        "lui-lg": "var(--sh-lg)",
      },
    },
  },
  plugins: [],
} satisfies Config;
