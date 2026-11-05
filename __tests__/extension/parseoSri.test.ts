// @vitest-environment jsdom
/**
 * Pruebas del parseo de las pantallas del SRI (extensión de Chrome).
 * ==================================================================
 *
 * Todo lo que la extensión sabe de una solicitud sale de leer el HTML del
 * portal, que no controlamos. Hasta acá eso no tenía ninguna prueba: cuando el
 * SRI movía una columna, la orden se registraba con los campos vacíos y el
 * error aparecía días después, en forma de un trabajo sin dueño.
 *
 * Las pruebas cubren las dos cosas que importan:
 *   • que lea bien la maqueta conocida;
 *   • que ante una maqueta cambiada devuelva VACÍO en vez de inventar, para
 *     que el contrato de datos mínimos frene el registro.
 *
 * El HTML de muestra está escrito a partir de la pantalla real descrita en
 * `parseoSri.js`. Cuando se tenga un volcado del portal, reemplazarlo acá.
 */
import { describe, it, expect, beforeAll } from 'vitest';

type Resumen = {
  ruc: string; razonSocial: string; codigoEstablecimiento: string;
  nombreComercial: string; direccion: string; fechaSolicitud: string;
};
type Parseo = {
  leerResumenSolicitud: (doc?: Document) => Resumen;
  leerSecuencias: (doc?: Document) => { serie: string; tipo: string; inicial: string; final: string } | null;
  filasBandeja: (doc?: Document) => Array<Record<string, string>>;
  validarCaptura: (orden: unknown) => { ok: boolean; faltan: string[] };
};

let P: Parseo;

beforeAll(async () => {
  // El archivo es un script de extensión: se asigna a `self`, no exporta.
  await import('../../sri-chrome-extension/Solicitador de documentos/Extension_Imprenta_Cordova/parseoSri.js');
  P = (globalThis as unknown as { CordovaParseo: Parseo }).CordovaParseo;
});

/** Arma un documento suelto, sin tocar el de la prueba. */
const docDe = (html: string): Document =>
  new DOMParser().parseFromString(`<html><body>${html}</body></html>`, 'text/html');

const PANTALLA_FINAL = `
  <table>
    <tr><th>RUC:</th><td>0705787745001</td></tr>
    <tr><th>Razón Social:</th><td>CORDOVA RAMIREZ ROBERTO SANTIAGO</td></tr>
    <tr><th>Código del Establecimiento:</th><td>001</td></tr>
    <tr><th>Nombre Comercial del Establecimiento:</th><td>IMPRENTA CORDOVA</td></tr>
    <tr><th>Dirección del establecimiento:</th><td>COLON S/N Y SUCRE</td></tr>
    <tr><th>Fecha de Solicitud:</th><td>29-10-2026</td></tr>
  </table>`;

describe('leerResumenSolicitud — pantalla final de la solicitud', () => {
  it('lee los seis campos de la maqueta conocida', () => {
    const r = P.leerResumenSolicitud(docDe(PANTALLA_FINAL));
    expect(r).toEqual({
      ruc: '0705787745001',
      razonSocial: 'CORDOVA RAMIREZ ROBERTO SANTIAGO',
      codigoEstablecimiento: '001',
      nombreComercial: 'IMPRENTA CORDOVA',
      direccion: 'COLON S/N Y SUCRE',
      fechaSolicitud: '29-10-2026',
    });
  });

  it('tolera espacios de más y la etiqueta sin dos puntos', () => {
    const r = P.leerResumenSolicitud(docDe(`
      <table>
        <tr><th>  RUC  </th><td>  0705787745001 </td></tr>
        <tr><th>RAZÓN SOCIAL :</th><td>PEDRO   MANUEL   CORDOVA</td></tr>
      </table>`));
    expect(r.ruc).toBe('0705787745001');
    expect(r.razonSocial).toBe('PEDRO MANUEL CORDOVA');
  });

  it('lee la maqueta alternativa: etiqueta y valor en la misma caja', () => {
    const r = P.leerResumenSolicitud(docDe(`
      <div><p>RUC: 0705787745001</p></div>
      <div><p>Razón Social: COMERCIAL EL ORO</p></div>
      <div><p>Dirección del establecimiento: AV. LAS PALMERAS Y CALLE 4TA</p></div>`));
    expect(r.ruc).toBe('0705787745001');
    expect(r.razonSocial).toBe('COMERCIAL EL ORO');
    expect(r.direccion).toBe('AV. LAS PALMERAS Y CALLE 4TA');
  });

  it('un RUC que no tiene 13 dígitos se descarta en vez de arrastrarse', () => {
    // Mejor vacío —y que el contrato frene el registro— que una orden con un
    // identificador que no existe en el SRI.
    const r = P.leerResumenSolicitud(docDe(`<table><tr><th>RUC:</th><td>07057877</td></tr></table>`));
    expect(r.ruc).toBe('');
  });

  it('limpia separadores del RUC', () => {
    const r = P.leerResumenSolicitud(docDe(`<table><tr><th>RUC:</th><td>0705787745-001</td></tr></table>`));
    expect(r.ruc).toBe('0705787745001');
  });

  it('con la maqueta cambiada devuelve vacío, no basura', () => {
    // Escenario real: el SRI reemplaza la tabla por otra cosa. Lo importante
    // es que NO se invente una razón social con el texto que encuentre.
    const r = P.leerResumenSolicitud(docDe(`
      <section><h1>Comprobante de solicitud</h1><p>Su trámite fue registrado con éxito.</p></section>`));
    expect(r.ruc).toBe('');
    expect(r.razonSocial).toBe('');
  });

  it('si el valor está vacío no toma la etiqueta siguiente como valor', () => {
    const r = P.leerResumenSolicitud(docDe(`
      <table>
        <tr><th>Razón Social:</th><td></td></tr>
        <tr><th>Código del Establecimiento:</th><td>001</td></tr>
      </table>`));
    expect(r.razonSocial).toBe('');
    expect(r.codigoEstablecimiento).toBe('001');
  });

  it('no explota con un documento vacío', () => {
    expect(() => P.leerResumenSolicitud(docDe(''))).not.toThrow();
  });
});

describe('leerSecuencias — serie y rango autorizado', () => {
  const tabla = (filas: string) => docDe(`
    <table><caption>Las secuencias solicitadas son las siguientes</caption>${filas}</table>`);

  it('lee serie, tipo y rango', () => {
    const s = P.leerSecuencias(tabla(`<tr><td>001-001</td><td>NOTA DE VENTA</td><td>1</td><td>50</td></tr>`));
    expect(s).toEqual({ serie: '001-001', tipo: 'NOTA DE VENTA', inicial: '1', final: '50' });
  });

  it('encuentra la serie aunque le agreguen una columna adelante', () => {
    // Es el cambio más probable del portal y antes dejaba la serie en null,
    // que es la que identifica la solicitud en la huella anti-duplicados.
    const s = P.leerSecuencias(tabla(`<tr><td>1</td><td>001-001</td><td>FACTURA</td><td>101</td><td>200</td></tr>`));
    expect(s).toMatchObject({ serie: '001-001', tipo: 'FACTURA', inicial: '101', final: '200' });
  });

  it('ignora tablas que no son la de secuencias', () => {
    const d = docDe(`<table><tr><td>001-001</td><td>otra cosa</td><td>x</td><td>y</td></tr></table>`);
    expect(P.leerSecuencias(d)).toBeNull();
  });

  it('devuelve null si no hay ninguna fila con forma de serie', () => {
    expect(P.leerSecuencias(tabla(`<tr><td>sin datos</td></tr>`))).toBeNull();
  });
});

describe('filasBandeja — solicitudes pendientes de aceptar', () => {
  const BANDEJA = `
    <table>
      <tr><th>Solicitud</th><th>Fecha</th><th>RUC</th><th>Razón Social</th><th>Establecimiento</th><th>Dirección</th></tr>
      <tr><td>12345</td><td>29-10-2026</td><td>0705787745001</td><td>COMERCIAL EL ORO</td><td>001</td><td>COLON Y SUCRE</td></tr>
      <tr><td>12346</td><td>30-10-2026</td><td>0702065319001</td><td>PEDRO CORDOVA</td><td>002</td><td>AV. 4TA</td></tr>
    </table>`;

  it('lee las solicitudes y saltea el encabezado', () => {
    const filas = P.filasBandeja(docDe(BANDEJA));
    expect(filas).toHaveLength(2);
    expect(filas[0]).toMatchObject({
      solicitud: '12345', fecha: '29-10-2026', ruc: '0705787745001',
      razon: 'COMERCIAL EL ORO', establecimiento: '001', direccion: 'COLON Y SUCRE',
    });
  });

  it('sigue funcionando si el SRI agrega una columna al principio', () => {
    // Antes se exigía que el RUC estuviera en la tercera celda: una columna
    // nueva dejaba la bandeja vacía sin que nadie se enterara.
    const filas = P.filasBandeja(docDe(`
      <table><tr>
        <td>✔</td><td>12345</td><td>29-10-2026</td><td>0705787745001</td><td>COMERCIAL EL ORO</td><td>001</td><td>COLON Y SUCRE</td>
      </tr></table>`));
    expect(filas).toHaveLength(1);
    expect(filas[0].ruc).toBe('0705787745001');
    expect(filas[0].razon).toBe('COMERCIAL EL ORO');
  });

  it('junta la dirección cuando viene partida en varias celdas', () => {
    const filas = P.filasBandeja(docDe(`
      <table><tr>
        <td>99</td><td>01-11-2026</td><td>0705787745001</td><td>X</td><td>001</td><td>COLON</td><td>Y SUCRE</td>
      </tr></table>`));
    expect(filas[0].direccion).toBe('COLON Y SUCRE');
  });

  it('una fila sin RUC no entra a la bandeja', () => {
    const filas = P.filasBandeja(docDe(`
      <table><tr><td>a</td><td>b</td><td>c</td><td>d</td><td>e</td></tr></table>`));
    expect(filas).toEqual([]);
  });

  it('sin tabla devuelve lista vacía', () => {
    expect(P.filasBandeja(docDe('<p>No hay solicitudes pendientes.</p>'))).toEqual([]);
  });
});

describe('validarCaptura — el contrato de datos mínimos', () => {
  const ok = { clientRuc: '0705787745001', clientName: 'COMERCIAL EL ORO' };

  it('acepta una captura completa', () => {
    expect(P.validarCaptura(ok)).toEqual({ ok: true, faltan: [] });
  });

  it('rechaza sin RUC o con un RUC incompleto', () => {
    expect(P.validarCaptura({ ...ok, clientRuc: '' }).faltan).toContain('RUC');
    expect(P.validarCaptura({ ...ok, clientRuc: '07057877' }).faltan).toContain('RUC');
  });

  it('rechaza el relleno "CLIENTE SRI", que es el síntoma del parseo roto', () => {
    expect(P.validarCaptura({ ...ok, clientName: 'CLIENTE SRI' }).faltan).toContain('razón social');
    expect(P.validarCaptura({ ...ok, clientName: 'cliente sri' }).faltan).toContain('razón social');
  });

  it('rechaza un nombre demasiado corto o vacío', () => {
    expect(P.validarCaptura({ ...ok, clientName: '' }).ok).toBe(false);
    expect(P.validarCaptura({ ...ok, clientName: 'AB' }).ok).toBe(false);
  });

  it('nombra TODOS los campos que faltan, para que el aviso sea útil', () => {
    expect(P.validarCaptura({}).faltan).toEqual(['RUC', 'razón social']);
  });

  it('no explota con null', () => {
    expect(P.validarCaptura(null).ok).toBe(false);
  });
});
