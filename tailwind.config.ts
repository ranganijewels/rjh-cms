import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f7fa',
          100: '#e9eef5',
          500: '#2563eb',
          600: '#1e40af',
          700: '#1e3a8a',
          900: '#0f1b3d',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto'],
      },
      fontSize: {
        xs2: ['10px', { lineHeight: '14px' }],
      },
    },
  },
  plugins: [],
}
export default config
