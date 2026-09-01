/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        kora: {
          primary: '#4F46E5',
          secondary: '#7C3AED',
          success: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B',
          dark: '#1F2937',
          light: '#F3F4F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}