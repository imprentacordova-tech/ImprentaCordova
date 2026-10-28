import { Producto, TrabajoTipo, Regimen } from '../types';

/**
 * @version 2.0 - Edición Alpha Industrial
 * @ideas_500k:
 * - Integración con Stock en Tiempo Real (Supabase Realtime)
 * - Matriz de Precios Dinámica por Volumen Escalable
 * - Filtros Avanzados por Gramaje, Acabado y Tipo de Impresión
 * - Generación Automática de Hojas de Producción desde el Catálogo
 */
export const MASTER_CATALOG: Partial<Producto>[] = [
  // --- DOCUMENTOS AUTORIZADOS (SRI) ---
  // Estos documentos aparecen filtrados según el régimen del cliente seleccionado.
  
  // RIMPE NEGOCIO POPULAR
  { nombre: 'FACTURA (RIMPE NEGOCIO POPULAR)', precio: 15.00, categoria: 'Oficina', esSRI: true, imagenUrl: 'https://i.imgur.com/vH3mGvR.png' },
  { nombre: 'NOTA DE VENTA (RIMPE NEGOCIO POPULAR)', precio: 15.00, categoria: 'Oficina', esSRI: true, imagenUrl: 'https://i.imgur.com/vH3mGvR.png' },
  { nombre: 'LIQUIDACION DE COMPRA DE BIENES MUEBLES USADOS (RIMPE)', precio: 18.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'NOTAS DE CREDITO (RIMPE)', precio: 12.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'NOTAS DE DEBITO (RIMPE)', precio: 12.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'GUIAS DE REMISION (RIMPE)', precio: 12.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'BOLETOS O ENTRADAS A ESPECTACULOS PUBLICOS (RIMPE)', precio: 25.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'LIQUIDACION DE COMPRA DE VEHICULOS USADOS (RIMPE)', precio: 20.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'ACTA DE ENTREGA - RECEPCION DE VEHICULOS USADOS (RIMPE)', precio: 5.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'LIQUIDACION DE COMPRA DE BIENES O PRESTACION DE SERVICIOS (RIMPE)', precio: 15.00, categoria: 'Oficina', esSRI: true },

  // RÉGIMEN GENERAL / RIMPE EMPRENDEDOR
  { nombre: 'FACTURA (REGIMEN GENERAL / EMPRENDEDOR)', precio: 15.00, categoria: 'Oficina', esSRI: true, imagenUrl: 'https://i.imgur.com/vH3mGvR.png' },
  { nombre: 'LIQUIDACION DE COMPRA DE BIENES O PRESTACION DE SERVICIOS (GENERAL)', precio: 18.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'NOTAS DE DEBITO (GENERAL)', precio: 12.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'GUIAS DE REMISION (GENERAL)', precio: 12.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'ACTA ENTREGA - RECEPCIÓN DE BOTELLAS PLASTICAS NO RETORNABLES DE PET', precio: 5.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'LIQUIDACION DE COMPRA DE BIENES MUEBLES USADOS (GENERAL)', precio: 18.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'LIQUIDACION DE COMPRA DE VEHICULOS USADOS (GENERAL)', precio: 20.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'ACTA DE ENTREGA - RECEPCION DE VEHICULOS USADOS (GENERAL)', precio: 5.00, categoria: 'Oficina', esSRI: true },

  // Formatos Estándar (Fallback/Comunes)
  { nombre: 'Facturero A5 1x Blocs (50x2)', precio: 10.00, categoria: 'Oficina', esSRI: true, imagenUrl: 'https://i.imgur.com/6X9mY9L.png' },
  { nombre: 'Facturero A5 3x Blocs (50x2)', precio: 22.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'Facturero A5 5x Blocs (50x2)', precio: 32.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'Facturero A5 10x Blocs (50x2)', precio: 55.00, categoria: 'Oficina', esSRI: true },
  { nombre: 'Comprobante de Retención Electrónico', precio: 0.15, categoria: 'Oficina', esSRI: true },
  { nombre: 'Vale de Caja Interno (Bloc)', precio: 5.00, categoria: 'Oficina', esSRI: false },

  // --- TARJETAS DE PRESENTACIÓN ---
  { 
    nombre: 'Tarjetas Premium (Acabado Soft-Touch)', 
    precio: 45.00, 
    categoria: 'Tarjetas', 
    esSRI: false,
    descripcion: 'Tarjetas con laminado aterciopelado y puntas redondeadas. Máximo prestigio.',
    specs: ['Soft-Touch', '350g', 'Full Color']
  },
  { 
    nombre: 'Tarjetas con Barniz UV Localizado x1000', 
    precio: 75.00, 
    categoria: 'Tarjetas', 
    esSRI: false,
    descripcion: 'Laminado mate con detalles brillantes en relieve. Ideal para logotipos.',
    specs: ['Mate + UV Localizado', '300g', 'Offset']
  },
  { nombre: 'Tarjetas en PVC Mate (Grosor Crédito)', precio: 1.50, categoria: 'Tarjetas', esSRI: false, specs: ['PVC', 'Durabilidad Alta'] },
  { nombre: 'Tarjetas Hot Stamping Oro/Plata x100', precio: 85.00, categoria: 'Tarjetas', esSRI: false, specs: ['Foil Metálico', 'Lujo'] },

  // --- PUBLICIDAD Y EDITORIAL ---
  { nombre: 'Revistas Corporativas A4 (16 pág) x100', precio: 350.00, categoria: 'Publicidad', esSRI: false, specs: ['Grapadas', 'Couché 150g'] },
  { nombre: 'Dípticos A4 x1000 (Couché 150g)', precio: 85.00, categoria: 'Publicidad', esSRI: false, specs: ['Doblado Pro', 'Offset'] },
  { nombre: 'Trípticos A4 x1000 (Couché 150g)', precio: 95.00, categoria: 'Publicidad', esSRI: false, specs: ['Doblado Pro', 'Offset'] },
  { nombre: 'Afiches A3 Pro x100 (Couché 150g)', precio: 45.00, categoria: 'Publicidad', esSRI: false, specs: ['Full Color', 'Offset'] },
  { nombre: 'Carpetas con Bolsillo Troquelado x100', precio: 120.00, categoria: 'Publicidad', esSRI: false, specs: ['Couché 300g', 'Troquel'] },

  // --- ETIQUETAS Y PACKAGING (LUJO) ---
  { nombre: 'Etiquetas de Vino (Papel Texturizado)', precio: 0.45, categoria: 'Etiquetas', esSRI: false, specs: ['Antihumedad', 'Textura'] },
  { nombre: 'Cajas para Joyería con Logo Oro', precio: 4.50, categoria: 'Packaging', esSRI: false, specs: ['Cartón Rígido', 'Hot Stamping'] },
  { nombre: 'Bolsas de Lujo (Papel Couché + Cordón)', precio: 1.20, categoria: 'Packaging', esSRI: false, specs: ['Laminadas', 'Reforzadas'] },
  { nombre: 'Etiquetas Transparentes (Corte Especial)', precio: 15.00, categoria: 'Etiquetas', esSRI: false, specs: ['Plotter', 'Vinil'] },

  // --- GRAN FORMATO (GIGANTOGRAFÍA) ---
  { nombre: 'Exhibidor Roll-up (80x200cm) Pro', precio: 55.00, categoria: 'Gran Formato', esSRI: false, specs: ['Aluminio Reforzado', 'Lona 13oz'] },
  { nombre: 'Caja de Luz LED (Backlight) m2', precio: 110.00, categoria: 'Gran Formato', esSRI: false, specs: ['Estructura Metal', 'Luz LED'] },
  { nombre: 'Vinil Decorativo para Pared m2', precio: 22.00, categoria: 'Gran Formato', esSRI: false, specs: ['Instalación Incluida', 'Mate/Brillo'] },
  { nombre: 'Letrero Acrílico con Separadores', precio: 145.00, categoria: 'Gran Formato', esSRI: false, specs: ['Acrílico 5mm', 'Pernos Acero'] },

  // --- MERCHANDISING Y REGALOS ---
  { nombre: 'Jarros Térmicos de Acero (Grabado Láser)', precio: 18.00, categoria: 'Merch', esSRI: false, specs: ['Láser YAG', 'Acero Inox'] },
  { nombre: 'Bolígrafos de Metal (Grabado Láser)', precio: 3.50, categoria: 'Merch', esSRI: false, specs: ['Tinta Azul', 'Estuche'] },
  { nombre: 'Agendas Cuero Sintético 2024', precio: 12.00, categoria: 'Merch', esSRI: false, specs: ['Repujado', 'A5'] },
  { nombre: 'Llaveros de Cuero con Placa Metal', precio: 5.50, categoria: 'Merch', esSRI: false, specs: ['Elegante', 'Empaque'] },

  // --- OFICINA Y VARIOS ---
  { nombre: 'Sello Seco (Relieve en Papel)', precio: 65.00, categoria: 'Oficina', esSRI: false, specs: ['Prensa Metal', 'Inviolable'] },
  { nombre: 'Sellos Automáticos (Serie Professional)', precio: 35.00, categoria: 'Oficina', esSRI: false, specs: ['Shiny Pro', 'Metal'] },
  { nombre: 'Hojas Membretadas en Papel Especial x500', precio: 65.00, categoria: 'Oficina', esSRI: false, specs: ['Papel Lino', 'Láser'] },
  { nombre: 'Sobres de Invitación (Corte Láser)', precio: 1.50, categoria: 'Oficina', esSRI: false, specs: ['Cartulina 220g', 'Diseño Calado'] },

  // --- JUEGOS Y EVENTOS (COMERCIAL) ---
  { nombre: 'Cartones de Bingo (Tablas 5x5)', precio: 0.35, categoria: 'Publicidad', esSRI: false, descripcion: 'Cartones de bingo numerados, en bond o cartulina.', specs: ['Numerado', 'Full Color'] },
  { nombre: 'Rifas / Boletos de Rifa (Numerados)', precio: 0.12, categoria: 'Publicidad', esSRI: false, descripcion: 'Boletos de rifa con talonario de control y numeración correlativa.', specs: ['Numerado', 'Talonario'] },

  // --- EMPASTADO / ENCUADERNACIÓN (servicio de acabado, NO edición de libros) ---
  { nombre: 'Empastado de Libros / Tesis (Tapa Dura)', precio: 12.00, categoria: 'Oficina', esSRI: false, descripcion: 'Encuadernación de tapa dura con lomo (empastado). Servicio de acabado, no edición.', specs: ['Tapa Dura', 'Encolado'] },

  // --- COMBOS ESTRATÉGICOS ---
  { nombre: 'Combo Identidad Corporativa Basic', precio: 150.00, categoria: 'Combos', esSRI: false, descripcion: 'Diseño Logo + 1000 Tarjetas + 500 Hojas Membretadas', specs: ['Ahorro 20%'] },
  { nombre: 'Combo Stand Ferias (Roll-up + 1000 Flyers)', precio: 95.00, categoria: 'Combos', esSRI: false, descripcion: 'Ideal para eventos y activaciones rápidas.', specs: ['Entrega 48h'] },
];
