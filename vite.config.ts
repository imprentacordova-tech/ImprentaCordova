
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './', // Asegura rutas relativas para evitar problemas de resolución en Vercel
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            name: 'Imprenta Córdova Elite',
            short_name: 'Córdova PWA',
            description: 'Sistema de Gestión de Imprenta Córdova',
            theme_color: '#020617',
            background_color: '#020617',
            display: 'standalone',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          }
        })
      ],
      define: {
        // ⚠️ SEGURIDAD: aquí se inyectaban `process.env.API_KEY` y `process.env.GEMINI_API_KEY`
        // con la clave de Google. `define` reemplaza el texto en TODOS los módulos del cliente,
        // así que la clave terminaba literalmente dentro del bundle público de Vercel.
        //
        // La IA ahora pasa por el backend (`/api/v1/ai/generate`, ver services/backendApi.ts):
        // la clave vive solo en el servidor. No volver a agregar secretos en `define` ni con
        // prefijo `VITE_` — cualquiera puede leer el bundle con Ctrl+U.
        'process.env.VITE_URL_SCRIPT_DE_GOOGLE': JSON.stringify(env.VITE_URL_SCRIPT_DE_GOOGLE || "https://script.google.com/macros/s/AKfycbz9BrIG8s1h5spiy3H2OQVInN4lODW6VJ50-SmGBajjIQ2jbgzBl-65-_6XF7IYRluM/exec"),
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      },
      // El prebundle de dependencias en `dev` usaba el target por defecto (chrome87…),
      // y `pdfjs-dist` trae top-level await: el servidor de desarrollo moría al arrancar.
      // Se alinea con `build.target`.
      optimizeDeps: {
        esbuildOptions: { target: 'esnext' },
      },
      build: {
        target: 'esnext', // Soporte para características modernas
        outDir: 'dist',
        sourcemap: mode === 'development',
        minify: 'esbuild',
        rollupOptions: {
          output: {
            chunkFileNames: 'assets/[name]-[hash].js',
            entryFileNames: 'assets/[name]-[hash].js',
            assetFileNames: 'assets/[name]-[hash].[ext]',

            /**
             * Vendors separados por librería.
             *
             * Sin esto, todo node_modules caía dentro de "index" (635 kB) o se
             * duplicaba en los chunks de página, y cada deploy invalidaba la caché
             * del navegador completa. Separados, el usuario que vuelve solo baja
             * lo que cambió: React/Supabase casi nunca, el código de la app sí.
             */
            manualChunks(id) {
              // El helper de precarga de Vite lo necesita CASI TODO chunk con
              // import() dinámico. Si Rollup lo deja caer dentro de un vendor
              // pesado, ese vendor pasa a ser dependencia del arranque: así
              // `vendor-pdfjs` (288 kB) terminaba descargándose en el login.
              // Se fija en vendor-react, que se carga siempre.
              if (id.includes('vite/preload-helper')) return 'vendor-react';

              if (!id.includes('node_modules')) return;

              // React + router + scheduler tienen que viajar JUNTOS: si react y
              // react-dom caen en chunks distintos, se rompe el runtime.
              if (/node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
                return 'vendor-react';
              }
              if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'vendor-motion';
              if (id.includes('recharts') || id.includes('victory-vendor') || id.includes('node_modules/d3-')) return 'vendor-charts';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('pdfjs-dist')) return 'vendor-pdfjs';
              if (id.includes('html2pdf') || id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
              if (id.includes('lucide-react')) return 'vendor-iconos';
              if (id.includes('date-fns')) return 'vendor-fechas';
              if (id.includes('papaparse')) return 'vendor-csv';

              // El resto SIN agrupar, a propósito: un chunk "vendor" cajón de
              // sastre se vuelve dependencia del arranque en cuanto la entrada
              // usa una sola de sus librerías, y arrastra también las que solo
              // necesitan páginas perezosas (+106 kB medidos en el login).
              // Dejándolo a Rollup, cada librería viaja con quien la usa.
              return undefined;
            }
          }
        },
        // Bajado de 2000: el límite alto escondía chunks de ~1 MB en el arranque.
        // El techo real hoy es `vendor-pdf` (html2pdf + jsPDF + html2canvas,
        // ~980 kB) y se descarga SOLO al pulsar "Descargar PDF". Si vuelve a
        // saltar el aviso por otro chunk, hay que partirlo, no subir el número.
        chunkSizeWarningLimit: 1000
      }
    };
});
