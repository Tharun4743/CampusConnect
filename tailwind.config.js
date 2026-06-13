// tailwind.config.js – added for dark mode and content paths
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // enable class-based dark mode
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // soft palette – can be customized later
        background: '#ffffff',
        foreground: '#1e293b',
        primary: {
          light: '#42a5f5',
        },
      },
    },
  },
  plugins: [],
};
