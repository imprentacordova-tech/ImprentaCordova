// @vitest-environment jsdom
/**
 * Reglas del flujo de la extensión v3 que no dependen del portal del SRI:
 * cuándo registrar la orden y qué datos manda al backend.
 */
import { describe, it, expect, beforeAll } from 'vitest';

type Flujo = {
  debeRegistrarOrden: (lanzamiento: unknown) => boolean;
};

let P: Flujo;

beforeAll(async () => {
  await import('../../sri-chrome-extension/Solicitador de documentos/Extension_Imprenta_Cordova/parseoSri.js');
  P = (globalThis as unknown as { CordovaParseo: Flujo }).CordovaParseo;
});

describe('debeRegistrarOrden — sin órdenes duplicadas', () => {
  it('lanzada desde Nueva Orden: NO registra (la orden la crea el panel)', () => {
    expect(P.debeRegistrarOrden({ origen: 'nueva-orden', requestId: 'r1' })).toBe(false);
  });

  it('solicitud hecha directo en el portal: SÍ registra', () => {
    expect(P.debeRegistrarOrden({})).toBe(true);
    expect(P.debeRegistrarOrden(null)).toBe(true);
    expect(P.debeRegistrarOrden(undefined)).toBe(true);
  });

  it('un lanzamiento viejo (más de 2 h) no cuenta: se registra', () => {
    const viejo = { origen: 'nueva-orden', createdAt: Date.now() - 3 * 60 * 60 * 1000 };
    expect(P.debeRegistrarOrden(viejo)).toBe(true);
  });
});
