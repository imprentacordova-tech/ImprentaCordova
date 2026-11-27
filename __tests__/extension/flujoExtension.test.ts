// @vitest-environment jsdom
/**
 * Reglas del flujo de la extensión v3 que no dependen del portal del SRI:
 * cuándo registrar la orden y qué datos manda al backend.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { DOCUMENTOS_SRI } from '../../services/solicitudesWebService';

type Flujo = {
  debeRegistrarOrden: (lanzamiento: unknown) => boolean;
  armarTrabajoPayload: (orden: Record<string, unknown>, clienteId: string | null) => Record<string, unknown>;
  detectarAceptacion: (texto: string) => boolean;
  esc: (texto: unknown) => string;
};

let P: Flujo;

beforeAll(async () => {
  await import('../../sri-chrome-extension/Solicitador de documentos/Extension_Imprenta_Cordova/docTypes.js');
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

describe('vocabulario compartido de documentos', () => {
  it('docTypes.js de la extensión es espejo exacto de DOCUMENTOS_SRI del panel', () => {
    const ext = (globalThis as unknown as { CORDOVA_DOC_TYPES: Array<{ codigo: string; nombre: string }> }).CORDOVA_DOC_TYPES;
    expect(ext).toEqual(DOCUMENTOS_SRI.map(d => ({ codigo: d.docType, nombre: d.nombre })));
  });
});

describe('armarTrabajoPayload — datos completos al registrar desde la extensión', () => {
  const orden = {
    clientRuc: '0705787745001', clientName: 'CORDOVA RAMIREZ ROBERTO', docType: '5', blocks: 200,
    docSize: '1/4 Oficio', total: 20, abono: 0, establecimiento: '002', puntoEmision: '003',
    numeracion: '501', serie: '002-003', direccion: 'COLON Y SUCRE', fechaSolicitud: '29-10-2026', caducidad: '',
  };

  it('usa el establecimiento y punto de emisión leídos del SRI (no 001 fijo)', () => {
    const p = P.armarTrabajoPayload(orden, 'c1');
    expect(p.establecimiento).toBe('002');
    expect(p.punto_emision).toBe('003');
    expect(p.cliente_id).toBe('c1');
  });

  it('nombra el documento con el vocabulario compartido (5 = Guía de Remisión)', () => {
    expect(P.armarTrabajoPayload(orden, null).tipo).toBe('Guía de Remisión');
  });

  it('manda la numeración y deja serie, dirección y fecha en observaciones', () => {
    const p = P.armarTrabajoPayload(orden, null);
    expect(p.numeracion).toBe('501');
    expect(String(p.observaciones)).toContain('002-003');
    expect(String(p.observaciones)).toContain('COLON Y SUCRE');
    expect(String(p.observaciones)).toContain('29-10-2026');
  });

  it('sin establecimiento leído cae en 001', () => {
    const p = P.armarTrabajoPayload({ ...orden, establecimiento: '', puntoEmision: undefined }, null);
    expect(p.establecimiento).toBe('001');
    expect(p.punto_emision).toBe('001');
  });
});

describe('detectarAceptacion — solo con confirmación explícita del SRI', () => {
  it('reconoce mensajes de éxito', () => {
    expect(P.detectarAceptacion('La solicitud ha sido aceptada correctamente.')).toBe(true);
    expect(P.detectarAceptacion('Solicitud procesada exitosamente')).toBe(true);
    expect(P.detectarAceptacion('Se ha aceptado la solicitud de impresión')).toBe(true);
  });
  it('la página de confirmación recién cargada (pregunta) NO cuenta', () => {
    expect(P.detectarAceptacion('¿Está seguro de aceptar la solicitud? RUC: 0705787745001 Aceptar Cancelar')).toBe(false);
  });
  it('un error nunca cuenta aunque mencione "aceptada"', () => {
    expect(P.detectarAceptacion('Error: la solicitud no pudo ser aceptada correctamente')).toBe(false);
    expect(P.detectarAceptacion('')).toBe(false);
  });
});

describe('esc — datos leídos del SRI nunca se inyectan como HTML', () => {
  it('escapa los caracteres de HTML', () => {
    expect(P.esc(`<img src=x onerror=alert(1)> & "q" 's'`)).toBe('&lt;img src=x onerror=alert(1)&gt; &amp; &quot;q&quot; &#39;s&#39;');
  });
  it('tolera null y números', () => {
    expect(P.esc(null)).toBe('');
    expect(P.esc(13)).toBe('13');
  });
});
