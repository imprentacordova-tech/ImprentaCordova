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
        'brand-blue': '#0A1E40', 
        'brand-red': '#E11D48',  
        'brand-dark': '#0c1324', // Unified Obsidian from Stitch
        'liquid-gold': '#D4AF37', 
        'gold-bright': '#f2ca50', // Stitch primary
        'surface-light': '#F8FAFC',
        'surface-dark': '#0c1324',
        'luxury-slate': '#191f31',
        'accent-blue': '#bfcdff',
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        tech: ['"Orbitron"', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        'gold-glow': '0 0 40px rgba(212, 175, 55, 0.12)',
        'gold-glow-soft': '0 0 20px rgba(212, 175, 55, 0.08)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'paper-stack': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
