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
          DEFAULT: "#1C2B39",
          dark: "#131E28",
          light: "#28384A",
        },
        paper: {
          DEFAULT: "#FBF7EF",
          dim: "#F1EADA",
        },
        brass: {
          DEFAULT: "#B8863B",
          light: "#D9A85C",
          dark: "#8C6529",
        },
        sage: {
          DEFAULT: "#5F7161",
          light: "#7C8F6E",
        },
        rust: {
          DEFAULT: "#A24936",
        },
        muted: "#7C8894",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "grain": "radial-gradient(circle at 1px 1px, rgba(251,247,239,0.06) 1px, transparent 0)",
      },
      boxShadow: {
        pin: "0 10px 30px -12px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
