
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const API_KEY = process.env.API_KEY || "";

const searchInternalDocuments: FunctionDeclaration = {
  name: "search_internal_documents",
  parameters: {
    type: Type.OBJECT,
    description: "Search internal brand guidelines, strategy docs, and asset metadata.",
    properties: {
      query: {
        type: Type.STRING,
        description: "Specific brand question to search for in internal files.",
      },
    },
    required: ["query"],
  },
};

export const getBrandAssistantResponse = async (
  prompt: string, 
  tenantContext: string,
  history: { role: 'user' | 'model', parts: { text: string }[] }[] = []
) => {
  if (!API_KEY) return { text: "API Key not configured.", citations: [] };

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // Ensure history starts with a user message as required by the API
    const historyParts = history
      .filter((h, idx) => !(idx === 0 && h.role === 'model')) 
      .map(h => ({ role: h.role, parts: h.parts }));

    const currentMessage = { role: 'user', parts: [{ text: `User request for ${tenantContext}: ${prompt}` }] };
    const fullContents = [...historyParts, currentMessage as any];

    // Step 1: Routing Node (Flash)
    // We must separate googleSearch from functionDeclarations per API constraints.
    const routerResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: `Analyze the user intent and categorize it as "INTERNAL", "MARKET", or "GENERAL".
      - INTERNAL: Asking about company mission, brand guidelines, or specific internal assets.
      - MARKET: Asking about competitors, industry trends, or live web information.
      - GENERAL: General chat, greetings, or follow-ups not requiring specific data.
      
      User Prompt: "${prompt}"
      Return ONLY the word: INTERNAL, MARKET, or GENERAL.` }] }],
      config: { temperature: 0.1 }
    });

    const route = routerResponse.text?.trim().toUpperCase() || "GENERAL";
    console.debug("Agentic Router selected path:", route);

    let finalResponse;

    if (route === "MARKET") {
      // Market Tooling (Strictly only googleSearch)
      finalResponse = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: fullContents,
        config: {
          systemInstruction: `You are a Market Intelligence Agent for ${tenantContext}. 
          Use Google Search to find real-time trends and competitor data. 
          Provide URLs for all findings.`,
          tools: [{ googleSearch: {} }],
        }
      });
    } else if (route === "INTERNAL") {
      // RAG Tooling (Strictly only functionDeclarations)
      const toolResponse = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: fullContents,
        config: {
          systemInstruction: `You are a Brand Knowledge Agent for ${tenantContext}. 
          Search internal documents to answer questions about strategy and identity.`,
          tools: [{ functionDeclarations: [searchInternalDocuments] }],
        }
      });

      if (toolResponse.functionCalls && toolResponse.functionCalls.length > 0) {
        const call = toolResponse.functionCalls[0];
        // Mocking the RAG result from our simulated "Neon/pgvector" storage
        const mockRetrieval = `[Internal Doc Found]: ${tenantContext} Brand Identity Guide (2024). 
        Core Mission: "Empowering global enterprises through decentralized branding." 
        Primary Palette: Navy (#000080), Gold (#FFD700).`;
        
        finalResponse = await ai.models.generateContent({
          model: "gemini-3-pro-preview",
          contents: [
            ...fullContents,
            { role: 'model', parts: [{ functionCall: { name: call.name, args: call.args, id: call.id } }] },
            { role: 'user', parts: [{ functionResponse: { name: call.name, response: { result: mockRetrieval }, id: call.id } }] }
          ]
        });
      } else {
        finalResponse = toolResponse;
      }
    } else {
      // General Synthesis
      finalResponse = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: fullContents,
        config: {
          systemInstruction: `You are a helpful Brand Assistant for ${tenantContext}. Answer as best as you can.`
        }
      });
    }

    // Extraction
    const citations = finalResponse.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => ({
        title: chunk.web?.title || "Reference",
        uri: chunk.web?.uri || ""
      }))
      .filter((c: any) => c.uri) || [];

    return { 
      text: finalResponse.text || "I processed your request but couldn't generate a text response.", 
      citations: citations,
      toolUsed: route === "MARKET" ? "Market Analysis" : route === "INTERNAL" ? "Internal RAG" : "General Intelligence"
    };

  } catch (error) {
    console.error("Agentic Hub Error:", error);
    return { text: "An error occurred in the Agentic Hub orchestration. Please ensure your query is specific.", citations: [] };
  }
};
