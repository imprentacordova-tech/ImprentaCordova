import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Trabajo, TrabajoEstado } from '../../types';
import {
  UMBRAL_REZAGO_HORAS,
  HORAS_ENTRE_RECORDATORIOS,
  horasEnVitrina,
  diasEnVitrina,
  esRezagadoDeRetiro,
  evaluarRezago,
  clasificarRezagados,
  recordatoriosPendientes,
  mensajeRecordatorio,
} from '../../services/recordatorios';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const AHORA = new Date('2026-03-10T12:00:00.000Z').getTime();
const HORA = 3600000;

/** Trabajo mínimo con lo que mira la regla; el resto no participa. */
const trabajo = (parcial: Partial<Trabajo> = {}): Trabajo =>
  ({
    id: 't1',
    orden: 4821,
    clienteId: 'c1',
    titular: 'Cliente',
    tipo: 'Talonario',
    subtipo: 'Facturas',
    cantidad: 100,
    tamano: 'A5',
    total: 120,
    abono: 0,
    saldo: 120,
    estado: TrabajoEstado.VITRINA,
    fechaEntrada: new Date(AHORA - 60 * HORA).toISOString(),
    caduco: false,
    estadoClave: 'LISTA',
    imprimirClave: false,
    ...parcial,
  }) as Trabajo;

const haceHoras = (h: number) => new Date(AHORA - h * HORA).toISOString();

describe('horasEnVitrina / diasEnVitrina', () => {
  it('cuenta las horas transcurridas desde la entrada', () => {
    expect(horasEnVitrina(trabajo({ fechaEntrada: haceHoras(72) }), AHORA)).toBe(72);
  });

  it('un reloj adelantado no produce tiempos negativos', () => {
    const futuro = new Date(AHORA + 5 * HORA).toISOString();
    expect(horasEnVitrina(trabajo({ fechaEntrada: futuro }), AHORA)).toBe(0);
  });

  it('una fecha inválida o ausente no rompe: da 0', () => {
    expect(horasEnVitrina(trabajo({ fechaEntrada: 'no-es-fecha' }), AHORA)).toBe(0);
    expect(horasEnVitrina(trabajo({ fechaEntrada: '' }), AHORA)).toBe(0);
  });

  it('los días son horas completas, no redondeo hacia arriba', () => {
    expect(diasEnVitrina(trabajo({ fechaEntrada: haceHoras(47) }), AHORA)).toBe(1);
    expect(diasEnVitrina(trabajo({ fechaEntrada: haceHoras(49) }), AHORA)).toBe(2);
  });
});

describe('esRezagadoDeRetiro', () => {
  it('justo en el umbral ya cuenta (48 h inclusive)', () => {
    expect(esRezagadoDeRetiro(trabajo({ fechaEntrada: haceHoras(48) }), AHORA)).toBe(true);
  });

  it('una hora antes todavía no', () => {
    expect(esRezagadoDeRetiro(trabajo({ fechaEntrada: haceHoras(47) }), AHORA)).toBe(false);
  });

  it('un trabajo que ya se entregó no es rezagado, por viejo que sea', () => {
    const entregado = trabajo({ fechaEntrada: haceHoras(500), estado: TrabajoEstado.ENTREGADO });
    expect(esRezagadoDeRetiro(entregado, AHORA)).toBe(false);
  });

  it('en producción tampoco: todavía no está listo para retirar', () => {
    const enPrensa = trabajo({ fechaEntrada: haceHoras(500), estado: TrabajoEstado.PROCESO });
    expect(esRezagadoDeRetiro(enPrensa, AHORA)).toBe(false);
  });
});

describe('evaluarRezago y la regla de insistencia', () => {
  const viejo = trabajo({ fechaEntrada: haceHoras(120) });

  it('sin aviso previo, toca recordar', () => {
    const r = evaluarRezago(viejo, AHORA, null, true);
    expect(r.estado).toBe('pendiente');
    expect(r.ultimoAviso).toBeNull();
    expect(r.horasParaInsistir).toBe(0);
  });

  it('recién avisado NO se vuelve a molestar', () => {
    const r = evaluarRezago(viejo, AHORA, haceHoras(10), true);
    expect(r.estado).toBe('avisado_reciente');
    expect(r.horasParaInsistir).toBe(HORAS_ENTRE_RECORDATORIOS - 10);
  });

  it('pasada la semana, se insiste', () => {
    expect(evaluarRezago(viejo, AHORA, haceHoras(168), true).estado).toBe('pendiente');
    expect(evaluarRezago(viejo, AHORA, haceHoras(200), true).estado).toBe('pendiente');
  });

  it('sin teléfono ni correo se marca aparte, no se reintenta en el vacío', () => {
    const r = evaluarRezago(viejo, AHORA, null, false);
    expect(r.estado).toBe('sin_contacto');
    expect(r.horasParaInsistir).toBe(0);
  });

  it('un aviso con fecha corrupta se trata como "nunca avisado"', () => {
    expect(evaluarRezago(viejo, AHORA, 'no-es-fecha', true).estado).toBe('pendiente');
  });
});

describe('clasificarRezagados', () => {
  it('deja afuera lo que no es rezagado', () => {
    const lista = [
      trabajo({ id: 'nuevo', fechaEntrada: haceHoras(2) }),
      trabajo({ id: 'entregado', fechaEntrada: haceHoras(300), estado: TrabajoEstado.ENTREGADO }),
      trabajo({ id: 'viejo', fechaEntrada: haceHoras(100) }),
    ];
    expect(clasificarRezagados(lista, AHORA).map(r => r.trabajo.id)).toEqual(['viejo']);
  });

  it('ordena del más viejo al más nuevo: primero lo que más lugar ocupa', () => {
    const lista = [
      trabajo({ id: 'dos-dias', fechaEntrada: haceHoras(50) }),
      trabajo({ id: 'semana', fechaEntrada: haceHoras(170) }),
      trabajo({ id: 'tres-dias', fechaEntrada: haceHoras(80) }),
    ];
    expect(clasificarRezagados(lista, AHORA).map(r => r.trabajo.id)).toEqual([
      'semana',
      'tres-dias',
      'dos-dias',
    ]);
  });

  it('recordatoriosPendientes filtra los ya avisados', () => {
    const lista = [
      trabajo({ id: 'avisado', fechaEntrada: haceHoras(100) }),
      trabajo({ id: 'pendiente', fechaEntrada: haceHoras(100) }),
    ];
    const pendientes = recordatoriosPendientes(lista, AHORA, { avisado: haceHoras(2) });
    expect(pendientes.map(r => r.trabajo.id)).toEqual(['pendiente']);
  });

  it('sin contactos registrados no hay ninguno pendiente', () => {
    const lista = [trabajo({ id: 'x', fechaEntrada: haceHoras(100) })];
    expect(recordatoriosPendientes(lista, AHORA, {}, () => false)).toEqual([]);
  });
});

describe('mensajeRecordatorio', () => {
  const datos = { clienteNombre: 'María Paredes', orden: 4821, servicio: 'Facturas', saldo: 45.5 };

  it('saluda, identifica el pedido y dice el saldo con dos decimales', () => {
    const m = mensajeRecordatorio(datos, 0);
    expect(m).toContain('María Paredes');
    expect(m).toContain('#4821');
    expect(m).toContain('Facturas');
    expect(m).toContain('LISTO para retirar');
    // `formatCurrency` usa Intl con es-EC, que escribe los centavos con coma
    // ("$45,50"), como se lee en Ecuador. La aserción acepta las dos formas para no
    // atarse al ICU de turno: lo que importa es que el monto salga completo.
    expect(m).toMatch(/45[.,]50/);
  });

  it('si está pagado lo dice, no muestra un saldo de cero', () => {
    const m = mensajeRecordatorio({ ...datos, saldo: 0 }, 0);
    expect(m).toContain('totalmente pagado');
    expect(m).not.toContain('$0.00');
  });

  it('el primer día no reclama; a partir del segundo sí menciona la espera', () => {
    expect(mensajeRecordatorio(datos, 1)).not.toContain('lleva 1 días');
    expect(mensajeRecordatorio(datos, 4)).toContain('lleva 4 días');
  });
});

describe('el backend espeja el umbral, no lo reinventa', () => {
  const backend = readFileSync(resolve(raiz, 'cordova-sri-backend/index.js'), 'utf8');

  it('el valor por defecto del backend es el mismo UMBRAL_REZAGO_HORAS', () => {
    const m = backend.match(/UMBRAL_REZAGO_HORAS\s*=\s*(?:parseInt\([^,]+,\s*10\)\s*\|\|\s*)?(\d+)/);
    expect(m, 'no se encontró UMBRAL_REZAGO_HORAS en el backend').not.toBeNull();
    expect(Number(m![1])).toBe(UMBRAL_REZAGO_HORAS);
  });

  it('la ventana de insistencia también coincide', () => {
    const m = backend.match(/HORAS_ENTRE_RECORDATORIOS\s*=\s*(?:parseInt\([^,]+,\s*10\)\s*\|\|\s*)?(\d+)/);
    expect(m, 'no se encontró HORAS_ENTRE_RECORDATORIOS en el backend').not.toBeNull();
    expect(Number(m![1])).toBe(HORAS_ENTRE_RECORDATORIOS);
  });
});
