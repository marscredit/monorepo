/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Mars-themed color palette - Deeper Red
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
        background: {
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
        display: ['"Stack Sans Notch"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'twinkle': 'twinkle 8s linear infinite',
        'orbit': 'orbit 20s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'scan-line': 'scan-line 3s linear infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        twinkle: {
          '50%': { opacity: '0.7' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
      },
      backgroundImage: {
        'orbit': 'linear-gradient(180deg, #1a1a22 0%, #121218 100%)',
        'mars': 'conic-gradient(from 220deg at 50% 50%, #cc0000, #ff4433, #cc0000, #220000 75%, #121218 100%)',
      },
    },
  },
  plugins: [],
}

