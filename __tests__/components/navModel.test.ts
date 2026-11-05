/**
 * Pruebas del modelo de navegación del panel interno.
 * ===================================================
 *
 * El menú es la única puerta a 20 módulos. Los errores que esta prueba atrapa
 * son los que en la práctica aparecen al agregar una pantalla:
 *
 *   • La ruta nueva no se agregó a `PAGE_TITLES` → el header dice "Sistema".
 *   • El `badge` apunta a una clave que el Layout no calcula → el contador
 *     nunca aparece y nadie entiende por qué.
 *   • Un módulo de administración se colgó de un grupo visible para todos →
 *     un operador ve "Usuarios" o "Configuración".
 *   • Se duplicó una ruta en dos grupos → React avisa por `key` repetida y el
 *     resaltado del ítem activo se vuelve ambiguo.
 */
import { describe, it, expect } from 'vitest';
import { buildNavGroups, PAGE_TITLES, ATAJOS, RUTA_CTA } from '../../components/layout/navModel';

/** Contadores que calcula `Layout` y pasa como `badges`. */
const BADGES_DISPONIBLES = ['ordenes', 'cobrar', 'stock'];

const items = (isAdmin: boolean) => buildNavGroups(isAdmin).flatMap((g) => g.items);
/** La descarga de la extensión es un `<a download>`, no una ruta de la app. */
const esDescarga = (path: string) => path.endsWith('.zip');

describe('buildNavGroups — qué ve cada rol', () => {
  it('el operador no ve el grupo Sistema', () => {
    const ids = buildNavGroups(false).map((g) => g.id);
    expect(ids).not.toContain('sistema');
    expect(ids).toEqual(['operaciones', 'taller', 'finanzas', 'entidades']);
  });

  it('el admin ve Sistema al final, sin perder ningún otro grupo', () => {
    const ids = buildNavGroups(true).map((g) => g.id);
    expect(ids).toEqual(['operaciones', 'taller', 'finanzas', 'entidades', 'sistema']);
  });

  it('las rutas sensibles están SOLO en el grupo de admin', () => {
    const deOperador = items(false).map((i) => i.path);
    for (const ruta of ['/usuarios', '/registro', '/configuracion']) {
      expect(deOperador, ruta).not.toContain(ruta);
      expect(items(true).map((i) => i.path), ruta).toContain(ruta);
    }
  });

  it('cada grupo tiene título e ítems', () => {
    for (const g of buildNavGroups(true)) {
      expect(g.title.trim().length, g.id).toBeGreaterThan(0);
      expect(g.items.length, g.id).toBeGreaterThan(0);
    }
  });
});

describe('integridad de los ítems', () => {
  it('ninguna ruta está duplicada entre grupos', () => {
    const rutas = items(true).map((i) => i.path);
    expect(new Set(rutas).size).toBe(rutas.length);
  });

  it('todos tienen etiqueta e ícono (si no, la fila sale vacía)', () => {
    for (const i of items(true)) {
      expect(i.label.trim().length, i.path).toBeGreaterThan(0);
      expect(i.icon, i.path).toBeTruthy();
    }
  });

  it('toda ruta de la app tiene título de página', () => {
    for (const i of items(true)) {
      if (esDescarga(i.path)) continue;
      expect(PAGE_TITLES[i.path], `falta el título de ${i.path}`).toBeTruthy();
    }
  });

  it('los badges apuntan a contadores que el Layout calcula de verdad', () => {
    for (const i of items(true)) {
      if (!i.badge || esDescarga(i.path)) continue;
      expect(BADGES_DISPONIBLES, `badge desconocido en ${i.path}`).toContain(i.badge);
    }
  });

  it('las rutas arrancan con / (si no, NavLink navega relativo y rompe el enlace)', () => {
    for (const i of items(true)) expect(i.path.startsWith('/'), i.path).toBe(true);
  });
});

describe('atajos de teclado y acción principal', () => {
  it('todo atajo anunciado corresponde a una ruta real del menú', () => {
    const rutas = items(true).map((i) => i.path);
    for (const ruta of Object.keys(ATAJOS)) {
      expect(rutas, `el atajo ${ATAJOS[ruta]} apunta a ${ruta}, que no está en el menú`).toContain(ruta);
    }
  });

  it('cada atajo es una sola tecla (se dibuja como ⌥X en una tecla chica)', () => {
    for (const [ruta, tecla] of Object.entries(ATAJOS)) {
      expect(tecla, ruta).toMatch(/^[A-Z]$/);
    }
  });

  it('no hay dos rutas con el mismo atajo', () => {
    const teclas = Object.values(ATAJOS);
    expect(new Set(teclas).size).toBe(teclas.length);
  });

  it('la acción destacada (Nueva Orden) existe en el menú', () => {
    expect(items(true).map((i) => i.path)).toContain(RUTA_CTA);
  });
});

describe('PAGE_TITLES', () => {
  it('no hay títulos vacíos', () => {
    for (const [ruta, titulo] of Object.entries(PAGE_TITLES)) {
      expect(titulo.trim().length, ruta).toBeGreaterThan(0);
    }
  });
});
