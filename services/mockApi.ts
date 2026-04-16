
import { Cliente, Producto, Regimen, Trabajo, TrabajoEstado, TrabajoTipo, User, InventoryItem, Proveedor, TareaProveedor, SriCredential, StatusLog } from '../types';
import { getConfig } from './configService';

// LLAVES DE LOCALSTORAGE
const DB_MAP = {
    trabajos: 'mockTrabajosData',
    clientes: 'mockClientesData',
    productos: 'mockProductosData',
    users: 'mockUsersData',
    inventario: 'mockInventarioData',
    proveedores: 'mockProveedoresData',
    sri: 'mockSriKeysData',
    tareas: 'mockTareasData',
    movimientos: 'mockMovimientosInv'
};

/**
 * LÓGICA DE DESCUENTO AUTOMÁTICO DE INVENTARIO
 */
const deductInventoryFromJob = async (trabajo: Trabajo) => {
    const inv = JSON.parse(localStorage.getItem(DB_MAP.inventario) || '[]');
    if (!inv.length) return;

    const esQuimico = trabajo.subtipo.toUpperCase().includes('FACTURA') || trabajo.subtipo.toUpperCase().includes('NOTA DE VENTA');
    
    if (esQuimico) {
        const matchBlocks = trabajo.subtipo.match(/^(\d+)x/);
        const numBlocks = matchBlocks ? parseInt(matchBlocks[1]) : 1;
        
        const matchHojas = trabajo.subtipo.match(/(\d+)H/i);
        const hojasPorBlock = matchHojas ? parseInt(matchHojas[1]) : 50;
        
        const esDuplicado = trabajo.subtipo.toUpperCase().includes('DUPLICADO');
        const esTriplicado = trabajo.subtipo.toUpperCase().includes('TRIPLICADO');
        const numPartes = esTriplicado ? 3 : (esDuplicado ? 2 : 1);

        let cortes = 4; 
        if (trabajo.subtipo.includes('1/8')) cortes = 8;
        if (trabajo.subtipo.includes('1/2')) cortes = 2;
        if (trabajo.subtipo.includes('OFICIO') && !trabajo.subtipo.includes('/')) cortes = 1;

        const hojasConsumidas = (numBlocks * hojasPorBlock) / cortes;
        const fraccionResma = hojasConsumidas / 500;

        let actualizo = false;
        const newInv = inv.map((item: InventoryItem) => {
            const name = item.item.toUpperCase();
            if (name.includes('QUIMICO') && (name.includes('ORIGINAL') || name.includes('CB'))) {
                item.cantidad = Math.max(0, item.cantidad - fraccionResma);
                actualizo = true;
            }
            if (numPartes > 1 && name.includes('QUIMICO') && (name.includes('COPIA') || name.includes('CF') || name.includes('CFB'))) {
                item.cantidad = Math.max(0, item.cantidad - (fraccionResma * (numPartes - 1)));
                actualizo = true;
            }
            return item;
        });

        if (actualizo) {
            localStorage.setItem(DB_MAP.inventario, JSON.stringify(newInv));
        }
    }
};

export const createTrabajo = async (trabajoData: any, usuario: string): Promise<Trabajo> => {
    const trabajos = JSON.parse(localStorage.getItem(DB_MAP.trabajos) || '[]');
    const clientes = JSON.parse(localStorage.getItem(DB_MAP.clientes) || '[]');
    const config = getConfig();

    // VALIDACIÓN DE SEGURIDAD SRI
    if (trabajoData.tipo === TrabajoTipo.SRI) {
        const cliente = clientes.find((c: any) => c.id === trabajoData.clienteId);
        if (cliente) {
            const isNotaVenta = trabajoData.subtipo.toUpperCase().includes('NOTA DE VENTA');
            if (cliente.regimen === Regimen.NEGOCIO_POPULAR && !isNotaVenta) {
                throw new Error("ERROR LEGAL: Un Negocio Popular solo puede emitir Notas de Venta.");
            }
            if (cliente.regimen !== Regimen.NEGOCIO_POPULAR && isNotaVenta) {
                throw new Error("ERROR LEGAL: Los regímenes Emprendedor/General no emiten Notas de Venta.");
            }
        }
    }

    const lastSequence = trabajos.length > 0 ? Math.max(...trabajos.map((t: any) => t.orden)) : config.secuencialInicio - 1;
    const nextSequence = Math.max(lastSequence + 1, config.secuencialInicio);
    
    const newTrabajo = {
        id: String(Date.now()),
        orden: nextSequence,
        ...trabajoData,
        fechaEntrada: new Date().toISOString(),
        caduco: false,
        creadoPor: usuario,
        saldo: (trabajoData.total || 0) - (trabajoData.abono || 0),
        historial: [{ estado: TrabajoEstado.PENDIENTE, fecha: new Date().toISOString(), usuario }]
    };
    
    trabajos.unshift(newTrabajo);
    localStorage.setItem(DB_MAP.trabajos, JSON.stringify(trabajos));
    
    await deductInventoryFromJob(newTrabajo);
    forcePushAllToCloud(); 
    return newTrabajo;
};

export const aprobarArte = async (trabajoId: string): Promise<Trabajo> => {
    const trabajos = JSON.parse(localStorage.getItem(DB_MAP.trabajos) || '[]');
    const idx = trabajos.findIndex((t: any) => t.id === trabajoId);
    if (idx > -1) {
        trabajos[idx].arteAprobado = true;
        trabajos[idx].estado = TrabajoEstado.PROCESO; // Pasa a taller tras aprobación
        trabajos[idx].historial.push({ estado: TrabajoEstado.PROCESO, fecha: new Date().toISOString(), usuario: 'Cliente (Web)' });
        localStorage.setItem(DB_MAP.trabajos, JSON.stringify(trabajos));
        forcePushAllToCloud();
        return trabajos[idx];
    }
    throw new Error("Trabajo no encontrado");
};

// --- GESTIÓN DE PRODUCTOS ---
export const getProductos = async (): Promise<Producto[]> => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.productos) || '[]');
    if (data.length === 0) return seed100Products(); // Auto-seed if empty
    return data;
};

export const createProducto = async (p: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.productos) || '[]');
    const newP = { id: `p${Date.now()}`, ...p };
    data.push(newP);
    localStorage.setItem(DB_MAP.productos, JSON.stringify(data));
    forcePushAllToCloud();
    return newP;
};

export const seed100Products = async (): Promise<Producto[]> => {
    const catalog: Omit<Producto, 'id'>[] = [
        // --- SRI (CATEGORIA REGLAMENTARIA) ---
        { nombre: 'FACTURAS (1/4 OFICIO - 50H - DUPLICADO)', categoria: 'SRI', precio: 15.00, esSRI: true, descripcion: 'Autorizado SRI, papel químico original y copia.', imagenUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400' },
        { nombre: 'FACTURAS (1/4 OFICIO - 100H - DUPLICADO)', categoria: 'SRI', precio: 25.00, esSRI: true, descripcion: 'Autorizado SRI, mayor volumen.', imagenUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400' },
        { nombre: 'FACTURAS (1/2 OFICIO - 50H - DUPLICADO)', categoria: 'SRI', precio: 22.00, esSRI: true, descripcion: 'Formato mediano.', imagenUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400' },
        { nombre: 'FACTURAS (OFICIO - 50H - DUPLICADO)', categoria: 'SRI', precio: 30.00, esSRI: true, descripcion: 'Formato grande.', imagenUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400' },
        { nombre: 'FACTURAS (1/4 OFICIO - 25H - DUPLICADO)', categoria: 'SRI', precio: 10.00, esSRI: true, descripcion: 'Contingencia (25 Hojas).', imagenUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400' },
        { nombre: 'NOTAS DE VENTA (1/4 OFICIO - 50H - ÚNICO)', categoria: 'SRI', precio: 10.00, esSRI: true, descripcion: 'RIMPE Negocio Popular.', imagenUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?q=80&w=400' },
        { nombre: 'NOTAS DE VENTA (1/8 OFICIO - 50H - ÚNICO)', categoria: 'SRI', precio: 7.00, esSRI: true, descripcion: 'RIMPE formato mini.', imagenUrl: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?q=80&w=400' },
        { nombre: 'NOTAS DE CRÉDITO (1/4 OFICIO - 50H)', categoria: 'SRI', precio: 15.00, esSRI: true, descripcion: 'Documento legal para devoluciones.', imagenUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=400' },
        { nombre: 'RETENCIONES (1/4 OFICIO - 50H)', categoria: 'SRI', precio: 15.00, esSRI: true, descripcion: 'Comprobantes de retención.', imagenUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=400' },
        { nombre: 'GUÍAS DE REMISIÓN (1/2 OFICIO - 50H)', categoria: 'SRI', precio: 20.00, esSRI: true, descripcion: 'Transporte legal.', imagenUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf391f3?q=80&w=400' },
        { nombre: 'LIQUIDACIÓN DE COMPRAS (1/4 OFICIO)', categoria: 'SRI', precio: 15.00, esSRI: true, descripcion: 'Para servicios no obligados.', imagenUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=400' },

        // --- PUBLICIDAD Y OFFSET ---
        { nombre: 'VOLANTES A5 FULL COLOR (1000 UND)', categoria: 'Publicidad', precio: 35.00, descripcion: 'Couché 115g, ideal para promociones.', imagenUrl: 'https://images.unsplash.com/photo-1586717791821-3f44a5638d0f?q=80&w=400' },
        { nombre: 'VOLANTES A6 FULL COLOR (1000 UND)', categoria: 'Publicidad', precio: 25.00, descripcion: 'Tamaño bolsillo.', imagenUrl: 'https://images.unsplash.com/photo-1586717791821-3f44a5638d0f?q=80&w=400' },
        { nombre: 'TRÍPTICOS A4 COUCHÉ (500 UND)', categoria: 'Publicidad', precio: 120.00, descripcion: 'Folletos plegados, 150g.', imagenUrl: 'https://images.unsplash.com/photo-1521193089946-7aa29d1fe334?q=80&w=400' },
        { nombre: 'AFICHES A3 FULL COLOR (100 UND)', categoria: 'Publicidad', precio: 65.00, descripcion: 'Impresión láser HD.', imagenUrl: 'https://images.unsplash.com/photo-152664730-d307ca884978?q=80&w=400' },
        { nombre: 'AFICHES A2 (PROMO EVENTOS)', categoria: 'Publicidad', precio: 85.00, descripcion: 'Cartelería de gran impacto.', imagenUrl: 'https://images.unsplash.com/photo-152664730-d307ca884978?q=80&w=400' },
        { nombre: 'DÍPTICOS A5 (500 UND)', categoria: 'Publicidad', precio: 95.00, descripcion: 'Folletos plegados al centro.', imagenUrl: 'https://images.unsplash.com/photo-1521193089946-7aa29d1fe334?q=80&w=400' },
        { nombre: 'VOLANTES 1/3 OFICIO (1000 UND)', categoria: 'Publicidad', precio: 30.00, descripcion: 'Elegante y alargado.', imagenUrl: 'https://images.unsplash.com/photo-1586717791821-3f44a5638d0f?q=80&w=400' },

        // --- PAPELERÍA CORPORATIVA ---
        { nombre: 'TARJETAS DE PRESENTACIÓN (1000 UND)', categoria: 'Papelería', precio: 38.00, descripcion: 'Couché 300g, laminado mate + UV.', imagenUrl: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?q=80&w=400' },
        { nombre: 'TARJETAS DE PRESENTACIÓN (100 UND) EXPRESS', categoria: 'Papelería', precio: 12.00, descripcion: 'Entrega en 1 hora.', imagenUrl: 'https://images.unsplash.com/photo-1579389083078-4e7018379f7e?q=80&w=400' },
        { nombre: 'HOJAS MEMBRETADAS A4 (500 UND)', categoria: 'Papelería', precio: 45.00, descripcion: 'Papel bond 90g con logo láser.', imagenUrl: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?q=80&w=400' },
        { nombre: 'SOBRES MANILA IMPRESOS (100 UND)', categoria: 'Papelería', precio: 40.00, descripcion: 'Personalizados para envíos.', imagenUrl: 'https://images.unsplash.com/photo-1573030225143-6d0815915d2a?q=80&w=400' },
        { nombre: 'RECETARIOS MÉDICOS (1/2 OFICIO)', categoria: 'Papelería', precio: 12.00, descripcion: 'Papel bond alta blancura.', imagenUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?q=80&w=400' },
        { nombre: 'CARPETAS CORPORATIVAS (100 UND)', categoria: 'Papelería', precio: 150.00, descripcion: 'Con bolsillo interno.', imagenUrl: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?q=80&w=400' },
        { nombre: 'CARPETAS CON SOLAPA (500 UND)', categoria: 'Papelería', precio: 380.00, descripcion: 'Alta gama para empresas.', imagenUrl: 'https://images.unsplash.com/photo-1533227268428-f9ed0900fb3b?q=80&w=400' },
        { nombre: 'RECIBOS DE CAJA (BLOCK 100H)', categoria: 'Papelería', precio: 6.00, descripcion: 'Control interno.', imagenUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=400' },

        // --- GRAN FORMATO ---
        { nombre: 'GIGANTOGRAFÍA LONA (1 MT2)', categoria: 'Gran Formato', precio: 12.00, descripcion: 'HD, incluye ojalillos.', imagenUrl: 'https://images.unsplash.com/photo-1520697517317-6767553cc51a?q=80&w=400' },
        { nombre: 'VINILO ADHESIVO (1 MT2)', categoria: 'Gran Formato', precio: 15.00, descripcion: 'Para vidrios o paredes.', imagenUrl: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?q=80&w=400' },
        { nombre: 'MICROPERFORADO (1 MT2)', categoria: 'Gran Formato', precio: 18.00, descripcion: 'Para publicidad en vehículos.', imagenUrl: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?q=80&w=400' },
        { nombre: 'ROLL UP (80x200 CM)', categoria: 'Gran Formato', precio: 55.00, descripcion: 'Estructura + Impresión.', imagenUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=400' },
        { nombre: 'LONA MESH (1 MT2)', categoria: 'Gran Formato', precio: 20.00, descripcion: 'Resistente al viento.', imagenUrl: 'https://images.unsplash.com/photo-1520697517317-6767553cc51a?q=80&w=400' },
        { nombre: 'BACKLIGHT PARA CAJAS LUZ', categoria: 'Gran Formato', precio: 25.00, descripcion: 'Imprenta traslúcida.', imagenUrl: 'https://images.unsplash.com/photo-1520697517317-6767553cc51a?q=80&w=400' },

        // --- MERCHANDISING / SUBLIMACIÓN ---
        { nombre: 'TAZA BLANCA PERSONALIZADA', categoria: 'Sublimación', precio: 7.50, descripcion: 'Cerámica AAA.', imagenUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fbed20?q=80&w=400' },
        { nombre: 'TAZA MÁGICA PERSONALIZADA', categoria: 'Sublimación', precio: 12.00, descripcion: 'Revela con calor.', imagenUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fbed20?q=80&w=400' },
        { nombre: 'GORRA CAMIONERA', categoria: 'Sublimación', precio: 10.00, descripcion: 'Varios colores.', imagenUrl: 'https://images.unsplash.com/photo-1588850561447-417f3318f400?q=80&w=400' },
        { nombre: 'CAMISETA POLI-ALGODÓN', categoria: 'Sublimación', precio: 15.00, descripcion: 'Alta durabilidad.', imagenUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400' },
        { nombre: 'JARRO CERVECERO CERÁMICO', categoria: 'Sublimación', precio: 18.00, descripcion: 'Regalo ideal.', imagenUrl: 'https://images.unsplash.com/photo-1584225064785-c62a8b43d148?q=80&w=400' },
        { nombre: 'BOTOTO ALUMINIO 600ML', categoria: 'Sublimación', precio: 12.00, descripcion: 'Deportistas.', imagenUrl: 'https://images.unsplash.com/photo-1602143399827-bd9596afc3c7?q=80&w=400' },
        { nombre: 'LLAVEROS METÁLICOS GRABADOS', categoria: 'Merchandising', precio: 4.50, descripcion: 'Grabado láser.', imagenUrl: 'https://images.unsplash.com/photo-1582142839970-2b9972b2049b?q=80&w=400' },
        { nombre: 'ALMOHADA 40x40 SUBLIMADA', categoria: 'Sublimación', precio: 15.00, descripcion: 'Decorativo.', imagenUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e6?q=80&w=400' },

        // --- EDITORIAL Y SOCIAL ---
        { nombre: 'REVISTAS A4 (UNIDAD)', categoria: 'Editorial', precio: 4.50, descripcion: 'Acabado premium.', imagenUrl: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?q=80&w=400' },
        { nombre: 'LIBROS PASTA BLANDA (HOT MELT)', categoria: 'Editorial', precio: 15.00, descripcion: 'Encuadernación profesional.', imagenUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400' },
        { nombre: 'AGENDAS PASTA DURA personalizada', categoria: 'Editorial', precio: 25.00, descripcion: 'Doble ring.', imagenUrl: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=400' },
        { nombre: 'INVITACIONES DE BODA LUX', categoria: 'Social', precio: 3.50, descripcion: 'Láser cut.', imagenUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=400' },
        { nombre: 'TARJETAS DE INVITACIÓN (100 UND)', categoria: 'Social', precio: 1.50, descripcion: 'Cartulina especial.', imagenUrl: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=400' },
        { nombre: 'MENÚS RESTAURANTE LAMINADOS', categoria: 'Publicidad', precio: 15.00, descripcion: 'Limpiables.', imagenUrl: 'https://images.unsplash.com/photo-1546241072-48010ad28c2c?q=80&w=400' },

        // --- SEÑALÉTICA Y OFICINA ---
        { nombre: 'SELLOS AUTOMÁTICOS TRODAT', categoria: 'Oficina', precio: 22.00, descripcion: 'Varios tamaños.', imagenUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=400' },
        { nombre: 'PLACAS DE RECONOCIMIENTO', categoria: 'Oficina', precio: 45.00, descripcion: 'Madera/Metal.', imagenUrl: 'https://images.unsplash.com/photo-1496293455970-f8581aae0e3c?q=80&w=400' },
        { nombre: 'STICKERS TROQUELADOS (MT2)', categoria: 'Publicidad', precio: 35.00, descripcion: 'Corte exacto.', imagenUrl: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?q=80&w=400' },
        { nombre: 'ETIQUETAS ADHESIVAS (1000 UND)', categoria: 'Publicidad', precio: 45.00, descripcion: 'Para frascos.', imagenUrl: 'https://images.unsplash.com/photo-1544982503-9f984c14501a?q=80&w=400' },

        // --- PAPELERÍA EXTRA ---
        { nombre: 'HOJAS CLÍNICAS (BLOCK 100H)', categoria: 'Papelería', precio: 6.00, descripcion: 'Registro médico formato A4.' },
        { nombre: 'RECETARIOS A5 ENCOLADOS (100H)', categoria: 'Papelería', precio: 8.00, descripcion: 'Papel bond 75g a 1 color.' },
        { nombre: 'CARNETS DE PVC BÁSICO', categoria: 'Papelería', precio: 3.50, descripcion: 'Impresión térmica PVC.' },
        { nombre: 'SELLO SECO POCKET', categoria: 'Oficina', precio: 85.00, descripcion: 'Sello en relieve metálico.' },
        { nombre: 'CAUCHO PARA SELLO INTERCAMBIO', categoria: 'Oficina', precio: 8.00, descripcion: 'Lámina polímero grabado.' },
        
        // --- PACKAGING Y ENVASES ---
        { nombre: 'CAJAS PARA PIZZA 40x40', categoria: 'Packaging', precio: 65.00, descripcion: 'Cartón microcorrugado (100 und).' },
        { nombre: 'BOLSAS DE PAPEL KRAFT (100 UND)', categoria: 'Packaging', precio: 45.00, descripcion: 'Con agarradera de cordón.' },
        { nombre: 'FUNDAS BOUTIQUE (500 UND)', categoria: 'Packaging', precio: 130.00, descripcion: 'Grosor 200g, plastificado mate.' },
        { nombre: 'BOLSAS ECOLÓGICAS CAMBRELA', categoria: 'Packaging', precio: 2.50, descripcion: 'Impresión en serigrafía.' },
        { nombre: 'PAPELES DE ENVOLTURA ANTIGRASA', categoria: 'Packaging', precio: 90.00, descripcion: 'Papel seda o antigrasa 1000 und.' },
        
        // --- CALENDARIOS / AGENDAS ---
        { nombre: 'CALENDARIOS DE PARED (100 UND)', categoria: 'Publicidad', precio: 250.00, descripcion: 'Formato A3, varilla metálica.' },
        { nombre: 'CALENDARIOS DE ESCRITORIO (50 UND)', categoria: 'Publicidad', precio: 120.00, descripcion: 'Base trípode, anillado.' },
        { nombre: 'ALMANAQUES DE BOLSILLO (1000 UND)', categoria: 'Publicidad', precio: 30.00, descripcion: 'Plastificados doble cara.' },
        
        // --- EVENTOS Y SOCIAL ---
        { nombre: 'BRAZALETES TYVEK EVENTOS (100 UND)', categoria: 'Social', precio: 15.00, descripcion: 'Codificados, anti-rotura.' },
        { nombre: 'ENTRADAS CON DESGLOSE (BLOCK 100)', categoria: 'Social', precio: 8.00, descripcion: 'Numeradas, troqueladas.' },
        { nombre: 'CREDENCIALES DE EVENTOS XXL', categoria: 'Papelería', precio: 4.50, descripcion: 'Incluye lanyard sublimado.' },
        { nombre: 'CINTAS LANYARD SUBLIMADAS (100 UND)', categoria: 'Merchandising', precio: 120.00, descripcion: 'Impresión doble faz.' },
        { nombre: 'TARJETAS DE AGRADECIMIENTO (500 UND)', categoria: 'Social', precio: 25.00, descripcion: 'Insertos para envíos.' },
        { nombre: 'ESCARAPELAS / ROSETAS', categoria: 'Social', precio: 6.00, descripcion: 'Cinta armada para premios.' },
        { nombre: 'BANDERAS NACIONALES', categoria: 'Social', precio: 45.00, descripcion: 'Tela impresa para izar o protocolo.' },
        { nombre: 'LISTONES PARA VELORIO', categoria: 'Social', precio: 25.00, descripcion: 'Cinta impresa brillante doradas.' },
        
        // --- OTROS MERCHANDISING PROMOCIONALES ---
        { nombre: 'BOTONES PUBLICITARIOS 55mm (100 UND)', categoria: 'Merchandising', precio: 40.00, descripcion: 'Botón metálico imperdible.' },
        { nombre: 'ESFEROS METÁLICOS GRABADOS', categoria: 'Merchandising', precio: 6.50, descripcion: 'Grabado láser y estuche.' },
        { nombre: 'LAPIZ PROMOCIONAL (100 UND)', categoria: 'Merchandising', precio: 45.00, descripcion: 'Madera con logo estampado.' },
        { nombre: 'STICKERS RESINADOS (TIPO GOTA)', categoria: 'Merchandising', precio: 2.50, descripcion: 'Sticker con resina epoxi 3D.' },
        { nombre: 'PADS DE RATÓN (MOUSEPADS)', categoria: 'Sublimación', precio: 6.00, descripcion: 'Base de neopreno 3mm.' },
        { nombre: 'PARCHES BORDADOS THERMOBORDADO', categoria: 'Merchandising', precio: 4.50, descripcion: 'Thermoadheribles o velcro.' },
        { nombre: 'LLAVEROS DE ACRÍLICO CORTADO', categoria: 'Merchandising', precio: 3.50, descripcion: 'Acrílico 3mm con argolla.' },
        { nombre: 'MUGS TÉRMICOS', categoria: 'Sublimación', precio: 22.00, descripcion: 'Termo para café doble pared.' },
        { nombre: 'MANDILES ESTAMPADOS', categoria: 'Sublimación', precio: 18.00, descripcion: 'Gabardina sintética, Vinil Textil.' },
        
        // --- GRAN FORMATO Y PUBLICIDAD EXTERIOR ---
        { nombre: 'BANDERINES PUBLICITARIOS (MT)', categoria: 'Gran Formato', precio: 15.00, descripcion: 'Lona exterior.' },
        { nombre: 'FLY BANNERS / BANDERINES GOTA', categoria: 'Gran Formato', precio: 85.00, descripcion: 'Mástil de aluminio y base.' },
        { nombre: 'LETRAS CORPÓREAS METÁLICAS', categoria: 'Gran Formato', precio: 150.00, descripcion: 'Acero galvanizado o acrílico.' },
        { nombre: 'LETRERO LUMINOSO BÁSICO', categoria: 'Gran Formato', precio: 200.00, descripcion: 'Caja metálica + Tubo LED.' },
        { nombre: 'CORTE LÁSER MDF (MINUTOS)', categoria: 'Gran Formato', precio: 0.50, descripcion: 'Corte de MDF y Acrílico.' },
        { nombre: 'SEÑALÉTICA DE SEGURIDAD (A4)', categoria: 'Papelería', precio: 8.00, descripcion: 'Sintra 3mm de espesor.' },
        { nombre: 'PLACAS DE INVENTARIO (100 UND)', categoria: 'Papelería', precio: 120.00, descripcion: 'Aluminio grabados láser.' },
        
        // --- COPIADO Y ENCUADERNACIÓN ---
        { nombre: 'IMPRESIONES A3 PÁGINA', categoria: 'Oficina', precio: 0.80, descripcion: 'Impresión rápida láser.' },
        { nombre: 'FOTOCOPIAS B/N AL POR MAYOR', categoria: 'Oficina', precio: 0.05, descripcion: 'A4 estándar (Más de 100).' },
        { nombre: 'ENCUADERNACIÓN ESPIRAL', categoria: 'Oficina', precio: 2.50, descripcion: 'Espiral plástico.' },
        { nombre: 'ENCUADERNACIÓN ANILLO METÁLICO', categoria: 'Oficina', precio: 4.50, descripcion: 'Doble ring ejecutivo.' },
        { nombre: 'MICA PROTECTORA LAMINADA A4', categoria: 'Oficina', precio: 1.50, descripcion: 'Enmicado térmico.' }
    ];

    const finalCatalog = catalog.map((p, idx) => ({ 
        id: `p-auto-${idx}`, 
        isPopular: idx < 8,
        specs: ['Nivel Premium', 'Atención Galaxia', 'Entrega Rápida'],
        ...p 
    })) as Producto[];
    
    localStorage.setItem(DB_MAP.productos, JSON.stringify(finalCatalog));
    return finalCatalog;
};

export const getClientes = async (): Promise<Cliente[]> => JSON.parse(localStorage.getItem(DB_MAP.clientes) || '[]');
export const createCliente = async (clienteData: any): Promise<Cliente> => {
    const clientes = JSON.parse(localStorage.getItem(DB_MAP.clientes) || '[]');
    const newCliente = { id: `c${Date.now()}`, creadoEn: new Date().toISOString(), ...clienteData };
    clientes.unshift(newCliente);
    localStorage.setItem(DB_MAP.clientes, JSON.stringify(clientes));
    forcePushAllToCloud();
    return newCliente;
};
export const updateCliente = async (id: string, data: any) => {
    const clientes = JSON.parse(localStorage.getItem(DB_MAP.clientes) || '[]');
    const idx = clientes.findIndex((c: any) => c.id === id);
    if (idx > -1) { clientes[idx] = { ...clientes[idx], ...data }; localStorage.setItem(DB_MAP.clientes, JSON.stringify(clientes)); forcePushAllToCloud(); }
};
export const getTrabajos = async (): Promise<Trabajo[]> => JSON.parse(localStorage.getItem(DB_MAP.trabajos) || '[]');
export const updateTrabajoStatus = async (trabajoId: string, newStatus: TrabajoEstado, usuario: string): Promise<Trabajo> => {
    const trabajos = JSON.parse(localStorage.getItem(DB_MAP.trabajos) || '[]');
    const idx = trabajos.findIndex((t: any) => t.id === trabajoId);
    if (idx > -1) {
        trabajos[idx].estado = newStatus;
        trabajos[idx].actualizadoPor = usuario;
        trabajos[idx].historial = [...(trabajos[idx].historial || []), { estado: newStatus, fecha: new Date().toISOString(), usuario }];
        localStorage.setItem(DB_MAP.trabajos, JSON.stringify(trabajos));
        forcePushAllToCloud();
        return trabajos[idx];
    }
    throw new Error("No encontrado");
};

export const registerRetiro = async (trabajoId: string, pagoFinal: number, usuario: string): Promise<Trabajo> => {
    const trabajos = JSON.parse(localStorage.getItem(DB_MAP.trabajos) || '[]');
    const idx = trabajos.findIndex((t: any) => t.id === trabajoId);
    if (idx > -1) {
        trabajos[idx].estado = TrabajoEstado.ENTREGADO;
        trabajos[idx].abono += pagoFinal;
        trabajos[idx].saldo = Math.max(0, trabajos[idx].total - trabajos[idx].abono);
        trabajos[idx].actualizadoPor = usuario;
        trabajos[idx].fechaEntrega = new Date().toISOString();
        trabajos[idx].historial = [...(trabajos[idx].historial || []), { estado: TrabajoEstado.ENTREGADO, fecha: new Date().toISOString(), usuario }];
        localStorage.setItem(DB_MAP.trabajos, JSON.stringify(trabajos));
        forcePushAllToCloud();
        return trabajos[idx];
    }
    throw new Error("Trabajo no encontrado");
};

export const getUsers = async (): Promise<User[]> => {
    const users = JSON.parse(localStorage.getItem(DB_MAP.users) || '[]');
    
    // Sembrar usuarios por defecto si no existen
    if (users.length === 0) {
        const defaultUsers: User[] = [
            { id: 'u1', nombre: 'Pedro', email: 'gerencia@imprentacordova.com', rol: 'Admin', estado: 'Activo', ultimoAcceso: new Date().toISOString(), requirePassword: false },
            { id: 'u2', nombre: 'Roberto', email: 'diseno@imprentacordova.com', rol: 'Diseñador', estado: 'Activo', ultimoAcceso: new Date().toISOString(), requirePassword: false },
            { id: 'u3', nombre: 'Aleida', email: 'ventas@imprentacordova.com', rol: 'Operador', estado: 'Activo', ultimoAcceso: new Date().toISOString(), requirePassword: false }
        ];
        localStorage.setItem(DB_MAP.users, JSON.stringify(defaultUsers));
        return defaultUsers;
    }
    
    return users;
};

export const getInventario = async (): Promise<InventoryItem[]> => JSON.parse(localStorage.getItem(DB_MAP.inventario) || '[]');
export const getProveedores = async (): Promise<Proveedor[]> => JSON.parse(localStorage.getItem(DB_MAP.proveedores) || '[]');
export const getTareasProveedor = async (): Promise<TareaProveedor[]> => JSON.parse(localStorage.getItem(DB_MAP.tareas) || '[]');
export const getSriCredentials = async (): Promise<SriCredential[]> => JSON.parse(localStorage.getItem(DB_MAP.sri) || '[]');

export const addSriCredential = async (cred: SriCredential) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.sri) || '[]');
    const idx = data.findIndex((c: any) => c.ruc === cred.ruc);
    if (idx > -1) data[idx] = { ...data[idx], ...cred, updatedAt: new Date().toISOString() };
    else data.push({ ...cred, updatedAt: new Date().toISOString() });
    localStorage.setItem(DB_MAP.sri, JSON.stringify(data));
    forcePushAllToCloud();
    return data;
};

export const updateTrabajoPhoto = async (trabajoId: string, photoUrl: string): Promise<void> => {
    const trabajos = JSON.parse(localStorage.getItem(DB_MAP.trabajos) || '[]');
    const idx = trabajos.findIndex((t: any) => t.id === trabajoId);
    if (idx > -1) { trabajos[idx].fotoOriginalUrl = photoUrl; localStorage.setItem(DB_MAP.trabajos, JSON.stringify(trabajos)); forcePushAllToCloud(); }
};

/**
 * CREAR PEDIDO PÚBLICO (WEB)
 * Gestiona automáticamente el cliente y crea la orden.
 */
export const createPublicPedido = async (clientData: { nombre: string, telefono: string }, cartItems: any[]): Promise<Trabajo> => {
    const clientes = await getClientes();
    
    // 1. Buscar o Crear Cliente
    let cliente = clientes.find(c => c.telefono.includes(clientData.telefono) || c.nombre.toLowerCase() === clientData.nombre.toLowerCase());
    
    if (!cliente) {
        cliente = await createCliente({
            nombre: clientData.nombre.toUpperCase(),
            telefono: [clientData.telefono],
            cedula: '9999999999', // Consumidor Final temporal
            direccion: 'Pedido Web',
            regimen: Regimen.GENERAL
        });
    }

    // 2. Calcular Totales
    const total = cartItems.reduce((acc, item) => acc + (item.producto.precio * item.cantidad), 0);
    const subtipo = cartItems.map(item => `${item.cantidad}x ${item.producto.nombre}`).join(', ');

    // 3. Crear Trabajo
    return createTrabajo({ 
        clienteId: cliente.id,
        titular: cliente.nombre, 
        tipo: TrabajoTipo.GENERAL, 
        subtipo, 
        cantidad: cartItems.length, 
        total, 
        abono: 0, 
        estado: TrabajoEstado.PENDIENTE, 
        origen: 'Web',
        prioridad: 'Normal'
    }, 'Web/Cliente');
};

export const forcePushAllToCloud = async () => {
    const config = getConfig();
    if (!config.googleScriptUrl || !config.googleScriptUrl.includes('macros')) return;
    try {
        window.dispatchEvent(new CustomEvent('cloud-sync-active'));
        const dataToExport = {
            trabajos: JSON.parse(localStorage.getItem(DB_MAP.trabajos) || '[]'),
            clientes: JSON.parse(localStorage.getItem(DB_MAP.clientes) || '[]'),
            productos: JSON.parse(localStorage.getItem(DB_MAP.productos) || '[]'),
            users: JSON.parse(localStorage.getItem(DB_MAP.users) || '[]'),
            inventario: JSON.parse(localStorage.getItem(DB_MAP.inventario) || '[]'),
            proveedores: JSON.parse(localStorage.getItem(DB_MAP.proveedores) || '[]'),
            tareas: JSON.parse(localStorage.getItem(DB_MAP.tareas) || '[]')
        };
        await fetch(config.googleScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'FULL_BACKUP', payload: dataToExport, timestamp: new Date().toISOString() })
        });
        setTimeout(() => window.dispatchEvent(new CustomEvent('cloud-sync-idle')), 800);
    } catch (e) { window.dispatchEvent(new CustomEvent('cloud-sync-idle')); }
};
export const hydrateFromCloud = async (): Promise<boolean> => {
    const config = getConfig();
    if (!config.googleScriptUrl || !config.googleScriptUrl.includes('macros')) return false;
    try {
        window.dispatchEvent(new CustomEvent('cloud-sync-active'));
        const response = await fetch(`${config.googleScriptUrl}?action=GET_ALL_DATA&ts=${Date.now()}`, { method: 'GET', redirect: 'follow' });
        const data = await response.json();
        if (data && data.success) {
            if (data.trabajos) localStorage.setItem(DB_MAP.trabajos, JSON.stringify(data.trabajos));
            if (data.clientes) localStorage.setItem(DB_MAP.clientes, JSON.stringify(data.clientes));
            if (data.productos) localStorage.setItem(DB_MAP.productos, JSON.stringify(data.productos));
            if (data.users) localStorage.setItem(DB_MAP.users, JSON.stringify(data.users));
            if (data.inventario) localStorage.setItem(DB_MAP.inventario, JSON.stringify(data.inventario));
            if (data.proveedores) localStorage.setItem(DB_MAP.proveedores, JSON.stringify(data.proveedores));
            if (data.tareas) localStorage.setItem(DB_MAP.tareas, JSON.stringify(data.tareas));
            window.dispatchEvent(new CustomEvent('cloud-sync-idle'));
            return true;
        }
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('cloud-sync-idle'));
    return false;
};
export const getMasterActividades = async (): Promise<string[]> => ["VENTA DE COMIDAS", "SERVICIOS PROFESIONALES", "TRANSPORTE", "EDUCACION", "SALUD"];
export const setInventario = async (items: InventoryItem[]) => { localStorage.setItem(DB_MAP.inventario, JSON.stringify(items)); forcePushAllToCloud(); };
export const deleteSriCredential = async (ruc: string) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.sri) || '[]');
    localStorage.setItem(DB_MAP.sri, JSON.stringify(data.filter((c: any) => c.ruc !== ruc)));
    forcePushAllToCloud();
};
export const bulkAddSriCredentials = async (creds: SriCredential[]) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.sri) || '[]');
    const updated = [...data];
    creds.forEach(newCred => {
        const idx = updated.findIndex((c: any) => c.ruc === newCred.ruc);
        if (idx > -1) updated[idx] = { ...updated[idx], ...newCred };
        else updated.push(newCred);
    });
    localStorage.setItem(DB_MAP.sri, JSON.stringify(updated));
    forcePushAllToCloud();
    return updated;
};
export const bulkCreateProductos = async (newProducts: Producto[]) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.productos) || '[]');
    const withIds = newProducts.map(p => ({ ...p, id: `p${Date.now()}-${Math.random().toString(36).substring(2, 7)}` }));
    localStorage.setItem(DB_MAP.productos, JSON.stringify([...data, ...withIds]));
    forcePushAllToCloud();
};
export const updateProducto = async (id: string, p: Partial<Producto>) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.productos) || '[]');
    const idx = data.findIndex((i: any) => i.id === id);
    if (idx > -1) { data[idx] = { ...data[idx], ...p }; localStorage.setItem(DB_MAP.productos, JSON.stringify(data)); forcePushAllToCloud(); }
};
export const deleteProducto = async (id: string) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.productos) || '[]');
    localStorage.setItem(DB_MAP.productos, JSON.stringify(data.filter((i: any) => i.id !== id)));
    forcePushAllToCloud();
};
export const updateClienteState = async (id: string, data: any) => {
    const clientes = JSON.parse(localStorage.getItem(DB_MAP.clientes) || '[]');
    const idx = clientes.findIndex((c: any) => c.id === id);
    if (idx > -1) { clientes[idx] = { ...clientes[idx], ...data }; localStorage.setItem(DB_MAP.clientes, JSON.stringify(clientes)); forcePushAllToCloud(); }
};
export const updateTareaProveedor = async (id: string, t: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.tareas) || '[]');
    const idx = data.findIndex((i: any) => i.id === id);
    if (idx > -1) { data[idx] = { ...data[idx], ...t }; localStorage.setItem(DB_MAP.tareas, JSON.stringify(data)); forcePushAllToCloud(); }
};
export const createProveedor = async (p: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.proveedores) || '[]');
    const newP = { id: `prov${Date.now()}`, creadoEn: new Date().toISOString(), ...p };
    data.unshift(newP);
    localStorage.setItem(DB_MAP.proveedores, JSON.stringify(data));
    forcePushAllToCloud();
    return newP;
};
export const updateProveedor = async (id: string, p: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.proveedores) || '[]');
    const idx = data.findIndex((i: any) => i.id === id);
    if (idx > -1) { data[idx] = { ...data[idx], ...p }; localStorage.setItem(DB_MAP.proveedores, JSON.stringify(data)); forcePushAllToCloud(); }
};
export const deleteProveedor = async (id: string) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.proveedores) || '[]');
    localStorage.setItem(DB_MAP.proveedores, JSON.stringify(data.filter((i: any) => i.id !== id)));
    forcePushAllToCloud();
};
export const createTareaProveedor = async (t: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.tareas) || '[]');
    const newT = { id: `task${Date.now()}`, completada: false, ...t };
    data.push(newT);
    localStorage.setItem(DB_MAP.tareas, JSON.stringify(data));
    forcePushAllToCloud();
    return newT;
};
export const createInventarioItem = async (item: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.inventario) || '[]');
    const newItem = { id: `inv${Date.now()}`, ...item };
    data.push(newItem);
    localStorage.setItem(DB_MAP.inventario, JSON.stringify(data));
    forcePushAllToCloud();
    return newItem;
};
export const updateInventarioItem = async (id: string, item: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.inventario) || '[]');
    const idx = data.findIndex((i: any) => i.id === id);
    if (idx > -1) { data[idx] = { ...data[idx], ...item }; localStorage.setItem(DB_MAP.inventario, JSON.stringify(data)); forcePushAllToCloud(); }
};
export const deleteInventarioItem = async (id: string) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.inventario) || '[]');
    localStorage.setItem(DB_MAP.inventario, JSON.stringify(data.filter((i: any) => i.id !== id)));
    forcePushAllToCloud();
};
export const createUser = async (u: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.users) || '[]');
    const newUser = { id: `u${Date.now()}`, estado: 'Activo', ultimoAcceso: new Date().toISOString(), ...u };
    data.push(newUser);
    localStorage.setItem(DB_MAP.users, JSON.stringify(data));
    forcePushAllToCloud();
    return newUser;
};
export const updateUser = async (id: string, u: any) => {
    const data = JSON.parse(localStorage.getItem(DB_MAP.users) || '[]');
    const idx = data.findIndex((i: any) => i.id === id);
    if (idx > -1) { data[idx] = { ...data[idx], ...u }; localStorage.setItem(DB_MAP.users, JSON.stringify(data)); forcePushAllToCloud(); }
};
export const testCloudConnection = async (customUrl?: string): Promise<{success: boolean, message: string}> => {
    const config = getConfig();
    const url = customUrl || config.googleScriptUrl;
    if (!url || !url.includes('macros')) return { success: false, message: "URL inválida." };
    try {
        const response = await fetch(`${url}?action=TEST&ts=${Date.now()}`, { method: 'GET', redirect: 'follow' });
        const data = await response.json();
        return data.success ? { success: true, message: "✅ ¡CONEXIÓN PERFECTA!" } : { success: false, message: "Error en el script." };
    } catch (e) { return { success: false, message: "Fallo de red o URL incorrecta." }; }
};
