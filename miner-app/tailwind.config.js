/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mars: {
          50: '#fef2f2',
          100: '#fcc2bb',
          200: '#f66849',
          300: '#ff4433',
          400: '#cc0000',
          500: '#990000',
          600: '#770000',
          700: '#550000',
          800: '#330000',
          900: '#220000',
          950: '#110000',
        },
        bg: {
          DEFAULT: '#0b0b0e',
          panel: '#121218',
          muted: '#1a1a22',
        },
        text: {
          hi: '#ffffff',
          med: '#c9c9d1',
          lo: '#9a9aa3',
        },
      },
      fontFamily: {
        sans: ['"Stack Sans Notch"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
