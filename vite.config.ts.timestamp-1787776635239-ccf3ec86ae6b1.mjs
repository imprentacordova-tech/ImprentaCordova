// vite.config.ts
import path from "path";
import { defineConfig, loadEnv } from "file:///C:/Users/Imprenta/Documents/Imprenta%20Cordova/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Imprenta/Documents/Imprenta%20Cordova/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { VitePWA } from "file:///C:/Users/Imprenta/Documents/Imprenta%20Cordova/node_modules/vite-plugin-pwa/dist/index.js";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    base: "./",
    // Asegura rutas relativas para evitar problemas de resolución en Vercel
    server: {
      port: 3e3,
      host: "0.0.0.0"
    },
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
        manifest: {
          name: "Imprenta C\xF3rdova Elite",
          short_name: "C\xF3rdova PWA",
          description: "Sistema de Gesti\xF3n de Imprenta C\xF3rdova",
          theme_color: "#020617",
          background_color: "#020617",
          display: "standalone",
          icons: [
            {
              src: "pwa-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ]
        }
      })
    ],
    define: {
      "process.env.API_KEY": JSON.stringify(env.VITE_CLAVE_API_DE_GOOGLE || env.GEMINI_API_KEY || env.VITE_GOOGLE_API_KEY || ""),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.VITE_CLAVE_API_DE_GOOGLE || env.GEMINI_API_KEY || env.VITE_GOOGLE_API_KEY || ""),
      "process.env.VITE_URL_SCRIPT_DE_GOOGLE": JSON.stringify(env.VITE_URL_SCRIPT_DE_GOOGLE || "https://script.google.com/macros/s/AKfycbz9BrIG8s1h5spiy3H2OQVInN4lODW6VJ50-SmGBajjIQ2jbgzBl-65-_6XF7IYRluM/exec")
    },
    resolve: {
      alias: {
        "@": path.resolve(".")
      }
    },
    build: {
      target: "esnext",
      // Soporte para características modernas
      outDir: "dist",
      sourcemap: mode === "development",
      minify: "esbuild",
      rollupOptions: {
        output: {
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash].[ext]"
        }
      },
      chunkSizeWarningLimit: 2e3
      // Aumentado para evitar warnings de Vercel
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxJbXByZW50YVxcXFxEb2N1bWVudHNcXFxcSW1wcmVudGEgQ29yZG92YVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcSW1wcmVudGFcXFxcRG9jdW1lbnRzXFxcXEltcHJlbnRhIENvcmRvdmFcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0ltcHJlbnRhL0RvY3VtZW50cy9JbXByZW50YSUyMENvcmRvdmEvdml0ZS5jb25maWcudHNcIjtcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IHsgVml0ZVBXQSB9IGZyb20gJ3ZpdGUtcGx1Z2luLXB3YSc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsICcuJywgJycpO1xuICAgIHJldHVybiB7XG4gICAgICBiYXNlOiAnLi8nLCAvLyBBc2VndXJhIHJ1dGFzIHJlbGF0aXZhcyBwYXJhIGV2aXRhciBwcm9ibGVtYXMgZGUgcmVzb2x1Y2lcdTAwRjNuIGVuIFZlcmNlbFxuICAgICAgc2VydmVyOiB7XG4gICAgICAgIHBvcnQ6IDMwMDAsXG4gICAgICAgIGhvc3Q6ICcwLjAuMC4wJyxcbiAgICAgIH0sXG4gICAgICBwbHVnaW5zOiBbXG4gICAgICAgIHJlYWN0KCksXG4gICAgICAgIFZpdGVQV0Eoe1xuICAgICAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxuICAgICAgICAgIGluY2x1ZGVBc3NldHM6IFsnZmF2aWNvbi5pY28nLCAnYXBwbGUtdG91Y2gtaWNvbi5wbmcnLCAnbWFza2VkLWljb24uc3ZnJ10sXG4gICAgICAgICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgICAgIG5hbWU6ICdJbXByZW50YSBDXHUwMEYzcmRvdmEgRWxpdGUnLFxuICAgICAgICAgICAgc2hvcnRfbmFtZTogJ0NcdTAwRjNyZG92YSBQV0EnLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICdTaXN0ZW1hIGRlIEdlc3RpXHUwMEYzbiBkZSBJbXByZW50YSBDXHUwMEYzcmRvdmEnLFxuICAgICAgICAgICAgdGhlbWVfY29sb3I6ICcjMDIwNjE3JyxcbiAgICAgICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjMDIwNjE3JyxcbiAgICAgICAgICAgIGRpc3BsYXk6ICdzdGFuZGFsb25lJyxcbiAgICAgICAgICAgIGljb25zOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzcmM6ICdwd2EtMTkyeDE5Mi5wbmcnLFxuICAgICAgICAgICAgICAgIHNpemVzOiAnMTkyeDE5MicsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZydcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNyYzogJ3B3YS01MTJ4NTEyLnBuZycsXG4gICAgICAgICAgICAgICAgc2l6ZXM6ICc1MTJ4NTEyJyxcbiAgICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgICAgICBwdXJwb3NlOiAnYW55IG1hc2thYmxlJ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgXSxcbiAgICAgIGRlZmluZToge1xuICAgICAgICAncHJvY2Vzcy5lbnYuQVBJX0tFWSc6IEpTT04uc3RyaW5naWZ5KGVudi5WSVRFX0NMQVZFX0FQSV9ERV9HT09HTEUgfHwgZW52LkdFTUlOSV9BUElfS0VZIHx8IGVudi5WSVRFX0dPT0dMRV9BUElfS0VZIHx8IFwiXCIpLFxuICAgICAgICAncHJvY2Vzcy5lbnYuR0VNSU5JX0FQSV9LRVknOiBKU09OLnN0cmluZ2lmeShlbnYuVklURV9DTEFWRV9BUElfREVfR09PR0xFIHx8IGVudi5HRU1JTklfQVBJX0tFWSB8fCBlbnYuVklURV9HT09HTEVfQVBJX0tFWSB8fCBcIlwiKSxcbiAgICAgICAgJ3Byb2Nlc3MuZW52LlZJVEVfVVJMX1NDUklQVF9ERV9HT09HTEUnOiBKU09OLnN0cmluZ2lmeShlbnYuVklURV9VUkxfU0NSSVBUX0RFX0dPT0dMRSB8fCBcImh0dHBzOi8vc2NyaXB0Lmdvb2dsZS5jb20vbWFjcm9zL3MvQUtmeWNiejlCcklHOHMxaDVzcGl5M0gyT1FWSW5ONGxPRFc2Vko1MC1TbUdCYWpqSVEyamJnekJsLTY1LV82WEY3SVlSbHVNL2V4ZWNcIiksXG4gICAgICB9LFxuICAgICAgcmVzb2x2ZToge1xuICAgICAgICBhbGlhczoge1xuICAgICAgICAgICdAJzogcGF0aC5yZXNvbHZlKCcuJyksXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBidWlsZDoge1xuICAgICAgICB0YXJnZXQ6ICdlc25leHQnLCAvLyBTb3BvcnRlIHBhcmEgY2FyYWN0ZXJcdTAwRURzdGljYXMgbW9kZXJuYXNcbiAgICAgICAgb3V0RGlyOiAnZGlzdCcsXG4gICAgICAgIHNvdXJjZW1hcDogbW9kZSA9PT0gJ2RldmVsb3BtZW50JyxcbiAgICAgICAgbWluaWZ5OiAnZXNidWlsZCcsXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS1baGFzaF0uanMnLFxuICAgICAgICAgICAgZW50cnlGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLVtoYXNoXS5qcycsXG4gICAgICAgICAgICBhc3NldEZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0tW2hhc2hdLltleHRdJ1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAyMDAwIC8vIEF1bWVudGFkbyBwYXJhIGV2aXRhciB3YXJuaW5ncyBkZSBWZXJjZWxcbiAgICAgIH1cbiAgICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsY0FBYyxlQUFlO0FBQ3RDLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFFeEIsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDdEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxLQUFLLEVBQUU7QUFDakMsU0FBTztBQUFBLElBQ0wsTUFBTTtBQUFBO0FBQUEsSUFDTixRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsTUFBTTtBQUFBLE1BQ04sUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFFBQ2QsZUFBZSxDQUFDLGVBQWUsd0JBQXdCLGlCQUFpQjtBQUFBLFFBQ3hFLFVBQVU7QUFBQSxVQUNSLE1BQU07QUFBQSxVQUNOLFlBQVk7QUFBQSxVQUNaLGFBQWE7QUFBQSxVQUNiLGFBQWE7QUFBQSxVQUNiLGtCQUFrQjtBQUFBLFVBQ2xCLFNBQVM7QUFBQSxVQUNULE9BQU87QUFBQSxZQUNMO0FBQUEsY0FDRSxLQUFLO0FBQUEsY0FDTCxPQUFPO0FBQUEsY0FDUCxNQUFNO0FBQUEsWUFDUjtBQUFBLFlBQ0E7QUFBQSxjQUNFLEtBQUs7QUFBQSxjQUNMLE9BQU87QUFBQSxjQUNQLE1BQU07QUFBQSxjQUNOLFNBQVM7QUFBQSxZQUNYO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTix1QkFBdUIsS0FBSyxVQUFVLElBQUksNEJBQTRCLElBQUksa0JBQWtCLElBQUksdUJBQXVCLEVBQUU7QUFBQSxNQUN6SCw4QkFBOEIsS0FBSyxVQUFVLElBQUksNEJBQTRCLElBQUksa0JBQWtCLElBQUksdUJBQXVCLEVBQUU7QUFBQSxNQUNoSSx5Q0FBeUMsS0FBSyxVQUFVLElBQUksNkJBQTZCLGtIQUFrSDtBQUFBLElBQzdNO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxHQUFHO0FBQUEsTUFDdkI7QUFBQSxJQUNGO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxRQUFRO0FBQUE7QUFBQSxNQUNSLFFBQVE7QUFBQSxNQUNSLFdBQVcsU0FBUztBQUFBLE1BQ3BCLFFBQVE7QUFBQSxNQUNSLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGdCQUFnQjtBQUFBLFVBQ2hCLGdCQUFnQjtBQUFBLFVBQ2hCLGdCQUFnQjtBQUFBLFFBQ2xCO0FBQUEsTUFDRjtBQUFBLE1BQ0EsdUJBQXVCO0FBQUE7QUFBQSxJQUN6QjtBQUFBLEVBQ0Y7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
