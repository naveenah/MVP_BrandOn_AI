
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Tenant, WixSite, SitePage, SiteSection } from '../types';
import * as WixService from '../services/wixService';
import { getBrandAssistantResponse } from '../services/geminiService';
import { DB } from '../services/db';

interface SiteBuilderProps {
  tenant: Tenant;
}

const WIX_TEMPLATES = [
  { id: 'enterprise', name: 'Enterprise Base', desc: 'Standard sleek corporate layout with radial gradients.' },
  { id: 'portfolio', name: 'Modern Portfolio', desc: 'Dark-themed, visual-centric minimal aesthetic.' },
  { id: 'saas', name: 'SaaS Landing', desc: 'Clean, high-contrast conversion-optimized structure.' }
];

const WIDGET_DEFS: Record<string, string[]> = {
  'Header': ['siteName', 'nav1', 'link1', 'nav2', 'link2', 'nav3', 'link3', 'cta'],
  'Hero': ['title', 'subtitle', 'btn1Text', 'btn1Link', 'btn2Text'],
  'Grid': ['item1Title', 'item1Desc', 'item2Title', 'item2Desc', 'item3Title', 'item3Desc'],
  'FeaturesList': ['title', 'feature1', 'desc1', 'feature2', 'desc2', 'feature3', 'desc3', 'feature4', 'desc4'],
  'Testimonials': ['title', 'quote1', 'author1', 'role1', 'quote2', 'author2', 'role2'],
  'Team': ['title', 'name1', 'role1', 'name2', 'role2', 'name3', 'role3'],
  'FAQ': ['title', 'q1', 'a1', 'q2', 'a2', 'q3', 'a3'],
  'Pricing': ['plan1Name', 'plan1Price', 'plan1Btn', 'plan2Name', 'plan2Price', 'plan2Btn'],
  'CallToAction': ['title', 'subtitle', 'btnText', 'btnLink'],
  'Newsletter': ['title', 'subtitle', 'placeholder', 'btnText'],
  'Contact': ['title', 'subtitle', 'btnText']
};

const SiteBuilder: React.FC<SiteBuilderProps> = ({ tenant }) => {
  const [sites, setSites] = useState<WixSite[]>(tenant.wixIntegration?.sites || []);
  const [activeEditorSite, setActiveEditorSite] = useState<WixSite | null>(null);
  const [activePageId, setActivePageId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [newPageName, setNewPageName] = useState('');

  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStep, setBuildStep] = useState('');
  const [activeTab, setActiveTab] = useState<'pages' | 'design' | 'settings' | 'templates'>('pages');
  const [editorView, setEditorView] = useState<'Desktop' | 'Tablet' | 'Mobile'>('Desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    setSites(tenant.wixIntegration?.sites || []);
  }, [tenant.wixIntegration?.sites]);

  // Derived active page - always guaranteed to return a page if a site is active
  const activePage = useMemo(() => {
    if (!activeEditorSite) return null;
    const found = activeEditorSite.pages.find(p => p.id === activePageId);
    return found || activeEditorSite.pages[0];
  }, [activeEditorSite, activePageId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === 'REQUEST_DELETE') {
        removeSection(payload.id);
      }
      if (type === 'SELECT_SECTION') {
        setSelectedSectionId(payload.id);
        setActiveTab('settings');
      }
      if (type === 'NAVIGATE') {
        if (!activeEditorSite) return;
        const targetPage = activeEditorSite.pages.find(p => p.path === payload.path);
        if (targetPage) {
            setActivePageId(targetPage.id);
            setIframeKey(prev => prev + 1);
            setSelectedSectionId(null);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeEditorSite, selectedSectionId]);

  const saveSiteState = useCallback(async (updatedSite: WixSite) => {
    setActiveEditorSite(updatedSite);
    setSites(prev => prev.map(s => s.id === updatedSite.id ? updatedSite : s));

    const currentTenants = await DB.get<Tenant[]>(DB.keys.TENANTS) || [];
    const updatedTenants = currentTenants.map(t => {
      if (t.id === tenant.id) {
        const sitesList = t.wixIntegration?.sites || [];
        const newSites = sitesList.some(s => s.id === updatedSite.id)
          ? sitesList.map(s => s.id === updatedSite.id ? updatedSite : s)
          : [...sitesList, updatedSite];
          
        return {
          ...t,
          wixIntegration: { 
            ...(t.wixIntegration || { enabled: true, autoSync: true, sites: [] }), 
            sites: newSites 
          }
        };
      }
      return t;
    });

    await DB.set(DB.keys.TENANTS, updatedTenants);
    window.dispatchEvent(new CustomEvent('tenantUpdated', { detail: { tenantId: tenant.id } }));
  }, [tenant.id]);

  useEffect(() => {
    if (iframeRef.current?.contentWindow && activePage) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SYNC_STATE',
        payload: { sections: activePage.sections }
      }, '*');
    }
  }, [activePage?.sections]);

  const currentSrcDoc = useMemo(() => {
    if (!activeEditorSite || !activePage) return '';
    return WixService.generatePageHtml(activeEditorSite.name, activeEditorSite.templateId, activePage.sections);
  }, [activeEditorSite?.templateId, activePage?.id, activeEditorSite?.name]);

  const handleCreateSite = async (templateName: string = 'Enterprise Base') => {
    setIsBuilding(true);
    setBuildStep(`Provisioning digital environment...`);
    try {
      const newSite = await WixService.cloneTemplateSite(tenant.id, `${tenant.name} Instance`, templateName);
      await saveSiteState(newSite);
      setActivePageId(newSite.pages[0].id);
      setIframeKey(prev => prev + 1);
    } catch (e) {
      alert('Provisioning failed.');
    } finally {
      setIsBuilding(false);
    }
  };

  const applyTemplate = async (templateName: string) => {
    if (!activeEditorSite) return;
    setIsBuilding(true);
    setBuildStep(`Mapping brand to ${templateName}...`);
    try {
      const updatedSite = { ...activeEditorSite, templateId: templateName };
      await saveSiteState(updatedSite);
      setIframeKey(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBuilding(false);
    }
  };

  const handleAddPage = () => {
    if (!activeEditorSite || !newPageName.trim()) return;
    
    const cleanName = newPageName.trim();
    const path = '/' + cleanName.toLowerCase().replace(/\s+/g, '-');
    
    if (activeEditorSite.pages.some(p => p.path === path)) {
      alert('A page with this path already exists.');
      return;
    }

    const newId = `p-${Date.now()}`;
    const newPage: SitePage = { 
      id: newId, 
      name: cleanName, 
      path, 
      sections: [] 
    };

    const updatedSite = { 
      ...activeEditorSite, 
      pages: [...activeEditorSite.pages, newPage] 
    };
    
    saveSiteState(updatedSite);
    setActivePageId(newId);
    setIframeKey(prev => prev + 1);
    setSelectedSectionId(null);
    setIsAddingPage(false);
    setNewPageName('');
    
    // Auto-switch to Design tab to allow adding widgets immediately
    setActiveTab('design');
  };

  const handleDeletePage = (id: string) => {
    if (!activeEditorSite || activeEditorSite.pages.length <= 1) return;
    if (id === 'p-home') {
        alert("The Home page cannot be deleted.");
        return;
    }
    if (!confirm("Are you sure you want to delete this page and all its widgets?")) return;

    const updatedPages = activeEditorSite.pages.filter(p => p.id !== id);
    const updatedSite = { ...activeEditorSite, pages: updatedPages };
    
    // If we are deleting the current page, go back home
    if (activePageId === id) {
        setActivePageId(updatedPages[0].id);
        setIframeKey(prev => prev + 1);
    }
    
    saveSiteState(updatedSite);
  };

  const addSection = (type: string) => {
    if (!activeEditorSite || !activePage) return;
    
    const id = `sec-${Date.now()}`;
    const newSection: SiteSection = { id, type, attributes: {} };
    
    const updatedPages = activeEditorSite.pages.map(p => 
      p.id === activePage.id ? { ...p, sections: [...p.sections, newSection] } : p
    );
    
    const updatedSite = { ...activeEditorSite, pages: updatedPages };
    saveSiteState(updatedSite);
  };

  const updateSectionAttribute = (sectionId: string, attrKey: string, value: any) => {
    if (!activeEditorSite || !activePage) return;
    const updatedPages = activeEditorSite.pages.map(p => {
      if (p.id !== activePage.id) return p;
      return {
        ...p,
        sections: p.sections.map(s => s.id === sectionId ? { ...s, attributes: { ...s.attributes, [attrKey]: value } } : s)
      };
    });
    const updatedSite = { ...activeEditorSite, pages: updatedPages };
    saveSiteState(updatedSite);
  };

  const removeSection = (id: string) => {
    if (!activeEditorSite || !activePage) return;
    const updatedPages = activeEditorSite.pages.map(p => {
      if (p.id !== activePage.id) return p;
      return { ...p, sections: p.sections.filter(s => s.id !== id) };
    });
    const updatedSite = { ...activeEditorSite, pages: updatedPages };
    saveSiteState(updatedSite);
    if (selectedSectionId === id) setSelectedSectionId(null);
  };

  const handleAiCopyGen = async () => {
    const selectedSection = activePage?.sections.find(s => s.id === selectedSectionId);
    if (!selectedSection || !activeEditorSite || isGeneratingCopy) return;
    setIsGeneratingCopy(true);

    const prompt = `As an enterprise brand strategist for ${tenant.name}, optimize the copy for this ${selectedSection.type} component. 
    Return a valid JSON object mapping these fields to optimized values: ${WIDGET_DEFS[selectedSection.type].join(', ')}.`;

    try {
      const result = await getBrandAssistantResponse(prompt, tenant.id, tenant.name);
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const updates = JSON.parse(jsonMatch[0]);
        Object.entries(updates).forEach(([key, value]) => {
          if (WIDGET_DEFS[selectedSection.type].includes(key)) {
            updateSectionAttribute(selectedSection.id, key, value);
          }
        });
      }
    } catch (err) {
      console.error("AI Assistant Failure:", err);
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const getCanvasWidth = () => {
    if (editorView === 'Tablet') return '768px';
    if (editorView === 'Mobile') return '390px';
    return '100%';
  };

  const selectedSection = useMemo(() => {
    return activePage?.sections.find(s => s.id === selectedSectionId);
  }, [activePage, selectedSectionId]);

  if (activeEditorSite) {
    return (
      <div className="fixed inset-0 z-[150] bg-slate-900 flex flex-col animate-in fade-in duration-300">
        <div className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveEditorSite(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <h2 className="text-sm font-black text-white truncate max-w-[200px]">{activeEditorSite.name}</h2>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            {(['pages', 'design', 'settings', 'templates'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                {tab}
              </button>
            ))}
          </div>

          <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase shadow-xl hover:bg-indigo-700 transition-all">
            Deploy Live
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col overflow-y-auto no-scrollbar">
            <div className="p-6 space-y-8">
              {activeTab === 'pages' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Navigation</h3>
                    {!isAddingPage && (
                      <button onClick={() => setIsAddingPage(true)} className="p-1 text-indigo-400 hover:text-white transition-colors" title="Add Page">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                      </button>
                    )}
                  </div>

                  {isAddingPage && (
                    <div className="space-y-3 p-4 bg-slate-900 rounded-2xl border border-indigo-600/30 animate-in slide-in-from-top-2 duration-200">
                       <input 
                         autoFocus
                         type="text" 
                         value={newPageName} 
                         onChange={(e) => setNewPageName(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleAddPage()}
                         placeholder="Page name..." 
                         className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none text-[11px] font-bold text-white focus:border-indigo-600 transition-all"
                       />
                       <div className="flex gap-2">
                         <button onClick={handleAddPage} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">
                           Add
                         </button>
                         <button onClick={() => { setIsAddingPage(false); setNewPageName(''); }} className="px-3 py-2 bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all">
                           Cancel
                         </button>
                       </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {activeEditorSite.pages.map(p => (
                      <div key={p.id} className="group relative">
                        <button 
                          onClick={() => { setActivePageId(p.id); setIframeKey(prev => prev + 1); setSelectedSectionId(null); }} 
                          className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${activePageId === p.id ? 'bg-indigo-600/10 border-indigo-600/40 text-white shadow-lg shadow-indigo-600/5' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-900'}`}
                        >
                          <span className="text-[11px] font-bold uppercase tracking-wider truncate mr-2">{p.name}</span>
                          <span className="text-[9px] opacity-40 truncate">{p.path}</span>
                        </button>
                        {p.id !== 'p-home' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeletePage(p.id); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-500 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'design' && (
                <div className="space-y-6">
                  <div className="p-4 bg-indigo-600/10 rounded-2xl border border-indigo-600/20">
                     <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Target Page</p>
                     <p className="text-xs font-black text-white">{activePage?.name || 'Home'}</p>
                  </div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Component Library</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.keys(WIDGET_DEFS).map(tool => (
                      <button key={tool} onClick={() => addSection(tool)} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-indigo-500 transition-all text-left group">
                        <p className="text-[10px] font-black text-white uppercase group-hover:text-indigo-400 transition-colors">{tool}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Properties</h3>
                  {selectedSection ? (
                    <div className="space-y-5">
                      <div className="p-4 bg-indigo-600/10 rounded-2xl border border-indigo-600/20">
                         <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Editing Layer</p>
                         <p className="text-sm font-black text-white">{selectedSection.type}</p>
                      </div>

                      {WIDGET_DEFS[selectedSection.type]?.map(attr => (
                        <div key={attr} className="space-y-2">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{attr.replace(/([A-Z])/g, ' $1')}</label>
                           {attr.toLowerCase().includes('link') ? (
                             <select 
                               value={selectedSection.attributes[attr] || '#'}
                               onChange={(e) => updateSectionAttribute(selectedSection.id, attr, e.target.value)}
                               className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl outline-none text-xs font-bold text-white focus:border-indigo-600 transition-all"
                             >
                               <option value="/">Home</option>
                               {activeEditorSite.pages.map(p => (
                                 <option key={p.id} value={p.path}>Page: {p.name}</option>
                               ))}
                               <option value="https://google.com">External: Google</option>
                             </select>
                           ) : (
                             <input 
                               type="text" 
                               value={selectedSection.attributes[attr] || ''} 
                               onChange={(e) => updateSectionAttribute(selectedSection.id, attr, e.target.value)}
                               className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl outline-none text-xs font-bold text-white focus:border-indigo-600 transition-all"
                             />
                           )}
                        </div>
                      ))}
                      
                      <button onClick={handleAiCopyGen} disabled={isGeneratingCopy} className="w-full py-4 bg-indigo-600/10 border border-indigo-600/20 text-indigo-400 rounded-2xl text-[10px] font-black uppercase disabled:opacity-20 hover:bg-indigo-600/20 transition-all">
                        {isGeneratingCopy ? 'Gemini is Reasoning...' : 'AI Refine with RAG'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-20 opacity-40">
                      <p className="text-[10px] font-black text-slate-500 uppercase leading-relaxed">Select a component on the canvas to edit its properties.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'templates' && (
                <div className="space-y-6">
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
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1">
                {(['Desktop', 'Tablet', 'Mobile'] as const).map(view => (
                  <button key={view} onClick={() => setEditorView(view)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${editorView === view ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                    {view}
                  </button>
                ))}
              </div>
            </div>

            <div className="mx-auto flex-1 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800 flex flex-col transition-all duration-700 relative" style={{ width: getCanvasWidth() }}>
              <div className="w-full h-11 bg-slate-100 flex items-center px-6 border-b border-slate-200">
                <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-slate-300"></div><div className="w-3 h-3 rounded-full bg-slate-300"></div><div className="w-3 h-3 rounded-full bg-slate-300"></div></div>
                <div className="mx-auto bg-white px-4 py-1 rounded-full text-[10px] text-slate-400 font-black border border-slate-200">
                  {activePage?.path} (Velo Environment)
                </div>
              </div>
              <div className="flex-1 relative bg-white overflow-hidden">
                {isBuilding && (
                  <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center p-8 bg-white rounded-[2.5rem] shadow-2xl">
                      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{buildStep}</p>
                    </div>
                  </div>
                )}
                <iframe 
                  key={iframeKey}
                  ref={iframeRef} 
                  srcDoc={currentSrcDoc}
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Instance Provisioning</h1>
          <p className="text-slate-500 font-medium">Map your brand identity to Wix digital twins with real-time RAG context.</p>
        </div>
        <button onClick={() => handleCreateSite()} disabled={isBuilding} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase shadow-2xl disabled:opacity-50 hover:bg-slate-800 transition-all flex items-center gap-3">
          {isBuilding ? 'Synthesizing...' : 'Provision Web Instance'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {sites.length === 0 ? (
          <div className="col-span-full bg-white border-4 border-dashed border-slate-100 rounded-[3rem] p-24 text-center">
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active web instances provisioned for this workspace.</p>
          </div>
        ) : (
          sites.map(site => (
            <div key={site.id} className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 flex flex-col md:flex-row gap-8 group hover:border-indigo-200 transition-all animate-in zoom-in-95">
              <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-black text-slate-900">{site.name}</h3>
                <div className="flex gap-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{site.pages.length} Pages</span>
                  <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Grounded Online</span>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-3 min-w-[180px]">
                <button onClick={() => { setActiveEditorSite(site); setActivePageId(site.pages[0].id); }} className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all">
                  Open Velo Editor
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SiteBuilder;
