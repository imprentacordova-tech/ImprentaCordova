/**
 * Modelos de impresión — Imprenta Córdova
 * =======================================
 *
 * Un mismo trabajo puede salir de formas distintas según CÓMO se produzca el comprobante
 * físicamente. Confundir la variante arruina un talonario ya autorizado por el SRI, así que
 * el modelo es un dato explícito y no una suposición del que imprime.
 *
 * ── POR QUÉ EXISTEN LAS TRES VARIANTES SRI ─────────────────────────────────────
 * La imprenta tiene **más de 5000 formularios de solicitud ya impresos en offset** (el stock
 * de `formatos/medio oficio.jpeg`). Mientras dure ese stock, lo correcto es imprimir SOLO los
 * datos encima, sin volver a dibujar las etiquetas ni los marcos: si se redibujan, se duplica
 * el arte sobre el papel y el formulario queda inservible.
 *
 * Cuando el stock se acabe, se usan los mismos tres modos pero sobre **hojas en blanco**, y
 * más adelante puede venir un estilo moderno. Las tres opciones se mantienen igual.
 *
 * ── Las dos familias ──────────────────────────────────────────────────────────
 *   SRI        la orden termina en una SOLICITUD DE IMPRESIÓN (formulario de autorización)
 *   Comercial  la orden termina en un RECIBO
 *
 * ── Las tres variantes SRI ────────────────────────────────────────────────────
 *   1. sri-sobre-preimpreso  imprime SOLO los datos, alineados a las casillas del
 *                            formulario que ya está impreso. Gasta el stock.
 *   2. sri-pc                la solicitud completa en A4 para gestionar desde la
 *                            computadora. NO es para el talonario.
 *   3. sri-arte-completo     el formulario entero CON los datos, sobre hoja en blanco.
 *
 * ── La variante comercial ─────────────────────────────────────────────────────
 *   comercial-recibo         el recibo sobre su formulario de 1/4 de oficio ya impreso,
 *                            en doble copia sobre la hoja sin cortar.
 *
 * ── Cómo se elige ─────────────────────────────────────────────────────────────
 * Por el parámetro `?mode=` de la URL del documento (ver `modeloDesdeQuery`), y el documento
 * expone `data-modelo` para que el CSS de impresión pueda ramificar. La extensión de Chrome
 * comparte este vocabulario: ella llena la solicitud en el portal del SRI y registra la orden,
 * así que tiene que hablar de los mismos modos.
 *
 * PENDIENTE: el arte fino de cada variante (márgenes de impresión y tolerancia de registro
 * sobre el preimpreso) todavía no está definido; se implementa sobre `marcaTaller` y
 * `data-modelo`, que ya quedan expuestos en el documento.
 */

export type FamiliaImpresion = 'SRI' | 'Comercial' | 'NotaVenta';

export type ModeloImpresion =
  | 'sri-sobre-preimpreso'
  | 'sri-arte-completo'
  | 'sri-moderno'
  | 'sri-pc'
  | 'comercial-sobre-preimpreso'
  | 'comercial-arte-completo'
  | 'comercial-moderno'
  | 'comercial-recibo'
  | 'nota-sobre-preimpreso'
  | 'nota-arte-completo'
  | 'nota-moderna';

/** Qué capas del documento se imprimen. */
export type CapaImpresion = 'solo-llenado' | 'arte-con-campos' | 'documento-digital';

/**
 * Cómo se produce el comprobante en el papel. Datos levantados de los formatos físicos
 * (ver `formatos/ESPECIFICACIONES.md`), no inventados.
 */
export interface PapelFisico {
  /** Nombre del formato tal como lo pide el taller. */
  nombre: string;
  orientacion: 'horizontal' | 'vertical';
  /** Ancho del papel ya orientado, en milímetros. Confirmado por el dueño. */
  anchoMm: number;
  /** Alto del papel ya orientado, en milímetros. Confirmado por el dueño. */
  altoMm: number;
  /** Proporción ancho:alto derivada de las medidas. */
  proporcion: string;
  /** Tinta principal. */
  tinta: string;
  /**
   * ¿Se imprime sobre un formulario que YA viene preimpreso en offset?
   * Es la diferencia de fondo entre las variantes: si es `true`, el sistema sólo aporta
   * los datos y no debe volver a dibujar las etiquetas fijas.
   */
  sobrePreimpreso: boolean;
}

export interface DescriptorModelo {
  id: ModeloImpresion;
  familia: FamiliaImpresion;
  /** Nombre corto para el operador. */
  label: string;
  /** Explicación de una línea, en español de Ecuador. */
  descripcion: string;
  capa: CapaImpresion;
  /**
   * Marca que va impresa en el pie del documento para que el taller no confunda variantes
   * cuando hay varias hojas del mismo talonario sobre la mesa.
   */
  marcaTaller: string;
  papel: PapelFisico;
}

/** Tinta del formulario SRI preimpreso: azul marino oscuro. */
const TINTA_NAVY = '#0A1A46';

export const MODELOS: Record<ModeloImpresion, DescriptorModelo> = {
  'sri-sobre-preimpreso': {
    id: 'sri-sobre-preimpreso',
    familia: 'SRI',
    label: '1. Sobre Preimpreso (10 Blocks)',
    descripcion: 'Imprime SOLO los datos sobre las 1000 hojas preimpresas en offset (160 × 220 mm). Sin marcos duplicados para ocupar los blocks existentes.',
    capa: 'solo-llenado',
    marcaTaller: 'LLENADO SOBRE PREIMPRESO OFFSET',
    papel: {
      // Medio oficio 16 x 22 cm, usado vertical. Medidas confirmadas por el dueño.
      nombre: 'Solicitud SRI preimpresa (medio oficio 16 x 22 cm)',
      orientacion: 'vertical',
      anchoMm: 160,
      altoMm: 220,
      proporcion: '1:1,375',
      tinta: TINTA_NAVY,
      sobrePreimpreso: true,
    },
  },
  'sri-arte-completo': {
    id: 'sri-arte-completo',
    familia: 'SRI',
    label: '2. Clásico Completo',
    descripcion: 'El formato clásico oficial idéntico al block tradicional + datos llenos sobre medio oficio en blanco (160 × 220 mm).',
    capa: 'arte-con-campos',
    marcaTaller: 'OFFSET CON CAMPOS LLENOS',
    papel: {
      // Mismo papel que el preimpreso (medio oficio 16 x 22 cm), pero HOJA EN BLANCO:
      // esta variante dibuja el arte completo, incluida la cabecera y los marcos.
      nombre: 'Hoja en blanco (medio oficio 16 x 22 cm)',
      orientacion: 'vertical',
      anchoMm: 160,
      altoMm: 220,
      proporcion: '1:1,375',
      tinta: TINTA_NAVY,
      sobrePreimpreso: false,
    },
  },
  'sri-moderno': {
    id: 'sri-moderno',
    familia: 'SRI',
    label: '3. Evolución Moderna (Full Pro)',
    descripcion: 'Diseño minimalista y elegante de última generación. QR de verificación digital, desglose editorial suizo y tipografía nítida para medio oficio (160 × 220 mm).',
    capa: 'arte-con-campos',
    marcaTaller: 'SOLICITUD SRI EVOLUCIÓN MODERNA',
    papel: {
      nombre: 'Solicitud SRI Evolución Moderna (medio oficio 16 x 22 cm)',
      orientacion: 'vertical',
      anchoMm: 160,
      altoMm: 220,
      proporcion: '1:1,375',
      tinta: TINTA_NAVY,
      sobrePreimpreso: false,
    },
  },
  'sri-pc': {
    id: 'sri-pc',
    familia: 'SRI',
    label: 'Versión PC (A4)',
    descripcion: 'La solicitud completa en A4 (dos A5: cliente + taller), para gestionar o archivar desde la computadora.',
    capa: 'documento-digital',
    marcaTaller: 'SOLICITUD VERSIÓN PC',
    papel: {
      nombre: 'A4 (dos A5: cliente + taller)',
      orientacion: 'vertical',
      anchoMm: 210,
      altoMm: 297,
      proporcion: '1:1,414',
      tinta: TINTA_NAVY,
      sobrePreimpreso: false,
    },
  },
  'comercial-sobre-preimpreso': {
    id: 'comercial-sobre-preimpreso',
    familia: 'Comercial',
    label: '1. Sobre Preimpreso (1/4 Oficio)',
    descripcion: 'Imprime SOLO los datos sobre los talonarios físicos existentes (160 × 110 mm). Sin marcos duplicados para ocupar los blocks de recibos en taller.',
    capa: 'solo-llenado',
    marcaTaller: 'RECIBO LLENADO SOBRE PREIMPRESO',
    papel: {
      nombre: 'Recibo preimpreso (1/4 de oficio 16 x 11 cm)',
      orientacion: 'horizontal',
      anchoMm: 160,
      altoMm: 110,
      proporcion: '1,4545:1',
      tinta: 'monocromo',
      sobrePreimpreso: true,
    },
  },
  'comercial-arte-completo': {
    id: 'comercial-arte-completo',
    familia: 'Comercial',
    label: '2. Clásico Completo',
    descripcion: 'Formato clásico completo idéntico al block tradicional (1/4 de oficio 160 × 110 mm) con cabecera, columna publicitaria y campos llenos sobre papel blanco.',
    capa: 'arte-con-campos',
    marcaTaller: 'RECIBO OFFSET CON CAMPOS LLENOS',
    papel: {
      nombre: 'Hoja en blanco (1/4 de oficio 16 x 11 cm)',
      orientacion: 'horizontal',
      anchoMm: 160,
      altoMm: 110,
      proporcion: '1,4545:1',
      tinta: 'monocromo',
      sobrePreimpreso: false,
    },
  },
  'comercial-moderno': {
    id: 'comercial-moderno',
    familia: 'Comercial',
    label: '3. Evolución Moderna (Full Pro)',
    descripcion: 'Diseño minimalista y elegante para trabajos comerciales. QR dinámico de seguimiento, desglose técnico de manufactura y tarjetas financieras en 1/4 de oficio (160 × 110 mm).',
    capa: 'arte-con-campos',
    marcaTaller: 'RECIBO COMERCIAL EVOLUCIÓN MODERNA',
    papel: {
      nombre: 'Recibo Comercial Evolución Moderna (1/4 de oficio 16 x 11 cm)',
      orientacion: 'horizontal',
      anchoMm: 160,
      altoMm: 110,
      proporcion: '1,4545:1',
      tinta: 'monocromo',
      sobrePreimpreso: false,
    },
  },
  'comercial-recibo': {
    id: 'comercial-recibo',
    familia: 'Comercial',
    label: 'Recibo comercial (Compatible)',
    descripcion: 'Alias de compatibilidad para recibo de 1/4 de oficio preimpreso.',
    capa: 'solo-llenado',
    marcaTaller: 'RECIBO OFFSET',
    papel: {
      nombre: 'Recibo comercial (1/4 de oficio 11 x 16 cm)',
      orientacion: 'horizontal',
      anchoMm: 160,
      altoMm: 110,
      proporcion: '1,4545:1',
      tinta: 'monocromo',
      sobrePreimpreso: true,
    },
  },
  'nota-sobre-preimpreso': {
    id: 'nota-sobre-preimpreso',
    familia: 'NotaVenta',
    label: '1. Sobre Preimpreso (Medio Oficio)',
    descripcion: 'Imprime SOLO los datos sobre los talonarios físicos existentes de Notas de Venta RIMPE (160 × 220 mm). Sin marcos duplicados para ocupar los blocks existentes.',
    capa: 'solo-llenado',
    marcaTaller: 'NOTA DE VENTA LLENADO SOBRE PREIMPRESO',
    papel: {
      nombre: 'Nota de Venta preimpresa (medio oficio 16 x 22 cm)',
      orientacion: 'vertical',
      anchoMm: 160,
      altoMm: 220,
      proporcion: '1:1,375',
      tinta: TINTA_NAVY,
      sobrePreimpreso: true,
    },
  },
  'nota-arte-completo': {
    id: 'nota-arte-completo',
    familia: 'NotaVenta',
    label: '2. Clásico Completo',
    descripcion: 'El formato clásico oficial idéntico al talonario offset de Nota de Venta RIMPE con cabecera, tabla de 16 filas y firmas sobre papel blanco (160 × 220 mm).',
    capa: 'arte-con-campos',
    marcaTaller: 'NOTA DE VENTA OFFSET COMPLETA',
    papel: {
      nombre: 'Hoja en blanco (medio oficio 16 x 22 cm)',
      orientacion: 'vertical',
      anchoMm: 160,
      altoMm: 220,
      proporcion: '1:1,375',
      tinta: TINTA_NAVY,
      sobrePreimpreso: false,
    },
  },
  'nota-moderna': {
    id: 'nota-moderna',
    familia: 'NotaVenta',
    label: '3. Evolución Moderna (Full Pro)',
    descripcion: 'Diseño fiscal minimalista y elegante. QR dinámico de tracking, resumen financiero KPI, tipografía suiza nítida en medio oficio (160 × 220 mm).',
    capa: 'arte-con-campos',
    marcaTaller: 'NOTA DE VENTA EVOLUCIÓN MODERNA',
    papel: {
      nombre: 'Nota de Venta Moderna (medio oficio 16 x 22 cm)',
      orientacion: 'vertical',
      anchoMm: 160,
      altoMm: 220,
      proporcion: '1:1,375',
      tinta: TINTA_NAVY,
      sobrePreimpreso: false,
    },
  },
};

/**
 * Coordenadas porcentuales para el formato 1/4 de oficio horizontal (160 × 110 mm)
 * Basado en `formatos/ESPECIFICACIONES.md` §2 y `1 cuarto de oficio recibo comercial.jpeg`
 */
export const GEO_COMERCIAL160 = {
  fecha: {
    y: 11.5,
    diaX: 77.5,
    mesX: 85.5,
    anoX: 93.5,
  },
  orden: {
    x: 82.0,
    y: 25.5,
  },
  lineas: {
    clienteY: 33.0,
    clienteX: 49.0,
    sumaY: 43.0,
    sumaX: 44.0,
    conceptoY: 53.0,
    conceptoX: 49.0,
    detalleY: 63.0,
    detalleX: 29.0,
    valorY: 74.0,
    valorX: 40.0,
    saldoY: 74.0,
    saldoX: 72.0,
    telefonoY: 84.0,
    telefonoX: 41.0,
    firmaY: 92.0,
    firmaX: 78.0,
  }
};

/**
 * Coordenadas porcentuales para Nota de Venta en Medio Oficio vertical (160 × 220 mm)
 * Basado en `formatos/ESPECIFICACIONES.md` §3 y `modelo nota de venta.jpeg`
 */
export const GEO_NOTAVENTA160 = {
  fecha: {
    y: 23.8,
    diaX: 71.0,
    mesX: 80.5,
    anoX: 90.0,
  },
  lugar: {
    x: 74.0,
    y: 28.2,
  },
  cliente: {
    srX: 16.0,
    srY: 23.8,
    dirX: 18.5,
    dirY: 26.8,
    rucCiX: 19.5,
    rucCiY: 29.8,
  },
  tabla: {
    cantX: 12.0,
    descX: 18.0,
    pUnitX: 72.0,
    totalX: 86.5,
    startY: 37.0,
    rowHeight: 2.75,
    maxRows: 16,
  },
  totalCobrar: {
    x: 86.5,
    y: 82.8,
  },
  serieNumero: {
    x: 82.0,
    y: 13.5,
  },
};

/**
 * ¿Este modelo imprime sobre un formulario que ya viene preimpreso?
 *
 * Cuando es `true`, el documento NO debe redibujar las etiquetas fijas ni los marcos: sólo
 * aporta los datos, alineados a las casillas y renglones del preimpreso. Redibujarlos
 * duplicaría el arte sobre el papel.
 */
export const vaSobrePreimpreso = (id: ModeloImpresion): boolean =>
  MODELOS[id]?.papel.sobrePreimpreso === true;

/** Los modelos de una familia, en el orden en que se le ofrecen al operador. */
export const modelosDe = (familia: FamiliaImpresion): DescriptorModelo[] =>
  Object.values(MODELOS).filter(m => m.familia === familia && m.id !== 'comercial-recibo');

/**
 * Modelo por defecto de cada familia cuando la orden no especifica ninguno.
 */
export const modeloPorDefecto = (esSRI: boolean, esNotaVenta = false): ModeloImpresion => {
  if (esNotaVenta) return 'nota-sobre-preimpreso';
  return esSRI ? 'sri-sobre-preimpreso' : 'comercial-sobre-preimpreso';
};

export const esModeloSRI = (id: ModeloImpresion): boolean => MODELOS[id]?.familia === 'SRI';
export const esModeloNotaVenta = (id: ModeloImpresion): boolean => MODELOS[id]?.familia === 'NotaVenta';

/** ¿El modelo sólo imprime el llenado, sin el arte preimpreso? */
export const esSoloLlenado = (id: ModeloImpresion): boolean => MODELOS[id]?.capa === 'solo-llenado';

/* ─────────────────────────────────────────────────────────────────────────────
 * Marcado del trámite en la solicitud de autorización del SRI
 * ─────────────────────────────────────────────────────────────────────────────
 * El formulario tiene tres casillas —Aument. / Cambiar. / Mismo.— y se marca UNA. Es lo que
 * declara ante el SRI qué se está pidiendo respecto de la autorización anterior.
 *
 * Antes estaba HARDCODEADO en el documento (`Aument.[ ] Mismo[✓]`), así que siempre salía
 * "Mismo", incluso en un talonario nuevo, y la casilla "Cambiar" ni siquiera se imprimía
 * aunque el preimpreso la tiene (medida en x 13,1 / 21,5 / 29,5 % del ancho).
 *
 * NO se deduce de `esRenovacion`: una renovación puede ser "Mismo" o "Aument." según la
 * cantidad pedida, y "Cambiar" si el cliente modificó un dato. Lo declara el operador.
 * ──────────────────────────────────────────────────────────────────────────── */

export type TramiteSri = 'AUMENTO' | 'CAMBIO' | 'MISMO';

export interface OpcionTramite {
  id: TramiteSri;
  /** Rótulo tal como sale impreso en el formulario. */
  label: string;
  /** Qué significa, para que el operador no tenga que adivinarlo. */
  descripcion: string;
}

export const TRAMITES_SRI: readonly OpcionTramite[] = [
  { id: 'AUMENTO', label: 'Aument.',  descripcion: 'Se pide más cantidad que en la autorización anterior.' },
  { id: 'CAMBIO',  label: 'Cambiar',  descripcion: 'Se modifica algún dato de la autorización anterior.' },
  { id: 'MISMO',   label: 'Mismo',    descripcion: 'Se repite igual que la autorización anterior.' },
];

/**
 * Por defecto `MISMO`: es lo que el sistema imprimía siempre por el hardcodeo, así que
 * ninguna orden existente cambia de comportamiento al desplegar esto.
 */
export const TRAMITE_POR_DEFECTO: TramiteSri = 'MISMO';

/** Valida un valor que puede venir de la BD o de la extensión. */
export const esTramiteValido = (valor: string | null | undefined): valor is TramiteSri =>
  TRAMITES_SRI.some(t => t.id === valor);

/** Resuelve el trámite guardado, cayendo al default si el valor no sirve. */
export const resolverTramite = (guardado: string | null | undefined): TramiteSri =>
  esTramiteValido(guardado) ? guardado : TRAMITE_POR_DEFECTO;

/**
 * Texto del marcado tal como se imprime: las TRES casillas, con el tilde en la elegida.
 * Se imprimen las tres siempre (no sólo la marcada) porque así está en el preimpreso.
 */
export const marcadoTramite = (guardado?: string | null): string => {
  const elegido = resolverTramite(guardado);
  const casilla = (id: TramiteSri) => (id === elegido ? '[✓]' : '[ ]');
  return TRAMITES_SRI.map(t => `${t.label}${casilla(t.id)}`).join(' ');
};

const IDS_VALIDOS = Object.keys(MODELOS) as ModeloImpresion[];

/**
 * Resuelve el modelo desde el parámetro `?mode=` de la URL.
 *
 * Nunca lanza: un valor desconocido o de la familia equivocada cae al modelo por defecto.
 * Un documento que no abre es peor que un documento que abre con el modelo por defecto, y
 * el pie impreso deja ver cuál se usó.
 */
export const modeloDesdeQuery = (valor: string | null | undefined, esSRI: boolean, esNotaVenta = false): ModeloImpresion => {
  const limpio = (valor || '').trim() as ModeloImpresion;
  if (!esModeloValidoPara(limpio, esSRI, esNotaVenta)) return modeloPorDefecto(esSRI, esNotaVenta);
  return limpio;
};

/** ¿El valor es un modelo válido y de la familia correcta? */
export const esModeloValidoPara = (valor: string | null | undefined, esSRI: boolean, esNotaVenta = false): boolean => {
  const limpio = (valor || '').trim() as ModeloImpresion;
  if (!IDS_VALIDOS.includes(limpio)) return false;
  if (esNotaVenta) return esModeloNotaVenta(limpio);
  return esModeloSRI(limpio) === esSRI && !esModeloNotaVenta(limpio);
};

/**
 * Resuelve el modelo de un documento con la precedencia correcta.
 *
 *   1. `?mode=` en la URL — override EXPLÍCITO para esta impresión.
 *   2. El modelo guardado en la orden — la decisión que se tomó al cargar el pedido.
 *   3. El modelo por defecto de la familia.
 *
 * El paso 2 es el que hace que la variante sea un dato de la ORDEN y no de la pantalla: si
 * alguien abre la misma orden desde la extensión de Chrome o desde otra computadora, sale la
 * misma. Un valor guardado inválido o de la familia equivocada se descarta sin romper nada.
 */
export const resolverModelo = (
  guardado: string | null | undefined,
  query: string | null | undefined,
  esSRI: boolean,
  esNotaVenta = false,
): ModeloImpresion => {
  if (esModeloValidoPara(query, esSRI, esNotaVenta)) return (query as string).trim() as ModeloImpresion;
  if (esModeloValidoPara(guardado, esSRI, esNotaVenta)) return (guardado as string).trim() as ModeloImpresion;
  return modeloPorDefecto(esSRI, esNotaVenta);
};
