/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./*.js",
    "./src/**/*.{js,html}"
  ],
  theme: {
    extend: {
      colors: {
        'trading-bg': '#111827',
        'trading-card': '#1f2937',
        'gold': '#ca8a04',
        'profit': '#10b981',
        'loss': '#ef4444'
      }
    },
  },
  plugins: [],
}
