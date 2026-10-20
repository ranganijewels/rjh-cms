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
          // House-brand tones taken from the Rangani wordmark / theme defaults.
          navy: '#162640',
          gold: '#d4af37',
        },
      },
      fontFamily: {
        // Cabin is loaded by next/font in src/app/layout.tsx and exposed as
        // --font-cabin; the stack falls back to the system UI font if it fails.
        sans: ['var(--font-cabin)', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto'],
      },
      fontSize: {
        xs2: ['10px', { lineHeight: '14px' }],
      },
    },
  },
  plugins: [],
}
export default config
