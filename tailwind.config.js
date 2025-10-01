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
        'trading-bg': '#0f172a',
        'trading-card': '#1e293b',
        'gold': '#fbbf24',
        'profit': '#10b981',
        'loss': '#ef4444',
        'neutral': '#6b7280'
      }
    }
  },
  plugins: [],
}
