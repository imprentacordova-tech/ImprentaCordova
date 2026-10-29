import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * Configuración de pruebas
 *
 * `environment: 'node'` es el default a propósito. Levantar jsdom en esta máquina
 * cuesta ~30 s por worker, y con 10 archivos el arranque se pasaba del timeout de
 * vitest ("Failed to start forks worker" / "Timeout waiting for worker to respond")
 * aunque el código estuviera bien. Casi todas las pruebas son de lógica pura
 * (precios, formatos, reglas del SRI, calibración) y no tocan el DOM.
 *
 * El único archivo que sí necesita DOM lo pide solo, con el docblock
 * `@vitest-environment jsdom` en su primera línea
 * (`__tests__/components/CalibradorRegistro.test.tsx`). Si agregás una prueba de
 * componentes, acordate de poner ese docblock: sin él `document` no existe.
 * ────────────────────────────────────────────────────────────────────────────
 */
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    setupFiles: './__tests__/setup.ts',
    pool: 'forks',
    maxWorkers: 1,
    include: ['**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', '__tests__/'],
    },
  },
  resolve: {
    alias: {
      '@': '.',
    },
  },
});
