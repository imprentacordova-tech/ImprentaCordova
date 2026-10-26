/**
 * Tests del tablero de taller (KDS).
 *
 * Cubren las dos exigencias de CONTINUITY_RULES.md para el monitor de producción:
 * que sea "libre de atascos" (una orden urgente o frenada tiene que verse primero) y que
 * los tiempos mostrados sean reales y no queden congelados.
 *
 * Todo se evalúa con un `ahora` fijo para que sea determinista.
 */

import { describe, it, expect } from 'vitest';
import { Trabajo, TrabajoEstado } from '../../types';
import { compararParaTaller, esUrgente, hace, tiempoEnEtapa } from '../../services/tallerBoard';

const AHORA = new Date('2026-09-14T12:00:00.000Z').getTime();
const HORA = 3600000;

/** Fábrica tipada: sin `any` y con todos los campos obligatorios de `Trabajo`. */
const trabajo = (over: Partial<Trabajo> = {}): Trabajo => ({
  id: 't1',
  orden: 1,
  clienteId: 'c1',
  titular: 'Ferretería El Oro',
  tipo: 'Nota de Venta',
  subtipo: '100 hojas',
  cantidad: 100,
  tamano: '1/4 Oficio',
  total: 15,
  abono: 0,
  saldo: 15,
  estado: TrabajoEstado.PENDIENTE,
  fechaEntrada: new Date(AHORA - 2 * HORA).toISOString(),
  caduco: false,
  estadoClave: 'PENDIENTE',
  imprimirClave: false,
  ...over,
});

const enHoras = (h: number) => new Date(AHORA + h * HORA).toISOString();

describe('esUrgente', () => {
  it('lo marcado como Urgente siempre lo es', () => {
    expect(esUrgente(trabajo({ prioridad: 'Urgente' }), AHORA)).toBe(true);
  });

  it('vence en menos de 24 h -> urgente', () => {
    expect(esUrgente(trabajo({ fechaEntrega: enHoras(5) }), AHORA)).toBe(true);
    expect(esUrgente(trabajo({ fechaEntrega: enHoras(23) }), AHORA)).toBe(true);
  });

  it('vence en más de 24 h -> no urgente', () => {
    expect(esUrgente(trabajo({ fechaEntrega: enHoras(30) }), AHORA)).toBe(false);
    expect(esUrgente(trabajo({ fechaEntrega: enHoras(72) }), AHORA)).toBe(false);
  });

  it('una orden ya vencida cuenta como urgente', () => {
    expect(esUrgente(trabajo({ fechaEntrega: enHoras(-48) }), AHORA)).toBe(true);
  });

  it('usa fechaVencimiento cuando no hay fechaEntrega (documentos SRI)', () => {
    expect(esUrgente(trabajo({ fechaVencimiento: enHoras(3) }), AHORA)).toBe(true);
    expect(esUrgente(trabajo({ fechaVencimiento: enHoras(100) }), AHORA)).toBe(false);
  });

  it('sin fecha ni prioridad no es urgente', () => {
    expect(esUrgente(trabajo(), AHORA)).toBe(false);
  });

  it('una fecha corrupta no rompe ni marca urgente', () => {
    expect(esUrgente(trabajo({ fechaEntrega: 'no-es-fecha' }), AHORA)).toBe(false);
  });

  it('prefiere fechaEntrega sobre fechaVencimiento', () => {
    expect(esUrgente(trabajo({ fechaEntrega: enHoras(100), fechaVencimiento: enHoras(1) }), AHORA)).toBe(false);
  });
});

describe('tiempoEnEtapa', () => {
  it('formatea horas y minutos', () => {
    const t = trabajo({ fechaEntrada: new Date(AHORA - (3 * HORA + 12 * 60000)).toISOString() });
    expect(tiempoEnEtapa(t, AHORA)).toBe('3 h 12 m');
  });

  it('formatea solo minutos cuando no llega a la hora', () => {
    const t = trabajo({ fechaEntrada: new Date(AHORA - 45 * 60000).toISOString() });
    expect(tiempoEnEtapa(t, AHORA)).toBe('45 m');
  });

  it('prefiere updated_at: refleja el tiempo en la etapa ACTUAL, no desde que entró', () => {
    const t = trabajo({
      fechaEntrada: new Date(AHORA - 50 * HORA).toISOString(),
      updated_at: new Date(AHORA - 2 * HORA).toISOString(),
    });
    expect(tiempoEnEtapa(t, AHORA)).toBe('2 h 0 m');
  });

  it('sin fechas devuelve el guion', () => {
    const t = trabajo({ fechaEntrada: '', updated_at: undefined });
    expect(tiempoEnEtapa(t, AHORA)).toBe('—');
  });

  it('no muestra tiempos negativos si el reloj del equipo está adelantado', () => {
    const t = trabajo({ fechaEntrada: enHoras(5) });
    expect(tiempoEnEtapa(t, AHORA)).toBe('—');
  });
});

describe('hace', () => {
  it('sin dato previo lo dice explícitamente', () => {
    expect(hace(null, AHORA)).toBe('sin sincronizar');
  });

  it('escala de segundos a minutos y horas', () => {
    expect(hace(AHORA - 30 * 1000, AHORA)).toBe('hace 30 s');
    expect(hace(AHORA - 5 * 60000, AHORA)).toBe('hace 5 min');
    expect(hace(AHORA - 3 * HORA, AHORA)).toBe('hace 3 h');
  });

  it('nunca muestra tiempos negativos', () => {
    expect(hace(AHORA + 60000, AHORA)).toBe('hace 0 s');
  });
});

describe('compararParaTaller (el antídoto contra los atascos)', () => {
  it('pone lo urgente por delante de lo normal, aunque sea más nuevo', () => {
    const urgenteNuevo = trabajo({ id: 'urgente', prioridad: 'Urgente', fechaEntrada: enHoras(-1) });
    const normalViejo = trabajo({ id: 'normal', fechaEntrada: enHoras(-100) });

    const ordenados = [normalViejo, urgenteNuevo].sort((a, b) => compararParaTaller(a, b, AHORA));
    expect(ordenados.map(t => t.id)).toEqual(['urgente', 'normal']);
  });

  it('entre normales, primero lo más atascado (lo que lleva más tiempo sin moverse)', () => {
    const viejo = trabajo({ id: 'viejo', updated_at: new Date(AHORA - 80 * HORA).toISOString() });
    const nuevo = trabajo({ id: 'nuevo', updated_at: new Date(AHORA - 2 * HORA).toISOString() });

    const ordenados = [nuevo, viejo].sort((a, b) => compararParaTaller(a, b, AHORA));
    expect(ordenados.map(t => t.id)).toEqual(['viejo', 'nuevo']);
  });

  it('entre urgentes también gana el más atascado', () => {
    const urgenteViejo = trabajo({ id: 'u-viejo', prioridad: 'Urgente', fechaEntrada: new Date(AHORA - 90 * HORA).toISOString() });
    const urgenteNuevo = trabajo({ id: 'u-nuevo', prioridad: 'Urgente', fechaEntrada: new Date(AHORA - 1 * HORA).toISOString() });

    const ordenados = [urgenteNuevo, urgenteViejo].sort((a, b) => compararParaTaller(a, b, AHORA));
    expect(ordenados.map(t => t.id)).toEqual(['u-viejo', 'u-nuevo']);
  });

  it('una orden que vence hoy adelanta a una normal vieja', () => {
    const porVencer = trabajo({ id: 'por-vencer', fechaEntrega: enHoras(6) });
    const normalVieja = trabajo({ id: 'normal-vieja', fechaEntrada: new Date(AHORA - 200 * HORA).toISOString() });

    const ordenados = [normalVieja, porVencer].sort((a, b) => compararParaTaller(a, b, AHORA));
    expect(ordenados.map(t => t.id)).toEqual(['por-vencer', 'normal-vieja']);
  });

  it('es un orden estable cuando no hay fechas', () => {
    const a = trabajo({ id: 'a', fechaEntrada: '', updated_at: undefined });
    const b = trabajo({ id: 'b', fechaEntrada: '', updated_at: undefined });
    expect(compararParaTaller(a, b, AHORA)).toBe(0);
  });
});
