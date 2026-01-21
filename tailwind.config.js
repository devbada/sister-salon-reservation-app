/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '375px',    // iPhone SE
        'sm': '640px',    // 태블릿 세로
        'md': '768px',    // 태블릿 가로
        'lg': '1024px',   // 데스크탑
        'xl': '1280px',   // 대형 모니터
        '2xl': '1536px',  // 초대형 모니터
      },
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.25)',
          dark: 'rgba(0, 0, 0, 0.25)',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
