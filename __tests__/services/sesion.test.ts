// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sesion, guardarBorrador, leerBorrador, debeUsarRespaldo, rutaDeVuelta, compartirSesionConExtension, escucharPuenteExtension } from '../../services/sesion';

const token = (expSeg: number) => `${btoa(JSON.stringify({ sub: 'u1', nombre: 'Pedro', rol: 'Admin', exp: expSeg }))}.firma`;
const ahoraSeg = () => Math.floor(Date.now() / 1000);

beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

describe('sesion', () => {
  it('guarda, devuelve y limpia el token', () => {
    const t = token(ahoraSeg() + 3600);
    sesion.guardar(t);
    expect(sesion.token()).toBe(t);
    sesion.limpiar();
    expect(sesion.token()).toBeNull();
  });

  it('vencida: pasado → true, futuro → false, basura → true', () => {
    expect(sesion.vencida(token(ahoraSeg() - 10))).toBe(true);
    expect(sesion.vencida(token(ahoraSeg() + 3600))).toBe(false);
    expect(sesion.vencida('no-es-un-token')).toBe(true);
    expect(sesion.vencida('')).toBe(true);
  });

  it('token() no devuelve un token vencido (y lo borra)', () => {
    sesion.guardar(token(ahoraSeg() - 10));
    expect(sesion.token()).toBeNull();
  });
});

describe('borrador de Nueva Orden', () => {
  it('ida y vuelta por sessionStorage, y se consume una sola vez', () => {
    guardarBorrador({ items: [{ id: 'x', nombre: 'Factura' }], clienteId: 'c1' });
    expect(leerBorrador()).toEqual({ items: [{ id: 'x', nombre: 'Factura' }], clienteId: 'c1' });
    expect(leerBorrador()).toBeNull();
  });
});

describe('debeUsarRespaldo (login de nombres fijos)', () => {
  it('nunca si el servidor rechazó las credenciales', () => {
    for (const st of [401, 403, 429]) expect(debeUsarRespaldo(st, true)).toBe(false);
  });
  it('si el servidor no responde o no tiene login configurado, solo con el respaldo habilitado', () => {
    for (const st of [0, 408, 500, 503]) {
      expect(debeUsarRespaldo(st, true)).toBe(true);
      expect(debeUsarRespaldo(st, false)).toBe(false);
    }
  });
});

describe('rutaDeVuelta', () => {
  it('acepta rutas internas del panel', () => {
    expect(rutaDeVuelta('/nuevo?ruc=1')).toBe('/nuevo?ruc=1');
  });
  it('rechaza externas, protocolo-relativas y vacías', () => {
    expect(rutaDeVuelta('https://malo.com')).toBe('/dashboard');
    expect(rutaDeVuelta('//malo.com')).toBe('/dashboard');
    expect(rutaDeVuelta('/\\malo.com')).toBe('/dashboard');
    expect(rutaDeVuelta(null)).toBe('/dashboard');
    expect(rutaDeVuelta('/login')).toBe('/dashboard');
  });
});

describe('puente con la extensión', () => {
  it('compartirSesionConExtension postea CORDOVA_SESSION solo a la propia página', () => {
    const espia = vi.spyOn(window, 'postMessage');
    compartirSesionConExtension('a.b', 'Pedro');
    expect(espia).toHaveBeenCalledWith({ type: 'CORDOVA_SESSION', token: 'a.b', nombre: 'Pedro' }, window.location.origin);
    espia.mockRestore();
  });

  it('al anunciarse el puente (CORDOVA_BRIDGE_READY) se le reenvía la sesión vigente', () => {
    sesion.guardar(token(ahoraSeg() + 3600));
    const espia = vi.spyOn(window, 'postMessage');
    const quitar = escucharPuenteExtension(() => 'Pedro');
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'CORDOVA_BRIDGE_READY' }, source: window, origin: window.location.origin }));
    quitar();
    expect(espia).toHaveBeenCalledWith(expect.objectContaining({ type: 'CORDOVA_SESSION', nombre: 'Pedro' }), window.location.origin);
    espia.mockRestore();
  });

  it('ignora anuncios que no vienen de la propia ventana', () => {
    sesion.guardar(token(ahoraSeg() + 3600));
    const espia = vi.spyOn(window, 'postMessage');
    const quitar = escucharPuenteExtension(() => 'Pedro');
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'CORDOVA_BRIDGE_READY' }, origin: 'https://otro.com' }));
    quitar();
    expect(espia).not.toHaveBeenCalled();
    espia.mockRestore();
  });
});
