/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/views/**/*.{erb,html}',
    './app/helpers/**/*.rb',
    './app/assets/stylesheets/**/*.scss',
    './app/javascript/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7f3',
          100: '#dcefe7',
          200: '#b6dfcf',
          300: '#8fceb7',
          400: '#5bb596',
          500: '#2e9c79',
          600: '#1e7e60',
          700: '#16624c',
          800: '#124e3d',
          900: '#0c3429',
        },
        soft: {
          blue: '#EAF2FF',
          sand: '#F7F1E6',
          mint: '#EAF6F1',
          lavender: '#F3ECFB',
        },
      },
      boxShadow: {
        card: '0 8px 24px -12px rgba(16, 24, 40, 0.15)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'beam-sweep': {
          '0%': { transform: 'translateX(-16px) rotate(-0.5deg)', opacity: '0.85' },
          '100%': { transform: 'translateX(16px) rotate(0.5deg)', opacity: '1' },
        },
        'glow-pulse': {
          '0%': { opacity: '0.9' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.9' },
        },
        'bob': {
          '0%': { transform: 'translateY(-2px)' },
          '100%': { transform: 'translateY(2px)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 600ms ease-out both',
        'fade-in-up': 'fade-in-up 700ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'beam-sweep': 'beam-sweep 6s ease-in-out infinite alternate',
        'glow-pulse': 'glow-pulse 5s ease-in-out infinite',
        bob: 'bob 4s ease-in-out infinite alternate',
      },
    },
  },
  plugins: [],
};


