/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./App.tsx",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-blue':      '#0ea5e9',
        'brand-blue-dark': '#0369a1',
        'brand-red':       '#E11D48',
        'brand-dark':      '#050810',
        'liquid-gold':     '#D4AF37',
        'gold-bright':     '#f2ca50',
        'champagne':       '#F5E6C8',
        'obsidian':        '#050810',
        'obsidian-mid':    '#0a0f1e',
        'obsidian-card':   '#0c1224',
        'surface-dark':    '#0a0f1e',
        'luxury-slate':    '#191f31',
        'accent-blue':     '#bfcdff',
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'luxury':        '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        'gold-glow':     '0 0 40px rgba(212, 175, 55, 0.12)',
        'gold-glow-soft':'0 0 20px rgba(212, 175, 55, 0.08)',
        'gold-ultra':    '0 0 80px rgba(212, 175, 55, 0.18), 0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(212, 175, 55, 0.2)',
        'glass':         '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease-out forwards',
        'slide-up':     'slideUp 0.6s ease-out forwards',
        'pulse-ring':   'pulse-ring 2s ease-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
      }
    },
  },
  plugins: [],
}
