
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { DB } from './db';

const API_KEY = process.env.API_KEY || "";

export const getBrandAssistantResponse = async (
  prompt: string, 
  tenantId: string,
  tenantName: string
) => {
  if (!API_KEY) return { text: "API Key not configured.", citations: [] };

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const history = await DB.get<any[]>(DB.keys.CHATS(tenantId)) || [];
    
    const currentMessage = { role: 'user', parts: [{ text: prompt }] };
    const fullContents = [...history, currentMessage];

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: fullContents,
      config: {
        systemInstruction: `You are a helpful Brand Assistant for ${tenantName}. Use the provided context to answer questions.`
      }
    });

    const modelResponse = { role: 'model', parts: [{ text: response.text || "" }] };
    const newHistory = [...fullContents, modelResponse];
    await DB.set(DB.keys.CHATS(tenantId), newHistory);

    const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || "Reference",
        uri: chunk.web?.uri || ""
      }))
      .filter((c: any) => c.uri) || [];

    return { 
      text: response.text || "Error processing request.", 
      citations: citations
    };
  } catch (error) {
    return { text: "Service temporarily unavailable.", citations: [] };
  }
};

export const getChatHistory = async (tenantId: string) => {
  return await DB.get<any[]>(DB.keys.CHATS(tenantId)) || [];
};

export const clearChatHistory = async (tenantId: string) => {
  await DB.remove(DB.keys.CHATS(tenantId));
};
