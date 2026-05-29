/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '!./src/**/*.test.{ts,tsx}',
    '!./src/test/**'
  ],
  theme: {
    extend: {
      fontFamily: {
        brand: ['Knewave', 'cursive'],
        sans: ['Poppins', 'Pretendard', 'Noto Sans KR', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        login: '7px 9px 102px rgba(0, 0, 0, 0.3)',
        panel: '7px 9px 102px rgba(0, 0, 0, 0.12)'
      }
    }
  },
  plugins: []
}
