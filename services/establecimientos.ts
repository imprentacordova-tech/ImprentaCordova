/**
 * Establecimientos fiscales del certificado de RUC (SRI Ecuador).
 *
 * CONTINUITY_RULES.md §6: "se deben registrar estrictamente los establecimientos abiertos,
 * puntos de emisión, actividades y los números de secuencia que el cliente quiere que salgan
 * en su talonario".
 *
 * El campo `fiscal_data.establecimientos` estaba declarado en el tipo `Cliente` desde el
 * principio, pero nadie lo llenaba: el parser del PDF sólo sabe contar cuántos
 * establecimientos hay. Lo que sí puede devolver la lista completa es la lectura con IA
 * (`extractClientFromImage`), y eso viene de un modelo, así que hay que normalizarlo en un
 * único lugar antes de guardarlo: un código mal formado va IMPRESO en la solicitud de
 * autorización del SRI y ahí el error es del cliente, no nuestro.
 */

import { EstablecimientoFiscal } from '../types';

export const ESTADO_ABIERTO = 'ABIERTO';
export const ESTADO_CERRADO = 'CERRADO';

/** Etiqueta por defecto cuando la fuente no distingue nombre comercial y tipo de local. */
const NOMBRE_DESCONOCIDO = 'ESTABLECIMIENTO';

const texto = (valor: unknown): string => {
  if (valor === null || valor === undefined) return '';
  return String(valor).trim();
};

/**
 * El código del SRI son siempre 3 dígitos. La IA a veces devuelve "1" o "0001", así que se
 * completa con ceros. Sin ningún dígito no hay código utilizable y la fila se descarta:
 * un establecimiento sin código no se puede seleccionar para el talonario.
 */
export const normalizarCodigoEstablecimiento = (valor: unknown): string => {
  const digitos = texto(valor).replace(/\D/g, '');
  if (!digitos) return '';
  return digitos.slice(-3).padStart(3, '0');
};

/**
 * Estados del SRI: "ABIERTO" / "CERRADO". Se aceptan también los sinónimos que devuelven
 * otros reportes (ACTIVO / INACTIVO / SUSPENDIDO) porque el mismo dato llega por tres
 * caminos distintos.
 *
 * Lo desconocido NO se asume abierto: si un local cerrado se ofrece como abierto, el
 * operador elige un código que no existe y el documento sale mal. Al revés, el peor caso es
 * que el local no aparezca como atajo y se escriba a mano.
 */
export const normalizarEstadoEstablecimiento = (valor: unknown): string => {
  const limpio = texto(valor).toUpperCase();
  if (!limpio) return '';
  // El negativo va primero a propósito: "INACTIVO" contiene "ACTIV".
  if (limpio.startsWith('CERRAD') || limpio.includes('INACTIV') ||
      limpio.includes('SUSPEND') || limpio.includes('PASIV')) {
    return ESTADO_CERRADO;
  }
  if (limpio.startsWith('ABIERT') || limpio.includes('ACTIV')) return ESTADO_ABIERTO;
  return limpio;
};

export const esEstablecimientoAbierto = (est?: EstablecimientoFiscal | null): boolean =>
  normalizarEstadoEstablecimiento(est?.estado) === ESTADO_ABIERTO;

/** Los que se pueden ofrecer al operador. Derivado siempre, nunca guardado aparte. */
export const establecimientosAbiertos = (
  lista?: EstablecimientoFiscal[] | null,
): EstablecimientoFiscal[] => (Array.isArray(lista) ? lista : []).filter(esEstablecimientoAbierto);

/**
 * Deja la lista en la forma que declara `EstablecimientoFiscal`: códigos de 3 dígitos,
 * sin repetidos y ordenados. Cualquier cosa que no sea un arreglo devuelve lista vacía, así
 * una ficha vieja o una respuesta rara de la IA no rompe la pantalla.
 */
export const normalizarEstablecimientos = (raw: unknown): EstablecimientoFiscal[] => {
  if (!Array.isArray(raw)) return [];

  const vistos = new Set<string>();
  const salida: EstablecimientoFiscal[] = [];

  for (const fila of raw) {
    if (!fila || typeof fila !== 'object') continue;
    const f = fila as Record<string, unknown>;

    const codigo = normalizarCodigoEstablecimiento(f.codigo ?? f.establecimiento ?? f.numero ?? f.local);
    if (!codigo || vistos.has(codigo)) continue;
    vistos.add(codigo);

    salida.push({
      codigo,
      nombre: texto(f.nombre ?? f.denominacion) || NOMBRE_DESCONOCIDO,
      direccion: texto(f.direccion),
      // El SRI reserva el 001 para la casa matriz y todo lo demás es sucursal. Si la fuente
      // no trae el tipo, se usa esa convención en vez de inventar una categoría nueva.
      tipo: (texto(f.tipo) || (codigo === '001' ? 'MATRIZ' : 'SUCURSAL')).toUpperCase(),
      estado: normalizarEstadoEstablecimiento(f.estado ?? f.situacion),
    });
  }

  return salida.sort((a, b) => a.codigo.localeCompare(b.codigo));
};

/**
 * Código que conviene proponer: la matriz si está abierta, si no el primer local abierto.
 * Devuelve '' cuando no hay ninguno abierto para que quien llama decida el respaldo.
 */
export const establecimientoSugerido = (lista?: EstablecimientoFiscal[] | null): string => {
  const abiertos = establecimientosAbiertos(lista);
  if (abiertos.length === 0) return '';
  return (abiertos.find(e => e.codigo === '001') ?? abiertos[0]).codigo;
};
