
import { Cliente, Producto, Regimen, Trabajo, TrabajoEstado, TrabajoTipo, User, InventoryItem, Proveedor, TareaProveedor } from '../types';
import { VALID_USERS } from '../constants';

// ============================================================================
// ☁️ CONFIGURACIÓN DE LA NUBE (GOOGLE SHEETS)
// ============================================================================

// URL DE RESPALDO DIRECTA (La proporcionada por el usuario)
// Esta se usará si fallan las variables de entorno o si no están configuradas en Vercel
const HARDCODED_URL = "https://script.google.com/macros/s/AKfycbz9BrIG8s1h5spiy3H2OQVInN4lODW6VJ50-SmGBajjIQ2jbgzBl-65-_6XF7IYRluM/exec";

const getScriptUrl = () => {
  try {
    // 1. Intentar acceder de forma segura a import.meta.env
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_URL_SCRIPT_DE_GOOGLE) {
        // @ts-ignore
        return import.meta.env.VITE_URL_SCRIPT_DE_GOOGLE;
    }
  } catch (e) {
    // Ignorar errores de acceso
  }
  
  // 2. Si falla lo anterior, devolver la URL hardcodeada garantizada
  return HARDCODED_URL;
};

const GOOGLE_SCRIPT_URL = getScriptUrl();

// ============================================================================
// 🔄 SISTEMA DE SINCRONIZACIÓN HÍBRIDO (CACHE + NUBE)
// ============================================================================

/**
 * Lee datos. Intenta leer de la Nube primero. Si falla, usa LocalStorage (caché).
 */
const getStoredData = async <T>(key: string, defaultValue: T): Promise<T> => {
    // 1. Intentar leer de LocalStorage primero para velocidad inmediata (Caché optimista)
    let localData = defaultValue;
    try {
        const item = localStorage.getItem(key);
        if (item) localData = JSON.parse(item);
    } catch (e) { console.warn("Error lectura local", e); }

    // 2. Validación básica
    if (!GOOGLE_SCRIPT_URL || !GOOGLE_SCRIPT_URL.startsWith('http')) {
        console.warn("⚠️ MODO OFFLINE: URL de Google Script no válida, usando caché local.");
        return localData;
    }

    // 3. Intentar obtener datos frescos de la Nube
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=get&key=${key}`);
        
        // Verificamos si la respuesta es JSON válido antes de parsear
        const text = await response.text();
        let json;
        try {
            json = JSON.parse(text);
        } catch (e) {
            // Si falla el parseo (ej. Google devuelve HTML de error), fallamos silenciosamente al localData
            return localData;
        }
        
        if (json.status === 'success' && json.data) {
            // Actualizamos el caché local con lo nuevo de la nube
            localStorage.setItem(key, JSON.stringify(json.data));
            return json.data as T;
        }
    } catch (error) {
        // Error silencioso en consola para no saturar al usuario, se usa caché
        // console.error(`☁️ Error conectando con Google Cloud [${key}]:`, error);
    }

    return localData;
};

/**
 * Guarda datos. Guarda en LocalStorage (inmediato) y luego envía a la Nube (asíncrono).
 */
const setStoredData = async <T>(key: string, value: T): Promise<void> => {
    // 1. Guardar en LocalStorage inmediatamente (UI rápida)
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { console.error("Error escritura local", e); }

    // 2. Validación básica de URL
    if (!GOOGLE_SCRIPT_URL || !GOOGLE_SCRIPT_URL.startsWith('http')) return;

    // 3. Enviar a la Nube en segundo plano (Fire and Forget)
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save', key: key, data: value })
        });
        console.log(`☁️ Datos enviados a Nube: ${key}`);
    } catch (error) {
        console.error(`☁️ Error guardando en Google Cloud [${key}]:`, error);
    }
};

// --- KEYS DE BASE DE DATOS ---
const TRABAJOS_KEY = 'mockTrabajosData';
const CLIENTES_KEY = 'mockClientesData';
const PRODUCTOS_KEY = 'mockProductosData';
const USERS_KEY = 'mockUsersData';
const INVENTARIO_KEY = 'mockInventarioData';
const PROVEEDORES_KEY = 'mockProveedoresData';
const TAREAS_PROVEEDOR_KEY = 'mockTareasProveedorData';
const SRI_KEYS_KEY = 'mockSriKeysData';

// --- DATOS POR DEFECTO (Para inicializar si está vacío) ---
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}
const getRandomUser = () => VALID_USERS[Math.floor(Math.random() * VALID_USERS.length)];

const defaultProductos: Producto[] = [
  // --- SRI (Documentos Autorizados) ---
  { 
    id: 'p_sri_1', 
    nombre: 'Notas de Venta 1/4 Oficio (Block 100h)', 
    descripcion: 'Para RIMPE Negocio Popular. Original y Copia. Papel químico o bond.', 
    precio: 8.00, 
    categoria: 'SRI', 
    esSRI: true,
    imagenUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'p_sri_2', 
    nombre: 'Facturas A5 (Media Carta) (Block 100h)', 
    descripcion: 'Para RIMPE Emprendedor o General. Tamaño medio oficio.', 
    precio: 15.00, 
    categoria: 'SRI', 
    esSRI: true,
    imagenUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'p_sri_3', 
    nombre: 'Facturas A4 (Tamaño Completo) (Block 100h)', 
    descripcion: 'Ideal para detalles extensos o ferreterías.', 
    precio: 25.00, 
    categoria: 'SRI', 
    esSRI: true 
  },
  { 
    id: 'p_sri_4', 
    nombre: 'Retenciones A5 (Block 50 juegos)', 
    descripcion: 'Comprobantes de retención para agentes.', 
    precio: 12.00, 
    categoria: 'SRI', 
    esSRI: true 
  },
  { 
    id: 'p_sri_5', 
    nombre: 'Guías de Remisión 1/2 Oficio (Block 100h)', 
    descripcion: 'Documento para traslado de mercadería.', 
    precio: 14.00, 
    categoria: 'SRI', 
    esSRI: true 
  },
  { 
    id: 'p_sri_6', 
    nombre: 'Liquidación de Compras A4', 
    descripcion: 'Para reembolso de gastos o compras sin factura.', 
    precio: 25.00, 
    categoria: 'SRI', 
    esSRI: true 
  },

  // --- PUBLICIDAD IMPRESA ---
  { 
    id: 'p_pub_1', 
    nombre: '1000 Volantes A6 (10x14cm)', 
    descripcion: 'Papel couché brillante 115g. Full color un lado.', 
    precio: 30.00, 
    categoria: 'Publicidad',
    imagenUrl: 'https://images.unsplash.com/photo-1586717791821-3f44a5638d0f?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'p_pub_2', 
    nombre: '1000 Volantes A5 (14x21cm)', 
    descripcion: 'Papel couché brillante 115g. Doble tamaño, mayor impacto.', 
    precio: 60.00, 
    categoria: 'Publicidad' 
  },
  { 
    id: 'p_pub_3', 
    nombre: '1000 Tarjetas de Presentación', 
    descripcion: 'Cartulina Couché 300g. Laminado Mate + Brillo UV Localizado. Dos lados.', 
    precio: 35.00, 
    categoria: 'Tarjetas',
    imagenUrl: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'p_pub_4', 
    nombre: 'Trípticos Informativos (Ciento)', 
    descripcion: 'Papel bond o couché, tamaño A4 abierto, doblado en 3.', 
    precio: 45.00, 
    categoria: 'Publicidad' 
  },
  {
    id: 'p_pub_5',
    nombre: 'Menú Restaurante Plastificado',
    descripcion: 'Impresión A4/A3 rígida lavable y duradera.',
    precio: 3.50,
    categoria: 'Publicidad',
    imagenUrl: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=400'
  },

  // --- GRAN FORMATO ---
  { 
    id: 'p_gf_1', 
    nombre: 'Gigantografía Lona (m²)', 
    descripcion: 'Lona 13oz de alta resistencia. Impresión 1440dpi. Incluye ojales.', 
    precio: 10.00, 
    categoria: 'Gran Formato',
    imagenUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'p_gf_2', 
    nombre: 'Vinil Adhesivo (m²)', 
    descripcion: 'Vinil brillante o mate para superficies lisas, etiquetas o decoración.', 
    precio: 12.00, 
    categoria: 'Gran Formato' 
  },
  { 
    id: 'p_gf_3', 
    nombre: 'Microperforado (m²)', 
    descripcion: 'Para vidrios de vehículos o locales. Permite visión desde adentro.', 
    precio: 15.00, 
    categoria: 'Gran Formato' 
  },
  { 
    id: 'p_gf_4', 
    nombre: 'Roll Up Banner (80x200cm)', 
    descripcion: 'Estructura de aluminio portátil + Lona impresa. Incluye bolso.', 
    precio: 65.00, 
    categoria: 'Gran Formato',
    imagenUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'p_gf_5',
    nombre: 'Señalética de Seguridad',
    descripcion: 'Sintra + Vinil (Ruta de evacuación, Extintor, Baños).',
    precio: 5.00,
    categoria: 'Gran Formato',
    imagenUrl: 'https://images.unsplash.com/photo-1574359411659-15573a21bc2c?auto=format&fit=crop&q=80&w=400'
  },

  // --- SUBLIMACIÓN Y TEXTIL (NUEVOS) ---
  { 
    id: 'p_sub_1', 
    nombre: 'Taza Personalizada 11oz', 
    descripcion: 'Taza de cerámica blanca clase AAA. Impresión full color duradera.', 
    precio: 6.00, 
    categoria: 'Sublimación',
    imagenUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'p_sub_2', 
    nombre: 'Gorra Tipo Camionero', 
    descripcion: 'Gorra con malla trasera y frente acolchado. Varios colores disponibles.', 
    precio: 7.00, 
    categoria: 'Sublimación',
    imagenUrl: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'p_sub_3',
    nombre: 'Jarro Mágico (Cambia de color)',
    descripcion: 'Taza negra que revela el diseño con agua caliente.',
    precio: 8.00,
    categoria: 'Sublimación',
    imagenUrl: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'p_sub_4',
    nombre: 'Tomatodo de Aluminio 600ml',
    descripcion: 'Botella deportiva personalizada, incluye gancho.',
    precio: 9.00,
    categoria: 'Sublimación',
    imagenUrl: 'https://images.unsplash.com/photo-1602143407151-01114195bc51?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'p_text_1', 
    nombre: 'Camiseta Estampada DTF', 
    descripcion: 'Camiseta de algodón peinado o poliéster. Estampado tacto cero.', 
    precio: 12.00, 
    categoria: 'Textil',
    imagenUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'p_text_2', 
    nombre: 'Uniforme Deportivo (Juego)', 
    descripcion: 'Camiseta + Pantaloneta en tela DryFit con numeración y nombre.', 
    precio: 18.00, 
    categoria: 'Textil'
  },

  // --- ETIQUETAS Y VARIOS (NUEVOS) ---
  { 
    id: 'p_etq_1', 
    nombre: '100 Etiquetas Adhesivas 5x5cm', 
    descripcion: 'Vinil troquelado resistente al agua o papel adhesivo. Forma personalizada.', 
    precio: 15.00, 
    categoria: 'Etiquetas',
    imagenUrl: 'https://images.unsplash.com/photo-1616406432452-07bc5921752d?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'p_id_1', 
    nombre: 'Credencial PVC', 
    descripcion: 'Tarjeta plástica tipo crédito. Full color ambas caras. Incluye cordón.', 
    precio: 3.50, 
    categoria: 'Identificación',
    imagenUrl: 'https://images.unsplash.com/photo-1555529733-0e670560f7e1?auto=format&fit=crop&q=80&w=400'
  },

  // --- OFICINA Y VARIOS ---
  { 
    id: 'p_var_1', 
    nombre: 'Recibos de Caja (Block 100h)', 
    descripcion: 'Talonario genérico para control interno de pagos.', 
    precio: 5.00, 
    categoria: 'Oficina' 
  },
  { 
    id: 'p_var_2', 
    nombre: 'Sello Automático Pequeño', 
    descripcion: 'Marca Trodat/Shiny 3911 (38x14mm). Ideal para nombres y cargos.', 
    precio: 15.00, 
    categoria: 'Oficina',
    imagenUrl: 'https://images.unsplash.com/photo-1563200055-e7eb77b8b200?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'p_var_3', 
    nombre: 'Sello Automático Grande', 
    descripcion: 'Marca Trodat/Shiny 3912 o 3913. Para RUC completo o logos.', 
    precio: 22.00, 
    categoria: 'Oficina' 
  },
  { 
    id: 'p_var_4', 
    nombre: 'Millar de Rifas', 
    descripcion: 'Numeradas, talonadas y engomadas. Papel bond color.', 
    precio: 35.00, 
    categoria: 'Merch',
    imagenUrl: 'https://images.unsplash.com/photo-1541560052-77ec1bbc09f7?auto=format&fit=crop&q=80&w=400'
  },
  { 
    id: 'p_var_5', 
    nombre: 'Tablas de Bingo (Unidad)', 
    descripcion: 'Impresión B/N en cartulina bristol o bond.', 
    precio: 0.15, 
    categoria: 'Merch',
    imagenUrl: 'https://images.unsplash.com/photo-1516132006923-e97e23c20242?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'p_merch_1',
    nombre: 'Llaveros Publicitarios (Ciento)',
    descripcion: 'Llaveros de acrílico o metal con logo empresarial.',
    precio: 45.00,
    categoria: 'Merch',
    imagenUrl: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'p_var_6',
    nombre: 'Empastado de Tesis',
    descripcion: 'Tapa dura con letras doradas (Pan de Oro).',
    precio: 25.00, 
    categoria: 'Oficina',
    imagenUrl: 'https://images.unsplash.com/photo-1519682577862-22b62b24e491?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'p_corp_1',
    nombre: 'Carpeta Corporativa',
    descripcion: 'Carpeta impresa full color con bolsillo interno para documentos.',
    precio: 1.50,
    categoria: 'Oficina',
    imagenUrl: 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?auto=format&fit=crop&q=80&w=400'
  }
];

const defaultClientes: Cliente[] = [
  { id: 'c1', cedula: '1792233445001', ruc: '1792233445001', nombre: 'Comercial La Ganga', nombreComercial: 'La Ganga Pasaje', telefono: ['0991234567'], email: 'ventas@laganga.com', direccion: 'Av. Jubones y Sucre', creadoEn: '2023-01-15T00:00:00Z', regimen: Regimen.GENERAL },
  { id: 'c2', cedula: '0702345678', nombre: 'Juan Pérez', telefono: ['0987654321'], email: 'juan.perez@email.com', direccion: 'Barrio La Peaña', creadoEn: '2023-02-20T00:00:00Z', regimen: Regimen.NEGOCIO_POPULAR },
  { id: 'c3', cedula: '0705566778001', ruc: '0705566778001', nombre: 'Restaurante El Buen Sabor', telefono: ['0998877665'], direccion: 'Rocafuerte y Colón', creadoEn: '2023-03-10T00:00:00Z', regimen: Regimen.EMPRENDEDOR },
  { id: 'c4', cedula: '0701122334', nombre: 'María González', telefono: ['0991122334'], direccion: 'Centro de Pasaje', creadoEn: daysAgo(2), regimen: Regimen.GENERAL },
];

const defaultTrabajos: Trabajo[] = [
  { 
    id: 't1', orden: 1050, clienteId: 'c1', titular: 'Comercial La Ganga', 
    tipo: TrabajoTipo.SRI, subtipo: 'Facturas A4 (Tamaño Completo)', cantidad: 10, tamano: 'A4', 
    total: 250.00, abono: 150.00, saldo: 100.00, estado: TrabajoEstado.PENDIENTE, 
    fechaEntrada: daysAgo(0), fechaVencimiento: '2025-08-15T12:00:00Z', caduco: false, 
    creadoPor: 'Pedro', origen: 'Interno', establecimiento: '001', puntoEmision: '002' 
  },
  { 
    id: 't2', orden: 1049, clienteId: 'c2', titular: 'Juan Pérez', 
    tipo: TrabajoTipo.GENERAL, subtipo: '1000 Tarjetas de Presentación', cantidad: 1000, tamano: 'Estándar', 
    total: 35.00, abono: 35.00, saldo: 0.00, estado: TrabajoEstado.ENTREGADO, 
    fechaEntrada: daysAgo(5), caduco: false, creadoPor: 'Aleida', origen: 'Interno' 
  },
  { 
    id: 't3', orden: 1048, clienteId: 'c3', titular: 'Restaurante El Buen Sabor', 
    tipo: TrabajoTipo.SRI, subtipo: 'Notas de Venta 1/4 Oficio', cantidad: 5, tamano: '1/4 Oficio', 
    total: 40.00, abono: 20.00, saldo: 20.00, estado: TrabajoEstado.PROCESO, 
    fechaEntrada: daysAgo(2), fechaVencimiento: '2025-07-20T10:00:00Z', caduco: false, 
    creadoPor: 'Roberto', origen: 'Interno', establecimiento: '001', puntoEmision: '001' 
  },
  { 
    id: 't4', orden: 1047, clienteId: 'c4', titular: 'María González', 
    tipo: TrabajoTipo.GENERAL, subtipo: 'Gigantografía Lona 2x1.5m', cantidad: 3, tamano: '3m2', 
    total: 30.00, abono: 15.00, saldo: 15.00, estado: TrabajoEstado.VITRINA, 
    fechaEntrada: daysAgo(4), caduco: false, creadoPor: 'Pedro', origen: 'Interno' 
  },
  {
    id: 't5', orden: 1046, clienteId: 'c1', titular: 'Comercial La Ganga',
    tipo: TrabajoTipo.GENERAL, subtipo: '2000 Volantes A6', cantidad: 2000, tamano: 'A6',
    total: 60.00, abono: 30.00, saldo: 30.00, estado: TrabajoEstado.PENDIENTE,
    fechaEntrada: daysAgo(1), caduco: false, creadoPor: 'Aleida', origen: 'Interno'
  }
];

// Update default users with security fields
const defaultUsers: User[] = [
  { id: 'u1', nombre: 'Pedro', email: 'pedro@imprenta.com', rol: 'Admin', estado: 'Activo', ultimoAcceso: daysAgo(0), requirePassword: true, password: 'admin' },
  { id: 'u2', nombre: 'Aleida', email: 'aleida@imprenta.com', rol: 'Operador', estado: 'Activo', ultimoAcceso: daysAgo(1), requirePassword: false },
  { id: 'u3', nombre: 'Roberto', email: 'roberto@imprenta.com', rol: 'Operador', estado: 'Activo', ultimoAcceso: daysAgo(0), requirePassword: false },
  { id: 'u4', nombre: 'Daniel', email: 'daniel@imprenta.com', rol: 'Operador', estado: 'Inactivo', ultimoAcceso: daysAgo(5), requirePassword: false },
  { id: 'u5', nombre: 'Dante', email: 'dante@imprenta.com', rol: 'Operador', estado: 'Activo', ultimoAcceso: daysAgo(2), requirePassword: false },
  { id: 'u6', nombre: 'Santiago', email: 'santiago@imprenta.com', rol: 'Operador', estado: 'Activo', ultimoAcceso: daysAgo(3), requirePassword: false },
];
const defaultSriKeys: string[] = ["1234567890", "0987654321"];
const defaultInventario: InventoryItem[] = [
    { id: 'i1', item: 'Papel Químico Original', cantidad: 5, unidad: 'Resmas', costoUnitario: 12.50, minimo: 2 },
    { id: 'i2', item: 'Tinta Negra Offset', cantidad: 2, unidad: 'Latas', costoUnitario: 18.00, minimo: 1 },
];
const defaultProveedores: Proveedor[] = [
    { id: 'pr1', nombre: 'Papelesa', categoria: 'Papel y Cartulinas', tipo: 'Producto', contacto: 'Carlos V.', telefono: '0991112222', email: 'ventas@papelesa.com', ciudad: 'Guayaquil', estado: 'Activo', creadoEn: daysAgo(10), productos: 'Bond, Químico, Couché' },
    { id: 'pr2', nombre: 'Tintas & Gráficos', categoria: 'Insumos Imprenta', tipo: 'Producto', contacto: 'María L.', telefono: '0988889999', ciudad: 'Machala', estado: 'Activo', creadoEn: daysAgo(12), productos: 'Tintas Offset, Placas' }
];
const defaultTareasProveedor: TareaProveedor[] = [];

// --- API FUNCTIONS ---

export const getTrabajos = async (): Promise<Trabajo[]> => {
    return await getStoredData(TRABAJOS_KEY, defaultTrabajos);
};

export const getClientes = async (): Promise<Cliente[]> => {
    return await getStoredData(CLIENTES_KEY, defaultClientes);
};

export const getProductos = async (): Promise<Producto[]> => {
    return await getStoredData(PRODUCTOS_KEY, defaultProductos);
};

export const updateTrabajoStatus = async (trabajoId: string, newStatus: TrabajoEstado, usuario: string): Promise<Trabajo> => {
    const trabajos = await getStoredData(TRABAJOS_KEY, defaultTrabajos);
    const trabajoIndex = trabajos.findIndex(t => t.id === trabajoId);
    if (trabajoIndex > -1) {
        trabajos[trabajoIndex].estado = newStatus;
        trabajos[trabajoIndex].actualizadoPor = usuario;
        await setStoredData(TRABAJOS_KEY, trabajos);
        return trabajos[trabajoIndex];
    }
    throw new Error("Trabajo no encontrado");
};

export const createTrabajo = async (trabajoData: Omit<Trabajo, 'id' | 'orden' | 'fechaEntrada' | 'saldo' | 'caduco'>, usuario: string): Promise<Trabajo> => {
    const trabajos = await getStoredData(TRABAJOS_KEY, defaultTrabajos);
    const newTrabajo: Trabajo = {
        id: String(Date.now()),
        orden: Math.max(...trabajos.map(t => t.orden), 1000) + 1,
        clienteId: trabajoData.clienteId,
        titular: trabajoData.titular,
        tipo: trabajoData.tipo,
        subtipo: trabajoData.subtipo,
        cantidad: trabajoData.cantidad,
        tamano: trabajoData.tamano,
        total: trabajoData.total,
        abono: trabajoData.abono,
        saldo: trabajoData.total - trabajoData.abono,
        estado: trabajoData.estado,
        fechaEntrada: new Date().toISOString(),
        fechaVencimiento: trabajoData.fechaVencimiento,
        caduco: false,
        creadoPor: usuario,
        establecimiento: trabajoData.establecimiento,
        puntoEmision: trabajoData.puntoEmision,
        claveAcceso: trabajoData.claveAcceso,
        origen: 'Interno',
        esRenovacion: trabajoData.esRenovacion,
    };
    trabajos.unshift(newTrabajo);
    await setStoredData(TRABAJOS_KEY, trabajos);
    return newTrabajo;
};

export const createPublicPedido = async (
    clienteInfo: { nombre: string; telefono: string; email: string; ruc?: string; direccion?: string; regimen?: Regimen; tipoDocumento: 'SRI' | 'Recibo'; },
    productos: { producto: Producto, cantidad: number }[]
): Promise<boolean> => {
    const clientes = await getStoredData(CLIENTES_KEY, defaultClientes);
    let cliente = clientes.find(c => 
        (clienteInfo.ruc && c.ruc === clienteInfo.ruc) || 
        (clienteInfo.ruc && c.cedula === clienteInfo.ruc) ||
        c.telefono.includes(clienteInfo.telefono)
    );
    
    if (!cliente) {
        cliente = {
            id: `c${Date.now()}`,
            cedula: clienteInfo.ruc || '9999999999',
            ruc: clienteInfo.ruc,
            nombre: clienteInfo.nombre,
            telefono: [clienteInfo.telefono],
            email: clienteInfo.email,
            direccion: clienteInfo.direccion,
            creadoEn: new Date().toISOString(),
            regimen: clienteInfo.regimen || Regimen.GENERAL
        };
        clientes.unshift(cliente);
        await setStoredData(CLIENTES_KEY, clientes);
    }

    const trabajos = await getStoredData(TRABAJOS_KEY, defaultTrabajos);
    const total = productos.reduce((sum, item) => sum + (item.producto.precio * item.cantidad), 0);
    const descripcion = productos.map(p => `${p.cantidad}x ${p.producto.nombre}`).join(', ');

    const newTrabajo: Trabajo = {
        id: `web${Date.now()}`,
        orden: Math.max(...trabajos.map(t => t.orden), 1000) + 1,
        clienteId: cliente.id,
        titular: `${clienteInfo.nombre} (WEB)`,
        tipo: clienteInfo.tipoDocumento === 'SRI' ? TrabajoTipo.SRI : TrabajoTipo.GENERAL,
        subtipo: descripcion,
        cantidad: productos.reduce((sum, p) => sum + p.cantidad, 0),
        tamano: 'Varios',
        total: total,
        abono: 0, 
        saldo: total,
        estado: TrabajoEstado.PENDIENTE,
        fechaEntrada: new Date().toISOString(),
        caduco: false,
        creadoPor: 'Cliente Web',
        origen: 'Web'
    };
    
    trabajos.unshift(newTrabajo);
    await setStoredData(TRABAJOS_KEY, trabajos);
    return true;
};

export const createCliente = async (clienteData: Omit<Cliente, 'id' | 'creadoEn'>): Promise<Cliente> => {
    const clientes = await getStoredData(CLIENTES_KEY, defaultClientes);
    const newCliente: Cliente = {
        id: `c${Date.now()}`,
        creadoEn: new Date().toISOString(),
        ...clienteData
    };
    clientes.unshift(newCliente);
    await setStoredData(CLIENTES_KEY, clientes);
    return newCliente;
};

export const updateCliente = async (clienteId: string, clienteData: Partial<Omit<Cliente, 'id' | 'creadoEn'>>): Promise<Cliente> => {
    const clientes = await getStoredData(CLIENTES_KEY, defaultClientes);
    const index = clientes.findIndex(c => c.id === clienteId);
    if (index > -1) {
        clientes[index] = { ...clientes[index], ...clienteData };
        await setStoredData(CLIENTES_KEY, clientes);
        return clientes[index];
    }
    throw new Error("Cliente no encontrado");
};

export const updateTrabajoPhoto = async (trabajoId: string, photoUrl: string): Promise<Trabajo> => {
    const trabajos = await getStoredData(TRABAJOS_KEY, defaultTrabajos);
    const trabajoIndex = trabajos.findIndex(t => t.id === trabajoId);
    if (trabajoIndex > -1) {
        trabajos[trabajoIndex].fotoOriginalUrl = photoUrl;
        await setStoredData(TRABAJOS_KEY, trabajos);
        return trabajos[trabajoIndex];
    }
    throw new Error("Trabajo no encontrado");
};

export const createProducto = async (productoData: Omit<Producto, 'id'>): Promise<Producto> => {
    const productos = await getStoredData(PRODUCTOS_KEY, defaultProductos);
    const newProducto: Producto = {
        id: `p${Date.now()}`,
        ...productoData
    };
    productos.unshift(newProducto);
    await setStoredData(PRODUCTOS_KEY, productos);
    return newProducto;
};

export const updateProducto = async (productoId: string, productoData: Partial<Omit<Producto, 'id'>>): Promise<Producto> => {
    const productos = await getStoredData(PRODUCTOS_KEY, defaultProductos);
    const index = productos.findIndex(p => p.id === productoId);
    if (index > -1) {
        productos[index] = { ...productos[index], ...productoData };
        await setStoredData(PRODUCTOS_KEY, productos);
        return productos[index];
    }
    throw new Error("Producto no encontrado");
};

export const deleteProducto = async (productoId: string): Promise<boolean> => {
    let productos = await getStoredData(PRODUCTOS_KEY, defaultProductos);
    const initialLength = productos.length;
    productos = productos.filter(p => p.id !== productoId);
    await setStoredData(PRODUCTOS_KEY, productos);
    return productos.length < initialLength;
};

export const getUsers = async (): Promise<User[]> => {
    return await getStoredData(USERS_KEY, defaultUsers);
};

export const createUser = async (userData: Omit<User, 'id' | 'ultimoAcceso'>): Promise<User> => {
    const users = await getStoredData(USERS_KEY, defaultUsers);
    const newUser: User = {
        id: `u${Date.now()}`,
        ultimoAcceso: new Date().toISOString(),
        ...userData
    };
    users.unshift(newUser);
    await setStoredData(USERS_KEY, users);
    return newUser;
};

export const updateUser = async (userId: string, userData: Partial<Omit<User, 'id'>>): Promise<User> => {
    const users = await getStoredData(USERS_KEY, defaultUsers);
    const index = users.findIndex(u => u.id === userId);
    if (index > -1) {
        users[index] = { ...users[index], ...userData };
        await setStoredData(USERS_KEY, users);
        return users[index];
    }
    throw new Error("Usuario no encontrado");
};

export const registerRetiro = async (trabajoId: string, pagoFinal: number, usuario: string): Promise<Trabajo> => {
    const trabajos = await getStoredData(TRABAJOS_KEY, defaultTrabajos);
    const trabajoIndex = trabajos.findIndex(t => t.id === trabajoId);
    if (trabajoIndex > -1) {
        const trabajo = trabajos[trabajoIndex];
        trabajo.estado = TrabajoEstado.ENTREGADO;
        trabajo.abono += pagoFinal;
        trabajo.saldo = parseFloat((trabajo.total - trabajo.abono).toFixed(2));
        if (trabajo.saldo < 0) trabajo.saldo = 0;
        trabajo.actualizadoPor = usuario;
        trabajos[trabajoIndex] = trabajo;
        await setStoredData(TRABAJOS_KEY, trabajos);
        return trabajo;
    }
    throw new Error("Trabajo no encontrado");
};

export const getInventario = async (): Promise<InventoryItem[]> => {
    return await getStoredData(INVENTARIO_KEY, defaultInventario);
};

export const createInventarioItem = async (itemData: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => {
    const items = await getStoredData(INVENTARIO_KEY, defaultInventario);
    const newItem: InventoryItem = {
        id: `inv${Date.now()}`,
        ...itemData
    };
    items.unshift(newItem);
    await setStoredData(INVENTARIO_KEY, items);
    return newItem;
};

export const updateInventarioItem = async (itemId: string, itemData: Partial<Omit<InventoryItem, 'id'>>): Promise<InventoryItem> => {
    const items = await getStoredData(INVENTARIO_KEY, defaultInventario);
    const index = items.findIndex(i => i.id === itemId);
    if (index > -1) {
        items[index] = { ...items[index], ...itemData };
        await setStoredData(INVENTARIO_KEY, items);
        return items[index];
    }
    throw new Error("Item no encontrado");
};

export const deleteInventarioItem = async (itemId: string): Promise<boolean> => {
    let items = await getStoredData(INVENTARIO_KEY, defaultInventario);
    const initialLength = items.length;
    items = items.filter(i => i.id !== itemId);
    await setStoredData(INVENTARIO_KEY, items);
    return items.length < initialLength;
};

export const setInventario = async (items: InventoryItem[]): Promise<void> => {
    await setStoredData(INVENTARIO_KEY, items);
};

export const getProveedores = async (): Promise<Proveedor[]> => {
    return await getStoredData(PROVEEDORES_KEY, defaultProveedores);
};

export const createProveedor = async (proveedorData: Omit<Proveedor, 'id' | 'creadoEn'>): Promise<Proveedor> => {
    const proveedores = await getStoredData(PROVEEDORES_KEY, defaultProveedores);
    const newProveedor: Proveedor = {
        id: `prov${Date.now()}`,
        creadoEn: new Date().toISOString(),
        ...proveedorData
    };
    proveedores.unshift(newProveedor);
    await setStoredData(PROVEEDORES_KEY, proveedores);
    return newProveedor;
};

export const updateProveedor = async (proveedorId: string, proveedorData: Partial<Omit<Proveedor, 'id'>>): Promise<Proveedor> => {
    const proveedores = await getStoredData(PROVEEDORES_KEY, defaultProveedores);
    const index = proveedores.findIndex(p => p.id === proveedorId);
    if (index > -1) {
        proveedores[index] = { ...proveedores[index], ...proveedorData };
        await setStoredData(PROVEEDORES_KEY, proveedores);
        return proveedores[index];
    }
    throw new Error("Proveedor no encontrado");
};

export const deleteProveedor = async (proveedorId: string): Promise<boolean> => {
    let proveedores = await getStoredData(PROVEEDORES_KEY, defaultProveedores);
    proveedores = proveedores.filter(p => p.id !== proveedorId);
    await setStoredData(PROVEEDORES_KEY, proveedores);
    return true;
};

export const getTareasProveedor = async (): Promise<TareaProveedor[]> => {
    return await getStoredData(TAREAS_PROVEEDOR_KEY, defaultTareasProveedor);
};

export const createTareaProveedor = async (tareaData: Omit<TareaProveedor, 'id' | 'completada'>): Promise<TareaProveedor> => {
    const tareas = await getStoredData(TAREAS_PROVEEDOR_KEY, defaultTareasProveedor);
    const newTarea: TareaProveedor = {
        id: `tarea${Date.now()}`,
        completada: false,
        ...tareaData
    };
    tareas.unshift(newTarea);
    await setStoredData(TAREAS_PROVEEDOR_KEY, tareas);
    return newTarea;
};

export const updateTareaProveedor = async (tareaId: string, tareaData: Partial<Omit<TareaProveedor, 'id'>>): Promise<TareaProveedor> => {
    const tareas = await getStoredData(TAREAS_PROVEEDOR_KEY, defaultTareasProveedor);
    const index = tareas.findIndex(t => t.id === tareaId);
    if (index > -1) {
        tareas[index] = { ...tareas[index], ...tareaData };
        await setStoredData(TAREAS_PROVEEDOR_KEY, tareas);
        return tareas[index];
    }
    throw new Error("Tarea no encontrada");
};

export const getSriKeys = async (): Promise<string[]> => {
    return await getStoredData(SRI_KEYS_KEY, defaultSriKeys);
};

export const addSriKey = async (key: string): Promise<string[]> => {
    const keys = await getStoredData(SRI_KEYS_KEY, defaultSriKeys);
    if (!keys.includes(key)) {
        keys.push(key);
        await setStoredData(SRI_KEYS_KEY, keys);
    }
    return keys;
};

export const deleteSriKey = async (key: string): Promise<string[]> => {
    let keys = await getStoredData(SRI_KEYS_KEY, defaultSriKeys);
    keys = keys.filter(k => k !== key);
    await setStoredData(SRI_KEYS_KEY, keys);
    return keys;
};
