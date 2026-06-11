import type { Config } from "tailwindcss";

// All palette colors are driven by CSS variables (RGB triplets defined in
// globals.css :root), exposed through the `rgb(var(--x) / <alpha-value>)`
// channel form so Tailwind opacity modifiers (bg-pitch/50 etc.) still work.
const c = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: c("--c-paper"),
        card: c("--c-card"),
        ink: c("--c-ink"),
        muted: c("--c-muted"),
        line: c("--c-line"),
        // Vivid pitch green — primary. `DEFAULT` is a bright fill (use INK text
        // on it); `dark` is the text-safe deep green for green text on light.
        pitch: {
          DEFAULT: c("--c-pitch"),
          dark: c("--c-pitch-dark"),
          light: c("--c-pitch-light"),
        },
        // Tournament gold — punchy secondary. `DEFAULT` is a bright fill (INK
        // text); `dark` is text-safe gold for gold text on light.
        amber: {
          DEFAULT: c("--c-amber"),
          dark: c("--c-amber-dark"),
          light: c("--c-amber-light"),
        },
        electric: c("--c-electric"),
        win: c("--c-win"),
        miss: c("--c-miss"),
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(6,33,25,0.05), 0 12px 28px -14px rgba(6,33,25,0.18)",
        glow: "0 8px 24px -8px rgba(18,197,110,0.45)",
      },
      keyframes: {
        "pop-in": {
          "0%": { transform: "scale(0.96)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "pop-in": "pop-in 0.18s ease-out",
        "slide-up": "slide-up 0.24s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
