
import React, { useState } from 'react';
import { SubscriptionTier, Tenant } from '../types';
import * as BillingService from '../services/billingService';

interface PricingProps {
  tenant: Tenant;
  onSubscriptionUpdate: (sub: any) => void;
}

const Pricing: React.FC<PricingProps> = ({ tenant, onSubscriptionUpdate }) => {
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (tier === 'Enterprise') {
      window.location.href = 'mailto:sales@brandos.com?subject=Enterprise Inquiry';
      return;
    }

    setLoadingTier(tier);
    try {
      const url = await BillingService.createCheckoutSession(tenant.id, tier);
      
      // Simulate redirect and successful return from Stripe
      // In real life: window.location.href = url;
      console.log("Redirecting to Stripe:", url);
      
      setTimeout(() => {
        const sub = BillingService.simulateSuccessfulPaymentWebhook(tenant.id, tier);
        onSubscriptionUpdate(sub);
        setLoadingTier(null);
        alert(`Successfully subscribed to ${tier} plan! (Simulated Stripe Flow)`);
      }, 2000);
    } catch (err) {
      console.error(err);
      setLoadingTier(null);
    }
  };

  const plans = [
    {
      name: 'Basic' as SubscriptionTier,
      price: '$99',
      desc: 'Perfect for small startups looking to automate their basic social presence.',
      features: ['50 AI Content Credits', 'Single Brand Identity', 'Standard Support', 'Basic Analytics'],
      buttonText: 'Start Basic',
      highlight: false
    },
    {
      name: 'Pro' as SubscriptionTier,
      price: '$199',
      desc: 'The power user choice for growing enterprises with high-frequency content needs.',
      features: ['Unlimited AI Content', 'Agentic Explore Hub', 'Competitor Analysis', 'Priority Human Support', 'Advanced Market RAG'],
      buttonText: 'Go Pro',
      highlight: true
    },
    {
      name: 'Enterprise' as SubscriptionTier,
      price: 'Custom',
      desc: 'Full-scale brand OS for global organizations with dedicated infrastructure.',
      features: ['Dedicated AI Training', 'Custom API Gateways', 'SLA Guarantee', 'Dedicated Account Manager', 'On-premise LLM options'],
      buttonText: 'Contact Sales',
      highlight: false
    }
  ];

  return (
    <div className="py-12 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">Scale Your Brand Engine</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">Choose the tier that matches your enterprise velocity. All plans include multi-tenant isolation and secure cloud storage.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrent = tenant.plan === plan.name;
          return (
            <div 
              key={plan.name} 
              className={`relative flex flex-col p-8 bg-white rounded-[2.5rem] border-2 transition-all duration-500 ${
                plan.highlight 
                  ? 'border-indigo-600 shadow-2xl shadow-indigo-100 scale-105 z-10' 
                  : 'border-slate-100 shadow-xl shadow-slate-100 hover:border-slate-200'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-black text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-slate-400 font-bold">/mo</span>}
                </div>
                <p className="mt-4 text-slate-500 text-sm leading-relaxed font-medium">{plan.desc}</p>
              </div>

              <div className="flex-1 space-y-4 mb-10">
                {plan.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{f}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={isCurrent || loadingTier !== null}
                onClick={() => handleSelectPlan(plan.name)}
                className={`w-full py-5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${
                  isCurrent 
                    ? 'bg-emerald-50 text-emerald-600 cursor-default'
                    : plan.highlight 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200' 
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {loadingTier === plan.name ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Connecting...
                  </div>
                ) : isCurrent ? 'Current Environment' : plan.buttonText}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-20 p-10 bg-slate-900 rounded-[3rem] text-center text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" /></svg>
        </div>
        <h2 className="text-3xl font-black mb-4 relative z-10 tracking-tight">Need a custom brand architecture?</h2>
        <p className="text-slate-400 max-w-xl mx-auto mb-8 relative z-10 font-medium text-lg">Our engineering team can build dedicated AI models trained exclusively on your corporate datasets for maximum security and alignment.</p>
        <button className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all relative z-10 shadow-2xl">Book Technical Demo</button>
      </div>
    </div>
  );
};

export default Pricing;
