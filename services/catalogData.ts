import { Producto } from '../types';

/**
 * Catálogo maestro de Imprenta Córdova.
 * =====================================================================
 * Fuente única de verdad del catálogo. `ProductosContext.seedCatalog()` lo
 * sincroniza con la tabla `productos` de Supabase (upsert por `nombre`).
 *
 * ── Organización ─────────────────────────────────────────────────────
 *  1. Documentos SRI (tributarios) por régimen: RIMPE Negocio Popular,
 *     RIMPE Emprendedor y Régimen General.
 *  2. Talonarios / formatos por blocks.
 *  3. Servicios electrónicos SRI.
 *  4. Trabajos comerciales (tarjetas, publicidad, etiquetas, packaging,
 *     gran formato, merch, oficina, juegos, empastado, combos).
 *
 * ── Sobre los precios ───────────────────────────────────────────────
 * Los montos son PRECIOS DE REFERENCIA para el formato estándar
 * (1/4 de oficio, duplicado químico, 100 hojas), en USD. El Paso 2 de
 * Nueva Orden ajusta el precio final según tamaño, copias, diseño y papel
 * (ver `components/orders/OrderDetails.tsx`). El dueño puede editar cada
 * producto desde el Catálogo y guardar su precio real.
 *
 * `esSRI: true` marca los comprobantes autorizados por el SRI (no gravan
 * IVA). El resto son trabajos comerciales (+15% IVA).
 */

const SRI = 'Documentos SRI';

/** Comprobantes que comparten el formato base 1/4 de oficio, duplicado químico. */
const sriDoc = (
  nombre: string,
  precio: number,
  descripcion: string,
  specs: string[],
): Partial<Producto> => ({
  nombre,
  precio,
  categoria: SRI,
  esSRI: true,
  descripcion,
  specs,
});

export const MASTER_CATALOG: Partial<Producto>[] = [
  // ═══════════════════════════════════════════════════════════════════
  // 1. DOCUMENTOS SRI — RIMPE NEGOCIO POPULAR
  // ═══════════════════════════════════════════════════════════════════
  sriDoc('NOTA DE VENTA (RIMPE NEGOCIO POPULAR)', 13.0,
    'Talonario autorizado de 100 hojas, 1/4 de oficio, duplicado químico.',
    ['RIMPE Negocio Popular', '100 hojas', '1/4 Oficio', 'Duplicado']),
  sriDoc('FACTURA (RIMPE NEGOCIO POPULAR)', 13.0,
    'Factura autorizada de 100 hojas, 1/4 de oficio, duplicado químico.',
    ['RIMPE Negocio Popular', '100 hojas', '1/4 Oficio', 'Duplicado']),
  sriDoc('NOTAS DE CREDITO (RIMPE NEGOCIO POPULAR)', 12.0,
    'Notas de crédito para anulaciones y devoluciones.',
    ['RIMPE Negocio Popular', '100 hojas', '1/4 Oficio']),
  sriDoc('NOTAS DE DEBITO (RIMPE NEGOCIO POPULAR)', 12.0,
    'Notas de débito para ajustes de valores.',
    ['RIMPE Negocio Popular', '100 hojas', '1/4 Oficio']),
  sriDoc('GUIAS DE REMISION (RIMPE NEGOCIO POPULAR)', 12.0,
    'Guías de remisión para transporte de mercadería.',
    ['RIMPE Negocio Popular', '100 hojas', '1/4 Oficio']),
  sriDoc('LIQUIDACION DE COMPRA DE BIENES O PRESTACION DE SERVICIOS (RIMPE)', 15.0,
    'Liquidación de compra a personas naturales por bienes o servicios.',
    ['RIMPE Negocio Popular', '100 hojas', '1/4 Oficio']),
  sriDoc('LIQUIDACION DE COMPRA DE BIENES MUEBLES USADOS (RIMPE)', 18.0,
    'Liquidación de compra de bienes muebles usados.',
    ['RIMPE Negocio Popular', '100 hojas', '1/4 Oficio']),
  sriDoc('LIQUIDACION DE COMPRA DE VEHICULOS USADOS (RIMPE)', 20.0,
    'Liquidación de compra de vehículos usados.',
    ['RIMPE Negocio Popular', '100 hojas', '1/4 Oficio', 'Tríptico legal']),
  sriDoc('BOLETOS O ENTRADAS A ESPECTACULOS PUBLICOS (RIMPE)', 25.0,
    'Boletos o entradas para espectáculos públicos autorizados.',
    ['RIMPE Negocio Popular', '100 hojas', 'Numerado']),
  sriDoc('ACTA DE ENTREGA - RECEPCION DE VEHICULOS USADOS (RIMPE)', 5.0,
    'Acta de entrega-recepción de vehículos usados (bloc).',
    ['RIMPE Negocio Popular', 'Bloc 50 hojas', 'Formato legal']),

  // ═══════════════════════════════════════════════════════════════════
  // 2. DOCUMENTOS SRI — RIMPE EMPRENDEDOR
  // ═══════════════════════════════════════════════════════════════════
  sriDoc('FACTURA (RIMPE EMPRENDEDOR)', 14.0,
    'Factura autorizada para RIMPE Emprendedor, 100 hojas, 1/4 de oficio.',
    ['RIMPE Emprendedor', '100 hojas', '1/4 Oficio', 'Duplicado']),
  sriDoc('NOTAS DE CREDITO (RIMPE EMPRENDEDOR)', 12.0,
    'Notas de crédito para RIMPE Emprendedor.',
    ['RIMPE Emprendedor', '100 hojas', '1/4 Oficio']),
  sriDoc('NOTAS DE DEBITO (RIMPE EMPRENDEDOR)', 12.0,
    'Notas de débito para RIMPE Emprendedor.',
    ['RIMPE Emprendedor', '100 hojas', '1/4 Oficio']),
  sriDoc('GUIAS DE REMISION (RIMPE EMPRENDEDOR)', 12.0,
    'Guías de remisión para RIMPE Emprendedor.',
    ['RIMPE Emprendedor', '100 hojas', '1/4 Oficio']),
  sriDoc('COMPROBANTE DE RETENCION (RIMPE EMPRENDEDOR)', 10.0,
    'Comprobante de retención en talonario autorizado.',
    ['RIMPE Emprendedor', '100 hojas', '1/4 Oficio']),

  // ═══════════════════════════════════════════════════════════════════
  // 3. DOCUMENTOS SRI — RÉGIMEN GENERAL
  // ═══════════════════════════════════════════════════════════════════
  sriDoc('FACTURA (REGIMEN GENERAL)', 15.0,
    'Factura autorizada de 100 hojas, 1/4 de oficio, duplicado químico.',
    ['Régimen General', '100 hojas', '1/4 Oficio', 'Duplicado']),
  sriDoc('NOTAS DE CREDITO (GENERAL)', 12.0,
    'Notas de crédito para régimen general.',
    ['Régimen General', '100 hojas', '1/4 Oficio']),
  sriDoc('NOTAS DE DEBITO (GENERAL)', 12.0,
    'Notas de débito para régimen general.',
    ['Régimen General', '100 hojas', '1/4 Oficio']),
  sriDoc('GUIAS DE REMISION (GENERAL)', 12.0,
    'Guías de remisión para régimen general.',
    ['Régimen General', '100 hojas', '1/4 Oficio']),
  sriDoc('COMPROBANTE DE RETENCION (GENERAL)', 10.0,
    'Comprobante de retención en talonario autorizado.',
    ['Régimen General', '100 hojas', '1/4 Oficio']),
  sriDoc('LIQUIDACION DE COMPRA DE BIENES O PRESTACION DE SERVICIOS (GENERAL)', 18.0,
    'Liquidación de compra a personas naturales (régimen general).',
    ['Régimen General', '100 hojas', '1/4 Oficio']),
  sriDoc('LIQUIDACION DE COMPRA DE BIENES MUEBLES USADOS (GENERAL)', 18.0,
    'Liquidación de compra de bienes muebles usados (régimen general).',
    ['Régimen General', '100 hojas', '1/4 Oficio']),
  sriDoc('LIQUIDACION DE COMPRA DE VEHICULOS USADOS (GENERAL)', 20.0,
    'Liquidación de compra de vehículos usados (régimen general).',
    ['Régimen General', '100 hojas', '1/4 Oficio', 'Tríptico legal']),
  sriDoc('ACTA DE ENTREGA - RECEPCION DE VEHICULOS USADOS (GENERAL)', 5.0,
    'Acta de entrega-recepción de vehículos usados (bloc).',
    ['Régimen General', 'Bloc 50 hojas', 'Formato legal']),
  sriDoc('ACTA ENTREGA - RECEPCION DE BOTELLAS PLASTICAS NO RETORNABLES DE PET', 5.0,
    'Acta para envases PET no retornables (bloc).',
    ['Régimen General', 'Bloc 50 hojas', 'Formato legal']),

  // ═══════════════════════════════════════════════════════════════════
  // 4. TALONARIOS / FORMATOS POR BLOCKS
  // ═══════════════════════════════════════════════════════════════════
  { nombre: 'Talonario 1 Block (100 hojas)', precio: 13.0, categoria: SRI, esSRI: true, descripcion: 'Un block de 100 hojas, 1/4 de oficio, duplicado químico.', specs: ['1 Block', '100 hojas', '1/4 Oficio'] },
  { nombre: 'Talonario 2 Blocks (200 hojas)', precio: 20.0, categoria: SRI, esSRI: true, descripcion: 'Dos blocks encolados de 100 hojas cada uno.', specs: ['2 Blocks', '200 hojas', '1/4 Oficio'] },
  { nombre: 'Talonario 5 Blocks (500 hojas)', precio: 40.0, categoria: SRI, esSRI: true, descripcion: 'Cinco blocks encolados de 100 hojas cada uno.', specs: ['5 Blocks', '500 hojas', '1/4 Oficio'] },
  { nombre: 'Talonario 10 Blocks (1000 hojas)', precio: 65.0, categoria: SRI, esSRI: true, descripcion: 'Diez blocks encolados de 100 hojas cada uno.', specs: ['10 Blocks', '1000 hojas', '1/4 Oficio'] },
  { nombre: 'Facturero A5 1x Blocs (50x2)', precio: 10.0, categoria: SRI, esSRI: true, descripcion: 'Facturero A5 de un block, 50 hojas, doble copia.', specs: ['1 Block', '50x2', 'A5'] },
  { nombre: 'Facturero A5 3x Blocs (50x2)', precio: 22.0, categoria: SRI, esSRI: true, descripcion: 'Facturero A5 de tres blocks, 50 hojas, doble copia.', specs: ['3 Blocks', '50x2', 'A5'] },
  { nombre: 'Facturero A5 5x Blocs (50x2)', precio: 32.0, categoria: SRI, esSRI: true, descripcion: 'Facturero A5 de cinco blocks, 50 hojas, doble copia.', specs: ['5 Blocks', '50x2', 'A5'] },
  { nombre: 'Facturero A5 10x Blocs (50x2)', precio: 55.0, categoria: SRI, esSRI: true, descripcion: 'Facturero A5 de diez blocks, 50 hojas, doble copia.', specs: ['10 Blocks', '50x2', 'A5'] },

  // ═══════════════════════════════════════════════════════════════════
  // 5. SERVICIOS ELECTRÓNICOS SRI
  // ═══════════════════════════════════════════════════════════════════
  { nombre: 'Comprobante de Retención Electrónico', precio: 0.15, categoria: SRI, esSRI: true, descripcion: 'Emisión de comprobante de retención por documento.', specs: ['Electrónico', 'SRI en línea'] },
  { nombre: 'Factura Electrónica (Emisión)', precio: 0.15, categoria: SRI, esSRI: true, descripcion: 'Emisión de factura electrónica autorizada por el SRI.', specs: ['Electrónico', 'SRI en línea'] },
  { nombre: 'Nota de Crédito Electrónica', precio: 0.15, categoria: SRI, esSRI: true, descripcion: 'Emisión de nota de crédito electrónica.', specs: ['Electrónico', 'SRI en línea'] },

  // ═══════════════════════════════════════════════════════════════════
  // 6. TARJETAS DE PRESENTACIÓN
  // ═══════════════════════════════════════════════════════════════════
  { nombre: 'Tarjetas Premium (Acabado Soft-Touch)', precio: 45.0, categoria: 'Tarjetas', esSRI: false, descripcion: 'Tarjetas con laminado aterciopelado y puntas redondeadas. Máximo prestigio.', specs: ['Soft-Touch', '350g', 'Full Color'] },
  { nombre: 'Tarjetas con Barniz UV Localizado x1000', precio: 75.0, categoria: 'Tarjetas', esSRI: false, descripcion: 'Laminado mate con detalles brillantes en relieve. Ideal para logotipos.', specs: ['Mate + UV Localizado', '300g', 'Offset'] },
  { nombre: 'Tarjetas en PVC Mate (Grosor Crédito)', precio: 1.5, categoria: 'Tarjetas', esSRI: false, descripcion: 'Tarjetas plásticas tipo crédito, resistentes al uso.', specs: ['PVC', 'Durabilidad Alta'] },
  { nombre: 'Tarjetas Hot Stamping Oro/Plata x100', precio: 85.0, categoria: 'Tarjetas', esSRI: false, descripcion: 'Tarjetas con foil metálico dorado o plateado.', specs: ['Foil Metálico', 'Lujo'] },
  { nombre: 'Tarjetas de Presentación x1000 (Couché 300g)', precio: 28.0, categoria: 'Tarjetas', esSRI: false, descripcion: 'Mil tarjetas full color en couché 300g, acabado mate o brillante.', specs: ['1000 u.', 'Couché 300g', 'Full Color'] },

  // ═══════════════════════════════════════════════════════════════════
  // 7. PUBLICIDAD Y EDITORIAL
  // ═══════════════════════════════════════════════════════════════════
  { nombre: 'Volantes Publicitarios x1000 (Couché 150g)', precio: 22.0, categoria: 'Publicidad', esSRI: false, descripcion: 'Mil volantes full color, ideal para promociones.', specs: ['1000 u.', 'Couché 150g'] },
  { nombre: 'Revistas Corporativas A4 (16 pág) x100', precio: 350.0, categoria: 'Publicidad', esSRI: false, descripcion: 'Revistas grapadas de 16 páginas a full color.', specs: ['Grapadas', 'Couché 150g'] },
  { nombre: 'Dípticos A4 x1000 (Couché 150g)', precio: 85.0, categoria: 'Publicidad', esSRI: false, descripcion: 'Dípticos doblados a full color.', specs: ['Doblado Pro', 'Offset'] },
  { nombre: 'Trípticos A4 x1000 (Couché 150g)', precio: 95.0, categoria: 'Publicidad', esSRI: false, descripcion: 'Trípticos doblados a full color.', specs: ['Doblado Pro', 'Offset'] },
  { nombre: 'Afiches A3 Pro x100 (Couché 150g)', precio: 45.0, categoria: 'Publicidad', esSRI: false, descripcion: 'Afiches A3 full color para vitrina o evento.', specs: ['Full Color', 'Offset'] },
  { nombre: 'Carpetas con Bolsillo Troquelado x100', precio: 120.0, categoria: 'Publicidad', esSRI: false, descripcion: 'Carpetas corporativas con bolsillo troquelado.', specs: ['Couché 300g', 'Troquel'] },

  // ═══════════════════════════════════════════════════════════════════
  // 8. ETIQUETAS Y PACKAGING
  // ═══════════════════════════════════════════════════════════════════
  { nombre: 'Etiquetas de Vino (Papel Texturizado)', precio: 0.45, categoria: 'Etiquetas', esSRI: false, descripcion: 'Etiquetas con papel texturizado y acabado premium.', specs: ['Antihumedad', 'Textura'] },
  { nombre: 'Etiquetas Transparentes (Corte Especial)', precio: 15.0, categoria: 'Etiquetas', esSRI: false, descripcion: 'Etiquetas de vinil transparente con corte especial.', specs: ['Plotter', 'Vinil'] },
  { nombre: 'Cajas para Joyería con Logo Oro', precio: 4.5, categoria: 'Packaging', esSRI: false, descripcion: 'Cajas rígidas con hot stamping dorado.', specs: ['Cartón Rígido', 'Hot Stamping'] },
  { nombre: 'Bolsas de Lujo (Papel Couché + Cordón)', precio: 1.2, categoria: 'Packaging', esSRI: false, descripcion: 'Bolsas laminadas con cordón reforzado.', specs: ['Laminadas', 'Reforzadas'] },

  // ═══════════════════════════════════════════════════════════════════
  // 9. GRAN FORMATO (GIGANTOGRAFÍA)
  // ═══════════════════════════════════════════════════════════════════
  { nombre: 'Exhibidor Roll-up (80x200cm) Pro', precio: 55.0, categoria: 'Gran Formato', esSRI: false, descripcion: 'Roll-up con estructura de aluminio reforzado y lona 13oz.', specs: ['Aluminio Reforzado', 'Lona 13oz'] },
  { nombre: 'Caja de Luz LED (Backlight) m2', precio: 110.0, categoria: 'Gran Formato', esSRI: false, descripcion: 'Caja de luz LED para letreros y backlight.', specs: ['Estructura Metal', 'Luz LED'] },
  { nombre: 'Vinil Decorativo para Pared m2', precio: 22.0, categoria: 'Gran Formato', esSRI: false, descripcion: 'Vinil decorativo con instalación incluida.', specs: ['Instalación Incluida', 'Mate/Brillo'] },
  { nombre: 'Letrero Acrílico con Separadores', precio: 145.0, categoria: 'Gran Formato', esSRI: false, descripcion: 'Letrero acrílico de 5mm con separadores de acero.', specs: ['Acrílico 5mm', 'Pernos Acero'] },
  { nombre: 'Gigantografía / Lona Banner (m2)', precio: 12.0, categoria: 'Gran Formato', esSRI: false, descripcion: 'Impresión en lona banner full color por metro cuadrado.', specs: ['Lona 13oz', 'Full Color'] },

  // ═══════════════════════════════════════════════════════════════════
  // 10. MERCHANDISING Y REGALOS
  // ═══════════════════════════════════════════════════════════════════
  { nombre: 'Jarros Térmicos de Acero (Grabado Láser)', precio: 18.0, categoria: 'Merch', esSRI: false, descripcion: 'Jarros térmicos de acero inoxidable con grabado láser.', specs: ['Láser YAG', 'Acero Inox'] },
  { nombre: 'Bolígrafos de Metal (Grabado Láser)', precio: 3.5, categoria: 'Merch', esSRI: false, descripcion: 'Bolígrafos metálicos con grabado láser y estuche.', specs: ['Tinta Azul', 'Estuche'] },
  { nombre: 'Agendas Cuero Sintético', precio: 12.0, categoria: 'Merch', esSRI: false, descripcion: 'Agendas A5 forradas en cuero sintético repujado.', specs: ['Repujado', 'A5'] },
  { nombre: 'Llaveros de Cuero con Placa Metal', precio: 5.5, categoria: 'Merch', esSRI: false, descripcion: 'Llaveros de cuero con placa metálica grabada.', specs: ['Elegante', 'Empaque'] },

  // ═══════════════════════════════════════════════════════════════════
  // 11. OFICINA Y SELLOS
  // ═══════════════════════════════════════════════════════════════════
  { nombre: 'Sello Seco (Relieve en Papel)', precio: 65.0, categoria: 'Oficina', esSRI: false, descripcion: 'Sello seco de prensa metálica para relieve en papel.', specs: ['Prensa Metal', 'Inviolable'] },
  { nombre: 'Sellos Automáticos (Serie Professional)', precio: 35.0, categoria: 'Oficina', esSRI: false, descripcion: 'Sello automático profesional de metal.', specs: ['Shiny Pro', 'Metal'] },
  { nombre: 'Hojas Membretadas en Papel Especial x500', precio: 65.0, categoria: 'Oficina', esSRI: false, descripcion: 'Quinientas hojas membretadas en papel lino.', specs: ['Papel Lino', 'Láser'] },
  { nombre: 'Sobres de Invitación (Corte Láser)', precio: 1.5, categoria: 'Oficina', esSRI: false, descripcion: 'Sobres de cartulina 220g con corte láser.', specs: ['Cartulina 220g', 'Diseño Calado'] },
  { nombre: 'Vale de Caja Interno (Bloc)', precio: 5.0, categoria: 'Oficina', esSRI: false, descripcion: 'Vales de caja internos en bloc, no fiscales.', specs: ['Bloc', 'Uso interno'] },

  // ═══════════════════════════════════════════════════════════════════
  // 12. JUEGOS Y EVENTOS
  // ═══════════════════════════════════════════════════════════════════
  { nombre: 'Cartones de Bingo (Tablas 5x5)', precio: 0.35, categoria: 'Publicidad', esSRI: false, descripcion: 'Cartones de bingo numerados, en bond o cartulina.', specs: ['Numerado', 'Full Color'] },
  { nombre: 'Rifas / Boletos de Rifa (Numerados)', precio: 0.12, categoria: 'Publicidad', esSRI: false, descripcion: 'Boletos de rifa con talonario de control y numeración correlativa.', specs: ['Numerado', 'Talonario'] },

  // ═══════════════════════════════════════════════════════════════════
  // 13. EMPASTADO / ENCUADERNACIÓN (acabado, NO edición de libros)
  // ═══════════════════════════════════════════════════════════════════
  { nombre: 'Empastado de Libros / Tesis (Tapa Dura)', precio: 12.0, categoria: 'Oficina', esSRI: false, descripcion: 'Encuadernación de tapa dura con lomo (empastado). Servicio de acabado, no edición.', specs: ['Tapa Dura', 'Encolado'] },

  // ═══════════════════════════════════════════════════════════════════
  // 14. COMBOS ESTRATÉGICOS
  // ═══════════════════════════════════════════════════════════════════
  { nombre: 'Combo Identidad Corporativa Basic', precio: 150.0, categoria: 'Combos', esSRI: false, descripcion: 'Diseño Logo + 1000 Tarjetas + 500 Hojas Membretadas.', specs: ['Ahorro 20%'] },
  { nombre: 'Combo Stand Ferias (Roll-up + 1000 Flyers)', precio: 95.0, categoria: 'Combos', esSRI: false, descripcion: 'Ideal para eventos y activaciones rápidas.', specs: ['Entrega 48h'] },
];

/** Categorías del catálogo, en el orden en que se muestran. */
export const CATEGORIAS_CATALOGO = [
  'Documentos SRI',
  'Tarjetas',
  'Publicidad',
  'Etiquetas',
  'Packaging',
  'Gran Formato',
  'Merch',
  'Oficina',
  'Combos',
] as const;

export type CategoriaCatalogo = typeof CATEGORIAS_CATALOGO[number];
