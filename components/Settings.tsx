
import React, { useState, useEffect } from 'react';
import { Tenant, AppRoute } from '../types';
import { Link } from 'react-router-dom';
import * as BillingService from '../services/billingService';
import { getInfraStatus, ApiClient } from '../services/apiClient';
import { runDiagnostics, TestResult } from '../services/testService';

interface SettingsProps {
  tenant: Tenant;
  onUpdateTenant: (updatedTenant: Tenant) => void;
}

const Settings: React.FC<SettingsProps> = ({ tenant, onUpdateTenant }) => {
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [workspaceName, setWorkspaceName] = useState(tenant.name);
  const [infra, setInfra] = useState(getInfraStatus());
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  
  // Fix: Ensure 'sites' property is included in the initial state to satisfy the Tenant interface requirements
  const [wixConfig, setWixConfig] = useState(tenant.wixIntegration || {
    enabled: false,
    siteId: '',
    apiKey: '',
    autoSync: false,
    sites: []
  });

  useEffect(() => {
    setWorkspaceName(tenant.name);
    const interval = setInterval(() => setInfra(getInfraStatus()), 2000);
    return () => clearInterval(interval);
  }, [tenant]);

  const handleRunDiagnostics = async () => {
    setIsTesting(true);
    setTestResults([]);
    const results = await runDiagnostics(tenant.id);
    setTestResults(results);
    setIsTesting(false);
  };

  const handleOpenBillingPortal = async () => {
    if (!tenant.subscription?.stripeCustomerId) {
      alert("No active Stripe subscription found.\n\nPlease subscribe to a plan in the 'Billing' tab first.");
      return;
    }
    setIsPortalLoading(true);
    try {
      const url = await BillingService.createBillingPortalSession(tenant.subscription.stripeCustomerId);
      window.location.href = url;
    } catch (err) {
      alert("Billing session failed.");
    } finally {
      setIsPortalLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!workspaceName.trim()) return;
    setIsSaving(true);
    const client = new ApiClient(tenant.id);
    try {
      await client.request('settings/update', { method: 'PATCH' });
      const updatedTenant: Tenant = { 
        ...tenant, 
        name: workspaceName,
        wixIntegration: wixConfig
      };
      onUpdateTenant(updatedTenant);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Workspace Settings</h1>
        <div className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">
          ID: {tenant.id}
        </div>
      </div>

      {/* Infrastructure & Verification Panel */}
      <section className="bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-slate-800 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5">
          <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        
        <div className="relative z-10 space-y-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight">System Verification</h2>
              <p className="text-slate-400 font-medium mt-1 italic">Real-time Persistence & AI Diagnostics</p>
            </div>
            <button 
              onClick={handleRunDiagnostics}
              disabled={isTesting}
              className={`px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 ${isTesting ? 'opacity-50' : ''}`}
            >
              {isTesting ? (
                <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Running Diagnostic</>
              ) : 'Run Full Suite'}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-4 duration-500">
              {testResults.map(res => (
                <div key={res.id} className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{res.name}</span>
                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${res.status === 'Passed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                         {res.status}
                       </span>
                    </div>
                    <p className="text-xs font-bold text-slate-200 leading-relaxed">{res.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-slate-800/50">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Isolation</p>
              <p className="text-sm font-black text-white">{infra.isolation}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Encryption</p>
              <p className="text-sm font-black text-white">{infra.encryption}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">API Version</p>
              <p className="text-sm font-black text-white">{infra.apiVersion}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Gateway Quota</p>
              <p className="text-sm font-black text-white">{infra.rateLimit}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Digital Presence Automation Section */}
      <section className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Digital Presence Engine</h2>
            <p className="text-slate-500 font-medium mt-1">Automate building & deployment via Wix REST APIs / SDK</p>
          </div>
          <div className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${wixConfig.enabled ? 'bg-indigo-600' : 'bg-slate-200'}`} onClick={() => setWixConfig({...wixConfig, enabled: !wixConfig.enabled})}>
            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${wixConfig.enabled ? 'translate-x-6' : ''}`}></div>
          </div>
        </div>

        {wixConfig.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-300">
             <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Wix Site ID</label>
               <input type="text" value={wixConfig.siteId} onChange={(e) => setWixConfig({...wixConfig, siteId: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900" placeholder="e.g. site-123-abc" />
             </div>
             <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">REST API Key</label>
               <input type="password" value={wixConfig.apiKey} onChange={(e) => setWixConfig({...wixConfig, apiKey: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-900" placeholder="••••••••••••••••" />
             </div>
             <div className="md:col-span-2 flex items-center gap-4 bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                <input type="checkbox" checked={wixConfig.autoSync} onChange={(e) => setWixConfig({...wixConfig, autoSync: e.target.checked})} className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" id="autosync" />
                <label htmlFor="autosync" className="text-sm font-bold text-slate-700 cursor-pointer">
                  Enable Headless Auto-Sync (NFR-901): Automatically update Wix CMS from Enterprise RAG store.
                </label>
             </div>
          </div>
        )}
      </section>

      {/* Subscription Section */}
      <section className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Subscription & Billing</h2>
          <div className="flex gap-4">
            <div className="px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Plan</p>
              <p className="text-lg font-black text-indigo-600">{tenant.plan}</p>
            </div>
            <div className="px-5 py-3 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</p>
              <p className={`text-lg font-black ${tenant.subscription?.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                {tenant.subscription?.status?.toUpperCase() || 'INACTIVE'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 min-w-[200px]">
          <button onClick={handleOpenBillingPortal} disabled={isPortalLoading} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50">
            {isPortalLoading ? 'Syncing...' : 'Billing Portal'}
          </button>
          <Link to={AppRoute.PRICING} className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-center">Change Plan</Link>
        </div>
      </section>

      {/* Identity Configuration */}
      <section className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 space-y-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Identity & Sync</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Workspace Name</label>
            <input type="text" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} className="w-full px-6 py-4 bg-indigo-50/40 border-2 border-indigo-100 rounded-2xl outline-none font-black transition-all text-slate-900" />
          </div>
          <div className="space-y-3">
             <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Logo</label>
             <div className="flex items-center gap-4">
               <img src={tenant.logo} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100" alt="" />
               <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">Update Image</button>
             </div>
          </div>
        </div>
        <div className="pt-6 border-t border-slate-100 flex justify-end">
           <button onClick={handleSaveConfig} disabled={isSaving || (workspaceName === tenant.name && JSON.stringify(wixConfig) === JSON.stringify(tenant.wixIntegration))} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all disabled:opacity-50">
             {isSaving ? 'Syncing...' : 'Save Context'}
           </button>
        </div>
      </section>
    </div>
  );
};

export default Settings;
