import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#211D1A",
        paper: "#F6EFE3",
        "paper-dim": "#EBE1CE",
        chalk: "#17140F",
        "chalk-2": "#2A241C",
        chili: "#C1440E",
        "chili-dark": "#9A360A",
        herb: "#4C6449",
        brass: "#B08D57",
      },
      fontFamily: {
        display: ["Oswald", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
