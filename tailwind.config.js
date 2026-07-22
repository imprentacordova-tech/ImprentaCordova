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
        'brand-light':     '#f8fafc',
        'brand-white':     '#ffffff',
        'brand-red':       '#E11D48',
        'brand-dark':      '#0c1324',
        'liquid-gold':     '#D4AF37',
        'gold-bright':     '#f2ca50',
        'champagne':       '#F5E6C8',
        'bone-white':      '#F9F7F4',
        'obsidian':        '#050810',
        'obsidian-mid':    '#0a0f1e',
        'surface-light':   '#F8FAFC',
        'surface-dark':    '#0c1324',
        'luxury-slate':    '#191f31',
        'accent-blue':     '#bfcdff',
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        tech: ['"Orbitron"', 'sans-serif'],
      },
      boxShadow: {
        'luxury':        '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        'gold-glow':     '0 0 40px rgba(212, 175, 55, 0.12)',
        'gold-glow-soft':'0 0 20px rgba(212, 175, 55, 0.08)',
        'gold-ultra':    '0 0 80px rgba(212, 175, 55, 0.18), 0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(212, 175, 55, 0.2)',
        'glass':         '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'paper-stack':   '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease-out forwards',
        'slide-up':     'slideUp 0.6s ease-out forwards',
        'float':        'float 6s ease-in-out infinite',
        'float-gentle': 'float-gentle 8s ease-in-out infinite',
        'ticker':       'ticker-scroll 30s linear infinite',
        'grain':        'grain-drift 8s steps(10) infinite',
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
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        'float-gentle': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%':      { transform: 'translateY(-8px) rotate(0.5deg)' },
          '66%':      { transform: 'translateY(-4px) rotate(-0.5deg)' },
        },
        'grain-drift': {
          '0%':   { transform: 'translate(0, 0)' },
          '10%':  { transform: 'translate(-1%, -2%)' },
          '30%':  { transform: 'translate(2%, -1%)' },
          '50%':  { transform: 'translate(-1%, 2%)' },
          '70%':  { transform: 'translate(1%, 1%)' },
          '90%':  { transform: 'translate(-2%, -1%)' },
          '100%': { transform: 'translate(0, 0)' },
        },
        'ticker-scroll': {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
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
