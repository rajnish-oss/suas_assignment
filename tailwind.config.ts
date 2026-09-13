import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0B0D10",
          900: "#0E1116",
          800: "#141821",
          700: "#1C212C",
          600: "#272E3B",
          500: "#3A4354",
        },
        paper: {
          100: "#F4F5F3",
          200: "#E7E9E4",
          300: "#C7CBC3",
        },
        signal: {
          green: "#3ED2A6",
          amber: "#E8A33D",
          coral: "#F1614A",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "5px",
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
