/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#08080f',
          50: '#0e0e1a',
          100: '#12121f',
          200: '#1a1a2e',
          300: '#22223a',
          400: '#2a2a46',
        },
        accent: {
          purple: '#8b5cf6',
          blue: '#3b82f6',
          cyan: '#06b6d4',
          pink: '#ec4899',
        },
        surface: {
          page: 'var(--color-bg-page)',
          card: 'var(--color-bg-card)',
          sidebar: 'var(--color-bg-sidebar)',
          elevated: 'var(--color-bg-elevated)',
          input: 'var(--color-bg-input)',
          glass: 'var(--color-bg-glass)',
        },
        content: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #06b6d4 100%)',
      },
    },
  },
  plugins: [],
};
