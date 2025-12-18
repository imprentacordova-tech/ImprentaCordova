
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AIContentRequest, DailySales, FinancialProjection, SupervisorAnalysis, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper para manejar timeouts en promesas
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout de conexión con IA")), ms))
    ]);
};

export const chatWithCustomer = async (history: ChatMessage[], productsContext: string): Promise<string> => {
    const modelId = "gemini-3-flash-preview";
    
    const systemInstruction = `
        Eres "Córdova AI", el asistente virtual de Imprenta Córdova en Pasaje, El Oro.
        Tu tono es profesional, amable y eficiente.
        
        INFORMACIÓN CLAVE:
        - Ubicación: Colón e/ Sucre y Rocafuerte, Pasaje.
        - Horario: Lunes a Viernes 08:30-18:30, Sábado 09:00-13:00.
        - Servicios: Gigantografías, Facturas SRI, Merchandising, Offset.
        - Productos disponibles (Contexto): ${productsContext}
        
        REGLAS:
        1. Si el cliente pregunta por el estado de su pedido, dile que use la sección "Seguimiento".
        2. No des precios exactos si no están en el contexto.
        3. Si preguntan por WhatsApp: 099 308 3943.
    `;

    try {
        const chat = ai.chats.create({
            model: modelId,
            config: { systemInstruction, temperature: 0.7 }
        });

        const lastMsg = history[history.length - 1];
        /* Fix: Cast response of withTimeout to GenerateContentResponse and access .text property */
        const response = await withTimeout(chat.sendMessage({ message: lastMsg.text }), 15000) as GenerateContentResponse;
        return response.text || "Disculpa, no pude procesar esa idea.";
    } catch (error) {
        console.error("Critical AI Error:", error);
        return "Tengo problemas técnicos temporales. ¿Podrías intentar de nuevo o llamarnos al 0993083943?";
    }
};

export const generateFinancialProjection = async (history: DailySales[]): Promise<FinancialProjection | null> => {
    if (!history.length) return null;
    const modelId = "gemini-3-flash-preview";
    
    const historyString = history.map(d => `${d.date}: $${d.sales}`).join('\n');
    const prompt = `Analiza estas ventas y proyecta los próximos 30 días en JSON:\n${historyString}`;

    try {
        /* Fix: Cast response of withTimeout to GenerateContentResponse and access .text property */
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
                                },
                                required: ["date", "sales"]
                            }
                        },
                        lowTrafficDays: { type: Type.ARRAY, items: { type: Type.STRING } },
                        suggestion: { type: Type.STRING }
                    },
                    required: ["forecast", "lowTrafficDays", "suggestion"]
                }
            }
        }), 20000) as GenerateContentResponse;

        if (!response.text) return null;
        return JSON.parse(response.text) as FinancialProjection;
    } catch (error) {
        console.error("Financial AI Error:", error);
        return null;
    }
};

export const analyzeDesignWithSupervisor = async (designBase64: string, context: string): Promise<SupervisorAnalysis | null> => {
    if (!designBase64) return null;
    const modelId = "gemini-2.5-flash-image";

    const prompt = `Analiza este diseño para: ${context}. Busca errores y responde en JSON.`;

    try {
        /* Fix: Cast response of withTimeout to GenerateContentResponse and access .text property */
        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [
                    { inlineData: { data: designBase64.split(',')[1], mimeType: 'image/jpeg' } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        estado: { type: Type.STRING, enum: ["VERDE", "AMARILLO", "ROJO"] },
                        resumen: { type: Type.STRING },
                        detalles: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    tipo: { type: Type.STRING, enum: ["TECNICA", "DISENO", "COLOR", "COMERCIAL"] },
                                    descripcion: { type: Type.STRING },
                                    sugerencia: { type: Type.STRING }
                                },
                                required: ["tipo", "descripcion", "sugerencia"]
                            }
                        }
                    },
                    required: ["estado", "resumen", "detalles"]
                }
            }
        }), 25000) as GenerateContentResponse;

        if (!response.text) return null;
        return JSON.parse(response.text) as SupervisorAnalysis;
    } catch (error) {
        console.error("Design AI Error:", error);
        return null;
    }
};

export const generateMarketingCopy = async (request: AIContentRequest): Promise<string> => {
  const modelId = "gemini-3-flash-preview";
  const prompt = `Genera copy publicitario para: ${request.businessName}, Producto: ${request.productType}, Tono: ${request.tone}`;

  try {
    /* Fix: Cast response of withTimeout to GenerateContentResponse and access .text property */
    const response = await withTimeout(ai.models.generateContent({ model: modelId, contents: prompt }), 10000) as GenerateContentResponse;
    return response.text || "Error al generar ideas.";
  } catch (error) {
    return "No pude conectar con el servicio creativo ahora.";
  }
};
