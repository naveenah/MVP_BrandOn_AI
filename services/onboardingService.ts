
import { OnboardingDraft, OnboardingAsset } from '../types';

const STORAGE_KEY_PREFIX = 'onboarding_draft_';

export const saveOnboardingDraft = async (tenantId: string, draft: Partial<OnboardingDraft>): Promise<void> => {
  // Simulating DRF PATCH /api/v1/onboarding/draft
  const existingRaw = localStorage.getItem(STORAGE_KEY_PREFIX + tenantId);
  const existing = existingRaw ? JSON.parse(existingRaw) : {};
  
  const updated = {
    ...existing,
    ...draft,
    updatedAt: new Date().toISOString()
  };
  
  localStorage.setItem(STORAGE_KEY_PREFIX + tenantId, JSON.stringify(updated));
  return new Promise(resolve => setTimeout(resolve, 300));
};

export const getOnboardingDraft = async (tenantId: string): Promise<OnboardingDraft | null> => {
  // Simulating DRF GET /api/v1/onboarding/draft
  const data = localStorage.getItem(STORAGE_KEY_PREFIX + tenantId);
  if (!data) return null;
  return JSON.parse(data);
};

export const uploadAsset = async (
  tenantId: string, 
  file: File, 
  onProgress: (progress: number) => void
): Promise<OnboardingAsset> => {
  // Simulating GCS/Google File Store Multipart Upload
  const assetId = `asset-${Math.random().toString(36).substr(2, 9)}`;
  
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        resolve({
          id: assetId,
          fileName: file.name,
          mimeType: file.type,
          publicUrl: `https://storage.google.com/tenants/${tenantId}/onboarding/${file.name}`,
          status: 'Synced',
          progress: 100
        });
      }
      onProgress(progress);
    }, 200);
  });
};
