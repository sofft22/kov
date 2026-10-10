/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        numbers: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      colors: {
        white: '#ffffff',
        black: '#0e0e0e',
        cream: '#FBF9F5',
        'cream-dark': '#EDE8E0',
        charcoal: '#1A1A1A',
        terracotta: '#C66B4F',
        ink: '#2a2a2a',
        muted: '#8a7a7a',
      },
      boxShadow: {
        soft: '0 10px 40px -15px rgba(26, 26, 26, 0.08)',
        pop: '0 20px 60px -20px rgba(26, 26, 26, 0.20)',
      },
    },
  },
  plugins: [],
};