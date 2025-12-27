
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

/**
 * Extrae datos de un certificado de RUC del SRI (Ecuador) a partir de una imagen o PDF.
 * Detecta automáticamente el MIME type para evitar errores 400 INVALID_ARGUMENT.
 * Extrae: Datos básicos, Correo y Lista de Establecimientos Abiertos.
 */
export const extractClientFromImage = async (base64Image: string): Promise<any | null> => {
    // Usamos gemini-3-flash-preview para análisis de documentos complejo
    const modelId = "gemini-3-flash-preview";
    
    const mimeMatch = base64Image.match(/^data:(.*);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const dataPart = base64Image.split(',')[1];

    const prompt = `Analiza este documento del SRI de Ecuador (Certificado de RUC).
    
    INSTRUCCIONES DE EXTRACCIÓN:
    1. NOMBRE: El nombre del contribuyente está arriba de la etiqueta "Apellidos y nombres".
    2. CONTACTO: Busca el correo electrónico y teléfono en la sección de datos de contacto.
    3. ESTABLECIMIENTOS: Busca la tabla de "Establecimientos registrados". Extrae SOLO los que digan estado "ABIERTO".
    
    Responde EXCLUSIVAMENTE en formato JSON plano:
    {
      "nombre": "Nombre completo",
      "ruc": "13 dígitos",
      "regimen": "Rimpe Popular, Emprendedor o General",
      "direccion": "Dirección completa",
      "actividades": "Resumen de actividad económica",
      "email": "correo electrónico encontrado",
      "telefono": "número de contacto",
      "establecimientos": [
        { "codigo": "001", "nombre": "Nombre del local", "estado": "ABIERTO" }
      ]
    }

    Si el documento tiene varias páginas (común en PDFs), analiza todas para encontrar la tabla de establecimientos.`;

    try {
        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [
                    { inlineData: { data: dataPart, mimeType: mimeType } },
                    { text: prompt }
                ]
            },
            config: {
                temperature: 0.1,
                responseMimeType: "application/json",
            }
        }), 30000) as GenerateContentResponse;

        if (!response.text) return null;

        let text = response.text.trim();
        // Limpieza de posibles tags de markdown
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const jsonStartIndex = text.indexOf('{');
        const jsonEndIndex = text.lastIndexOf('}') + 1;
        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            text = text.substring(jsonStartIndex, jsonEndIndex);
        }

        const data = JSON.parse(text);
        console.log("IA Extracted Data:", data);
        return data;
    } catch (error) {
        console.error("SRI Extraction Error:", error);
        return null;
    }
};

export const chatWithCustomer = async (history: ChatMessage[], productsContext: string): Promise<string> => {
    const modelId = "gemini-3-flash-preview";
    
    const systemInstruction = `
        Eres "Córdova AI", un experto Senior en Marketing y Producción Gráfica para Imprenta Córdova en Pasaje, El Oro.
        Tu misión es asesorar a los clientes para que sus negocios crezcan a través de una buena imagen.
        
        TONO: Profesional, inspirador, empático y experto.
        
        INFORMACIÓN CLAVE DE LA EMPRESA:
        - Ubicación: Calle Colón entre Sucre y Rocafuerte, Pasaje, El Oro.
        - Horario: Lunes a Viernes 08:30-18:30, Sábados 09:00-13:00.
        - Especialidades: Gigantografías HD (máquinas Roland), Facturas autorizadas SRI, Merchandising, Offset.
        - WhatsApp de Soporte: 099 308 3943.
        
        CATÁLOGO REFERENCIAL: ${productsContext}
        
        REGLAS DE RESPUESTA:
        1. Si preguntan por precios: "Nuestros precios inician desde... pero el valor final depende de los acabados. ¿Quieres que un asesor te cotice exacto en WhatsApp?".
        2. Si preguntan por estado de pedido: "Puedes rastrearlo con tu # de orden en la sección Seguimiento de nuestra web".
        3. Siempre sé amable y menciona que estamos en el centro de Pasaje.
        4. Si el cliente tiene una idea de diseño, dale un consejo técnico (ej: "Para gigantografías, asegúrate de que tu logo esté en alta resolución para que se vea perfecto").
    `;

    try {
        const chat = ai.chats.create({
            model: modelId,
            config: { systemInstruction, temperature: 0.7 }
        });

        const lastMsg = history[history.length - 1];
        const response = await withTimeout(chat.sendMessage({ message: lastMsg.text }), 15000) as GenerateContentResponse;
        return response.text || "Lo siento, tuve un breve error. ¿Puedes escribirme de nuevo o contactarnos al 0993083943?";
    } catch (error) {
        console.error("Critical AI Error:", error);
        return "Nuestra IA está descansando. Por favor, llámanos directamente al 0993083943 para ayudarte de inmediato.";
    }
};

export const generateFinancialProjection = async (history: DailySales[]): Promise<FinancialProjection | null> => {
    if (!history.length) return null;
    const modelId = "gemini-3-flash-preview";
    
    const historyString = history.map(d => `${d.date}: $${d.sales}`).join('\n');
    const prompt = `Como analista financiero de una imprenta, analiza estas ventas y proyecta los próximos 30 días. Devuelve estrictamente JSON:\n${historyString}`;

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
    const modelId = "gemini-3-flash-preview";

    const prompt = `Eres un supervisor de control de calidad gráfica. Analiza este diseño para: ${context}. Busca errores de resolución, sangrados, ortografía o contraste. Responde estrictamente con un objeto JSON (sin markdown) que tenga los campos: estado ("VERDE", "AMARILLO", "ROJO"), resumen (string), y detalles (array de objetos con tipo ("TECNICA", "DISENO", "COLOR", "COMERCIAL"), descripcion (string), sugerencia (string)).`;

    try {
        const response = await withTimeout(ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [
                    { inlineData: { data: designBase64.split(',')[1], mimeType: 'image/jpeg' } },
                    { text: prompt }
                ]
            }
        }), 25000) as GenerateContentResponse;

        if (!response.text) return null;
        const cleanedJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedJson) as SupervisorAnalysis;
    } catch (error) {
        console.error("Design AI Error:", error);
        return null;
    }
};

export const generateMarketingCopy = async (request: AIContentRequest): Promise<string> => {
  const modelId = "gemini-3-flash-preview";
  const prompt = `Genera copy publicitario profesional para: ${request.businessName}, Producto: ${request.productType}, Tono: ${request.tone}. Hazlo creativo y listo para imprimir.`;

  try {
    const response = await withTimeout(ai.models.generateContent({ model: modelId, contents: prompt }), 10000) as GenerateContentResponse;
    return response.text || "Intenta de nuevo en unos momentos.";
  } catch (error) {
    return "Error al conectar con el servicio creativo.";
  }
};
