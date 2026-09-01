
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { AIContentRequest, DailySales, FinancialProjection, SupervisorAnalysis, ChatMessage } from "../types";

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout de conexión con IA")), ms))
    ]);
};

/**
 * Identifica un producto de imprenta a partir de una foto.
 */
export const matchProductFromImage = async (base64Image: string): Promise<any | null> => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const modelId = "gemini-3-flash-preview";
    const dataPart = base64Image.split(',')[1];
    const mimeType = base64Image.match(/^data:(.*);base64,/)?.[1] || 'image/jpeg';

    const prompt = `Actúa como experto en artes gráficas de Imprenta Córdova. 
    Analiza esta foto de un producto impreso y determina:
    1. TIPO: ¿Es Factura, Nota de Venta, Tarjeta, Volante o Gigantografía?
    2. TAMAÑO ESTIMADO: (1/4 oficio, A5, 10x15cm, etc).
    3. CARACTERÍSTICAS: ¿Papel químico (autocopiante), Bond, Couché? ¿Es a color o un solo color?
    4. RECOMENDACIÓN: Sugiere el producto más parecido de nuestro catálogo.
    Responde en JSON.`;

    try {
        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: { parts: [{ inlineData: { data: dataPart, mimeType: mimeType } }, { text: prompt }] },
            config: { 
                temperature: 0.2, 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tipo: { type: Type.STRING },
                        tamano: { type: Type.STRING },
                        material: { type: Type.STRING },
                        recomendacion: { type: Type.STRING },
                        confianza: { type: Type.NUMBER }
                    },
                    required: ['tipo', 'recomendacion']
                }
            }
        }), 25000) as GenerateContentResponse;
        return JSON.parse(response.text || "{}");
    } catch (error) {
        return null;
    }
};

/**
 * Extrae datos detallados de un Certificado de RUC del SRI.
 * ACTUALIZACIÓN MAESTRA: Extracción precisa de establecimientos y teléfonos.
 */
export const extractClientFromImage = async (base64Image: string): Promise<any | null> => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const modelId = "gemini-3-flash-preview";
    const mimeMatch = base64Image.match(/^data:(.*);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const dataPart = base64Image.split(',')[1];
    
    const prompt = `Analiza este documento del SRI Ecuador (Certificado de RUC). Extrae con precisión quirúrgica:
    1. NOMBRE: La "Razón Social" o "Apellidos y Nombres".
    2. RUC: El número de 13 dígitos.
    3. REGIMEN: Identifica si es "RIMPE Negocio Popular", "RIMPE Emprendedor" o "General".
    4. DIRECCIÓN: La dirección completa de la matriz.
    5. TELÉFONOS: Busca en TODO el documento (secciones de contacto, cabecera, pie) cualquier número celular (09...) o fijo. Devuélvelos unidos por comas.
    6. ESTABLECIMIENTOS:
       - Busca la sección "ESTABLECIMIENTOS REGISTRADOS".
       - Cuenta cuántos dicen estado "ABIERTO". Ese es 'numEstablecimientos'.
       - Identifica el código del establecimiento principal (generalmente 001, pero verifica).
    7. ACTIVIDADES: Las actividades económicas principales.
    
    Responde en JSON limpio.`;

    try {
        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: { parts: [{ inlineData: { data: dataPart, mimeType: mimeType } }, { text: prompt }] },
            config: { 
                temperature: 0.1, 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        nombre: { type: Type.STRING },
                        ruc: { type: Type.STRING },
                        regimen: { type: Type.STRING },
                        direccion: { type: Type.STRING },
                        email: { type: Type.STRING },
                        telefono: { type: Type.STRING, description: "Lista de teléfonos encontrados separados por coma" },
                        actividades: { type: Type.STRING },
                        numEstablecimientos: { type: Type.NUMBER, description: "Cantidad de locales ABIERTOS" },
                        establecimientoPrincipal: { type: Type.STRING, description: "Código del local (ej: 001)" }
                    },
                    required: ['nombre', 'ruc', 'numEstablecimientos']
                }
            }
        }), 35000) as GenerateContentResponse;
        
        return JSON.parse(response.text || "{}");
    } catch (error) { 
        return null; 
    }
};

/**
 * Maestro Feature: Analiza si una imagen sirve para impresión profesional.
 */
export const analyzeImageQualityForPrint = async (base64Image: string): Promise<any | null> => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const modelId = "gemini-3-flash-preview";
    const dataPart = base64Image.split(',')[1];
    const mimeType = base64Image.match(/^data:(.*);base64,/)?.[1] || 'image/jpeg';

    const prompt = `Analiza este archivo de diseño para Imprenta Córdova Pasaje.
    Evalúa calidad para impresión profesional (nitidez, colores CMYK, textos).
    Responde en JSON con campos: 'calidad', 'advertencias', 'veredicto', 'porcentaje_exito'.`;

    try {
        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: { parts: [{ inlineData: { data: dataPart, mimeType: mimeType } }, { text: prompt }] },
            config: { 
                temperature: 0.2, 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        calidad: { type: Type.STRING },
                        advertencias: { type: Type.ARRAY, items: { type: Type.STRING } },
                        veredicto: { type: Type.STRING },
                        porcentaje_exito: { type: Type.NUMBER }
                    }
                }
            }
        }), 25000) as GenerateContentResponse;
        return JSON.parse(response.text || "{}");
    } catch (error) {
        return null;
    }
};

export const generateMarketingPromotion = async (clientName: string, lastProducts: string[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const modelId = "gemini-3-flash-preview";
    const prompt = `Redacta un mensaje de WhatsApp amigable para "${clientName}" de Imprenta Córdova (Pasaje). Ofrece 10% en su próxima impresión de: ${lastProducts.join(", ")}. Usa emojis.`;
    try {
        const response = await withTimeout(ai.models.generateContent({ model: modelId, contents: prompt }), 10000) as GenerateContentResponse;
        return response.text || "¡Hola! Tenemos promos para ti.";
    } catch (error) { return "¡Hola! Escríbenos para una oferta especial."; }
};

export const chatWithCustomer = async (history: ChatMessage[], productsContext: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const modelId = "gemini-3-flash-preview";
    const systemInstruction = `Eres Córdova AI. Ayuda al cliente en Pasaje sobre: ${productsContext}`;
    try {
        const chat = ai.chats.create({ model: modelId, config: { systemInstruction, temperature: 0.7 } });
        const lastMsg = history[history.length - 1];
        const response = await withTimeout(chat.sendMessage({ message: lastMsg.text }), 15000) as GenerateContentResponse;
        return response.text || "Error.";
    } catch (error) { return "IA no disponible."; }
};

export const generateFinancialProjection = async (history: DailySales[]): Promise<FinancialProjection | null> => {
    if (!history.length) return null;
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const modelId = "gemini-3-flash-preview";
    const prompt = `Analiza ventas y proyecta 30 días: ${JSON.stringify(history)}`;
    try {
        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        forecast: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { date: { type: Type.STRING }, sales: { type: Type.NUMBER } } } },
                        lowTrafficDays: { type: Type.ARRAY, items: { type: Type.STRING } },
                        suggestion: { type: Type.STRING }
                    },
                    required: ['forecast', 'lowTrafficDays', 'suggestion']
                }
            }
        }), 20000) as GenerateContentResponse;
        return JSON.parse(response.text);
    } catch (error) { return null; }
};

export interface SampleOcrResult {
    razonSocial: string;
    ruc: string;
    direccion: string;
    telefonos: string;
    actividadComercial: string;
    textosDetectados: string[];
    advertenciaSri: string;
}

export const extractSampleTextOCR = async (imageInput: string): Promise<SampleOcrResult | null> => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const modelId = "gemini-3-flash-preview";
    
    let base64Data = imageInput;
    let mimeType = 'image/jpeg';
    if (imageInput.startsWith('data:')) {
        const parts = imageInput.split(',');
        base64Data = parts[1];
        mimeType = imageInput.match(/^data:(.*);base64,/)?.[1] || 'image/jpeg';
    }

    const prompt = `Actúa como asistente OCR de alta precisión para un diseñador gráfico en Imprenta Córdova (Ecuador).
    Analiza esta imagen de muestra física (talonario, tarjeta, factura, volante o boceto).
    Extrae todos los datos textuales limpios para que el diseñador los copie y pegue en CorelDRAW o Illustrator:
    1. razonSocial: Nombre de la empresa o persona.
    2. ruc: RUC de 13 dígitos o Cédula.
    3. direccion: Dirección física completa de la matriz o local.
    4. telefonos: Celulares o teléfonos fijos encontrados.
    5. actividadComercial: Actividades, servicios o slogan del negocio.
    6. textosDetectados: Array con frases, columnas o textos secundarios identificados.
    7. advertenciaSri: Leyendas fiscales detectadas o faltantes (ej. Contribuyente Régimen RIMPE, Agente de Retención, etc.).
    
    Responde en JSON estricto.`;

    try {
        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: { parts: [{ inlineData: { data: base64Data, mimeType } }, { text: prompt }] },
            config: {
                temperature: 0.1,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        razonSocial: { type: Type.STRING },
                        ruc: { type: Type.STRING },
                        direccion: { type: Type.STRING },
                        telefonos: { type: Type.STRING },
                        actividadComercial: { type: Type.STRING },
                        textosDetectados: { type: Type.ARRAY, items: { type: Type.STRING } },
                        advertenciaSri: { type: Type.STRING }
                    },
                    required: ['razonSocial', 'ruc', 'direccion', 'telefonos']
                }
            }
        }), 25000) as GenerateContentResponse;
        return JSON.parse(response.text || "{}");
    } catch (error) {
        console.error("Error en OCR de muestra:", error);
        return null;
    }
};

export const analyzeDesignWithSupervisor = async (designBase64: string, context: string): Promise<SupervisorAnalysis | null> => {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
    const modelId = "gemini-3-flash-preview";
    const prompt = `Actúa como un diseñador gráfico pro élite de la costa ecuatoriana (Pasaje, Ecuador), con estilo realista, premium y siempre al gusto de la costa ecuatoriana (sin salirte de lo lógico/sobrenatural).
    Eres el Supervisor de Calidad de Imprenta Córdova.
    Analiza este diseño para impresión profesional. Si consideras que necesitas una API de visión más avanzada (de pago) para dar un mejor diagnóstico, indícalo, pero por ahora dame el mejor análisis técnico posible usando esta herramienta gratuita.
    Contexto de la orden: ${context}
    Responde en JSON con: estado (VERDE, AMARILLO, ROJO), resumen (tu veredicto profesional con tu estilo costeño), y detalles (array con tipo, descripcion, sugerencia).`;
    try {
        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: { parts: [{ inlineData: { data: designBase64.split(',')[1], mimeType: 'image/jpeg' } }, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        estado: { type: Type.STRING, enum: ['VERDE', 'AMARILLO', 'ROJO'] },
                        resumen: { type: Type.STRING },
                        detalles: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { tipo: { type: Type.STRING }, descripcion: { type: Type.STRING }, sugerencia: { type: Type.STRING } } } }
                    },
                    required: ['estado', 'resumen', 'detalles']
                }
            }
        }), 25000) as GenerateContentResponse;
        return JSON.parse(response.text);
    } catch (error) { return null; }
};

export const generateMarketingCopy = async (request: AIContentRequest): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const modelId = "gemini-3-flash-preview";
  const prompt = `Copy para: ${request.businessName}, Producto: ${request.productType}, Tono: ${request.tone}.`;
  try {
    const response = await withTimeout(ai.models.generateContent({ model: modelId, contents: prompt }), 10000) as GenerateContentResponse;
    return response.text || "Error.";
  } catch (error) { return "Error."; }
};
