import { GoogleGenAI } from "@google/genai";
import { AIContentRequest } from "../types";

// Initialize the GoogleGenAI client with the API key from process.env.API_KEY
// As per guidelines, we assume the environment variable is valid and accessible.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMarketingCopy = async (request: AIContentRequest): Promise<string> => {
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