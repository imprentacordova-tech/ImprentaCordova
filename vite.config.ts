
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.VITE_CLAVE_API_DE_GOOGLE || env.GEMINI_API_KEY || env.VITE_GOOGLE_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_CLAVE_API_DE_GOOGLE || env.GEMINI_API_KEY || env.VITE_GOOGLE_API_KEY),
        // Inyectamos la URL directamente en define para que esté disponible globalmente sin depender solo de import.meta.env
        'process.env.VITE_URL_SCRIPT_DE_GOOGLE': JSON.stringify(env.VITE_URL_SCRIPT_DE_GOOGLE || "https://script.google.com/macros/s/AKfycbz9BrIG8s1h5spiy3H2OQVInN4lODW6VJ50-SmGBajjIQ2jbgzBl-65-_6XF7IYRluM/exec"),
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});
