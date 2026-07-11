import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#10b981",
        danger: "#ef4444",
        warning: "#f59e0b",
        dark: "#1f2937",
        light: "#f9fafb",
      },
    },
  },
  plugins: [],
};
export default config;
