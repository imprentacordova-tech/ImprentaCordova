
import { GoogleGenAI, Type } from "@google/genai";
import { AIContentRequest, DailySales, FinancialProjection, SupervisorAnalysis } from "../types";

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

export const analyzeDesignWithSupervisor = async (
    designBase64: string, 
    originalBase64?: string, 
    context?: string
): Promise<SupervisorAnalysis | null> => {
    if (!ai) {
        console.warn("Gemini API Key is missing.");
        return null;
    }

    const modelId = "gemini-2.5-flash"; // Capable of vision and structured output

    const systemInstruction = `
        Eres el "Supervisor Maestro de Imprenta": una fusión entre un corrector de estilo de la RAE, un diseñador gráfico senior y un técnico experto en preimpresión.
        Tu trabajo es analizar los archivos que recibas y proporcionar un diagnóstico inmediato, preciso y constructivo para asegurar la máxima calidad antes de imprimir.
        
        Debes escanear el contenido en cuatro capas de profundidad:
        1. CAPA TÉCNICA (El "Corrector de Antaño"): Detecta erratas ortográficas, gramaticales y de sintaxis. Verifica la legibilidad de las fuentes.
        2. CAPA DE DISEÑO (El "Director de Arte"): Analiza el equilibrio visual, los espacios en blanco (aire) y la jerarquía visual. Sugiere mejoras en la alineación.
        3. CAPA DE COLOR (El "Colorista"): Analiza la paleta. ¿Evoca la emoción correcta? Alerta sobre problemas de contraste o conversión RGB a CMYK.
        4. CAPA COMERCIAL (El "Marketer"): ¿El mensaje es claro? ¿Hay un "Call to Action" visible? Sugiere cambios para impacto de venta.

        TONO: Profesional, conciso, útil y directo. No uses relleno. Habla como un experto viejo pero actualizado.
    `;

    const parts: any[] = [];
    
    // Add Design Image (Required)
    parts.push({
        inlineData: {
            mimeType: "image/jpeg",
            data: designBase64.split(',')[1] // Remove data:image/jpeg;base64, prefix if present
        }
    });

    // Add Original/Reference Image (Optional)
    if (originalBase64) {
        parts.push({
            inlineData: {
                mimeType: "image/jpeg",
                data: originalBase64.split(',')[1]
            }
        });
        parts.push({ text: "La segunda imagen es la referencia u original." });
    }

    parts.push({ text: `Contexto adicional del trabajo: ${context || "Ninguno"}` });
    parts.push({ text: "Analiza el diseño y dame el diagnóstico." });

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: { parts: parts },
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        estado: { type: Type.STRING, enum: ["VERDE", "AMARILLO", "ROJO"] },
                        resumen: { type: Type.STRING, description: "Una frase de máximo 15 palabras." },
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
        });

        const jsonText = response.text;
        if (!jsonText) return null;
        return JSON.parse(jsonText) as SupervisorAnalysis;

    } catch (error) {
        console.error("Error analyzing design:", error);
        return null;
    }
};

export const remixColorsWithAI = async (originalImageBase64: string, suggestion: string): Promise<string | null> => {
    if (!ai) return null;
    const modelId = 'gemini-2.5-flash-image'; // Model capable of image editing

    const prompt = `Aplica la siguiente corrección de color a la imagen: "${suggestion}". Mantén la estructura y el contenido intactos, solo ajusta la paleta de colores para mejorar el diseño o legibilidad.`;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: originalImageBase64.split(',')[1],
                            mimeType: 'image/jpeg'
                        }
                    },
                    { text: prompt }
                ]
            }
        });

        // Loop through parts to find the image
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Error remixing colors:", error);
        return null;
    }
};

export const rewriteCopyWithAI = async (currentContext: string, issueDescription: string): Promise<string[]> => {
    if (!ai) return [];
    const modelId = 'gemini-2.5-flash';

    const prompt = `
        Actúa como un experto en copywriting para impresión.
        
        CONTEXTO DEL DISEÑO:
        ${currentContext}

        PROBLEMA DETECTADO:
        ${issueDescription}

        Genera 3 alternativas de texto (Copy) que solucionen este problema y sean más "vendedoras" o apropiadas.
        Devuelve SOLO las 3 opciones en un arreglo JSON de strings.
    `;

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });

        const jsonText = response.text;
        if (!jsonText) return [];
        return JSON.parse(jsonText) as string[];
    } catch (error) {
        console.error("Error rewriting copy:", error);
        return [];
    }
};
