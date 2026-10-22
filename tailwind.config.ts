import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // The brand ramp is derived from the Rangani navy (#162640) so every
        // existing `brand-*` utility (buttons, links, focus rings, active
        // states) resolves to the house identity instead of Tailwind blue.
        brand: {
          50: '#f4f6fa',
          100: '#e8edf5',
          200: '#d3dcec',
          300: '#aebdd6',
          400: '#7f93b8',
          500: '#1d3f66',
          600: '#162640',
          700: '#12203a',
          800: '#0e1930',
          900: '#0b1424',
          // House-brand tones taken from the Rangani wordmark / theme defaults.
          navy: '#162640',
          gold: '#d4af37',
          'gold-soft': '#f8f2e0',
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
      keyframes: {
        // Entrance for the toast stack (see src/components/Toast.tsx).
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 180ms ease-out',
      },
    },
  },
  plugins: [],
}
export default config
