
import * as pdfjsLib from 'pdfjs-dist';
import { Regimen } from '../types';

// Configurar el worker de PDF.js (usando CDN para evitar problemas de build complejos en este entorno)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedSriData {
    ruc: string;
    razonSocial: string;
    nombreComercial?: string;
    direccion: string;
    email?: string;
    telefono?: string;
    actividades: string[];
    regimen: Regimen;
    agenteRetencion: boolean;
    obligadoContabilidad: boolean;
}

/**
 * Función principal que orquesta la lectura y el parseo
 */
export const parseSriPdf = async (file: File): Promise<ParsedSriData> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Leer todas las páginas (usualmente el RUC son 1-2 páginas)
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // Unimos los items de texto con un espacio, pero preservando cierto orden visual
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
    }

    // Limpieza básica de espacios múltiples
    fullText = fullText.replace(/\s+/g, ' ').trim();

    return extractDataFromText(fullText);
};

/**
 * El "Motor Lógico" determinista basado en RegEx para el formato específico del SRI (2024-2025)
 */
const extractDataFromText = (text: string): ParsedSriData => {
    console.log("PDF Text Dump:", text); // Para depuración

    // 1. RUC (13 dígitos que terminan en 001)
    const rucMatch = text.match(/(\d{13})/); // Busca la primera secuencia de 13 dígitos
    // A veces el número RUC está cerca de la etiqueta "Número RUC"
    const rucSpecificMatch = text.match(/Número RUC\s*(\d{13})/i);
    const ruc = rucSpecificMatch ? rucSpecificMatch[1] : (rucMatch ? rucMatch[1] : '');

    // 2. Razón Social / Nombres
    // Estrategia: Buscar texto entre "Apellidos y nombres" y "Número RUC" o "Estado"
    // El formato suele ser: "Apellidos y nombres [NOMBRE COMPLETO] Número RUC"
    let razonSocial = '';
    const nameRegex = /(?:Apellidos y nombres|Razón Social)(.*?)(?:Número RUC|Estado|Nombre Comercial)/i;
    const nameMatch = text.match(nameRegex);
    if (nameMatch && nameMatch[1]) {
        razonSocial = nameMatch[1].trim();
    }

    // 3. Nombre Comercial (Opcional)
    let nombreComercial = '';
    const tradeNameRegex = /Nombre Comercial(.*?)(?:Estado|Fecha)/i;
    const tradeNameMatch = text.match(tradeNameRegex);
    if (tradeNameMatch && tradeNameMatch[1]) {
        const potentialName = tradeNameMatch[1].trim();
        if (potentialName !== 'No registra' && potentialName !== 'OTRO') {
            nombreComercial = potentialName;
        }
    }

    // 4. Régimen
    let regimen = Regimen.GENERAL;
    if (text.toUpperCase().includes('NEGOCIO POPULAR') || text.toUpperCase().includes('RIMPE POPULAR')) {
        regimen = Regimen.NEGOCIO_POPULAR;
    } else if (text.toUpperCase().includes('RIMPE EMPRENDEDOR')) {
        regimen = Regimen.EMPRENDEDOR;
    }

    // 5. Contactos (Email y Celular)
    let email = '';
    let telefono = '';
    
    // Buscar Email
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    if (emailMatch) email = emailMatch[1];

    // Buscar Celular (Prioriza 09...)
    const phoneMatch = text.match(/(09\d{8})/);
    if (phoneMatch) telefono = phoneMatch[1];

    // 6. Dirección
    // Busca entre "Dirección" y "Medios de contacto" o "Domicilio tributario"
    let direccion = 'Pasaje, El Oro'; // Default
    // Intentar capturar Calle y Referencia
    const calleMatch = text.match(/Calle:\s*(.*?)\s*(?:Numero|Interseccion|Referencia|Carretero)/i);
    const refMatch = text.match(/Referencia:\s*(.*?)\s*(?:Medios de contacto|Domicilio|Ubicación)/i);
    
    if (calleMatch) {
        direccion = calleMatch[1].trim();
        if (refMatch) {
            direccion += `, Ref: ${refMatch[1].trim()}`;
        }
    } else {
        // Fallback: buscar bloque grande
        const dirBlockMatch = text.match(/Dirección(.*?)(?:Medios de contacto)/i);
        if (dirBlockMatch) {
            direccion = dirBlockMatch[1].replace(/Calle:|Referencia:|Numero:/gi, '').trim().substring(0, 150);
        }
    }

    // 7. Actividades Económicas
    // Busca códigos CIUU (ej: G47...)
    const actividades: string[] = [];
    const actRegex = /([A-Z]\d{8})\s?-\s?(.*?)(?=(?:[A-Z]\d{8}|Establecimientos|Obligaciones))/g;
    let match;
    while ((match = actRegex.exec(text)) !== null) {
        // Limpiamos el texto de la actividad
        const actText = match[2].trim();
        // Solo agregamos si no es una cadena vacía y parece una descripción
        if (actText.length > 5) {
            actividades.push(actText);
        }
    }

    // 8. Otros datos fiscales
    const obligadoContabilidad = text.toUpperCase().includes('OBLIGADO A LLEVAR CONTABILIDAD SI');
    const agenteRetencion = text.toUpperCase().includes('AGENTE DE RETENCIÓN SI') || text.includes('Resolución Nro. NAC-DNCRASC');

    return {
        ruc,
        razonSocial: razonSocial || nombreComercial || '', // Fallback
        nombreComercial,
        direccion: direccion.replace(/\s+/g, ' '),
        email: email.toLowerCase(),
        telefono,
        actividades,
        regimen,
        agenteRetencion,
        obligadoContabilidad
    };
};
