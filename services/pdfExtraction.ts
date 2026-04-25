import * as pdfjsLib from 'pdfjs-dist';
import { isPast } from 'date-fns';
import { Regimen } from '../types';

export interface SriExtractionResult {
  apellidos_nombres: string;
  ruc: string;
  direccion: string;
  contacto: {
    email: string;
    celular: string;
  };
  regimen: Regimen;
  obligaciones_tributarias: string;
  lista_obligaciones: string[];
  actividad_economica: string;
  es_artesano: boolean;
  cantidad_establecimientos: number;
  isCertificate: boolean;
}

// Ajuste para el Worker. Usamos la versión de pdfjs-dist instalada (4.0.379)
const pdfjsVersion = pdfjsLib.version || '4.0.379';
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

export const extractDataFromSriPdf = async (file: File): Promise<SriExtractionResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 2);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' | ');
      fullText += pageText + ' | ';
    }

    // Limpieza profunda y normalización
    const cleanText = fullText.toUpperCase().replace(/\s+/g, ' ').replace(/\|\s*\|/g, '|');
    const textOnly = cleanText.replace(/\|/g, ' ').replace(/\s+/g, ' ');

    console.log("SRI ENGINE - TEXT ONLY PREVIEW:", textOnly.substring(0, 1000));

    // --- 1. EXTRACCIÓN DE RUC ---
    let ruc = '';
    const rucMatch = cleanText.match(/N[ÚU]MERO RUC\s*[:\|]?\s*(\d{13})/) || cleanText.match(/\b(\d{10}001)\b/);
    ruc = rucMatch ? rucMatch[1] : '';

    // --- 2. EXTRACCIÓN DE NOMBRE (LOGICA REVERSA) ---
    let nombres = '';
    const parts = cleanText.split('|').map(p => p.trim()).filter(p => p.length > 0);
    const rucIndex = parts.findIndex(p => p.includes(ruc));

    if (rucIndex > 0) {
      const nameParts = [];
      // El nombre suele estar antes del RUC. Buscamos hasta 6 posiciones atrás.
      for (let i = 1; i <= 6; i++) {
        const candidate = parts[rucIndex - i];
        if (!candidate) continue;

        const isLabel = candidate.includes("NÚMERO") ||
          candidate.includes("APELLIDOS") ||
          candidate.includes("NOMBRES") ||
          candidate.includes("CERTIFICADO") ||
          candidate.includes("REGISTRO") ||
          candidate.includes("IDENTIFICACIÓN") ||
          candidate.length < 3;

        if (!isLabel) {
          nameParts.unshift(candidate); // Agregamos al inicio para mantener el orden natural
        } else if (nameParts.length > 0) {
          // Si ya tenemos partes del nombre y encontramos una etiqueta, paramos.
          break;
        }
      }
      nombres = nameParts.join(' ');
    }

    // --- 3. DIRECCIÓN Y UBICACIÓN ---
    const provinciaM = textOnly.match(/PROVINCIA:\s*([^:]+?)(?=\s*(?:CANT[ÓO]N|PARROQUIA|DIRECCI|UBICACI|REFERENCIA|MEDIOS))/);
    const cantonM = textOnly.match(/CANT[ÓO]N:\s*([^:]+?)(?=\s*(?:PROVINCIA|PARROQUIA|DIRECCI|UBICACI|REFERENCIA|MEDIOS))/);
    const parroquiaM = textOnly.match(/PARROQUIA:\s*([^:]+?)(?=\s*(?:PROVINCIA|CANT[ÓO]N|DIRECCI|UBICACI|REFERENCIA|MEDIOS))/);
    const referenciaM = textOnly.match(/REFERENCIA:\s*([^:]+?)(?=\s*(?:DIRECCI[ÓO]N|UBICACI[ÓO]N|MEDIOS|EMAIL|CELULAR|ACTIVIDADES|ESTABLECIMIENTOS|$))/);

    const geoParts = [];
    if (provinciaM && provinciaM[1].trim()) geoParts.push(provinciaM[1].trim());
    if (cantonM && cantonM[1].trim()) geoParts.push(cantonM[1].trim());
    if (parroquiaM && parroquiaM[1].trim()) geoParts.push(parroquiaM[1].trim());

    const ubicacionGeografica = geoParts.length > 0 ? `Ubicación: ${geoParts.join(' / ')}` : '';
    const referencia = (referenciaM && referenciaM[1].trim()) ? `Ref: ${referenciaM[1].trim()}` : '';

    const direccionFinal = [ubicacionGeografica, referencia].filter(Boolean).join(' - ');

    // --- 4. CONTACTOS ---
    const emailMatch = cleanText.match(/[\w\.-]+@[\w\.-]+\.\w{2,}/g);
    const validEmail = emailMatch ? emailMatch.find(e => !e.includes("sri.gob.ec")) : '';

    const phoneMatch = textOnly.match(/(?:CELULAR|TELEFONO|TELF)[^0-9]*(\d{9,10})/);
    const validPhone = phoneMatch ? phoneMatch[1] : (textOnly.match(/\b09\d{8}\b/) ? textOnly.match(/\b09\d{8}\b/)![0] : '');

    // --- 5. RÉGIMEN & OBLIGACIONES ---
    let regimen = Regimen.GENERAL;
    
    // Búsqueda más robusta de Régimen
    const isPopular = textOnly.includes("NEGOCIO POPULAR") || 
                     (textOnly.includes("RIMPE") && textOnly.includes("POPULAR")) ||
                     textOnly.includes("CONTRIBUYENTE RÉGIMEN RIMPE-NEGOCIO POPULAR") ||
                     textOnly.includes("RÉGIMEN RIMPE - NEGOCIO POPULAR");
                     
    const isEmprendedor = textOnly.includes("EMPRENDEDOR") && 
                         (textOnly.includes("RIMPE") || textOnly.includes("RÉGIMEN"));

    if (isPopular) regimen = Regimen.NEGOCIO_POPULAR;
    else if (isEmprendedor) regimen = Regimen.EMPRENDEDOR;
    else regimen = Regimen.GENERAL;

    console.log("SRI ENGINE - REGIMEN DETECTED:", regimen, " | Based on keywords found:", { isPopular, isEmprendedor });

    const listaObligaciones: string[] = [];
    if (textOnly.includes("DECLARACION DE IVA")) listaObligaciones.push("IVA");
    if (textOnly.includes("RENTA")) listaObligaciones.push("Impuesto a la Renta");

    return {
      apellidos_nombres: nombres || 'CONTRIBUYENTE',
      ruc: ruc,
      direccion: direccionFinal || 'Dirección no detectada',
      contacto: {
        email: validEmail || '',
        celular: validPhone || ''
      },
      regimen: regimen,
      obligaciones_tributarias: textOnly.includes("SEMESTRAL") ? "semestral" : "mensual",
      lista_obligaciones: listaObligaciones,
      actividad_economica: textOnly.match(/ACTIVIDADES ECONÓMICAS\s*([^:]+?)(?=\s*(?:ESTABLECIMIENTOS|OBLIGACIONES|$))/)?.[1]?.trim() || '',
      es_artesano: textOnly.includes("ARTESANO") && !textOnly.includes("NO REGISTRA"),
      cantidad_establecimientos: parseInt(textOnly.match(/ESTABLECIMIENTOS\s*ABIERTOS\s*(\d+)/)?.[1] || '1'),
      isCertificate: textOnly.includes("CERTIFICADO DE RUC")
    };

  } catch (error) {
    console.error("Error en extracción PDF:", error);
    throw new Error("No se pudo procesar el PDF mecánicamente.");
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};
