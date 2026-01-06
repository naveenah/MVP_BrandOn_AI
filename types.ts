
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

export interface BrandAsset {
  id: string;
  name: string;
  type: 'Logo' | 'ColorPalette' | 'Guideline' | 'SocialPost';
  url: string;
  createdAt: string;
}

export interface OnboardingData {
  companyName: string;
  industry: string;
  brandVoice: string;
  mission: string;
  step: number;
}

export enum AppRoute {
  LOGIN = '/login',
  DASHBOARD = '/',
  ONBOARDING = '/onboarding',
  EXPLORE = '/explore',
  SETTINGS = '/settings'
}
