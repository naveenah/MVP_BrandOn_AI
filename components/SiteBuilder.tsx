
import React, { useState, useEffect } from 'react';
import { Tenant, WixSite } from '../types';
import * as WixService from '../services/wixService';
import * as OnboardingService from '../services/onboardingService';
import { DB } from '../services/db';

interface SiteBuilderProps {
  tenant: Tenant;
}

const SiteBuilder: React.FC<SiteBuilderProps> = ({ tenant }) => {
  const [sites, setSites] = useState<WixSite[]>(tenant.wixIntegration?.sites || []);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [buildStep, setBuildStep] = useState('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Sync sites if tenant updates from parent or store
  useEffect(() => {
    setSites(tenant.wixIntegration?.sites || []);
  }, [tenant.wixIntegration?.sites]);

  const handleCreateSite = async () => {
    setIsBuilding(true);
    setBuildStep('Calling Wix Account API: Duplicate Site...');
    
    try {
      const newSite = await WixService.cloneTemplateSite(tenant.id, `${tenant.name} Digital Twin`);
      
      setBuildStep('Configuring Velo Backend & Wix CLI...');
      await new Promise(r => setTimeout(r, 1000));
      
      const updatedSites = [...sites, newSite];
      setSites(updatedSites);
      
      // Update tenant in persistent store
      const tenants = await DB.get<Tenant[]>(DB.keys.TENANTS) || [];
      const updatedTenants = tenants.map(t => t.id === tenant.id ? {
        ...t,
        wixIntegration: { ...(t.wixIntegration || { enabled: true, autoSync: true, apiKey: '' }), sites: updatedSites }
      } : t);
      await DB.set(DB.keys.TENANTS, updatedTenants);
      window.dispatchEvent(new CustomEvent('tenantUpdated', { detail: { tenantId: tenant.id } }));

    } catch (e) {
      alert('Wix API Bridge Failed');
    } finally {
      setIsBuilding(false);
      setBuildStep('');
    }
  };

  const handleSyncCMS = async (siteId: string) => {
    setIsSyncing(true);
    setSyncStatus('Retrieving Enterprise RAG Store...');
    
    const draft = await OnboardingService.getOnboardingDraft(tenant.id);
    if (!draft || !draft.offerings || draft.offerings.length === 0) {
      alert('No product data found in RAG store. Please complete onboarding step 3 (Offerings Portfolio).');
      setIsSyncing(false);
      return;
    }

    setSyncStatus(`Pushing ${draft.offerings.length} entities to Wix Data Collections...`);
    await WixService.syncEnterpriseCMS(tenant.id, siteId, draft.offerings);
    
    setSyncStatus('Success: Wix Headless Sync Complete.');
    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatus(null);
    }, 2000);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Digital Presence Builder</h1>
          <p className="text-slate-500 font-medium">Automate Wix infrastructure, CMS content, and deployment via REST APIs.</p>
        </div>
        <button 
          onClick={handleCreateSite}
          disabled={isBuilding}
          className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center gap-3"
        >
          {isBuilding ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> {buildStep}</>
          ) : (
            <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg> Clone New Wix Instance</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Managed Sites Queue */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Enterprise Site Cluster</h2>
          {sites.length === 0 ? (
            <div className="bg-white border-4 border-dashed border-slate-100 rounded-[3rem] p-20 text-center flex flex-col items-center">
               <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
                 <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" /></svg>
               </div>
               <p className="text-slate-500 font-bold max-w-xs">No Wix sites programmatically managed. Initialize your first clone to start.</p>
            </div>
          ) : (
            sites.map(site => (
              <div key={site.id} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 flex flex-col md:flex-row gap-8 group hover:border-indigo-200 transition-all">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-slate-900">{site.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      site.status === 'Live' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {site.status}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Wix Site URL</p>
                    <a href={site.url} target="_blank" className="text-sm font-bold text-indigo-600 hover:underline flex items-center gap-2">
                      {site.url}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Last RAG Sync</p>
                      <p className="text-xs font-bold text-slate-700">{new Date(site.lastSync).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Velo Version</p>
                      <p className="text-xs font-bold text-slate-700">1.4.2-enterprise</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-3">
                  <button 
                    onClick={() => handleSyncCMS(site.id)}
                    disabled={isSyncing}
                    className="px-6 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                  >
                    {isSyncing ? 'Syncing...' : 'Sync Enterprise CMS'}
                  </button>
                  <button 
                    onClick={() => window.open(site.url, '_blank')}
                    className="px-6 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all text-center"
                  >
                    Launch Wix Editor
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Builder Sidebar - Automation Stats */}
        <div className="space-y-8">
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute -top-10 -right-10 opacity-10">
               <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
             </div>
             <h3 className="text-lg font-black tracking-tight mb-6">Automation Console</h3>
             <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">REST API Gateway</span>
                  <span className="text-xs font-black text-emerald-400">ENCRYPTED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">Headless Sync</span>
                  <span className="text-xs font-black text-blue-400">{isSyncing ? 'RUNNING' : 'STANDBY'}</span>
                </div>
                <div className="pt-6 border-t border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active CI/CD Pipelines</span>
                    <span className="text-lg font-black">04</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-2/3"></div>
                  </div>
                </div>
             </div>
           </div>

           {syncStatus && (
             <div className="bg-indigo-50 border-2 border-indigo-100 rounded-3xl p-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                  <p className="text-xs font-black text-indigo-900 uppercase tracking-tight">{syncStatus}</p>
                </div>
             </div>
           )}

           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl">
             <h3 className="text-sm font-black text-slate-900 mb-6 uppercase tracking-widest">Build Capabilities</h3>
             <ul className="space-y-4">
               {[
                 'Programmatic Site Cloning',
                 'Bulk Data CMS Import',
                 'Headless Product Management',
                 'Wix CLI Deployment Flows',
                 'Velo GitHub Integration'
               ].map((item, i) => (
                 <li key={i} className="flex items-center gap-3">
                   <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                   <span className="text-xs font-bold text-slate-600">{item}</span>
                 </li>
               ))}
             </ul>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SiteBuilder;
