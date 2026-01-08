
import React, { useState, useEffect, useRef } from 'react';
import { Tenant, WixSite } from '../types';
import * as WixService from '../services/wixService';
import { getBrandAssistantResponse } from '../services/geminiService';
import { DB } from '../services/db';

interface SiteBuilderProps {
  tenant: Tenant;
}

interface SiteSection {
  id: string;
  type: string;
}

const WIX_TEMPLATES = [
  { id: 'enterprise', name: 'Enterprise Base', desc: 'Standard sleek corporate layout with radial gradients.' },
  { id: 'portfolio', name: 'Modern Portfolio', desc: 'Dark-themed, visual-centric minimal aesthetic.' },
  { id: 'saas', name: 'SaaS Landing', desc: 'Clean, high-contrast conversion-optimized structure.' }
];

const SiteBuilder: React.FC<SiteBuilderProps> = ({ tenant }) => {
  const [sites, setSites] = useState<WixSite[]>(tenant.wixIntegration?.sites || []);
  const [activeEditorSite, setActiveEditorSite] = useState<WixSite | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStep, setBuildStep] = useState('');
  const [activeTab, setActiveTab] = useState<'design' | 'templates' | 'data'>('design');
  const [editorView, setEditorView] = useState<'Desktop' | 'Tablet' | 'Mobile'>('Desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [sections, setSections] = useState<SiteSection[]>([]);
  // Used to force iframe re-mount
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    setSites(tenant.wixIntegration?.sites || []);
  }, [tenant.wixIntegration?.sites]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'REQUEST_DELETE') {
        removeSection(event.data.payload.id);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sections]);

  const handleCreateSite = async (templateName: string = 'Enterprise Base') => {
    setIsBuilding(true);
    setBuildStep(`Provisioning ${templateName}...`);
    
    try {
      const newSite = await WixService.cloneTemplateSite(tenant.id, `${tenant.name} Instance`, templateName);
      const updatedSites = [...sites, newSite];
      
      const tenants = await DB.get<Tenant[]>(DB.keys.TENANTS) || [];
      const updatedTenants = tenants.map(t => t.id === tenant.id ? {
        ...t,
        wixIntegration: { ...(t.wixIntegration || { enabled: true, autoSync: true, sites: [] }), sites: updatedSites }
      } : t);
      
      await DB.set(DB.keys.TENANTS, updatedTenants);
      setSites(updatedSites);
      setActiveEditorSite(newSite);
      setSections([]);
      setIframeKey(prev => prev + 1);
      window.dispatchEvent(new CustomEvent('tenantUpdated', { detail: { tenantId: tenant.id } }));
    } catch (e) {
      alert('Failed to provision site.');
    } finally {
      setIsBuilding(false);
      setBuildStep('');
    }
  };

  const applyTemplate = async (templateName: string) => {
    if (!activeEditorSite) return;
    setIsBuilding(true);
    setBuildStep(`Switching to ${templateName}...`);
    
    try {
      const newUrl = await WixService.updateSiteTemplate(activeEditorSite.id, activeEditorSite.name, templateName);
      const updatedSite = { ...activeEditorSite, url: newUrl, templateId: templateName };
      
      const updatedSites = sites.map(s => s.id === activeEditorSite.id ? updatedSite : s);
      const tenants = await DB.get<Tenant[]>(DB.keys.TENANTS) || [];
      const updatedTenants = tenants.map(t => t.id === tenant.id ? {
        ...t,
        wixIntegration: { ...(t.wixIntegration || { enabled: true, autoSync: true, sites: [] }), sites: updatedSites }
      } : t);

      await DB.set(DB.keys.TENANTS, updatedTenants);
      setSites(updatedSites);
      setActiveEditorSite(updatedSite);
      setSections([]);
      // Force iframe remount to ensure the data: URL is processed fresh
      setIframeKey(prev => prev + 1);
    } catch (e) {
      alert('Failed to update template.');
    } finally {
      setIsBuilding(false);
      setBuildStep('');
    }
  };

  const addSection = (type: string) => {
    const id = `sec-${Date.now()}`;
    const newSection = { id, type };
    setSections(prev => [...prev, newSection]);

    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'ADD_SECTION',
        payload: { id, type, siteName: activeEditorSite?.name || 'Enterprise' }
      }, '*');
    }
  };

  const removeSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'REMOVE_SECTION',
        payload: { id }
      }, '*');
    }
  };

  const handleAiCopyGen = async () => {
    if (sections.length === 0) return;
    setIsGeneratingCopy(true);
    try {
      const prompt = "Create a powerful 8-word hero headline for a corporate site based on brand excellence.";
      const result = await getBrandAssistantResponse(prompt, tenant.id, tenant.name);
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'UPDATE_ELEMENT',
          payload: { id: 'hero-title', text: result.text.replace(/"/g, '') }
        }, '*');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const getCanvasWidth = () => {
    if (editorView === 'Tablet') return '768px';
    if (editorView === 'Mobile') return '390px';
    return '100%';
  };

  if (activeEditorSite) {
    return (
      <div className="fixed inset-0 z-[150] bg-slate-900 flex flex-col animate-in fade-in duration-300">
        <div className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveEditorSite(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Editing Site</p>
               <h2 className="text-sm font-black text-white">{activeEditorSite.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            {(['design', 'templates', 'data'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase shadow-xl hover:bg-indigo-700 transition-all">
              Deploy Live
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col overflow-y-auto no-scrollbar">
            <div className="p-6 space-y-8">
              {activeTab === 'design' && (
                <div className="space-y-6 animate-in slide-in-from-left-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Widgets</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {['Header', 'Hero', 'Grid', 'Pricing', 'Contact'].map(tool => (
                      <button key={tool} onClick={() => addSection(tool)} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-indigo-500 transition-all group text-left">
                        <div className="w-8 h-8 bg-slate-800 rounded-lg mb-2 flex items-center justify-center text-slate-500 group-hover:text-indigo-400">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <p className="text-[10px] font-black text-white uppercase">{tool}</p>
                      </button>
                    ))}
                  </div>
                  
                  <div className="pt-6 border-t border-slate-800">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Site Layers</h3>
                    <div className="space-y-2">
                      {sections.length === 0 && <p className="text-[10px] text-slate-600 italic">No sections added.</p>}
                      {sections.map(s => (
                        <div key={s.id} className="flex items-center justify-between p-3.5 bg-slate-900 rounded-xl border border-slate-800 group hover:border-indigo-500">
                          <span className="text-[10px] font-black text-white uppercase tracking-widest">{s.type}</span>
                          <button onClick={() => removeSection(s.id)} className="text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10 p-1 rounded">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={handleAiCopyGen} disabled={isGeneratingCopy || sections.length === 0} className="w-full py-4 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 rounded-2xl text-[10px] font-black uppercase disabled:opacity-20 hover:bg-indigo-600/20 transition-all">
                    {isGeneratingCopy ? 'Gemini Thinking...' : 'Rewrite Copy via AI'}
                  </button>
                </div>
              )}

              {activeTab === 'templates' && (
                <div className="space-y-6 animate-in slide-in-from-left-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Base Layouts</h3>
                  <div className="space-y-4">
                    {WIX_TEMPLATES.map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => applyTemplate(t.name)}
                        className={`w-full text-left p-5 bg-slate-900 border rounded-3xl transition-all hover:scale-[1.02] ${activeEditorSite.templateId === t.name ? 'border-indigo-600 ring-4 ring-indigo-600/20' : 'border-slate-800 hover:border-slate-600'}`}
                      >
                        <p className="text-sm font-black text-white mb-1">{t.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          <main className="flex-1 bg-slate-900 flex flex-col p-4 md:p-10 relative">
            <div className="flex justify-center gap-2 mb-6">
              {(['Desktop', 'Tablet', 'Mobile'] as const).map(view => (
                <button key={view} onClick={() => setEditorView(view)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${editorView === view ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
                  {view}
                </button>
              ))}
            </div>

            <div className="mx-auto flex-1 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800 flex flex-col transition-all duration-700 relative" style={{ width: getCanvasWidth() }}>
              <div className="w-full h-10 bg-slate-100 flex items-center px-6 border-b border-slate-200">
                <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-slate-300"></div><div className="w-3 h-3 rounded-full bg-slate-300"></div><div className="w-3 h-3 rounded-full bg-slate-300"></div></div>
                <div className="mx-auto bg-white px-4 py-1 rounded-full text-[10px] text-slate-400 font-black border border-slate-200 flex items-center gap-2">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   {activeEditorSite.id}.wix-enterprise.app
                </div>
              </div>
              <div className="flex-1 relative bg-slate-50 overflow-hidden">
                {isBuilding && (
                  <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center transition-all">
                    <div className="text-center p-8 bg-white rounded-[2.5rem] shadow-2xl">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{buildStep}</p>
                    </div>
                  </div>
                )}
                <iframe 
                  key={iframeKey} 
                  ref={iframeRef} 
                  src={activeEditorSite.url} 
                  className="w-full h-full border-none bg-white" 
                  sandbox="allow-scripts allow-same-origin" 
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Site Builder</h1>
          <p className="text-slate-500 font-medium">Provision and manage Wix Cloud instances with enterprise RAG context.</p>
        </div>
        <button onClick={() => handleCreateSite()} disabled={isBuilding} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase shadow-2xl disabled:opacity-50 hover:bg-slate-800 transition-all flex items-center gap-3">
          {isBuilding ? 'Provisioning...' : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg> New Wix Site</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {sites.length === 0 ? (
          <div className="col-span-full bg-white border-4 border-dashed border-slate-100 rounded-[3rem] p-24 text-center">
             <p className="text-slate-400 font-black uppercase text-xs">No sites provisioned in this cluster.</p>
          </div>
        ) : (
          sites.map(site => (
            <div key={site.id} className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 flex flex-col md:flex-row gap-8 group hover:border-indigo-200 transition-all animate-in zoom-in-95">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-2xl font-black text-slate-900">{site.name}</h3>
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-black uppercase">{site.status}</span>
                </div>
                <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Architecture</p>
                  <p className="text-xs font-black text-slate-700">Wix Velo Headless Engine</p>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-3 min-w-[180px]">
                <button onClick={() => setActiveEditorSite(site)} className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all">
                  Launch Editor
                </button>
                <div className="text-[10px] text-center font-bold text-slate-400 uppercase">Last Sync: {new Date(site.lastSync).toLocaleDateString()}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SiteBuilder;
