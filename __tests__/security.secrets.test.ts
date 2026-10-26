/**
 * Guardián de secretos — Imprenta Córdova
 * =======================================
 *
 * Este test existe por un incidente real: la `service_role` de Supabase (clave maestra
 * que saltea toda la Row Level Security) y la API key de Resend estuvieron hardcodeadas
 * y terminaron publicadas en el bundle de Vercel, además de quedar en el historial de git.
 *
 * Cualquier cosa que empiece con `VITE_`, o que se inyecte por `define` en vite.config.ts,
 * termina incrustada en el JavaScript público. Este test es la red de seguridad para que
 * eso no vuelva a pasar por descuido.
 *
 * Qué verifica:
 *   1. Que no haya secretos hardcodeados en el código fuente.
 *   2. Que ningún archivo del frontend lea un secreto vía `import.meta.env.VITE_*`.
 *   3. Que el bundle compilado (si existe `dist/`) no contenga un JWT con rol `service_role`.
 *
 * Si este test falla, NO lo desactives: sacá el secreto y rotalo.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const RAIZ = process.cwd();

/** Este archivo contiene los patrones como texto, así que se autoexcluye. */
const ESTE_ARCHIVO = path.join('__tests__', 'security.secrets.test.ts');

const DIRS_IGNORADOS = new Set(['node_modules', 'dist', '.git', '.vercel', 'coverage']);
const EXTENSIONES = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.html', '.json']);
const ARCHIVOS_IGNORADOS = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']);

/** Un secreto real: nunca debería aparecer literal en un archivo versionado. */
const PATRONES_PROHIBIDOS: Array<{ nombre: string; re: RegExp }> = [
  { nombre: 'JWT hardcodeado (posible anon/service_role de Supabase)', re: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{20,}\./ },
  { nombre: 'API key de Resend (re_...)', re: /re_[A-Za-z0-9_]{20,}/ },
  { nombre: 'API key de Google (AIza...)', re: /AIza[0-9A-Za-z_-]{35}/ },
];

/** Nombres de variable que jamás deben leerse desde el navegador. */
const NOMBRES_PROHIBIDOS_VITE = /import\.meta\.env\.VITE_[A-Z0-9_]*(SERVICE_ROLE|SECRET|RESEND|GEMINI|GOOGLE|PRIVATE)/;

/**
 * Excepciones documentadas. `VITE_RENDER_API_KEY` es pública a propósito: viaja en el
 * navegador y funciona como barrera anti-abuso junto a CORS y rate limiting, NO como
 * credencial. Los secretos reales viven solo en el backend.
 */
const EXCEPCIONES_VITE = [/VITE_RENDER_API_URL/];

function recorrerArchivos(dir: string, encontrados: string[] = []): string[] {
  let entradas: fs.Dirent[];
  try {
    entradas = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return encontrados;
  }

  for (const entrada of entradas) {
    const completo = path.join(dir, entrada.name);

    if (entrada.isDirectory()) {
      if (DIRS_IGNORADOS.has(entrada.name)) continue;
      recorrerArchivos(completo, encontrados);
      continue;
    }

    if (ARCHIVOS_IGNORADOS.has(entrada.name)) continue;
    if (!EXTENSIONES.has(path.extname(entrada.name))) continue;
    if (completo.endsWith(ESTE_ARCHIVO)) continue;

    encontrados.push(completo);
  }

  return encontrados;
}

const relativizar = (p: string) => path.relative(RAIZ, p).split(path.sep).join('/');

describe('Seguridad: los secretos no viven en el cliente', () => {
  const archivosFuente = recorrerArchivos(RAIZ);

  it('encuentra archivos para analizar (el escaneo no está vacío por error)', () => {
    expect(archivosFuente.length).toBeGreaterThan(20);
  });

  it('no hay secretos hardcodeados en el código fuente', () => {
    const hallazgos: string[] = [];

    for (const archivo of archivosFuente) {
      const contenido = fs.readFileSync(archivo, 'utf8');
      for (const { nombre, re } of PATRONES_PROHIBIDOS) {
        if (re.test(contenido)) {
          hallazgos.push(`  ${relativizar(archivo)}\n    -> ${nombre}`);
        }
      }
    }

    expect(
      hallazgos,
      `Se encontraron secretos hardcodeados. Sacalos del código y ROTALOS en el proveedor:\n${hallazgos.join('\n')}`
    ).toEqual([]);
  });

  it('ningún archivo del frontend lee un secreto vía import.meta.env.VITE_*', () => {
    const hallazgos: string[] = [];

    for (const archivo of archivosFuente) {
      // El backend corre en Node: ahí `process.env` sí es privado y no se escanea.
      if (relativizar(archivo).includes('cordova-sri-backend/')) continue;
      if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(archivo)) continue;

      const contenido = fs.readFileSync(archivo, 'utf8');
      const lineas = contenido.split('\n');

      lineas.forEach((linea, i) => {
        if (!NOMBRES_PROHIBIDOS_VITE.test(linea)) return;
        if (EXCEPCIONES_VITE.some(ex => ex.test(linea))) return;
        hallazgos.push(`  ${relativizar(archivo)}:${i + 1}`);
      });
    }

    expect(
      hallazgos,
      `Estos archivos exponen un secreto al navegador (todo VITE_ se incrusta en el bundle).\n` +
      `Movelo al backend y consumilo por services/backendApi.ts:\n${hallazgos.join('\n')}`
    ).toEqual([]);
  });

  it('el bundle compilado no contiene ningún JWT con rol service_role', () => {
    const dist = path.join(RAIZ, 'dist');
    if (!fs.existsSync(dist)) {
      // Sin build previo no hay nada que auditar; `npm run build` genera dist/.
      return;
    }

    const bundles: string[] = [];
    const recorrerBundles = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const completo = path.join(dir, e.name);
        if (e.isDirectory()) recorrerBundles(completo);
        else if (e.name.endsWith('.js')) bundles.push(completo);
      }
    };
    recorrerBundles(dist);

    const ofensores: string[] = [];
    const reJwt = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g;

    for (const bundle of bundles) {
      const contenido = fs.readFileSync(bundle, 'utf8');
      for (const match of contenido.matchAll(reJwt)) {
        const payload = match[0].split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        try {
          const json = Buffer.from(payload, 'base64').toString('utf8');
          if (/"role"\s*:\s*"service_role"/.test(json)) {
            ofensores.push(`  ${relativizar(bundle)} -> JWT con rol service_role`);
          }
        } catch {
          // No era un JWT decodificable; se ignora.
        }
      }
    }

    expect(
      ofensores,
      `El bundle público contiene la clave maestra de Supabase. Cualquiera puede leerla\n` +
      `con Ctrl+U y tiene acceso total a la base. Rotala en Supabase y subila solo como\n` +
      `variable de entorno del servidor:\n${ofensores.join('\n')}`
    ).toEqual([]);
  });
});
