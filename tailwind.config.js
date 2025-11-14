/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Data Empire custom colors
        'empire-dark': '#0f172a',
        'empire-blue': '#3b82f6',
        'empire-green': '#10b981',
        'empire-red': '#ef4444',
        'empire-yellow': '#f59e0b',
      }
    },
  },
  plugins: [],
}
