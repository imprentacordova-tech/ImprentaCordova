
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { AIContentRequest, DailySales, FinancialProjection, SupervisorAnalysis, ChatMessage } from "../types";

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout de conexión con IA")), ms))
    ]);
};

/**
 * Extrae datos detallados de un Certificado de RUC del SRI.
 * Optimizado para Imprenta Córdova - Pasaje.
 */
export const extractClientFromImage = async (base64Image: string): Promise<any | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-flash-preview";
    const mimeMatch = base64Image.match(/^data:(.*);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const dataPart = base64Image.split(',')[1];
    
    const prompt = `Analiza este documento del SRI Ecuador. Sigue estas reglas estrictas para Imprenta Córdova:
    1. NOMBRE: Extrae "Apellidos y Nombres" para personas naturales o "Razón Social" para empresas.
    2. RUC: Extrae los 13 dígitos. Ignora cédulas de 10 dígitos.
    3. REGIMEN: Identifica si es RIMPE (Negocio Popular / Emprendedor) o General.
    4. ACTIVIDADES: Extrae la descripción de las actividades económicas. ELIMINA los códigos CIIU (ej. de "G45.10 - VENTA" a solo "VENTA").
    5. DIRECCIÓN: Extrae solo la Calle Principal y Secundaria. IGNORA referencias (detrás de, junto a, etc.) y códigos postales. Formato final: "[Calle P] y [Calle S], Pasaje - El Oro".
    6. ESTABLECIMIENTOS: Identifica cuántos establecimientos ABIERTOS tiene. Si es solo 1, usa "001". Si hay más, indica el total.
    7. EMAIL: Extrae el correo para base de datos interna (marketing).`;

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
                        telefono: { type: Type.STRING },
                        actividades: { type: Type.STRING },
                        numEstablecimientos: { type: Type.NUMBER },
                        establecimientoPrincipal: { type: Type.STRING }
                    },
                    required: ['nombre', 'ruc', 'numEstablecimientos']
                }
            }
        }), 35000) as GenerateContentResponse;
        
        return JSON.parse(response.text || "{}");
    } catch (error) { 
        console.error("Error IA RUC:", error);
        return null; 
    }
};

/**
 * Genera mensajes de marketing personalizados.
 */
export const generateMarketingPromotion = async (clientName: string, lastProducts: string[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-flash-preview";
    const prompt = `Redacta un mensaje de WhatsApp amigable para "${clientName}" de Imprenta Córdova (Pasaje). Ofrece 10% en su próxima impresión de: ${lastProducts.join(", ")}. Usa emojis.`;
    try {
        const response = await withTimeout(ai.models.generateContent({ model: modelId, contents: prompt }), 10000) as GenerateContentResponse;
        return response.text || "¡Hola! Tenemos promos para ti.";
    } catch (error) { return "¡Hola! Escríbenos para una oferta especial."; }
};

export const chatWithCustomer = async (history: ChatMessage[], productsContext: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

export const analyzeDesignWithSupervisor = async (designBase64: string, context: string): Promise<SupervisorAnalysis | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-flash-preview";
    const prompt = `Supervisor de calidad. Analiza: ${context}`;
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = "gemini-3-flash-preview";
  const prompt = `Copy para: ${request.businessName}, Producto: ${request.productType}, Tono: ${request.tone}.`;
  try {
    const response = await withTimeout(ai.models.generateContent({ model: modelId, contents: prompt }), 10000) as GenerateContentResponse;
    return response.text || "Error.";
  } catch (error) { return "Error."; }
};
