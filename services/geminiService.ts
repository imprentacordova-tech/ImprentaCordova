
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AIContentRequest, DailySales, FinancialProjection, SupervisorAnalysis, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Timeout de conexión con IA")), ms))
    ]);
};

/**
 * Genera un mensaje de marketing para WhatsApp basado en el historial del cliente.
 */
export const generateMarketingPromotion = async (clientName: string, lastProducts: string[]): Promise<string> => {
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

export const extractClientFromImage = async (base64Image: string): Promise<any | null> => {
    const modelId = "gemini-3-flash-preview";
    const mimeMatch = base64Image.match(/^data:(.*);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const dataPart = base64Image.split(',')[1];
    const prompt = `Analiza este documento del SRI de Ecuador (Certificado de RUC).
    INSTRUCCIONES: Extrae Nombre, RUC, Régimen, Dirección, Email y Teléfono.
    Responde en JSON plano.`;
    try {
        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: { parts: [{ inlineData: { data: dataPart, mimeType: mimeType } }, { text: prompt }] },
            config: { temperature: 0.1, responseMimeType: "application/json" }
        }), 30000) as GenerateContentResponse;
        return response.text ? JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim()) : null;
    } catch (error) { return null; }
};

export const chatWithCustomer = async (history: ChatMessage[], productsContext: string): Promise<string> => {
    const modelId = "gemini-3-flash-preview";
    const systemInstruction = `Eres "Córdova AI", experto en Marketing Gráfico en Pasaje. Ayuda al cliente.`;
    try {
        const chat = ai.chats.create({ model: modelId, config: { systemInstruction, temperature: 0.7 } });
        const lastMsg = history[history.length - 1];
        const response = await withTimeout(chat.sendMessage({ message: lastMsg.text }), 15000) as GenerateContentResponse;
        return response.text || "Error de conexión.";
    } catch (error) { return "IA no disponible."; }
};

export const generateFinancialProjection = async (history: DailySales[]): Promise<FinancialProjection | null> => {
    if (!history.length) return null;
    const modelId = "gemini-3-flash-preview";
    const historyString = history.map(d => `${d.date}: $${d.sales}`).join('\n');
    const prompt = `Analiza estas ventas y proyecta 30 días. Devuelve JSON.`;
    try {
        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        }), 20000) as GenerateContentResponse;
        return response.text ? JSON.parse(response.text) : null;
    } catch (error) { return null; }
};

export const analyzeDesignWithSupervisor = async (designBase64: string, context: string): Promise<SupervisorAnalysis | null> => {
    if (!designBase64) return null;
    const modelId = "gemini-3-flash-preview";
    const prompt = `Eres supervisor de calidad gráfica. Analiza resolución y diseño. JSON estricto.`;
    try {
        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: { parts: [{ inlineData: { data: designBase64.split(',')[1], mimeType: 'image/jpeg' } }, { text: prompt }] }
        }), 25000) as GenerateContentResponse;
        return response.text ? JSON.parse(response.text.replace(/```json/g, '').replace(/```/g, '').trim()) : null;
    } catch (error) { return null; }
};

export const generateMarketingCopy = async (request: AIContentRequest): Promise<string> => {
  const modelId = "gemini-3-flash-preview";
  const prompt = `Genera copy profesional para: ${request.businessName}, Producto: ${request.productType}.`;
  try {
    const response = await withTimeout(ai.models.generateContent({ model: modelId, contents: prompt }), 10000) as GenerateContentResponse;
    return response.text || "Intenta de nuevo.";
  } catch (error) { return "Error."; }
};
