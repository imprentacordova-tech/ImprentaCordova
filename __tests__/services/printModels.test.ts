/**
 * Tests de los modelos de impresión.
 *
 * Lo que se protege acá: que un trabajo comercial nunca salga con el modelo de una
 * solicitud SRI (ni al revés) y que un `?mode=` inválido no deje el documento sin abrir.
 * Confundir la variante arruina un talonario ya autorizado por el SRI.
 */

import { describe, it, expect } from 'vitest';
import {
  MODELOS,
  esModeloSRI,
  esSoloLlenado,
  modeloDesdeQuery,
  modeloPorDefecto,
  modelosDe,
  marcadoTramite,
  resolverModelo,
  resolverTramite,
  TRAMITES_SRI,
  TRAMITE_POR_DEFECTO,
  vaSobrePreimpreso,
  type ModeloImpresion,
} from '../../services/printModels';

const TODOS = Object.keys(MODELOS) as ModeloImpresion[];

describe('catálogo de modelos', () => {
  it('cada descriptor tiene su propia clave como id', () => {
    for (const id of TODOS) {
      expect(MODELOS[id].id).toBe(id);
    }
  });

  it('todos tienen label, descripción y marca de taller no vacíos', () => {
    for (const id of TODOS) {
      expect(MODELOS[id].label.trim().length).toBeGreaterThan(0);
      expect(MODELOS[id].descripcion.trim().length).toBeGreaterThan(0);
      expect(MODELOS[id].marcaTaller.trim().length).toBeGreaterThan(0);
    }
  });

  it('las marcas de taller son únicas (el taller las usa para no confundir hojas)', () => {
    const marcas = TODOS.map(id => MODELOS[id].marcaTaller);
    expect(new Set(marcas).size).toBe(marcas.length);
  });

  it('hay exactamente 4 variantes SRI, 3 comerciales y 3 de nota de venta activas', () => {
    expect(modelosDe('SRI')).toHaveLength(4);
    expect(modelosDe('Comercial')).toHaveLength(3);
    expect(modelosDe('NotaVenta')).toHaveLength(3);
  });

  it('las variantes de llenado sobre offset imprimen sin el arte preimpreso', () => {
    const soloLlenado = TODOS.filter(esSoloLlenado);
    expect(soloLlenado.sort()).toEqual(['comercial-recibo', 'comercial-sobre-preimpreso', 'nota-sobre-preimpreso', 'sri-sobre-preimpreso'].sort());
  });
});

describe('esModeloSRI', () => {
  it('distingue las familias', () => {
    expect(esModeloSRI('sri-sobre-preimpreso')).toBe(true);
    expect(esModeloSRI('sri-pc')).toBe(true);
    expect(esModeloSRI('sri-arte-completo')).toBe(true);
    expect(esModeloSRI('sri-moderno')).toBe(true);
    expect(esModeloSRI('comercial-sobre-preimpreso')).toBe(false);
    expect(esModeloSRI('comercial-arte-completo')).toBe(false);
    expect(esModeloSRI('comercial-moderno')).toBe(false);
    expect(esModeloSRI('comercial-recibo')).toBe(false);
    expect(esModeloSRI('nota-sobre-preimpreso')).toBe(false);
    expect(esModeloSRI('nota-arte-completo')).toBe(false);
    expect(esModeloSRI('nota-moderna')).toBe(false);
  });
});

describe('modeloPorDefecto', () => {
  it('una orden SRI cae en "sobre preimpreso", comercial en su recibo preimpreso y nota de venta en su preimpreso', () => {
    expect(modeloPorDefecto(true)).toBe('sri-sobre-preimpreso');
    expect(modeloPorDefecto(false)).toBe('comercial-sobre-preimpreso');
    expect(modeloPorDefecto(false, true)).toBe('nota-sobre-preimpreso');
  });
});

describe('modeloDesdeQuery', () => {
  it('respeta un modelo válido de la familia correcta', () => {
    expect(modeloDesdeQuery('sri-sobre-preimpreso', true)).toBe('sri-sobre-preimpreso');
    expect(modeloDesdeQuery('sri-arte-completo', true)).toBe('sri-arte-completo');
    expect(modeloDesdeQuery('comercial-sobre-preimpreso', false)).toBe('comercial-sobre-preimpreso');
    expect(modeloDesdeQuery('comercial-arte-completo', false)).toBe('comercial-arte-completo');
    expect(modeloDesdeQuery('comercial-moderno', false)).toBe('comercial-moderno');
    expect(modeloDesdeQuery('comercial-recibo', false)).toBe('comercial-recibo');
  });

  it('RECHAZA un modelo SRI en una orden comercial (y cae al recibo)', () => {
    expect(modeloDesdeQuery('sri-sobre-preimpreso', false)).toBe('comercial-sobre-preimpreso');
    expect(modeloDesdeQuery('sri-pc', false)).toBe('comercial-sobre-preimpreso');
  });

  it('RECHAZA un recibo comercial en una orden SRI (y cae al default de SRI)', () => {
    expect(modeloDesdeQuery('comercial-sobre-preimpreso', true)).toBe('sri-sobre-preimpreso');
    expect(modeloDesdeQuery('comercial-recibo', true)).toBe('sri-sobre-preimpreso');
  });

  it('un valor desconocido no rompe: cae al modelo por defecto', () => {
    expect(modeloDesdeQuery('inventado', true)).toBe('sri-sobre-preimpreso');
    expect(modeloDesdeQuery('inventado', false)).toBe('comercial-sobre-preimpreso');
  });

  it('sin parámetro cae al modelo por defecto', () => {
    expect(modeloDesdeQuery(null, true)).toBe('sri-sobre-preimpreso');
    expect(modeloDesdeQuery(undefined, false)).toBe('comercial-sobre-preimpreso');
    expect(modeloDesdeQuery('', true)).toBe('sri-sobre-preimpreso');
  });

  it('tolera espacios alrededor del valor', () => {
    expect(modeloDesdeQuery('  sri-pc  ', true)).toBe('sri-pc');
  });
});

describe('papel físico y preimpreso', () => {
  it('todo modelo declara su papel', () => {
    for (const id of TODOS) {
      expect(MODELOS[id].papel.nombre.trim().length).toBeGreaterThan(0);
      expect(MODELOS[id].papel.tinta.trim().length).toBeGreaterThan(0);
      expect(['horizontal', 'vertical']).toContain(MODELOS[id].papel.orientacion);
      expect(typeof MODELOS[id].papel.sobrePreimpreso).toBe('boolean');
    }
  });

  it('se imprimen SIN preimpreso los modelos para hoja en blanco', () => {
    const sinPreimpreso = TODOS.filter(id => !vaSobrePreimpreso(id));
    expect(sinPreimpreso.sort()).toEqual([
      'comercial-arte-completo',
      'comercial-moderno',
      'nota-arte-completo',
      'nota-moderna',
      'sri-arte-completo',
      'sri-moderno',
      'sri-pc'
    ].sort());
  });

  it('los modelos sobre preimpreso NO deben redibujar el arte (se duplicaría sobre el papel)', () => {
    for (const id of TODOS) {
      if (!vaSobrePreimpreso(id)) continue;
      // El recibo y la solicitud preimpresos ya traen sus etiquetas: el sistema sólo aporta datos.
      expect(MODELOS[id].capa === 'solo-llenado' || MODELOS[id].capa === 'arte-con-campos').toBe(true);
    }
  });

  it('la solicitud SRI preimpresa es vertical y el recibo comercial horizontal (medido en los formatos)', () => {
    expect(MODELOS['sri-sobre-preimpreso'].papel.orientacion).toBe('vertical');
    expect(MODELOS['comercial-recibo'].papel.orientacion).toBe('horizontal');
  });

  it('el recibo comercial es monocromo y la solicitud SRI va en navy', () => {
    expect(MODELOS['comercial-recibo'].papel.tinta).toBe('monocromo');
    expect(MODELOS['sri-pc'].papel.tinta).toBe('#0A1A46');
  });

  it('las medidas en mm son las confirmadas por el dueño', () => {
    // 1/4 de oficio = 11 x 16 cm apaisado · medio oficio = 16 x 22 cm vertical.
    expect(MODELOS['comercial-recibo'].papel).toMatchObject({ anchoMm: 160, altoMm: 110, orientacion: 'horizontal' });
    expect(MODELOS['sri-sobre-preimpreso'].papel).toMatchObject({ anchoMm: 160, altoMm: 220, orientacion: 'vertical' });
    expect(MODELOS['sri-arte-completo'].papel).toMatchObject({ anchoMm: 160, altoMm: 220 });
    expect(MODELOS['sri-moderno'].papel).toMatchObject({ anchoMm: 160, altoMm: 220 });
    expect(MODELOS['sri-pc'].papel).toMatchObject({ anchoMm: 210, altoMm: 297 });
  });

  it('el medio oficio es la hoja partida al medio: mismo lado corto, el doble de largo', () => {
    const cuarto = MODELOS['comercial-recibo'].papel;      // 160 x 110
    const medio = MODELOS['sri-sobre-preimpreso'].papel;     // 160 x 220
    expect(medio.anchoMm).toBe(cuarto.anchoMm);
    expect(medio.altoMm).toBe(cuarto.altoMm * 2);
  });

  it('las medidas declaradas coinciden con la proporción declarada (tolerancia 5%)', () => {
    for (const id of TODOS) {
      const p = MODELOS[id].papel;
      const real = p.anchoMm / p.altoMm;
      const [a, b] = p.proporcion.split(':').map(s => Number(s.replace(',', '.')));
      const declarada = a / b;
      expect(Math.abs(real - declarada) / declarada).toBeLessThan(0.05);
    }
  });
});

describe('resolverModelo (lo guardado en la orden vs. la URL)', () => {
  it('el ?mode= explícito manda sobre lo guardado', () => {
    expect(resolverModelo('sri-pc', 'sri-arte-completo', true)).toBe('sri-arte-completo');
  });

  it('sin ?mode=, manda el modelo GUARDADO en la orden', () => {
    // Esto es lo que hace que la extensión y el documento impriman la misma variante.
    expect(resolverModelo('sri-arte-completo', null, true)).toBe('sri-arte-completo');
    expect(resolverModelo('sri-arte-completo', undefined, true)).toBe('sri-arte-completo');
    expect(resolverModelo('sri-arte-completo', '', true)).toBe('sri-arte-completo');
  });

  it('sin nada, aplica el default de la familia', () => {
    expect(resolverModelo(null, null, true)).toBe('sri-sobre-preimpreso');
    expect(resolverModelo(undefined, undefined, false)).toBe('comercial-sobre-preimpreso');
  });

  it('un valor guardado corrupto NO rompe: cae al default', () => {
    expect(resolverModelo('lo-que-sea', null, true)).toBe('sri-sobre-preimpreso');
    expect(resolverModelo('', null, false)).toBe('comercial-sobre-preimpreso');
  });

  it('un valor guardado de la familia equivocada se descarta', () => {
    // Una orden SRI no puede quedar guardada con el modelo de un recibo comercial.
    expect(resolverModelo('comercial-recibo', null, true)).toBe('sri-sobre-preimpreso');
    expect(resolverModelo('sri-arte-completo', null, false)).toBe('comercial-sobre-preimpreso');
  });

  it('un ?mode= de la familia equivocada no se acepta y deja pasar lo guardado', () => {
    expect(resolverModelo('sri-arte-completo', 'comercial-recibo', true)).toBe('sri-arte-completo');
  });

  it('tolera espacios alrededor del valor guardado', () => {
    expect(resolverModelo('  sri-sobre-preimpreso  ', null, true)).toBe('sri-sobre-preimpreso');
  });
});

describe('marcado del trámite SRI (Aument. / Cambiar / Mismo)', () => {
  it('imprime SIEMPRE las tres casillas, con el tilde en la elegida', () => {
    // Las tres van impresas porque así están en el preimpreso medido. Antes el documento
    // mostraba solo dos ("Aument.[ ] Mismo[✓]") y omitía "Cambiar" por completo.
    // Los rótulos son los del formulario físico (formatos/ESPECIFICACIONES.md): "Cambiar"
    // sin punto, tal como se lee en el preimpreso, y por eso el arte completo también lo
    // reproduce así.
    expect(marcadoTramite('AUMENTO')).toBe('Aument.[✓] Cambiar[ ] Mismo[ ]');
    expect(marcadoTramite('CAMBIO')).toBe('Aument.[ ] Cambiar[✓] Mismo[ ]');
    expect(marcadoTramite('MISMO')).toBe('Aument.[ ] Cambiar[ ] Mismo[✓]');
  });

  it('sin dato cae en MISMO, que es exactamente lo que el documento imprimía hardcodeado', () => {
    // Garantiza que ninguna orden existente cambie de comportamiento al desplegar esto.
    expect(marcadoTramite(undefined)).toBe('Aument.[ ] Cambiar[ ] Mismo[✓]');
    expect(marcadoTramite(null)).toBe('Aument.[ ] Cambiar[ ] Mismo[✓]');
    expect(marcadoTramite('')).toBe('Aument.[ ] Cambiar[ ] Mismo[✓]');
  });

  it('un valor corrupto NO rompe: cae al default', () => {
    expect(marcadoTramite('lo-que-sea')).toBe('Aument.[ ] Cambiar[ ] Mismo[✓]');
    expect(resolverTramite('lo-que-sea')).toBe('MISMO');
  });

  it('nunca quedan dos casillas marcadas a la vez', () => {
    for (const t of TRAMITES_SRI) {
      const marcas = (marcadoTramite(t.id).match(/\[✓\]/g) || []).length;
      expect(marcas).toBe(1);
    }
  });

  it('las tres opciones traen rótulo y descripción para el operador', () => {
    expect(TRAMITES_SRI).toHaveLength(3);
    for (const t of TRAMITES_SRI) {
      expect(t.label.trim().length).toBeGreaterThan(0);
      expect(t.descripcion.trim().length).toBeGreaterThan(0);
    }
  });

  it('el default es MISMO (preserva el comportamiento anterior)', () => {
    expect(TRAMITE_POR_DEFECTO).toBe('MISMO');
  });
});
