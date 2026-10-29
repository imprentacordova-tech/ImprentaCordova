/**
 * Recordatorio de rezagados — Imprenta Córdova
 * =============================================
 *
 * Un "rezagado" es un trabajo que ya está LISTO (en Vitrina) y el cliente todavía no
 * vino a retirarlo. A partir de las 48 h deja de ser una espera normal y pasa a ser
 * plata quieta en el estante y un cliente que se puede olvidar del pedido.
 *
 * `pages/Retiros.tsx` ya los marcaba y tenía un botón "Avisar Retiro" de a uno. Lo que
 * faltaba es el recordatorio **automático**: que el sistema avise solo, sin que nadie
 * abra la pantalla. Eso corre en el backend (`cordova-sri-backend/index.js`, cron diario)
 * porque un navegador cerrado no puede recordarle nada a nadie.
 *
 * Este módulo es la definición canónica de "rezagado" y de "toca recordar": la pantalla
 * lo usa para pintar y el backend lo espeja. El umbral está en una sola constante
 * (`UMBRAL_REZAGO_HORAS`) y hay una prueba (`recordatorios.test.ts`) que verifica que el
 * backend no se haya quedado con otro número.
 *
 * ── Limitación conocida ─────────────────────────────────────────────────────
 * El tiempo se mide desde `fechaEntrada` (cuándo entró el pedido al taller), no desde
 * cuándo pasó a Vitrina, porque la tabla no guarda ese momento. Un trabajo que tardó
 * cuatro días en producirse aparece como "rezagado" apenas se termina. Es la misma
 * cuenta que hacía la pantalla antes, así que no cambia ningún número de hoy, pero el
 * arreglo de fondo es una columna `fecha_vitrina` que se escriba en la transición a
 * Vitrina. Cuando exista, alcanza con devolverla acá primero.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { Trabajo, TrabajoEstado } from '../types';
import { formatCurrency } from '../utils';

/** Horas en Vitrina a partir de las cuales el retiro se considera rezagado. */
export const UMBRAL_REZAGO_HORAS = 48;

/**
 * Ventana mínima entre dos recordatorios del mismo trabajo.
 *
 * Sin esto el cron diario le escribiría al cliente todos los días hasta que se enoje
 * (o marque el correo como spam, que arruina la entregabilidad de todo el dominio).
 * Una semana es el ritmo que usa cualquier taller: insistir sin acosar.
 */
export const HORAS_ENTRE_RECORDATORIOS = 168;

const MS_HORA = 3600000;

/** Momento de referencia: cuándo entró el pedido. Ver "Limitación conocida" arriba. */
const fechaBase = (t: Trabajo): number => {
  const raw = t.fechaEntrada;
  if (!raw) return 0;
  const ts = new Date(raw).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

/** Horas que lleva un trabajo esperando retiro. Negativo o inválido ⇒ 0. */
export const horasEnVitrina = (t: Trabajo, ahora: number): number => {
  const base = fechaBase(t);
  if (!base) return 0;
  return Math.max(0, Math.floor((ahora - base) / MS_HORA));
};

/** Días completos que lleva esperando retiro. */
export const diasEnVitrina = (t: Trabajo, ahora: number): number =>
  Math.floor(horasEnVitrina(t, ahora) / 24);

/**
 * ¿Es un rezagado? Estar listo y esperando no alcanza: tiene que estar en Vitrina
 * (si ya se entregó, no hay nada que recordar) y haber pasado el umbral.
 */
export const esRezagadoDeRetiro = (t: Trabajo, ahora: number): boolean =>
  t.estado === TrabajoEstado.VITRINA && horasEnVitrina(t, ahora) >= UMBRAL_REZAGO_HORAS;

/** Por qué a un rezagado todavía no se le mandó el recordatorio. */
export type EstadoRecordatorio = 'pendiente' | 'avisado_reciente' | 'sin_contacto';

export interface RezagoEvaluado {
  trabajo: Trabajo;
  horasEnVitrina: number;
  diasEnVitrina: number;
  estado: EstadoRecordatorio;
  /** Cuándo se le avisó por última vez (ISO), si alguna vez se le avisó. */
  ultimoAviso: string | null;
  /** Horas que faltan para poder volver a recordarle. 0 si ya se puede. */
  horasParaInsistir: number;
}

const tsDe = (iso: string | null | undefined): number => {
  if (!iso) return 0;
  const ts = new Date(iso).getTime();
  return Number.isNaN(ts) ? 0 : ts;
};

/**
 * Evalúa un rezagado contra la regla de insistencia.
 *
 * `hayContacto` es aparte del trabajo porque tener el dato y poder usarlo no son lo
 * mismo: un cliente sin teléfono ni correo es un rezagado que hay que resolver a mano,
 * y conviene que la pantalla lo muestre distinto en vez de reintentar en el vacío.
 */
export const evaluarRezago = (
  t: Trabajo,
  ahora: number,
  ultimoAviso: string | null,
  hayContacto: boolean
): RezagoEvaluado => {
  const horas = horasEnVitrina(t, ahora);
  const ultimo = tsDe(ultimoAviso);
  const desdeAviso = ultimo ? (ahora - ultimo) / MS_HORA : Number.POSITIVE_INFINITY;

  let estado: EstadoRecordatorio;
  if (!hayContacto) {
    estado = 'sin_contacto';
  } else if (desdeAviso >= HORAS_ENTRE_RECORDATORIOS) {
    estado = 'pendiente';
  } else {
    estado = 'avisado_reciente';
  }

  return {
    trabajo: t,
    horasEnVitrina: horas,
    diasEnVitrina: Math.floor(horas / 24),
    estado,
    ultimoAviso: ultimoAviso ?? null,
    horasParaInsistir:
      estado === 'avisado_reciente'
        ? Math.max(0, Math.ceil(HORAS_ENTRE_RECORDATORIOS - desdeAviso))
        : 0,
  };
};

/**
 * Clasifica todos los rezagados de una lista, del más viejo al más nuevo.
 *
 * El orden importa: el operador y el correo automático atacan primero lo que lleva más
 * tiempo ocupando lugar en el estante.
 */
export const clasificarRezagados = (
  trabajos: readonly Trabajo[],
  ahora: number,
  avisos: Readonly<Record<string, string | null | undefined>> = {},
  hayContacto: (t: Trabajo) => boolean = () => true
): RezagoEvaluado[] =>
  trabajos
    .filter(t => esRezagadoDeRetiro(t, ahora))
    .map(t => evaluarRezago(t, ahora, avisos[t.id] ?? null, hayContacto(t)))
    .sort((a, b) => b.horasEnVitrina - a.horasEnVitrina);

/** Sólo los que toca recordar hoy, en el orden en que hay que atenderlos. */
export const recordatoriosPendientes = (
  trabajos: readonly Trabajo[],
  ahora: number,
  avisos: Readonly<Record<string, string | null | undefined>> = {},
  hayContacto: (t: Trabajo) => boolean = () => true
): RezagoEvaluado[] =>
  clasificarRezagados(trabajos, ahora, avisos, hayContacto).filter(r => r.estado === 'pendiente');

/** Datos de contacto y montos con los que se arma cualquier recordatorio. */
export interface DatosRecordatorio {
  clienteNombre: string;
  orden: number | string;
  servicio: string;
  saldo: number;
}

/**
 * Mensaje de WhatsApp para pedir el retiro.
 *
 * Es el mismo texto que arma `notifyClient` en `pages/Retiros.tsx`: se extrajo acá para
 * que el envío manual y el automático digan exactamente lo mismo y se pueda testear el
 * saludo, el número de orden y el saldo sin montar un navegador.
 *
 * `dias` sólo aparece cuando el pedido ya lleva tiempo, para no sonar a reclamo el mismo
 * día en que se terminó.
 */
export const mensajeRecordatorio = (datos: DatosRecordatorio, dias: number): string => {
  const saldo =
    datos.saldo > 0
      ? `Saldo pendiente al retirar: ${formatCurrency(datos.saldo)}.`
      : 'Su pedido se encuentra totalmente pagado.';

  const insistencia =
    dias >= 2
      ? `Ya lleva ${dias} días esperándole en nuestro estante y no queremos que se quede sin su trabajo.`
      : '';

  return [
    `¡Hola ${datos.clienteNombre}! 👋 Le saludamos de Imprenta Córdova.`,
    '',
    `Le recordamos que su pedido #${datos.orden} (${datos.servicio}) está LISTO para retirar en nuestro local.`,
    ...(insistencia ? ['', insistencia] : []),
    '',
    `📍 ${saldo}`,
    '⏰ Horario: Lunes a Viernes 08:30 a 18:30.',
    '',
    '¡Le esperamos!',
  ].join('\n');
};
