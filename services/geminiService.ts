
import { GoogleGenAI, Type } from "@google/genai";
import { AIContentRequest, DailySales, FinancialProjection } from "../types";

// FIX: Conformed to @google/genai guidelines using process.env.API_KEY
// This assumes process.env.API_KEY is available in the environment (e.g. via Vite define or Next.js)
const apiKey = process.env.API_KEY;

// Initialize conditionally to prevent app crash if key is missing
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateMarketingCopy = async (request: AIContentRequest): Promise<string> => {
  if (!ai) {
    console.warn("Gemini API Key is missing. Check your process.env.API_KEY environment variable.");
    return "El sistema de IA está configurándose. Por favor contacta a la imprenta directamente para ideas creativas.";
  }

  const modelId = "gemini-2.5-flash";
  
  const prompt = `
    Actúa como un experto redactor publicitario para una imprenta en Ecuador.
    El cliente necesita texto para un diseño impreso.
    
    Negocio: ${request.businessName}
    Producto a imprimir: ${request.productType}
    Tono deseado: ${request.tone}
    
    Genera 3 opciones distintas, cortas y atractivas para poner en este producto impreso.
    Usa un formato de lista simple.
    Si es una tarjeta, incluye slogan.
    Si es volante, incluye un 'Call to Action' claro.
    Responde solo con el texto sugerido, sin introducciones largas.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } // Speed over deep reasoning for simple copy
      }
    });

    // Access the text property directly from the response object
    return response.text || "Lo sentimos, no pudimos generar ideas en este momento.";
  } catch (error) {
    console.error("Error generating content:", error);
    return "Ocurrió un error al conectar con el asistente inteligente. Por favor intente más tarde.";
  }
};

export const generateFinancialProjection = async (history: DailySales[]): Promise<FinancialProjection | null> => {
    if (!ai) {
        console.warn("Gemini API Key is missing.");
        return null;
    }

    const modelId = "gemini-2.5-flash";
    
    // Formatting history for prompt to save tokens while keeping readability
    const historyString = history.map(d => `${d.date}: $${d.sales}`).join('\n');

    const prompt = `
        Actúa como un analista financiero experto para una imprenta comercial.
        Analiza el siguiente historial de ventas diarias de los últimos meses:
        
        ${historyString}

        TAREA:
        1. Identifica patrones semanales y tendencias mensuales.
        2. Genera una proyección de ventas diarias para los próximos 30 días a partir de la última fecha de los datos.
        3. Identifica qué días de la semana suelen tener las ventas más bajas (low traffic).
        4. Escribe una sugerencia estratégica breve (máx 20 palabras) para lanzar promociones en esos días bajos.

        Responde estrictamente en formato JSON.
    `;

    try {
        const response = await ai.models.generateContent({
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
                                    date: { type: Type.STRING, description: "YYYY-MM-DD" },
                                    sales: { type: Type.NUMBER, description: "Proyección de venta diaria en USD" }
                                },
                                required: ["date", "sales"]
                            }
                        },
                        lowTrafficDays: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Ej: ['Lunes', 'Miércoles']"
                        },
                        suggestion: { type: Type.STRING, description: "Consejo estratégico breve" }
                    },
                    required: ["forecast", "lowTrafficDays", "suggestion"]
                }
            }
        });

        const jsonText = response.text;
        if (!jsonText) return null;
        return JSON.parse(jsonText) as FinancialProjection;

    } catch (error) {
        console.error("Error generating financial projection:", error);
        return null;
    }
};
