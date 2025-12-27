/** @type {import('tailwindcss').Config} */
export default {
  content: ["./entrypoints/**/*.{html,js,ts,tsx}", "./pages/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        "theme-inter": ['"Inter"', "sans-serif"],
        "theme-ibm-mono": ['"IBM Plex Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
