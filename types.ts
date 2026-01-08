
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

export interface SiteSection {
  id: string;
  type: string;
  attributes: Record<string, any>;
}

export interface SitePage {
  id: string;
  name: string;
  path: string;
  sections: SiteSection[];
}

export interface WixSite {
  id: string;
  name: string;
  url: string;
  status: 'Live' | 'Preview' | 'Staging';
  lastSync: string;
  templateId: string;
  pages: SitePage[];
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
  wixIntegration?: {
    enabled: boolean;
    siteId?: string;
    apiKey?: string;
    autoSync: boolean;
    sites: WixSite[];
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

export interface ProductServiceDetail {
  id: string;
  name: string;
  type: 'Product' | 'Service';
  description: string;
  targetAudience: string;
  keyFeatures: string[];
  pricingModel: string;
  marketPosition: string;
  status: 'Beta' | 'Live' | 'Sunset';
  usp: string;
  competitors: string[];
  useCases: string[];
  techStack?: string;
  documentationUrl?: string;
  painPointsSolved: string;
  launchDate?: string;
}

export interface OnboardingDraft {
  companyName: string;
  linkedinUrl: string;
  website: string;
  industry: string;
  orgSize: string;
  orgType: string;
  tagline: string;
  isAuthorized: boolean;
  brandVoice: string;
  mission: string;
  valueProps: string[];
  services: string[]; 
  offerings: ProductServiceDetail[];
  assets: OnboardingAsset[];
  currentStep: number;
  updatedAt: string;
  wixAutomationEnabled: boolean;
}

export interface InfraStatus {
  gateway: 'Healthy' | 'Degraded' | 'Down';
  rateLimitRemaining: number;
  apiVersion: string;
  encryption: 'AES-256' | 'None';
  isolationMode: 'Row-Level Security' | 'Schema-Level';
}

export enum AppRoute {
  LOGIN = '/login',
  DASHBOARD = '/',
  ONBOARDING = '/onboarding',
  EXPLORE = '/explore',
  SITE_BUILDER = '/builder',
  SETTINGS = '/settings',
  PRICING = '/pricing'
}
