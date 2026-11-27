/**
 * Lectura de las pantallas del SRI — Imprenta Córdova (extensión)
 * ===============================================================
 *
 * Todo lo que esta extensión sabe de una solicitud sale de leer el HTML del
 * portal, que no controlamos y que cambia sin avisar. Por eso el parseo vive
 * acá separado del resto: es lo único que se puede probar con un DOM de
 * muestra, y tiene pruebas en `__tests__/extension/parseoSri.test.ts`.
 *
 * Dos reglas de diseño:
 *
 *   1. Buscar por FORMA, no por posición. El RUC se reconoce porque son 13
 *      dígitos, no porque esté en la tercera columna. Una columna nueva en el
 *      portal no puede dejar la bandeja vacía en silencio.
 *
 *   2. Devolver vacío antes que inventar. Si un dato no se pudo leer, se
 *      devuelve '' y que el contrato de datos mínimos (`validarCaptura`) lo
 *      cante: registrar una orden sin dueño es peor que no registrarla.
 */
(function (global) {
  'use strict';

  const limpiar = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const norm = (s) => limpiar(s).toLowerCase();

  /**
   * Resumen de la solicitud en la pantalla final del SRI:
   *   RUC: 0705787745001
   *   Razón Social: CORDOVA RAMIREZ ROBERTO SANTIAGO
   *   Código del Establecimiento: 001
   *   Nombre Comercial del Establecimiento:
   *   Dirección del establecimiento: COLON S/N Y SUCRE
   *   Fecha de Solicitud: 29-10-2026
   */
  function leerResumenSolicitud(doc) {
    const d = doc || document;
    const out = { ruc: '', razonSocial: '', codigoEstablecimiento: '', nombreComercial: '', direccion: '', fechaSolicitud: '' };

    try {
      const celdas = Array.from(d.querySelectorAll('th, td'));

      // La etiqueta puede venir con o sin dos puntos, con espacios de más o en
      // otra caja: se compara normalizada y se toma la celda de al lado.
      const leer = (etiqueta) => {
        const objetivo = norm(etiqueta);
        for (const celda of celdas) {
          const txt = norm(celda.textContent).replace(/\s*:\s*$/, '');
          if (txt !== objetivo) continue;
          const sig = celda.nextElementSibling;
          const val = sig ? limpiar(sig.textContent) : '';
          if (val) return val;
        }
        return '';
      };

      out.ruc = leer('RUC');
      out.razonSocial = leer('Razón Social') || leer('Razon Social');
      out.codigoEstablecimiento = leer('Código del Establecimiento') || leer('Codigo del Establecimiento');
      out.nombreComercial = leer('Nombre Comercial del Establecimiento') || leer('Nombre Comercial');
      out.direccion = leer('Dirección del establecimiento') || leer('Direccion del establecimiento');
      out.fechaSolicitud = leer('Fecha de Solicitud');

      // Respaldo con el texto plano, por si la maqueta dejó de usar pares de
      // celdas. Se intenta en cuanto falte CUALQUIER campo: antes solo se
      // probaba si faltaban el RUC o la razón social, así que mover una fila
      // hacía perder la dirección o el establecimiento sin reintento.
      const faltaAlgo = !out.ruc || !out.razonSocial || !out.direccion || !out.codigoEstablecimiento || !out.fechaSolicitud;
      if (faltaAlgo) {
        // La otra maqueta posible es "etiqueta y valor en la MISMA caja"
        // ("RUC: 0705787745001"). Se recorren las hojas del árbol —elementos
        // sin hijos— y se busca ahí: acotado a un elemento, el valor no puede
        // arrastrar media página como pasaría buscando sobre el texto entero.
        const hojas = Array.from(d.querySelectorAll('td, th, p, span, div, li, b, strong, label'))
          .filter(el => el.children.length === 0)
          .map(el => limpiar(el.textContent))
          .filter(Boolean);

        const sacar = (label) => {
          const re = new RegExp('^' + label + '\\s*:\\s*(.+)$', 'i');
          for (const linea of hojas) {
            const m = linea.match(re);
            if (m) return limpiar(m[1]);
          }
          return '';
        };
        if (!out.ruc) out.ruc = sacar('RUC');
        if (!out.razonSocial) out.razonSocial = sacar('Razón Social') || sacar('Razon Social');
        if (!out.codigoEstablecimiento) out.codigoEstablecimiento = sacar('Código del Establecimiento') || sacar('Codigo del Establecimiento');
        if (!out.nombreComercial) out.nombreComercial = sacar('Nombre Comercial del Establecimiento');
        if (!out.direccion) out.direccion = sacar('Dirección del establecimiento') || sacar('Direccion del establecimiento');
        if (!out.fechaSolicitud) out.fechaSolicitud = sacar('Fecha de Solicitud');
      }

      // El RUC se queda solo con sus dígitos. Si no son 13, no es un RUC: se
      // devuelve vacío en vez de arrastrar un identificador inventado.
      const digitos = (out.ruc || '').replace(/\D/g, '');
      out.ruc = digitos.length === 13 ? digitos : '';

      // La razón social no puede quedarse con la etiqueta de al lado.
      if (/^(ruc|razón social|razon social)$/i.test(out.razonSocial)) out.razonSocial = '';
    } catch (e) {
      console.warn('[Cordova Ext] No se pudo leer el resumen de la solicitud:', e);
    }

    return out;
  }

  /**
   * Serie y rango de secuencias de "Confirmación de la Solicitud":
   *   001-001 | NOTA DE VENTA | 1 | 50
   * @returns {{serie:string,tipo:string,inicial:string,final:string}|null}
   */
  function leerSecuencias(doc) {
    const d = doc || document;
    try {
      const tablas = Array.from(d.querySelectorAll('table'));
      for (const tabla of tablas) {
        // El portal dice "Las secuencias solicitadas son las siguientes", en
        // PLURAL. El filtro buscaba "secuencia solicitada" en singular, que no
        // es subcadena de la frase real: esta función venía devolviendo null
        // siempre contra el SRI, así que la serie y el rango autorizado nunca
        // se capturaban. Lo descubrió la prueba con el texto real de la pantalla.
        if (!/secuencias?\s+solicitadas?/i.test(tabla.textContent || '')) continue;
        for (const fila of Array.from(tabla.querySelectorAll('tr'))) {
          const celdas = Array.from(fila.querySelectorAll('td')).map(td => limpiar(td.textContent));
          // La serie se reconoce por su forma 000-000, esté en la columna que esté.
          const i = celdas.findIndex(c => /^\d{3}-\d{3}$/.test(c));
          if (i === -1 || celdas.length < i + 4) continue;
          return { serie: celdas[i], tipo: celdas[i + 1], inicial: celdas[i + 2], final: celdas[i + 3] };
        }
      }
    } catch (e) { /* una tabla rara no puede tumbar el flujo */ }
    return null;
  }

  /**
   * Bandeja de solicitudes recibidas por la imprenta.
   * Columnas conocidas: Solicitud | Fecha | RUC | Razón Social | Establec. | Dirección
   */
  function filasBandeja(doc) {
    const d = doc || document;
    const pendientes = [];
    try {
      for (const fila of Array.from(d.querySelectorAll('table tr'))) {
        const celdas = Array.from(fila.querySelectorAll('td')).map(td => limpiar(td.textContent));
        if (celdas.length < 5) continue;

        const iRuc = celdas.findIndex(c => /^\d{13}$/.test(c.replace(/\s/g, '')));
        if (iRuc === -1) continue;

        pendientes.push({
          solicitud: celdas[0] || '',
          fecha: celdas.find(c => /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(c)) || celdas[1] || '',
          ruc: celdas[iRuc].replace(/\s/g, ''),
          razon: celdas[iRuc + 1] || '',
          establecimiento: celdas[iRuc + 2] || '',
          direccion: celdas.slice(iRuc + 3).join(' ').trim(),
        });
      }
    } catch (e) { /* ídem */ }
    return pendientes;
  }

  /**
   * Contrato de datos mínimos: sin estos dos campos la orden es un fantasma
   * (sin RUC y con el titular en "CLIENTE SRI"), y alguien la descubre días
   * después sin saber de quién era.
   * @returns {{ok: boolean, faltan: string[]}}
   */
  function validarCaptura(orden) {
    const faltan = [];

    const ruc = String((orden && orden.clientRuc) || '').replace(/\D/g, '');
    if (ruc.length !== 13) faltan.push('RUC');

    const nombre = String((orden && orden.clientName) || '').trim();
    if (nombre.length < 3 || /^cliente sri$/i.test(nombre)) faltan.push('razón social');

    return { ok: faltan.length === 0, faltan };
  }

  /** Un lanzamiento desde la web vale 2 h; después se trata como solicitud suelta. */
  const VIGENCIA_LANZAMIENTO_MS = 2 * 60 * 60 * 1000;

  /**
   * ¿La extensión debe crear el trabajo? NO cuando la solicitud la lanzó Nueva Orden:
   * ahí el panel crea la orden con los datos devueltos y, si la extensión también la
   * creaba, quedaban dos órdenes por cada solicitud.
   * @returns {boolean}
   */
  function debeRegistrarOrden(lanzamiento) {
    if (!lanzamiento || lanzamiento.origen !== 'nueva-orden') return true;
    const creado = Number(lanzamiento.createdAt) || 0;
    if (creado && Date.now() - creado > VIGENCIA_LANZAMIENTO_MS) return true;
    return false;
  }

  const tresDigitos = (v) => {
    const d = String(v || '').replace(/\D/g, '');
    return d ? d.padStart(3, '0').slice(-3) : '001';
  };

  /** Nombre del documento según el código del SRI, con el vocabulario compartido (docTypes.js). */
  function nombreDocumento(codigo) {
    const lista = global.CORDOVA_DOC_TYPES || [];
    const d = codigo ? lista.find((x) => x.codigo === String(codigo)) : null;
    return d ? d.nombre : 'Nota de Venta';
  }

  /**
   * Payload para `POST /api/v1/trabajos/crear` con TODO lo que se leyó del portal.
   * Antes el establecimiento iba fijo en '001' y se perdían numeración, serie y dirección.
   * `fecha_vencimiento` la completa content.js (necesita su parser de fechas del SRI).
   */
  function armarTrabajoPayload(orden, clienteId) {
    const o = orden || {};
    const total = parseFloat(o.total) || 13;
    const abono = parseFloat(o.abono) || 0;
    const actividad = String(o.activity || 'COMERCIO / SERVICIOS GENERAL').toUpperCase();
    const notas = [
      o.serie ? `Serie SRI ${o.serie}` : '',
      o.direccion ? `Dirección: ${o.direccion}` : '',
      o.fechaSolicitud ? `Solicitud SRI del ${o.fechaSolicitud}` : '',
    ].filter(Boolean).join(' · ');
    return {
      cliente_id: clienteId || null,
      titular: String(o.clientName || 'CLIENTE SRI').toUpperCase(),
      tipo: nombreDocumento(o.docType),
      subtipo: `${o.blocks || 100} Hojas (${o.docSize || '1/4 Oficio'})`,
      cantidad: 1,
      total,
      abono,
      saldo: Math.max(0, total - abono),
      prioridad: 'Normal',
      estado: 'Pendiente',
      fecha_entrada: new Date().toISOString(),
      origen: 'SRI Extension',
      establecimiento: tresDigitos(o.establecimiento),
      punto_emision: tresDigitos(o.puntoEmision),
      tamano: o.docSize || '1/4 Oficio',
      actividad_seleccionada: actividad,
      numeracion: o.numeracion ? String(o.numeracion) : null,
      observaciones: notas || null,
    };
  }

  /**
   * ¿La pantalla confirma que el SRI ACEPTÓ la solicitud? Antes se avisaba "aceptada"
   * apenas cargaba la página de confirmación (que es la pregunta, no el resultado) y
   * la orden pasaba a Diseño sin que el trámite existiera. Ahora solo con un mensaje
   * de éxito explícito y sin señales de error. Ante la duda: false (el operador la
   * pasa a mano).
   */
  function detectarAceptacion(texto) {
    const t = String(texto || '').toLowerCase();
    if (!t) return false;
    if (/error|no se pudo|no pudo|rechaz|fall[óo]|inv[áa]lid/.test(t)) return false;
    if (/[¿?]\s*est[áa] seguro/.test(t)) return false;
    return /(aceptad[ao]|procesad[ao]|registrad[ao])\s+(correctamente|exitosamente|con [ée]xito)/.test(t)
      || /se ha (aceptado|procesado)/.test(t);
  }

  /** Escapa texto para insertarlo en HTML (datos leídos del portal del SRI). */
  function esc(texto) {
    return String(texto === null || texto === undefined ? '' : texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  global.CordovaParseo = { leerResumenSolicitud, leerSecuencias, filasBandeja, validarCaptura, debeRegistrarOrden, armarTrabajoPayload, nombreDocumento, detectarAceptacion, esc };
})(typeof self !== 'undefined' ? self : this);
