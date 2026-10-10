/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#ecfeff', 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
        stellar: { purple: '#7c3aed', cyan: '#06b6d4', emerald: '#10b981' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
