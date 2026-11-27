/**
 * Reglas de rendimiento del sitio público (auditoría docs/design/auditoria-publica-2026-11.md):
 *   • toda <img> reserva su espacio (width/height) y declara cómo cargar (loading);
 *   • las fotos de la portada se sirven en WebP, no en PNG de ~800 KB.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = join(__dirname, '..', '..');
const PUBLICAS = [
  'pages/VisualLanding.tsx',
  'pages/Vitrina.tsx',
  'pages/Tracking.tsx',
  'pages/SolicitarOnline.tsx',
  'components/PublicNavbar.tsx',
];

/** Cada etiqueta <img ...> completa (puede ocupar varias líneas). */
const etiquetasImg = (src: string) => src.match(/<img\b[\s\S]*?\/>/g) ?? [];

describe('imágenes del sitio público', () => {
  for (const archivo of PUBLICAS) {
    it(`${archivo}: toda <img> tiene width, height y loading`, () => {
      const src = readFileSync(join(RAIZ, archivo), 'utf8');
      for (const tag of etiquetasImg(src)) {
        expect(tag, tag).toMatch(/\bwidth=/);
        expect(tag, tag).toMatch(/\bheight=/);
        expect(tag, tag).toMatch(/\bloading=/);
      }
    });
  }

  it('las fotos de la portada se referencian en WebP y el archivo existe', () => {
    for (const archivo of ['pages/VisualLanding.tsx', 'pages/Vitrina.tsx']) {
      const src = readFileSync(join(RAIZ, archivo), 'utf8');
      const nombres = [...src.matchAll(/IMG\('([^']+)'\)|img:\s*'([^']+)'/g)].map(m => m[1] ?? m[2]);
      expect(nombres.length).toBeGreaterThan(0);
      for (const n of nombres) {
        expect(n, `${archivo}: ${n}`).toMatch(/\.webp$/);
        expect(existsSync(join(RAIZ, 'public', 'images', 'landing', n)), n).toBe(true);
      }
    }
  });
});
