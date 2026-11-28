/**
 * Orígenes permitidos por CORS.
 *
 * `ALLOWED_ORIGINS` (Render) SUMA a la base, no la reemplaza: antes la reemplazaba y,
 * al configurarla solo con imprentacordova.net, se perdía el Origin del portal del SRI
 * desde donde la extensión hace sus fetch (no podía crear clientes ni trabajos).
 */
const ORIGENES_BASE = [
  'https://www.imprentacordova.net',
  'https://imprentacordova.net',
  'https://imprentacordova.com',
  'https://www.imprentacordova.com',
  // La extensión hace fetch desde el content script: llega con el Origin del SRI.
  'https://srienlinea.sri.gob.ec',
  'https://sri.gob.ec',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

const origenesPermitidos = (variable) => {
  const extra = String(variable || '').split(',').map((s) => s.trim()).filter(Boolean);
  return [...new Set([...ORIGENES_BASE, ...extra])];
};

module.exports = { ORIGENES_BASE, origenesPermitidos };
