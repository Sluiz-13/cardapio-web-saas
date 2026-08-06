import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Marca de cada restaurante (usado só em /r/[slug]) — não mexer.
        ink: "#211D1A",
        paper: "#F6EFE3",
        "paper-dim": "#EBE1CE",
        chalk: "#17140F",
        "chalk-2": "#2A241C",
        chili: "#C1440E",
        "chili-dark": "#9A360A",
        herb: "#4C6449",
        brass: "#B08D57",

        // Design system do painel (admin de restaurante + plataforma).
        surface: {
          bg: "#F7F8FA",
          DEFAULT: "#FFFFFF",
          border: "#E5E7EB",
        },
        brand: {
          DEFAULT: "#C75A1B",
          dark: "#A6480F",
          light: "#FBEAE0",
        },
      },
      fontFamily: {
        display: ["Oswald", "sans-serif"], // segue usado no cardápio público
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Inter", "Work Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;