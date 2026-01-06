
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export type SubscriptionTier = 'Basic' | 'Pro' | 'Enterprise';
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'none' | 'incomplete';

export interface Subscription {
  id: string;
  tenantId: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
}

export type ChannelType = 'LinkedIn' | 'X' | 'Google Business' | 'YouTube' | 'Medium' | 'Shopify';
export type AutomationStatus = 'Pending' | 'Active' | 'Generating' | 'Failed';

export interface AutomationChannel {
  type: ChannelType;
  status: AutomationStatus;
  lastAction?: string;
}

export interface ScheduledPost {
  id: string;
  platform: ChannelType;
  title: string;
  publishAt: string;
  status: 'Scheduled' | 'Published' | 'Draft';
  contentSummary: string;
}

export interface Tenant {
  id: string;
  name: string;
  logo: string;
  plan: SubscriptionTier;
  status: 'Active' | 'Onboarding' | 'Inactive';
  subscription?: Subscription;
  automationWorkflow?: {
    channels: AutomationChannel[];
    overallProgress: number;
  };
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
  SETTINGS = '/settings',
  PRICING = '/pricing'
}
