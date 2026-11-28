import { describe, it, expect, vi } from 'vitest';

vi.mock('../../services/supabase', () => ({ supabase: {} }));

import {
    validarSolicitud, normalizarTelefono, generarCodigo, urlNuevaOrdenDesde, docTypeDe, CANTIDADES, mensajeWhatsAppSolicitud,
    type SolicitudWebInput, type SolicitudWeb,
} from '../../services/solicitudesWebService';
import { MASTER_CATALOG } from '../../services/catalogData';

const base: SolicitudWebInput = {
    ruc: '0702065319001', razonSocial: 'Comercial Ejemplo', telefono: '0991234567',
    documento: 'Factura', cantidad: 100, aceptaDatos: true,
};

describe('validarSolicitud', () => {
    it('acepta una solicitud completa', () => {
        expect(validarSolicitud(base)).toBeNull();
    });
    it('acepta cédula de 10 dígitos', () => {
        expect(validarSolicitud({ ...base, ruc: '0702065319' })).toBeNull();
    });
    it('rechaza RUC corto o mal terminado', () => {
        expect(validarSolicitud({ ...base, ruc: '07020653' })).toMatch(/13 dígitos/);
        expect(validarSolicitud({ ...base, ruc: '0702065319999' })).toMatch(/001/);
    });
    it('rechaza teléfono inválido y correo mal escrito', () => {
        expect(validarSolicitud({ ...base, telefono: '123' })).toMatch(/celular/);
        expect(validarSolicitud({ ...base, email: 'no-es-correo' })).toMatch(/correo/);
    });
    it('exige la autorización de uso de datos', () => {
        expect(validarSolicitud({ ...base, aceptaDatos: false })).toMatch(/autorización/);
    });
});

describe('normalizarTelefono', () => {
    it.each([
        ['+593 99 123 4567', '0991234567'],
        ['593991234567', '0991234567'],
        ['991234567', '0991234567'],
        ['099-123-4567', '0991234567'],
    ])('%s → %s', (entrada, salida) => {
        expect(normalizarTelefono(entrada)).toBe(salida);
    });
});

describe('generarCodigo', () => {
    it('usa el prefijo SW- y 6 caracteres sin letras confundibles', () => {
        const c = generarCodigo();
        expect(c).toMatch(/^SW-[A-HJ-NP-Z2-9]{6}$/);
    });
});

describe('urlNuevaOrdenDesde', () => {
    const sol: SolicitudWeb = {
        ...base, id: 'abc-123', codigo: 'SW-AAAAAA', createdAt: '2026-11-27T10:00:00Z', estado: 'NUEVA',
        direccion: 'Colón y Sucre', establecimiento: '2', puntoEmision: '001', tramite: 'NUEVO', tamano: '1/4 Oficio',
    };
    const params = (s: SolicitudWeb) => new URLSearchParams(urlNuevaOrdenDesde(s).split('?')[1]);

    it('apunta a Nueva Orden con los parámetros que entiende applySriPayload', () => {
        const url = urlNuevaOrdenDesde(sol);
        expect(url.startsWith('/nuevo?')).toBe(true);
        const p = params(sol);
        expect(p.get('ruc')).toBe('0702065319001');
        expect(p.get('name')).toBe('Comercial Ejemplo');
        expect(p.get('docType')).toBe('0');
        expect(p.get('blocks')).toBe('100');
        expect(p.get('est')).toBe('002');
        expect(p.get('solicitud')).toBe('abc-123');
    });
    it('primera vez no manda trámite (usa el default); los demás sí', () => {
        expect(params(sol).get('tramite')).toBeNull();
        expect(params({ ...sol, tramite: 'CAMBIO' }).get('tramite')).toBe('CAMBIO');
    });
    it('un documento sin código va como "otro" para no caer en Nota de Venta', () => {
        const p = params({ ...sol, documento: 'Liquidación de Compra' });
        expect(p.get('docType')).toBe('otro');
        expect(p.get('doc')).toBe('Liquidación de Compra');
    });
});

describe('vocabulario compartido', () => {
    it('factura, nota de venta y guía usan los códigos de la extensión', () => {
        expect(docTypeDe('Factura')).toBe('0');
        expect(docTypeDe('Nota de Venta')).toBe('1');
        expect(docTypeDe('Guía de Remisión')).toBe('5');
    });
    it('cada cantidad ofrecida tiene su talonario en el catálogo (precio de referencia)', () => {
        for (const c of CANTIDADES) {
            expect(MASTER_CATALOG.some(p => p.esSRI && p.nombre?.includes(`(${c} hojas)`))).toBe(true);
        }
    });
});

describe('mensajeWhatsAppSolicitud (respaldo si no se puede guardar)', () => {
  it('incluye todos los datos para que el pedido no se pierda', () => {
    const m = mensajeWhatsAppSolicitud({
      ...base, direccion: 'Colón y Sucre', copias: 'Original + 1 copia', tamano: '1/4 Oficio',
      establecimiento: '002', puntoEmision: '001', tramite: 'CAMBIO', notas: 'logo a color',
    });
    for (const parte of ['0702065319001', 'Comercial Ejemplo', 'Factura', '100', 'Original + 1 copia', '1/4 Oficio', '002-001', 'Reimpresión con cambios', 'Colón y Sucre', 'logo a color', '0991234567']) {
      expect(m).toContain(parte);
    }
  });
  it('omite los campos vacíos', () => {
    const m = mensajeWhatsAppSolicitud(base);
    expect(m).not.toContain('undefined');
    expect(m).not.toContain('Indicaciones');
  });
});
