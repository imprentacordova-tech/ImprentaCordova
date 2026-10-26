/**
 * Reglas de régimen tributario (SRI Ecuador) — Imprenta Córdova
 * ============================================================
 *
 * Fuente: CONTINUITY_RULES.md §6, agent_instructions.md §5 y AI_INSTRUCTIONS.md §1.
 *
 * Estas reglas son de cumplimiento legal: imprimir el documento equivocado para un
 * régimen expone al cliente ante el SRI. Estaban dispersas en `ProductGrid` y
 * `ServiceSelector` como comparaciones sueltas; acá quedan en un solo lugar, en
 * funciones puras y testeables.
 *
 * RESUMEN DE LA NORMA
 * -------------------
 *   RIMPE Negocio Popular  -> ÚNICO autorizado a imprimir NOTAS DE VENTA físicas.
 *                             Sin límite de hojas (puede pedir talonarios completos).
 *   Régimen General        -> NO puede imprimir Notas de Venta.
 *   RIMPE Emprendedor      -> NO puede imprimir Notas de Venta.
 *                             Ambos limitados a 25 unidades en documentos de
 *                             contingencia (facturas físicas).
 */

import { Regimen } from '../types';

/** Tope de hojas para documentos SRI de contingencia fuera de Negocio Popular. */
export const LIMITE_CONTINGENCIA = 25;

/** Solo RIMPE Negocio Popular está autorizado a emitir Notas de Venta. */
export const puedeEmitirNotaDeVenta = (regimen?: Regimen | string | null): boolean =>
  regimen === Regimen.NEGOCIO_POPULAR;

/**
 * Detecta si un nombre de producto/documento es una Nota de Venta.
 *
 * OJO con el plural: `'NOTAS DE VENTA'.includes('NOTA DE VENTA')` es **false**, así que
 * un `includes` ingenuo dejaba pasar el plural y la guarda legal no bloqueaba nada.
 * El catálogo y los documentos usan ambas formas, por eso se usa una expresión regular.
 */
export const esDocumentoNotaDeVenta = (tipo?: string | null): boolean =>
  /NOTAS?\s+DE\s+VENTA/.test((tipo || '').toUpperCase());

/** Detecta si un nombre de producto/documento es una Factura. */
export const esDocumentoFactura = (tipo?: string | null): boolean =>
  (tipo || '').toUpperCase().includes('FACTURA');

/** Normaliza el texto libre que puede venir de la BD (`regime`/`regimen`/PDF del SRI). */
export const normalizarRegimen = (valor?: string | null): Regimen => {
  const raw = (valor || '').toUpperCase();
  if (raw.includes('POPULAR')) return Regimen.NEGOCIO_POPULAR;
  if (raw.includes('EMPRENDEDOR')) return Regimen.EMPRENDEDOR;
  return Regimen.GENERAL;
};

export interface ValidacionDocumento {
  permitido: boolean;
  /** Aviso bloqueante: no se debe permitir continuar. */
  motivo?: string;
  /** Advertencia no bloqueante (se puede continuar con criterio). */
  advertencia?: string;
}

/**
 * Valida si un documento puede emitirse para un régimen y una cantidad dadas.
 *
 * @example
 *   validarDocumento({ regimen: Regimen.GENERAL, tipo: 'NOTA DE VENTA', esSRI: true, cantidad: 100 })
 *   // -> { permitido: false, motivo: '...' }
 */
export const validarDocumento = ({
  regimen,
  tipo,
  esSRI,
  cantidad,
}: {
  regimen?: Regimen | string | null;
  tipo?: string | null;
  esSRI?: boolean;
  cantidad?: number;
}): ValidacionDocumento => {
  if (esDocumentoNotaDeVenta(tipo) && !puedeEmitirNotaDeVenta(regimen)) {
    return {
      permitido: false,
      motivo:
        `El cliente está en ${regimen || 'Régimen General'} y ese régimen no está autorizado ` +
        `a imprimir Notas de Venta ante el SRI. Solo RIMPE Negocio Popular puede. ` +
        `Emití una Factura o corregí el régimen del cliente.`,
    };
  }

  if (esSRI && !puedeEmitirNotaDeVenta(regimen) && (cantidad || 0) > LIMITE_CONTINGENCIA) {
    return {
      permitido: true,
      advertencia:
        `En ${regimen || 'Régimen General'} los documentos SRI de contingencia tienen un tope ` +
        `de ${LIMITE_CONTINGENCIA} hojas. Se están pidiendo ${cantidad}.`,
    };
  }

  return { permitido: true };
};
