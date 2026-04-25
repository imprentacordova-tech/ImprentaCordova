
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: './', // Asegura rutas relativas para evitar problemas de resolución en Vercel
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
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
      build: {
        target: 'esnext', // Soporte para características modernas
        outDir: 'dist',
        sourcemap: mode === 'development',
        minify: 'esbuild',
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('react')) return 'vendor-react';
                if (id.includes('lucide-react')) return 'vendor-icons';
                if (id.includes('framer-motion')) return 'vendor-animations';
                if (id.includes('supabase')) return 'vendor-supabase';
                return 'vendor-libs';
              }
            }
          }
        },
        chunkSizeWarningLimit: 2000 // Aumentado para evitar warnings de Vercel
      }
    };
});
