
import { GoogleGenAI, Type } from "@google/genai";
import { ChannelType, AutomationChannel, ScheduledPost, Tenant } from '../types';
import { DB } from './db';
import * as OnboardingService from './onboardingService';

const CHANNELS: ChannelType[] = ['LinkedIn', 'X', 'Google Business', 'YouTube', 'Medium', 'Shopify'];
const API_KEY = process.env.API_KEY || "";

export const synthesizeAIPipeline = async (tenantId: string): Promise<ScheduledPost[]> => {
  if (!API_KEY) return generateStaticFallback(tenantId);

  const draft = await OnboardingService.getOnboardingDraft(tenantId);
  if (!draft) return generateStaticFallback(tenantId);

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `Synthesize a 1-week strategic content pipeline for ${draft.companyName} (${draft.industry}). Mission: ${draft.mission}. Voice: ${draft.brandVoice}. Return exactly 4 posts.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              platform: { type: Type.STRING },
              title: { type: Type.STRING },
              contentSummary: { type: Type.STRING },
              daysFromNow: { type: Type.NUMBER }
            }
          }
        }
      }
    });

    const generated = JSON.parse(response.text || "[]");
    return generated.map((item: any, idx: number) => ({
      id: `sp-ai-${Date.now()}-${idx}`,
      platform: item.platform as ChannelType,
      title: item.title,
      publishAt: new Date(Date.now() + item.daysFromNow * 86400000).toISOString(),
      status: 'Scheduled',
      contentSummary: item.contentSummary
    }));
  } catch (error) {
    return generateStaticFallback(tenantId);
  }
};

export const generateBrandIntelligenceReport = async (tenantId: string): Promise<string> => {
  if (!API_KEY) return "AI Configuration Missing.";
  const draft = await OnboardingService.getOnboardingDraft(tenantId);
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `Generate a high-level "Enterprise Intelligence Report" for ${draft?.companyName || 'the organization'}. 1. Summary, 2. Strategy, 3. Future Opportunities.`;
  try {
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: [{ parts: [{ text: prompt }] }] });
    return response.text || "Failed to generate.";
  } catch (e) {
    return "Error synthesizing intelligence report.";
  }
};

const generateStaticFallback = (tenantId: string): ScheduledPost[] => ([{
  id: `sp-fb-1-${tenantId}`,
  platform: 'LinkedIn',
  title: 'Strategic Vision 2025',
  publishAt: new Date(Date.now() + 86400000).toISOString(),
  status: 'Scheduled',
  contentSummary: 'Establishing brand authority in the new ecosystem.'
}]);

export const triggerAutomationRipple = async (tenantId: string): Promise<void> => {
  const initialChannels: AutomationChannel[] = CHANNELS.map(type => ({ type, status: 'Pending' }));
  
  const updateStore = async (channels: AutomationChannel[], progress: number) => {
    const tenants = await DB.get<Tenant[]>(DB.keys.TENANTS) || [];
    const updated = tenants.map(t => t.id === tenantId ? { 
      ...t, 
      automationWorkflow: { channels, overallProgress: progress } 
    } : t);
    await DB.set(DB.keys.TENANTS, updated);
    window.dispatchEvent(new CustomEvent('tenantUpdated', { detail: { tenantId } }));
  };

  await updateStore(initialChannels, 5);

  CHANNELS.forEach((type, index) => {
    setTimeout(async () => {
      const tenants = await DB.get<Tenant[]>(DB.keys.TENANTS);
      const tenant = tenants?.find(t => t.id === tenantId);
      
      // Defensive check for initialization
      const currentChannels = tenant?.automationWorkflow?.channels || initialChannels;
      
      const updatedChannels = currentChannels.map(c => 
        c.type === type ? { ...c, status: 'Active' as const, lastAction: 'Synced with cloud context' } : c
      );
      
      const progress = Math.min(100, 10 + (index + 1) * 15);
      await updateStore(updatedChannels, progress);

      if (index === CHANNELS.length - 1) {
        const posts = await synthesizeAIPipeline(tenantId);
        await DB.set(DB.keys.PIPELINE(tenantId), posts);
        window.dispatchEvent(new CustomEvent('pipelineUpdated', { detail: { tenantId } }));
      }
    }, 1000 + (index * 800));
  });
};

export const createScheduledPost = async (tenantId: string, post: Omit<ScheduledPost, 'id'>): Promise<ScheduledPost> => {
  const newPost = { ...post, id: `sp-${Date.now()}` } as ScheduledPost;
  const existing = await getScheduledPosts(tenantId);
  await DB.set(DB.keys.PIPELINE(tenantId), [newPost, ...existing]);
  window.dispatchEvent(new CustomEvent('pipelineUpdated', { detail: { tenantId } }));
  return newPost;
};

export const getScheduledPosts = async (tenantId: string): Promise<ScheduledPost[]> => {
  return await DB.get<ScheduledPost[]>(DB.keys.PIPELINE(tenantId)) || [];
};

export const clearSchedule = async (tenantId: string) => {
  await DB.remove(DB.keys.PIPELINE(tenantId));
  window.dispatchEvent(new CustomEvent('pipelineUpdated', { detail: { tenantId } }));
};
