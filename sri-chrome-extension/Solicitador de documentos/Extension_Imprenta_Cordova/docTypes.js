/**
 * Vocabulario de documentos SRI — ESPEJO de `DOCUMENTOS_SRI` en
 * services/solicitudesWebService.ts del panel. Un test
 * (__tests__/extension/flujoExtension.test.ts) verifica que coincidan:
 * si agregás un documento en un lado, agregalo en el otro.
 *
 * `codigo` es el que usa el portal del SRI (0 factura, 1 nota de venta, 5 guía);
 * vacío = sin código conocido.
 */
(function (global) {
  'use strict';
  global.CORDOVA_DOC_TYPES = [
    { codigo: '0', nombre: 'Factura' },
    { codigo: '1', nombre: 'Nota de Venta' },
    { codigo: '', nombre: 'Liquidación de Compra' },
    { codigo: '5', nombre: 'Guía de Remisión' },
    { codigo: '', nombre: 'Comprobante de Retención' },
    { codigo: '', nombre: 'Nota de Crédito' },
    { codigo: '', nombre: 'Nota de Débito' },
  ];
})(typeof self !== 'undefined' ? self : this);
