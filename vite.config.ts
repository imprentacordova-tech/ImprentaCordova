
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
        'process.env.API_KEY': JSON.stringify(env.VITE_CLAVE_API_DE_GOOGLE || env.GEMINI_API_KEY || env.VITE_GOOGLE_API_KEY || ""),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_CLAVE_API_DE_GOOGLE || env.GEMINI_API_KEY || env.VITE_GOOGLE_API_KEY || ""),
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
            assetFileNames: 'assets/[name]-[hash].[ext]'
          }
        },
        chunkSizeWarningLimit: 2000 // Aumentado para evitar warnings de Vercel
      }
    };
});
