/**
 * Precios de referencia de talonarios — Imprenta Córdova (extensión)
 * ==================================================================
 *
 * REGLA: la extensión NO cotiza cuando la orden viene de la web.
 *
 * El precio bueno lo calcula la web (precio del documento en el catálogo según
 * el régimen del contribuyente + los recargos del Paso 2: tamaño de corte y
 * copias químicas) y viaja dentro del lanzamiento. `precioDeLaOrden()` lo usa
 * tal cual. Antes la extensión tenía su propia tabla y registraba TODO a precio
 * de nota de venta de 1/4 de oficio: una factura de RIMPE Emprendedor ($14),
 * una liquidación de compra ($15–$20) o unos boletos ($25) entraban a $13.
 *
 * La tabla de abajo es la lista de referencia para el otro camino: cuando la
 * solicitud se hace directo en el portal del SRI, o cuando el operador carga
 * una orden a mano desde `registro.html`. Ahí no hay precio que heredar.
 *
 * Esta tabla estaba copiada TRES veces (content.js dos veces y registro.js);
 * ahora vive sola acá. Si cambian los precios, se cambian en este archivo.
 */
(function (global) {
  'use strict';

  /**
   * Precio por talonario según corte y cantidad de comprobantes.
   *
   * ⚠️ El 1/2 oficio de 100 hojas figura acá en $18, pero la web lo cotiza en
   * $17 (precio base $13 + $4 del corte). Es una diferencia real de lista que
   * tiene que resolver el dueño; no se tocó para no cambiar precios por mi
   * cuenta. Mientras tanto manda la web en las órdenes que salen de la web.
   */
  const TABLA_REFERENCIA = {
    '1/4 Oficio': {
      25: 9.00,
      50: 10.00,
      100: 13.00,
      150: 16.50, // triplicado: coincide con la web ($13 + $3,50)
      200: 20.00,
      300: 30.00,
      400: 36.00,
      500: 40.00,
      1000: 65.00,
    },
    '1/2 Oficio': {
      25: 12.00,
      50: 14.00,
      100: 18.00,
      200: 32.00,
      300: 48.00,
      400: 60.00,
      500: 65.00,
      1000: 100.00,
    },
  };

  /** Precio de lista para un corte y una cantidad. Nunca devuelve 0. */
  function precioReferencia(tamano, hojas) {
    const tabla = TABLA_REFERENCIA[tamano] || TABLA_REFERENCIA['1/4 Oficio'];
    const exacto = tabla[hojas];
    if (exacto !== undefined) return exacto;

    // Cantidad fuera de la lista: se prorratea sobre el precio de 100.
    const base = tamano === '1/2 Oficio' ? 18.00 : 13.00;
    return Math.round(((Number(hojas) || 100) / 100) * base * 100) / 100;
  }

  /**
   * Precio de una orden que viene del portal.
   * Si el lanzamiento trae el precio calculado por la web, ese manda.
   */
  function precioDeLaOrden(lanzamiento, hojas, tamano) {
    const delLanzamiento = Number(lanzamiento && lanzamiento.precioUnitario);
    if (Number.isFinite(delLanzamiento) && delLanzamiento > 0) return delLanzamiento;
    return precioReferencia(tamano, hojas);
  }

  global.CordovaPrecios = { TABLA_REFERENCIA, precioReferencia, precioDeLaOrden };
})(typeof self !== 'undefined' ? self : this);
