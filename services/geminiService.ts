
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { AIContentRequest, DailySales, FinancialProjection, SupervisorAnalysis, ChatMessage } from "../types";

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout de conexión con IA")), ms))
    ]);
};

/**
 * Extrae datos detallados de un Certificado de RUC o documento del SRI Ecuador.
 */
export const extractClientFromImage = async (base64Image: string): Promise<any | null> => {
    // Initializing right before call to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-flash-preview";
    const mimeMatch = base64Image.match(/^data:(.*);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const dataPart = base64Image.split(',')[1];
    
    const prompt = `Analiza este Certificado de RUC del SRI (Ecuador). 
    Extrae la información de forma precisa y estructurada.`;

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
                        nombre: { type: Type.STRING, description: 'Razón Social o Nombres Apellidos' },
                        ruc: { type: Type.STRING, description: 'Número de RUC completo de 13 dígitos' },
                        regimen: { type: Type.STRING, description: 'Régimen tributario (Popular, Emprendedor, General)' },
                        direccion: { type: Type.STRING },
                        email: { type: Type.STRING },
                        telefono: { type: Type.STRING },
                        actividades: { type: Type.STRING }
                    },
                    required: ['nombre', 'ruc']
                }
            }
        }), 35000) as GenerateContentResponse;
        
        return JSON.parse(response.text || "{}");
    } catch (error) { 
        console.error("Error extraiendo datos del RUC:", error);
        return null; 
    }
};

/**
 * Genera mensajes de marketing personalizados para clientes basándose en su historial.
 */
export const generateMarketingPromotion = async (clientName: string, lastProducts: string[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-flash-preview";
    const prompt = `Como experto en marketing para Imprenta Córdova, redacta un mensaje de WhatsApp amigable y profesional para el cliente "${clientName}". 
    Su último pedido fue: ${lastProducts.join(", ")}. 
    El objetivo es saludarlo porque hace tiempo no nos visita y ofrecerle un 10% de descuento en su próxima gigantografía o talonario SRI. 
    Usa emojis, mantén el tono cercano y menciona que estamos en el centro de Pasaje. Máximo 60 palabras.`;

    try {
        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt
        }), 10000) as GenerateContentResponse;
        return response.text || "¡Hola! Te extrañamos en Imprenta Córdova. Ven por un descuento especial hoy.";
    } catch (error) {
        return "¡Hola! Tenemos promociones nuevas para ti en Imprenta Córdova. ¡Escríbenos!";
    }
};

/**
 * Asistente IA para interacción directa con clientes.
 */
export const chatWithCustomer = async (history: ChatMessage[], productsContext: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-flash-preview";
    const systemInstruction = `Eres "Córdova AI", experto en Marketing Gráfico en Pasaje. Ayuda al cliente basándote en: ${productsContext}`;
    try {
        const chat = ai.chats.create({ 
            model: modelId, 
            config: { 
                systemInstruction, 
                temperature: 0.7 
            } 
        });
        const lastMsg = history[history.length - 1];
        const response = await withTimeout(chat.sendMessage({ message: lastMsg.text }), 15000) as GenerateContentResponse;
        return response.text || "Error de conexión.";
    } catch (error) { return "IA no disponible."; }
};

/**
 * Proyecta ventas futuras basadas en el historial de transacciones.
 */
export const generateFinancialProjection = async (history: DailySales[]): Promise<FinancialProjection | null> => {
    if (!history.length) return null;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-flash-preview";
    const prompt = `Analiza estas ventas históricas y proyecta los próximos 30 días: ${JSON.stringify(history)}`;
    try {
        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        forecast: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    date: { type: Type.STRING },
                                    sales: { type: Type.NUMBER }
                                }
                            }
                        },
                        lowTrafficDays: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        suggestion: { type: Type.STRING }
                    },
                    required: ['forecast', 'lowTrafficDays', 'suggestion']
                }
            }
        }), 20000) as GenerateContentResponse;
        return response.text ? JSON.parse(response.text) : null;
    } catch (error) { return null; }
};

/**
 * Analiza diseños gráficos para control de calidad.
 */
export const analyzeDesignWithSupervisor = async (designBase64: string, context: string): Promise<SupervisorAnalysis | null> => {
    if (!designBase64) return null;
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelId = "gemini-3-flash-preview";
    const prompt = `Eres supervisor de calidad gráfica. Analiza resolución y diseño para: ${context}. Proporciona estado, resumen y detalles técnicos.`;
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
                        detalles: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    tipo: { type: Type.STRING, enum: ['TECNICA', 'DISENO', 'COLOR', 'COMERCIAL'] },
                                    descripcion: { type: Type.STRING },
                                    sugerencia: { type: Type.STRING }
                                }
                            }
                        }
                    },
                    required: ['estado', 'resumen', 'detalles']
                }
            }
        }), 25000) as GenerateContentResponse;
        return response.text ? JSON.parse(response.text) : null;
    } catch (error) { return null; }
};

/**
 * Genera copys publicitarios para productos específicos.
 */
export const generateMarketingCopy = async (request: AIContentRequest): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelId = "gemini-3-flash-preview";
  const prompt = `Genera copy profesional para: ${request.businessName}, Producto: ${request.productType}, Tono: ${request.tone}.`;
  try {
    const response = await withTimeout(ai.models.generateContent({ model: modelId, contents: prompt }), 10000) as GenerateContentResponse;
    return response.text || "Intenta de nuevo.";
  } catch (error) { return "Error."; }
};
