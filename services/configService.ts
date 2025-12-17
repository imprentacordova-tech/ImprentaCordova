
export interface NotaDeVentaConfig {
    numeracionPrefijo: string;
    autorizacionSRI: string;
    fechaAutorizacion: string;
    fechaCaducidad: string;
    imprentaNombre: string;
    imprentaRuc: string;
    imprentaAutorizacion: string;
    emisorNombreComercial: string;
    emisorRazonSocial: string;
    emisorTipoContribuyente: string;
    emisorDireccionMatriz: string;
    emisorDireccionSucursal: string;
    emisorRuc: string;
    // Campos para Recibo de Abono
    reciboCodAuto: string;
    emisorDireccionCompleta: string;
    emisorEmail: string;
    emisorTelefono: string;
    reciboServicios: string;
}

const CONFIG_KEY = 'appConfig';

const defaultConfig: NotaDeVentaConfig = {
    // --- DATOS VARIABLES (Editables en UI) ---
    numeracionPrefijo: "002-001-",
    autorizacionSRI: "1131234567",
    fechaAutorizacion: new Date().toISOString().split('T')[0], // Hoy por defecto
    fechaCaducidad: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // 1 año despues

    // --- DATOS DE LA IMPRENTA AUTORIZADA (Quien imprime los blocks) ---
    imprentaNombre: "Carlos Ángel Bolívar Mora / Imprenta Bolívar",
    imprentaRuc: "0701234567001",
    imprentaAutorizacion: "1234",

    // --- DATOS DEL EMISOR (BASE DE CODIGO - IMPRENTA CÓRDOVA) ---
    // Estos datos son estáticos por seguridad y consistencia fiscal.
    emisorNombreComercial: "Imprenta Córdova",
    emisorRazonSocial: "Perez Lara Juan Efrain",
    emisorTipoContribuyente: "Contribuyente Negocio Popular - Régimen RIMPE",
    emisorRuc: "0703862233001",
    emisorDireccionMatriz: "Colón e/ Sucre y Rocafuerte",
    emisorDireccionSucursal: "Pasaje - El Oro",
    
    // Datos de contacto para recibos
    reciboCodAuto: "8634",
    emisorDireccionCompleta: "Colón e/ Sucre y Rocafuerte • Pasaje - El Oro - Ecuador",
    emisorEmail: "imprentacordova@gmail.com",
    emisorTelefono: "099 308 3943",
    reciboServicios: "DOCUMENTOS AUTORIZADOS POR EL SRI; FACTURAS, NOTAS DE VENTA ETC. TARJETAS PARA TODO COMPROMISO SOCIAL, VOLANTES, RECIBOS, RIFAS, TABLAS DE BINGO, SELLOS, GIGANTOGRAFIAS, DIPLOMAS, CALENDARIOS, EMPASTAMOS TODO TIPO DE LIBROS, ANILLADOS. ADEMAS: DECLARACIONES TRIBUTARIAS SRI."
};

export const getConfig = (): NotaDeVentaConfig => {
    try {
        const savedConfig = localStorage.getItem(CONFIG_KEY);
        if (savedConfig) {
            const parsed = JSON.parse(savedConfig);
            // FORZAR DATOS DEL EMISOR DESDE EL CÓDIGO
            // Esto asegura que aunque haya datos viejos en localStorage, 
            // los datos fiscales base siempre se lean de este archivo.
            return { 
                ...defaultConfig, 
                ...parsed,
                emisorNombreComercial: defaultConfig.emisorNombreComercial,
                emisorRazonSocial: defaultConfig.emisorRazonSocial,
                emisorTipoContribuyente: defaultConfig.emisorTipoContribuyente,
                emisorRuc: defaultConfig.emisorRuc,
                emisorDireccionMatriz: defaultConfig.emisorDireccionMatriz,
                emisorDireccionSucursal: defaultConfig.emisorDireccionSucursal,
                emisorDireccionCompleta: defaultConfig.emisorDireccionCompleta,
                emisorTelefono: defaultConfig.emisorTelefono,
                emisorEmail: defaultConfig.emisorEmail
            };
        }
    } catch (error) {
        console.error("Error parsing config from localStorage", error);
    }
    return defaultConfig;
};

export const saveConfig = (config: NotaDeVentaConfig): void => {
    try {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
        console.error("Error saving config to localStorage", error);
    }
};
