/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefbff",
          500: "#0ea5e9",
          700: "#0369a1"
        }
      }
    }
  },
  plugins: []
};
