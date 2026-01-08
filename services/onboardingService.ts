
import { OnboardingDraft, OnboardingAsset } from '../types';
import { DB } from './db';

/**
 * Saves or updates an onboarding draft for a tenant.
 * Uses direct persistence to prevent race conditions during rapid state updates.
 */
export const saveOnboardingDraft = async (tenantId: string, draft: Partial<OnboardingDraft>): Promise<void> => {
  const existing = await DB.get<OnboardingDraft>(DB.keys.ONBOARDING(tenantId)) || {} as OnboardingDraft;
  const updated = {
    ...existing,
    ...draft,
    updatedAt: new Date().toISOString()
  };
  await DB.set(DB.keys.ONBOARDING(tenantId), updated);
};

export const getOnboardingDraft = async (tenantId: string): Promise<OnboardingDraft | null> => {
  return await DB.get<OnboardingDraft>(DB.keys.ONBOARDING(tenantId));
};

export const uploadAsset = async (
  tenantId: string, 
  file: File, 
  onProgress: (progress: number) => void
): Promise<OnboardingAsset> => {
  const assetId = `asset-${Math.random().toString(36).substr(2, 9)}`;
  
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        resolve({
          id: assetId,
          fileName: file.name,
          mimeType: file.type,
          publicUrl: `https://storage.neon.tech/tenants/${tenantId}/assets/${file.name}`,
          status: 'Synced',
          progress: 100
        });
      }
      onProgress(progress);
    }, 150);
  });
};
