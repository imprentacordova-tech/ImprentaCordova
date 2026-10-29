import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * ────────────────────────────────────────────────────────────────────────────
 * La paleta está en DOS archivos y tiene que ser la MISMA
 *
 * `components/panelTheme.ts` es la fuente (la usan los paneles internos en estilos
 * inline) y `tailwind.config.js` es su espejo como clases de Tailwind (lo usa la
 * landing pública). Al no poder importarse entre sí —uno es TS y el otro lo carga
 * Tailwind con su propio loader— los hex quedan escritos dos veces.
 *
 * Esto es justamente el tipo de duplicación que se desincroniza en silencio: alguien
 * retoca el navy en el panel, la landing se queda con el viejo, y nadie lo nota hasta
 * que las dos pantallas se ven distintas. Esta prueba compara valor por valor.
 *
 * Si falla: casi siempre hay que copiar el hex nuevo al otro archivo. Si el cambio es
 * intencional y asimétrico, sacá esa fila del mapa y explicá por qué en un comentario.
 * ────────────────────────────────────────────────────────────────────────────
 */

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const leer = (relativa: string): string => readFileSync(resolve(raiz, relativa), 'utf8');

const tailwind = leer('tailwind.config.js');
const panel = leer('components/panelTheme.ts');

/** Hex declarado en `C` de panelTheme.ts. */
const hexPanel = (clave: string): string | undefined =>
  panel.match(new RegExp(`\\b${clave}:\\s*'(#[0-9A-Fa-f]{6})'`))?.[1];

/** Hex declarado en `colors` de tailwind.config.js. */
const hexTailwind = (clase: string): string | undefined =>
  tailwind.match(new RegExp(`'${clase}':\\s*'(#[0-9A-Fa-f]{6})'`))?.[1];

/** clase de Tailwind → token de panelTheme.ts */
const MAPA: ReadonlyArray<readonly [string, string]> = [
  ['ink', 'ink'],
  ['royal', 'royal'],
  ['royal-dark', 'royalHover'],
  ['gold', 'gold'],
  ['gold-hover', 'goldHover'],
  ['gold-deep', 'goldTextStrong'],
  ['gold-ink', 'goldText'],
  ['gold-soft', 'goldBg'],
  ['gold-line', 'goldBorder'],
  ['paper', 'bg'],
  ['soft', 'softGray'],
  ['tint', 'chipBlue'],
  ['body', 'body'],
  ['muted', 'muted'],
  ['faint', 'faint'],
  ['ghost', 'ghost'],
  ['hairline', 'border'],
  ['hairline-strong', 'borderStrong'],
  ['success', 'success'],
  ['success-dot', 'successDot'],
  ['danger', 'danger'],
  ['onink', 'onInkSoft'],
  ['onink-muted', 'onInkMuted'],
  ['onink-success', 'onInkSuccess'],
];

describe('paleta compartida entre Tailwind y el panel interno', () => {
  it('cada token del tema está declarado en los dos archivos', () => {
    const faltantes = MAPA.filter(([clase, token]) => hexTailwind(clase) === undefined || hexPanel(token) === undefined)
      .map(([clase, token]) => `${clase} ↔ ${token}`);

    expect(faltantes).toEqual([]);
  });

  it('los hex son idénticos, sin importar mayúsculas', () => {
    const distintos = MAPA.map(([clase, token]) => ({
      par: `${clase} ↔ ${token}`,
      tailwind: hexTailwind(clase)?.toUpperCase(),
      panel: hexPanel(token)?.toUpperCase(),
    })).filter(x => x.tailwind !== x.panel);

    expect(distintos).toEqual([]);
  });

  it('no hay dos clases de Tailwind con el mismo nombre apuntando a hex distintos', () => {
    // Un duplicado de clave en un objeto JS no da error: gana la última y la primera
    // queda muerta. Acá se detecta antes de que muerda.
    const declaradas = [...tailwind.matchAll(/'([a-z-]+)':\s*'(#[0-9A-Fa-f]{6})'/g)];
    const porNombre = new Map<string, Set<string>>();

    for (const [, clase, hex] of declaradas) {
      const set = porNombre.get(clase) ?? new Set<string>();
      set.add(hex.toUpperCase());
      porNombre.set(clase, set);
    }

    const conflictivas = [...porNombre.entries()]
      .filter(([, hexes]) => hexes.size > 1)
      .map(([clase, hexes]) => `${clase}: ${[...hexes].join(' / ')}`);

    expect(conflictivas).toEqual([]);
  });
});

describe('utilidades que la landing usa y que tienen que existir', () => {
  it('font-heading está declarada (21 títulos dependen de ella)', () => {
    expect(tailwind).toMatch(/heading:\s*\[/);
  });

  it('animate-marquee tiene animación y keyframes (el ticker se movía en el vacío)', () => {
    expect(tailwind).toMatch(/'marquee':\s*'marquee /);
    expect(tailwind).toMatch(/marquee:\s*\{\s*'0%'/);
  });
});
