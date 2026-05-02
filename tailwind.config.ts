import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7ff',
          100: '#e8ecff',
          500: '#5b6cff',
          600: '#4a59e6',
          700: '#3a47b8',
        },
      },
    },
  },
  plugins: [],
}

export default config
