/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CSS-variable-driven so dark/light theme swaps everything automatically
        dark: {
          950: 'rgb(var(--dark-950) / <alpha-value>)',
          900: 'rgb(var(--dark-900) / <alpha-value>)',
          800: 'rgb(var(--dark-800) / <alpha-value>)',
          700: 'rgb(var(--dark-700) / <alpha-value>)',
          600: 'rgb(var(--dark-600) / <alpha-value>)',
        },
        brand: {
          cyan:   'rgb(var(--brand-cyan)   / <alpha-value>)',
          indigo: 'rgb(var(--brand-indigo) / <alpha-value>)',
          purple: 'rgb(var(--brand-purple) / <alpha-value>)',
          pink:   'rgb(var(--brand-pink)   / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fadeIn': 'fadeIn 0.4s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
