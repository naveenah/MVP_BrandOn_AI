
import React, { useState, useEffect } from 'react';
import { Tenant, AppRoute } from '../types';
import { Link } from 'react-router-dom';
import * as BillingService from '../services/billingService';
import { getInfraStatus, ApiClient } from '../services/apiClient';

interface SettingsProps {
  tenant: Tenant;
  onUpdateTenant: (updatedTenant: Tenant) => void;
}

const Settings: React.FC<SettingsProps> = ({ tenant, onUpdateTenant }) => {
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [workspaceName, setWorkspaceName] = useState(tenant.name);
  const [infra, setInfra] = useState(getInfraStatus());

  useEffect(() => {
    setWorkspaceName(tenant.name);
    const interval = setInterval(() => setInfra(getInfraStatus()), 2000);
    return () => clearInterval(interval);
  }, [tenant]);

  const handleOpenBillingPortal = async () => {
    if (!tenant.subscription?.stripeCustomerId) {
      alert("No active Stripe subscription found for this workspace.\n\nPlease navigate to the 'Billing' tab and select a plan first to initialize your Stripe Customer identity.");
      return;
    }

    setIsPortalLoading(true);
    try {
      const url = await BillingService.createBillingPortalSession(tenant.subscription.stripeCustomerId);
      setTimeout(() => {
        window.location.href = url;
      }, 500);
    } catch (err) {
      console.error("Billing Context Error:", err);
      alert("System Error: Failed to generate Stripe Portal session.");
    } finally {
      setTimeout(() => setIsPortalLoading(false), 2000);
    }
  };

  const handleSaveConfig = async () => {
    if (!workspaceName.trim()) return;
    setIsSaving(true);
    
    // NFR-601: Enforcing isolated request through API client
    const client = new ApiClient(tenant.id);
    try {
      await client.request('settings/update', { method: 'PATCH' });
      
      const updatedTenant: Tenant = { ...tenant, name: workspaceName };
      onUpdateTenant(updatedTenant);
      
      const n = document.createElement('div');
      n.className = "fixed bottom-8 right-8 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl font-black z-[500] animate-in slide-in-from-right-10";
      n.innerText = "✓ Configuration Synchronized";
      document.body.appendChild(n);
      setTimeout(() => n.remove(), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Workspace Settings</h1>
        <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">
          ID: {tenant.id}
        </div>
      </div>

      {/* NFR & Infrastructure Monitoring (NFR-601 to NFR-803) */}
      <section className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 border border-slate-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Infrastructure & Security</h2>
              <p className="text-slate-400 font-medium mt-1">NFR Compliance & Real-time System Status</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20">
               <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
               <span className="text-xs font-black uppercase tracking-widest">Gateway: {infra.gateway}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">API Context</p>
              <p className="text-sm font-black text-white">{infra.apiVersion}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 italic">Stateless (NFR-801)</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Isolation Mode</p>
              <p className="text-sm font-black text-white">{infra.isolation}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 italic">Scoped Repo (NFR-601)</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Encryption</p>
              <p className="text-sm font-black text-white">{infra.encryption}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 italic">AES-256 (NFR-602)</p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Rate Limit</p>
              <p className="text-sm font-black text-white">{infra.rateLimit}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 italic">Kong (NFR-603)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Section */}
      <section className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Subscription & Billing</h2>
            <p className="text-slate-500 font-medium">Enterprise tiers and payment methods managed via Stripe.</p>
            <div className="flex items-center gap-4 mt-6">
              <div className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Tier</p>
                <p className="text-xl font-black text-indigo-600">{tenant.plan}</p>
              </div>
              <div className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <p className={`text-xl font-black ${tenant.subscription?.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {tenant.subscription?.status ? tenant.subscription.status.toUpperCase() : 'NO ACTIVE PLAN'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 min-w-[200px]">
            <button 
              onClick={handleOpenBillingPortal}
              disabled={isPortalLoading}
              className="group relative px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 overflow-hidden"
            >
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isPortalLoading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Redirecting...</span></>
                ) : (
                  <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg><span>Manage via Stripe</span></>
                )}
              </div>
            </button>
            <Link to={AppRoute.PRICING} className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-center">Change Plan</Link>
          </div>
        </div>
      </section>

      {/* General Settings Section */}
      <section className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-slate-100 border border-slate-100 space-y-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Identity & Branding</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Workspace Name</label>
            <input 
              type="text" 
              value={workspaceName} 
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g. Acme Global"
              className="w-full px-6 py-4 bg-indigo-50/40 border-2 border-indigo-100 rounded-2xl focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 outline-none font-black transition-all text-slate-900 placeholder-slate-400" 
            />
          </div>
          <div className="space-y-3">
             <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Workspace Logo</label>
             <div className="flex items-center gap-4">
               <div className="relative group">
                 <img src={tenant.logo} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm" alt="Workspace Logo" />
                 <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 </div>
               </div>
               <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Upload New</button>
             </div>
          </div>
        </div>
        <div className="pt-6 border-t border-slate-100 flex justify-end">
           <button onClick={handleSaveConfig} disabled={isSaving || workspaceName === tenant.name} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
             {isSaving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Syncing...</span></> : <span>Save Configuration</span>}
           </button>
        </div>
      </section>
    </div>
  );
};

export default Settings;
