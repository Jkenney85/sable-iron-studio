import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Editorial ink-and-bone palette with a single vermilion accent.
        ink: {
          DEFAULT: "#0b0b0d",
          soft: "#141417",
          raised: "#1c1c21",
          line: "#2a2a30",
        },
        bone: {
          DEFAULT: "#f3efe6",
          soft: "#d8d3c6",
          muted: "#9a9488",
        },
        vermilion: {
          DEFAULT: "#e2472a",
          soft: "#ef6a50",
          deep: "#a82f18",
        },
        oxblood: "#5a1a12",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      letterSpacing: {
        widest: "0.32em",
      },
      maxWidth: {
        editorial: "76rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.9s ease both",
        marquee: "marquee 34s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
