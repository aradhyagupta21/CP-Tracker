/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#060913',
          900: '#0b1120',
          800: '#152035',
          700: '#1e2d4a',
          600: '#2d3f64',
        },
        brand: {
          cyan: '#00f2fe',
          indigo: '#4facfe',
          purple: '#8a2be2',
          pink: '#ff007f'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
