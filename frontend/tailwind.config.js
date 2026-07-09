/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        base: '#0a0f1e',
        surface: '#111827',
        surface2: '#1e293b',
        primary: '#6366f1',
        accent: '#8b5cf6',
        muted: '#94a3b8',
      },
    },
  },
  plugins: [],
};
