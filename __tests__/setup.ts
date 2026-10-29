/**
 * Setup global de las pruebas.
 *
 * ── jsdom sólo donde hace falta ───────────────────────────────────────────────
 * Los matchers de jest-dom (`toBeInTheDocument`, `toHaveValue`, …) y el propio `document`
 * se cargan únicamente cuando el archivo de prueba corre bajo jsdom (docblock
 * `@vitest-environment jsdom`). Las pruebas de lógica pura corren en `node` —ver
 * vitest.config.ts— y no pagan el costo de importarlos.
 *
 * ── `localStorage` en node ────────────────────────────────────────────────────
 * Varios servicios guardan cosas en `localStorage` (la calibración de registro, el
 * reporte de errores) y sus pruebas verifican justamente esa persistencia. En `node` no
 * existe, así que acá se instala un doble en memoria.
 *
 * Es un doble honesto: el `localStorage` de jsdom también es un mapa en memoria, no el
 * del navegador, así que para lo que estas pruebas verifican (que se guarde, se lea, se
 * borre y que un JSON corrupto no rompa) no se pierde fidelidad. La alternativa —levantar
 * jsdom en esos archivos— agregaba ~30 s de arranque cada uno sin probar nada distinto.
 * Lo que sí queda cubierto con jsdom real es el hook de React (`CalibradorRegistro`).
 * ────────────────────────────────────────────────────────────────────────────
 */
if (typeof document !== 'undefined') {
  // El especificador va en una constante a propósito: los tipos de
  // `@testing-library/jest-dom` son un archivo de declaración global sin
  // `export {}`, así que TypeScript lo trata como script y no como módulo
  // (TS2306) al resolver un import literal. Con la indirección el import queda
  // como `any` y no hace falta silenciar el chequeo con @ts-ignore.
  const JEST_DOM = '@testing-library/jest-dom';
  await import(JEST_DOM);
}

if (typeof localStorage === 'undefined') {
  const crearAlmacen = (): Storage => {
    const datos = new Map<string, string>();

    return {
      get length() {
        return datos.size;
      },
      key(indice: number): string | null {
        return Array.from(datos.keys())[indice] ?? null;
      },
      getItem(clave: string): string | null {
        return datos.has(clave) ? (datos.get(clave) as string) : null;
      },
      setItem(clave: string, valor: string): void {
        datos.set(String(clave), String(valor));
      },
      removeItem(clave: string): void {
        datos.delete(clave);
      },
      clear(): void {
        datos.clear();
      },
    };
  };

  // Dos almacenes independientes, como en el navegador: no comparten claves.
  Object.defineProperty(globalThis, 'localStorage', { value: crearAlmacen(), configurable: true });
  Object.defineProperty(globalThis, 'sessionStorage', { value: crearAlmacen(), configurable: true });
}
