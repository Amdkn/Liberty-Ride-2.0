/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        solarpunk: {
          bg: '#07110e',
          panel: '#0c1d18',
          border: '#18392f',
          emerald: '#00E676',
          cyan: '#00E5FF',
          gold: '#FFD600',
        }
      }
    },
  },
  plugins: [],
}
