/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif JP"', "serif"],
        sans: ['"Noto Sans JP"', "system-ui", "sans-serif"],
      },
      colors: {
        numa: {
          bg: "#f8f5ef",
          "bg-warm": "#f0ead8",
          text: "#3a3428",
          "text-muted": "#8a7e6e",
          "text-hint": "#aaa28e",
          gold: "#8a7248",
          brown: "#5a4628",
          border: "rgba(90,70,40,.08)",
          "border-hover": "rgba(90,70,40,.2)",
          // Legacy green (used by editor, dashboard, etc.)
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
        },
        swamp: {
          50: "#e8f0e4",
          100: "#d4e8c8",
          200: "#a8cca0",
          300: "#8aba82",
          400: "#6aaa5c",
          500: "#4a9a44",
          600: "#3a7a34",
          700: "#2d5a32",
          800: "#1e4a20",
          900: "#1B5E20",
        },
      },
    },
  },
  plugins: [],
};
