/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Noto Naskh Arabic', 'Tahoma', 'sans-serif'] },
      colors: {
        success: { DEFAULT: 'var(--success)', foreground: 'var(--success-foreground)' },
        warning: { DEFAULT: 'var(--warning)', foreground: 'var(--warning-foreground)' },
        sidebar: { DEFAULT: 'var(--sidebar)', foreground: 'var(--sidebar-foreground)', muted: 'var(--sidebar-muted)' },
        border: 'var(--border)', input: 'var(--input)', ring: 'var(--ring)',
        background: 'var(--background)', foreground: 'var(--foreground)',
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
      },
      borderRadius: { lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)' },
      boxShadow: { card: '0 2px 12px rgb(24 47 39 / 0.025)' },
    },
  },
  plugins: [],
};
