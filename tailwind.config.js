/** @type {import('tailwindcss').Config} */
export default {
  // 👇 이 줄을 반드시 추가해야 버튼으로 다크 모드가 켜집니다!
  darkMode: 'class', 

  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}