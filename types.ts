
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Tenant {
  id: string;
  name: string;
  logo: string;
  plan: 'Basic' | 'Enterprise';
  status: 'Active' | 'Onboarding' | 'Inactive';
}

export interface OnboardingAsset {
  id: string;
  fileName: string;
  mimeType: string;
  publicUrl: string;
  status: 'Uploading' | 'Synced';
  progress: number;
}

export interface OnboardingDraft {
  companyName: string;
  industry: string;
  brandVoice: string;
  mission: string;
  valueProps: string[];
  services: string[];
  assets: OnboardingAsset[];
  currentStep: number;
  updatedAt: string;
}

export enum AppRoute {
  LOGIN = '/login',
  DASHBOARD = '/',
  ONBOARDING = '/onboarding',
  EXPLORE = '/explore',
  SETTINGS = '/settings'
}
