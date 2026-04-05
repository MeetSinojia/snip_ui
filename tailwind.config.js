/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Bebas Neue"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#0a0a0a',
          50: '#f5f5f5',
          100: '#e8e8e8',
          200: '#d0d0d0',
          300: '#a0a0a0',
          400: '#6e6e6e',
          500: '#404040',
          600: '#2a2a2a',
          700: '#1e1e1e',
          800: '#141414',
          900: '#0a0a0a',
        },
        acid: '#c8f135',   // sharp lime accent — the ONLY color
      },
      borderColor: {
        DEFAULT: '#2a2a2a',
      },
    },
  },
  plugins: [],
}
