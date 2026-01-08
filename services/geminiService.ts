
import { GoogleGenAI, Type } from "@google/genai";
import { DB } from './db';
import * as OnboardingService from './onboardingService';

/**
 * Compiles a dense enterprise knowledge base from the onboarding draft.
 */
const buildEnterpriseContext = async (tenantId: string): Promise<string> => {
  const draft = await OnboardingService.getOnboardingDraft(tenantId);
  if (!draft) return "No brand context available.";

  const offeringsText = draft.offerings?.map((o, i) => `
Offering #${i + 1}: ${o.name} (${o.type})
- Status: ${o.status}
- Market Position: ${o.marketPosition}
- Target Audience: ${o.targetAudience}
- USP: ${o.usp}
- Description: ${o.description}
- Key Features: ${o.keyFeatures.join(', ')}
- Pain Points Solved: ${o.painPointsSolved}
`).join('\n') || "No detailed offerings provided.";

  return `
--- ENTERPRISE KNOWLEDGE BASE (RAG STORE) ---
Company Name: ${draft.companyName}
Industry: ${draft.industry}
Tagline: ${draft.tagline}
Mission Statement: ${draft.mission}
Core Brand Voice: ${draft.brandVoice}

Strategic Value Propositions:
${draft.valueProps.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Product & Service Portfolio:
${offeringsText}
--- END KNOWLEDGE BASE ---
`;
};

// Added helper to retrieve chat history from persistent store
export const getChatHistory = async (tenantId: string) => {
  return await DB.get<any[]>(DB.keys.CHATS(tenantId)) || [];
};

// Added helper to clear chat history from persistent store
export const clearChatHistory = async (tenantId: string) => {
  await DB.remove(DB.keys.CHATS(tenantId));
};

// Added image generation capabilities using Gemini 2.5 Flash Image model (nano banana series)
export const generateLogo = async (tenantId: string): Promise<string> => {
  if (!process.env.API_KEY) throw new Error("API Key not configured.");
  const draft = await OnboardingService.getOnboardingDraft(tenantId);
  if (!draft) throw new Error("No brand context available.");

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Generate a modern, professional corporate logo for a company named "${draft.companyName}" in the "${draft.industry}" industry. Brand voice: ${draft.brandVoice}. Mission: ${draft.mission}. The logo should be clean, iconic, and suitable for high-end enterprise branding.`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: prompt }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  // Extract the image from the candidates by iterating through parts
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64EncodeString: string = part.inlineData.data;
        // Use the mimeType from response if available, otherwise default to png
        const mimeType = part.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${base64EncodeString}`;
      }
    }
  }
  
  throw new Error("Failed to generate image data.");
};

export const getBrandAssistantResponse = async (
  prompt: string, 
  tenantId: string,
  tenantName: string
) => {
  if (!process.env.API_KEY) return { text: "API Key not configured.", citations: [] };

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Use the getChatHistory helper for consistent data access
    const history = await getChatHistory(tenantId);
    const enterpriseContext = await buildEnterpriseContext(tenantId);
    
    const currentMessage = { role: 'user', parts: [{ text: prompt }] };
    const fullContents = [...history, currentMessage];

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: fullContents,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `
You are the Wix Digital Architect for ${tenantName}. You have total administrative control over the digital workspace state.
Your mission is to construct hyper-aligned web experiences using the provided RAG Enterprise Knowledge Base.

FULL SITE ORCHESTRATION RULES:
1. You can CHAIN multiple actions in one response. 
2. SEQUENCE: To build a new page, first use "CREATE_PAGE", then follow with multiple "ADD_WIDGET" actions. The system will automatically target the most recently created page in your batch.
3. CONTENT FIDELITY: For every widget, use specific copy from the RAG store. If you are describing a product, use the real product name and description from the portfolio.
4. VARIETY: Use both Enterprise Presets (Hero, Grid, Pricing) and Abstract Blocks (QuoteBlock, IconBox, TextContent) to create professional layouts.

COMMUNICATION PROTOCOL:
- Act as a Senior Product Architect.
- APPEND a JSON array of actions to your message. 

ACTION SCHEMA:
- { "type": "CREATE_PAGE", "pageName": "Services" }
- { "type": "RESET_PAGE" }
- { "type": "SET_TEMPLATE", "templateId": "Modern Portfolio" | "SaaS Landing" | "Enterprise Base" }
- { "type": "ADD_WIDGET", "widget": "WidgetType", "attributes": { "key": "val" } }

WIDGET TYPES:
Enterprise: Hero, Grid, FeaturesList, Testimonials, Team, FAQ, Pricing, CallToAction, Newsletter, Contact.
Abstract: TextContent, MediaBlock, LinkList, Spacer, ButtonBlock, Divider, IconBox, QuoteBlock, VideoBlock.

RAG STORE ACCESS:
${enterpriseContext}
`
      }
    });

    const modelResponse = { role: 'model', parts: [{ text: response.text || "" }] };
    const newHistory = [...fullContents, modelResponse];
    await DB.set(DB.keys.CHATS(tenantId), newHistory);

    // Extract search grounding citations as per guidelines
    const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title || 'Reference',
      uri: chunk.web?.uri || '#'
    })).filter((c: any) => c.uri !== '#') || [];

    return { 
      text: response.text || "Error processing request.", 
      citations: citations
    };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Architectural Engine timed out. Please retry.", citations: [] };
  }
};
