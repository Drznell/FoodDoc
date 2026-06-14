/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#26B160",
        "primary-dark": "#1EA559",
        "primary-glow": "rgba(38, 177, 96, 0.2)",
        dark: {
          900: "#0a0f0a",
          800: "#111611",
          700: "#1a221a",
          600: "#243024",
        }
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(38, 177, 96, 0.25)',
        'glow-sm': '0 0 10px rgba(38, 177, 96, 0.15)',
      }
    },
  },
  plugins: [],
}
