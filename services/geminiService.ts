
import { GoogleGenAI, Type } from "@google/genai";
import { DB } from './db';
import * as OnboardingService from './onboardingService';

const API_KEY = process.env.API_KEY || "";

/**
 * Compiles a dense enterprise knowledge base from the onboarding draft.
 * This simulates a RAG file search by providing structured enterprise data
 * as the model's primary source of truth.
 */
const buildEnterpriseContext = async (tenantId: string): Promise<string> => {
  const draft = await OnboardingService.getOnboardingDraft(tenantId);
  if (!draft) return "No brand context available.";

  return `
--- ENTERPRISE KNOWLEDGE BASE (RAG STORE) ---
Company Name: ${draft.companyName}
LinkedIn Page: ${draft.linkedinUrl}
Official Website: ${draft.website}
Industry: ${draft.industry}
Organization Size: ${draft.orgSize}
Organization Type: ${draft.orgType}
Tagline: ${draft.tagline}
Mission Statement: ${draft.mission}
Core Brand Voice: ${draft.brandVoice}

Strategic Value Propositions:
${draft.valueProps.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Core Service Offerings:
${draft.services.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Internal Assets Synced: ${draft.assets.length} items.
--- END KNOWLEDGE BASE ---
`;
};

export const getBrandAssistantResponse = async (
  prompt: string, 
  tenantId: string,
  tenantName: string
) => {
  if (!API_KEY) return { text: "API Key not configured.", citations: [] };

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const history = await DB.get<any[]>(DB.keys.CHATS(tenantId)) || [];
    const enterpriseContext = await buildEnterpriseContext(tenantId);
    
    const currentMessage = { role: 'user', parts: [{ text: prompt }] };
    const fullContents = [...history, currentMessage];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullContents,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `
You are the Enterprise Brand Assistant for ${tenantName}. 
Your core intelligence is grounded in the provided Enterprise Knowledge Base.

Follow these rules:
1. Always refer to the internal Knowledge Base first for facts about the company.
2. If data is missing from the Knowledge Base, use Google Search grounding to verify the company's public presence.
3. Maintain the company's specified brand voice in all responses.
4. If asked about the brand's strategy, align your answer with the Mission and Value Propositions provided.

${enterpriseContext}
`
      }
    });

    const modelResponse = { role: 'model', parts: [{ text: response.text || "" }] };
    const newHistory = [...fullContents, modelResponse];
    await DB.set(DB.keys.CHATS(tenantId), newHistory);

    const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || "Web Reference",
        uri: chunk.web?.uri || ""
      }))
      .filter((c: any) => c.uri) || [];

    return { 
      text: response.text || "Error processing request.", 
      citations: citations
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Service temporarily unavailable. Our engineers have been notified.", citations: [] };
  }
};

export const getChatHistory = async (tenantId: string) => {
  return await DB.get<any[]>(DB.keys.CHATS(tenantId)) || [];
};

export const clearChatHistory = async (tenantId: string) => {
  await DB.remove(DB.keys.CHATS(tenantId));
};
