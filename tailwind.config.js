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
        // ── Paleta "Marino & Oro" ────────────────────────────────────────────
        // Espejo exacto de los tokens de `components/panelTheme.ts` (que es la
        // fuente). Acá están como clases para la landing pública, que es Tailwind
        // puro. Si cambiás un hex, cambialo en los dos lados: hay una prueba
        // (`__tests__/theme.palette.test.ts`) que compara ambos archivos y falla
        // si se desincronizan.
        'ink':             '#0A1140', // navy de marca: titulares y franjas oscuras
        'royal':           '#16309B', // azul de acción
        'royal-dark':      '#0F2280', // azul de acción en hover
        'gold':            '#FFC61A', // oro de marca (el mismo del panel interno)
        'gold-hover':      '#F0B400',
        // El oro puro sobre blanco no tiene contraste para texto (1.6:1): para texto
        // dorado sobre fondo claro se usan estos dos tonos oscuros.
        'gold-deep':       '#B45309',
        'gold-ink':        '#7A5A00',
        'gold-soft':       '#FFFBEB',
        'gold-line':       '#F4E3A8',
        'paper':           '#F7F9FF', // fondo de página (blanco azulado, no gris)
        'soft':            '#F2F4FA', // fondo de bloque / chips
        'tint':            '#EEF1FC', // azul muy claro para estados seleccionados
        'body':            '#3C4763', // texto corrido
        'muted':           '#6B7590', // texto secundario
        'faint':           '#8A93AE', // rótulos y metadatos
        'ghost':           '#A6AFC8', // placeholders y deshabilitado
        'hairline':        '#E4E8F4', // borde normal
        'hairline-strong': '#D7DDF0', // borde marcado
        'success':         '#1B6E3E',
        'success-dot':     '#1B8A4B',
        'danger':          '#E70101',

        // Texto y capas SOBRE fondo navy (`bg-ink`)
        'onink':           '#C2CAE6',
        'onink-muted':     '#9AA6CE',
        'onink-gold':      '#FFC61A',
        'onink-success':   '#7BE0A6',

        // ── Paleta anterior (se conserva por compatibilidad) ─────────────────
        'brand-blue':      '#16309B',
        'brand-blue-dark': '#0F2280',
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
        // `font-heading` lo usaba la landing en 21 lugares y NO existía en Tailwind:
        // los títulos caían a Inter y perdían la tipografía de marca. Es la misma
        // familia que `DISPLAY` en components/panelTheme.ts.
        heading: ['"Outfit"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'luxury':        '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        'gold-glow':     '0 0 40px rgba(212, 175, 55, 0.12)',
        'gold-glow-soft':'0 0 20px rgba(212, 175, 55, 0.08)',
        'gold-ultra':    '0 0 80px rgba(212, 175, 55, 0.18), 0 20px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(212, 175, 55, 0.2)',
        'blue-glow-sm':  '0 10px 25px -12px rgba(22, 48, 155, 0.28)',
        'blue-glow':     '0 18px 40px -18px rgba(22, 48, 155, 0.35)',
      },
      animation: {
        'fade-in':      'fadeIn 0.5s ease-out forwards',
        'slide-up':     'slideUp 0.6s ease-out forwards',
        'pulse-ring':   'pulse-ring 2s ease-out infinite',
        // El ticker de la landing usaba `animate-marquee`, que tampoco existía: el texto
        // quedaba quieto y recortado. Recorre la mitad del contenedor porque la tira se
        // imprime dos veces (ver TICKER en VisualLanding) para que el bucle no tenga salto.
        'marquee':      'marquee 42s linear infinite',
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
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      }
    },
  },
  plugins: [],
}
