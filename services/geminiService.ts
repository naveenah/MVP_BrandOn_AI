
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

export const getBrandAssistantResponse = async (
  prompt: string, 
  tenantContext: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[] = []
) => {
  if (!API_KEY) return "API Key not configured. Please check environment variables.";

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // We use gemini-3-flash-preview for fast, brand-specific reasoning
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...history.map(h => ({ role: h.role, parts: h.parts })),
        { parts: [{ text: `Context for ${tenantContext}: ${prompt}` }] }
      ],
      config: {
        systemInstruction: `You are an elite Brand Automation Strategist. You help enterprises manage their brand identity, assets, and social media strategy. Provide insights based on the provided company context. Be professional, creative, and concise.`,
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      },
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "An error occurred while communicating with the Brand Intelligence Engine.";
  }
};
