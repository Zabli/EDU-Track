import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--brand-primary, #1d4ed8)',
          secondary: 'var(--brand-secondary, #00838F)',
          accent: 'var(--brand-accent, #ea2261)',
          dark: '#1c1e54',
          light: '#f6f9fc',
        },
        stripe: {
          primary: '#533afd',
          'primary-deep': '#4434d4',
          'primary-press': '#2e2b8c',
          'primary-soft': '#665efd',
          'primary-subdued': '#b9b9f9',
          'primary-tint': '#f0efff',
          'dark-900': '#1c1e54',
          ink: '#0d253d',
          'ink-secondary': '#273951',
          'ink-mute': '#64748d',
          'ink-mute-2': '#61718a',
          canvas: '#ffffff',
          'canvas-soft': '#f6f9fc',
          'canvas-cream': '#f5e9d4',
          hairline: '#e3e8ee',
          'hairline-input': '#a8c3de',
          ruby: '#ea2261',
          magenta: '#f96bee',
          lemon: '#9b6829',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        '2xs': '0 1px 2px rgba(0, 55, 112, 0.04)',
        'xs': '0 1px 2px rgba(0, 55, 112, 0.06)',
        'stripe-1': '0 1px 3px rgba(0, 55, 112, 0.08)',
        'stripe-2': '0 8px 24px rgba(0, 55, 112, 0.08), 0 2px 6px rgba(0, 55, 112, 0.04)',
        'stripe-hero': '0 24px 60px -12px rgba(13, 37, 61, 0.22), 0 8px 20px -6px rgba(83, 58, 253, 0.14)',
      },
    },
  },
  plugins: [],
};

export default config;
