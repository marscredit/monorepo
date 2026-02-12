/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mars: {
          black: '#0a0a0a',
          dark: '#141414',
          red: '#c41e3a',
          orange: '#e85d04',
          accent: '#dc2f02',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
