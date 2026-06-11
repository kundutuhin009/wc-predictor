import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pitch / tournament palette — clean, warm, not casino neon.
        paper: "#FAFAF5",
        card: "#FFFFFF",
        ink: "#0E1F17", // deep pitch-black green, primary text
        muted: "#5B6B62",
        line: "#E6E7E0",
        pitch: {
          DEFAULT: "#0B7A4B", // grass green, primary action
          dark: "#085C39",
          light: "#E7F4EE",
        },
        amber: {
          DEFAULT: "#F4A300", // trophy amber, accent / highlight
          light: "#FDF1D6",
        },
        win: "#0B7A4B",
        miss: "#9AA4A0",
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
        card: "0 1px 2px rgba(14,31,23,0.04), 0 8px 24px -12px rgba(14,31,23,0.12)",
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
