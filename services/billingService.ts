
import { SubscriptionTier, Subscription } from '../types';

// Mock price IDs from Stripe Dashboard
export const STRIPE_PRICES = {
  BASIC: 'price_basic_99',
  PRO: 'price_pro_199',
  ENTERPRISE: 'price_enterprise_custom'
};

export const createCheckoutSession = async (tenantId: string, tier: SubscriptionTier): Promise<string> => {
  console.log(`Creating Stripe Checkout Session for Tenant: ${tenantId}, Tier: ${tier}`);
  // In a real DRF backend:
  // session = stripe.checkout.Session.create(metadata={'tenant_id': tenantId}, line_items=[...])
  // return session.url
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return a mock "Stripe Checkout" URL
      resolve(`https://checkout.stripe.com/pay/mock_session_${Math.random().toString(36).substr(2, 9)}?tenant=${tenantId}&tier=${tier}`);
    }, 1000);
  });
};

export const createBillingPortalSession = async (stripeCustomerId: string): Promise<string> => {
  console.log(`Creating Stripe Billing Portal for Customer: ${stripeCustomerId}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return a more realistic mock portal URL (for demo purposes)
      resolve(`https://billing.stripe.com/p/session/test_YWNjdF8xSnB0QzBBTEhLdHV3RlhWfGZsX3Rlc3RfNzhEaEpOQ1R6d2tWM0V1T0VqTnl6RGhG0000000000`);
    }, 1200);
  });
};

/**
 * Simulated Webhook Handler (FR-403)
 * In production, this would be a DRF view receiving POST from Stripe.
 */
export const simulateSuccessfulPaymentWebhook = (tenantId: string, tier: SubscriptionTier): Subscription => {
  const sub: Subscription = {
    id: `sub_${Math.random().toString(36).substr(2, 9)}`,
    tenantId,
    stripeCustomerId: `cus_${Math.random().toString(36).substr(2, 9)}`,
    stripeSubscriptionId: `id_${Math.random().toString(36).substr(2, 9)}`,
    status: 'active',
    tier
  };
  
  // Persist to "Neon DB" (local storage)
  const savedTenants = localStorage.getItem('tenants');
  if (savedTenants) {
    const tenants = JSON.parse(savedTenants);
    const updated = tenants.map((t: any) => t.id === tenantId ? { ...t, subscription: sub, plan: tier } : t);
    localStorage.setItem('tenants', JSON.stringify(updated));
  }
  
  return sub;
};
