
export interface NotaDeVentaConfig {
    // Numeración
    emisorEstablecimiento: string;
    emisorPuntoEmision: string;
    secuencialInicio: number;
    
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
    emisorActividades: string;
    // Campos para Recibo de Abono
    reciboCodAuto: string;
    emisorDireccionCompleta: string;
    emisorEmail: string;
    emisorTelefono: string;
    reciboServicios: string;
    // Cloud Storage
    googleScriptUrl: string;
}

const CONFIG_KEY = 'appConfig';

const defaultConfig: NotaDeVentaConfig = {
    emisorEstablecimiento: "001",
    emisorPuntoEmision: "001",
    secuencialInicio: 1, // Permite que Pedro decida desde qué número arranca el sistema
    
    autorizacionSRI: "1234567890",
    fechaAutorizacion: "2024-01-15",
    fechaCaducidad: "2025-01-15",
    imprentaNombre: "Carlos Ángel Bolívar Mora / Imprenta Bolívar",
    imprentaRuc: "1709876543001",
    imprentaAutorizacion: "1234",
    emisorNombreComercial: "Imprenta Córdova",
    emisorRazonSocial: "Pedro Manuel Cordova Rodiguez",
    emisorTipoContribuyente: "Contribuyente Negocio Popular - Régimen RIMPE",
    emisorDireccionMatriz: "Calle Colón Ej. Sucre y Rocafuerte - Pasaje El Oro",
    emisorDireccionSucursal: "Pasaje - El Oro - Ecuador",
    emisorRuc: "0702065319001",
    emisorActividades: "SERVICIOS GRÁFICOS Y PUBLICITARIOS",
    
    reciboCodAuto: "8634",
    emisorDireccionCompleta: "Colón Ej. Sucre y Rocafuerte • Pasaje - El Oro - Ecuador",
    emisorEmail: "imprentacordova@gmail.com",
    emisorTelefono: "0993083943",
    reciboServicios: "DOCUMENTOS AUTORIZADOS POR EL SRI; FACTURAS, NOTAS DE VENTA ETC...",
    googleScriptUrl: "https://script.google.com/macros/s/AKfycbz9BrIG8s1h5spiy3H2OQVInN4lODW6VJ50-SmGBajjIQ2jbgzBl-65-_6XF7IYRluM/exec"
};

export const getConfig = (): NotaDeVentaConfig => {
    try {
        const savedConfig = localStorage.getItem(CONFIG_KEY);
        if (savedConfig) {
            return { ...defaultConfig, ...JSON.parse(savedConfig) };
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
