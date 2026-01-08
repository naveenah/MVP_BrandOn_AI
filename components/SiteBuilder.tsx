
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
  // Enterprise Presets
  'Hero': ['title', 'subtitle', 'btn1Text', 'btn1Link', 'btn2Text'],
  'Grid': ['item1Title', 'item1Desc', 'item2Title', 'item2Desc', 'item3Title', 'item3Desc'],
  'FeaturesList': ['title', 'feature1', 'desc1', 'feature2', 'desc2', 'feature3', 'desc3', 'feature4', 'desc4'],
  'Testimonials': ['title', 'quote1', 'author1', 'role1', 'quote2', 'author2', 'role2'],
  'Team': ['title', 'name1', 'role1', 'name2', 'role2', 'name3', 'role3'],
  'FAQ': ['title', 'q1', 'a1', 'q2', 'a2', 'q3', 'a3'],
  'Pricing': ['plan1Name', 'plan1Price', 'plan1Btn', 'plan2Name', 'plan2Price', 'plan2Btn'],
  'CallToAction': ['title', 'subtitle', 'btnText', 'btnLink'],
  'Newsletter': ['title', 'subtitle', 'placeholder', 'btnText'],
  'Contact': ['title', 'subtitle', 'btnText'],
  // Abstract Building Blocks
  'TextContent': ['heading', 'body', 'alignment', 'backgroundColor', 'padding'],
  'MediaBlock': ['imageUrl', 'caption', 'imageWidth', 'rounded', 'borderStyle'],
  'LinkList': ['title', 'link1Label', 'link1Url', 'link2Label', 'link2Url', 'link3Label', 'link3Url'],
  'Spacer': ['height', 'backgroundColor'],
  'CustomHtml': ['htmlContent', 'cssClass'],
  'ButtonBlock': ['text', 'link', 'variant', 'alignment', 'buttonColor'],
  'Divider': ['thickness', 'color', 'width', 'verticalMargin'],
  'IconBox': ['title', 'description', 'iconColor', 'iconBackground'],
  'QuoteBlock': ['quote', 'author', 'authorTitle'],
  'VideoBlock': ['videoUrl', 'title', 'aspectRatio']
};

const ENTERPRISE_WIDGETS = ['Hero', 'Grid', 'FeaturesList', 'Testimonials', 'Team', 'FAQ', 'Pricing', 'CallToAction', 'Newsletter', 'Contact'];
const ABSTRACT_WIDGETS = ['TextContent', 'MediaBlock', 'LinkList', 'Spacer', 'CustomHtml', 'ButtonBlock', 'Divider', 'IconBox', 'QuoteBlock', 'VideoBlock'];

interface CopilotAction {
  type: 'ADD_WIDGET' | 'RESET_PAGE' | 'SET_TEMPLATE' | 'CREATE_PAGE';
  widget?: string;
  attributes?: Record<string, any>;
  pageName?: string;
  templateId?: string;
}

interface AssistantMsg {
  role: 'user' | 'assistant';
  text: string;
  actionsApplied?: CopilotAction[];
}

const SiteBuilder: React.FC<SiteBuilderProps> = ({ tenant }) => {
  const [sites, setSites] = useState<WixSite[]>(tenant.wixIntegration?.sites || []);
  const [activeEditorSite, setActiveEditorSite] = useState<WixSite | null>(null);
  const [activePageId, setActivePageId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  // AI Copilot State
  const [assistantMsgs, setAssistantMsgs] = useState<AssistantMsg[]>([
    { role: 'assistant', text: `Full-Site Architect Online. I have deep-indexed the RAG context for ${tenant.name}. I am ready to provision entire pages and complex layouts.` }
  ]);
  const [assistantInput, setAssistantInput] = useState('');
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);

  const [isBuilding, setIsBuilding] = useState(false);
  const [activeTab, setActiveTab] = useState<'pages' | 'design' | 'ai' | 'settings' | 'templates'>('pages');
  const [editorView, setEditorView] = useState<'Desktop' | 'Tablet' | 'Mobile'>('Desktop');
  const [iframeKey, setIframeKey] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setSites(tenant.wixIntegration?.sites || []);
  }, [tenant.wixIntegration?.sites]);

  const activePage = useMemo(() => {
    if (!activeEditorSite) return null;
    return activeEditorSite.pages.find(p => p.id === activePageId) || activeEditorSite.pages[0];
  }, [activeEditorSite, activePageId]);

  const saveSiteState = useCallback(async (updatedSite: WixSite) => {
    setActiveEditorSite(updatedSite);
    setSites(prev => prev.map(s => s.id === updatedSite.id ? updatedSite : s));
    const currentTenants = await DB.get<Tenant[]>(DB.keys.TENANTS) || [];
    const updatedTenants = currentTenants.map(t => {
      if (t.id === tenant.id) {
        const sitesList = t.wixIntegration?.sites || [];
        const newSites = sitesList.some(s => s.id === updatedSite.id) ? sitesList.map(s => s.id === updatedSite.id ? updatedSite : s) : [...sitesList, updatedSite];
        return { ...t, wixIntegration: { ...(t.wixIntegration || { enabled: true, autoSync: true, sites: [] }), sites: newSites } };
      }
      return t;
    });
    await DB.set(DB.keys.TENANTS, updatedTenants);
    window.dispatchEvent(new CustomEvent('tenantUpdated', { detail: { tenantId: tenant.id } }));
  }, [tenant.id]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
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
  }, [activeEditorSite]);

  const currentSrcDoc = useMemo(() => {
    if (!activeEditorSite || !activePage) return '';
    return WixService.generatePageHtml(activeEditorSite.name, activeEditorSite.templateId, activePage.sections);
  }, [activeEditorSite?.templateId, activePage?.id, activeEditorSite?.name]);

  const getCanvasWidth = () => {
    switch (editorView) {
      case 'Tablet': return '768px';
      case 'Mobile': return '375px';
      default: return '100%';
    }
  };

  const handleCreateSite = async (templateName: string = 'Enterprise Base') => {
    setIsBuilding(true);
    try {
      const newSite = await WixService.cloneTemplateSite(tenant.id, `${tenant.name} Instance`, templateName);
      await saveSiteState(newSite);
      setActivePageId(newSite.pages[0].id);
      setIframeKey(prev => prev + 1);
    } catch (e) {
      alert('Architectural synthesis failed.');
    } finally { setIsBuilding(false); }
  };

  /**
   * Refined Action Processor
   * Now returns the newly modified site AND the current targeted page ID
   * to allow chaining actions across turns.
   */
  const executeCopilotAction = useCallback((action: CopilotAction, currentSite: WixSite, currentTargetPageId: string): { site: WixSite, pageId: string } => {
    let site = { ...currentSite };
    let newTargetId = currentTargetPageId;
    
    if (action.type === 'SET_TEMPLATE' && action.templateId) {
      site.templateId = action.templateId;
    }

    if (action.type === 'CREATE_PAGE' && action.pageName) {
      const path = '/' + action.pageName.toLowerCase().replace(/\s+/g, '-');
      const existingPage = site.pages.find(p => p.path === path);
      if (!existingPage) {
        const newPage: SitePage = { id: `p-${Date.now()}-${Math.random()}`, name: action.pageName, path, sections: [] };
        site.pages.push(newPage);
        newTargetId = newPage.id;
      } else {
        newTargetId = existingPage.id;
      }
    }

    if (action.type === 'RESET_PAGE') {
      site.pages = site.pages.map(p => p.id === newTargetId ? { ...p, sections: [] } : p);
    }

    if (action.type === 'ADD_WIDGET' && action.widget) {
      const newSec: SiteSection = { id: `sec-${Date.now()}-${Math.random()}`, type: action.widget, attributes: action.attributes || {} };
      site.pages = site.pages.map(p => p.id === newTargetId ? { ...p, sections: [...p.sections, newSec] } : p);
    }

    return { site, pageId: newTargetId };
  }, []);

  const handleCopilotCommand = async (userInput?: string) => {
    const text = userInput || assistantInput;
    if (!text.trim() || isAssistantThinking || !activeEditorSite) return;

    setAssistantInput('');
    setAssistantMsgs(prev => [...prev, { role: 'user', text }]);
    setIsAssistantThinking(true);

    const prompt = `
    Request: "${text}"
    Context: You are currently on page "${activePage?.name || 'Home'}".
    
    You have FULL architectural control. You can:
    1. Create new pages (CREATE_PAGE).
    2. Reset the content of a page (RESET_PAGE).
    3. Add multiple widgets (ADD_WIDGET) in sequence.
    
    BATCH RULE: If you create a page, subsequent ADD_WIDGET actions in this turn will automatically target that page.
    Always generate high-fidelity content from the RAG store for attributes.
    `;

    try {
      const result = await getBrandAssistantResponse(prompt, tenant.id, tenant.name);
      const jsonMatch = result.text.match(/\[[\s\S]*\]/);
      let actions: CopilotAction[] = [];
      let cleanedText = result.text;

      if (jsonMatch) {
        try { 
          actions = JSON.parse(jsonMatch[0]); 
          cleanedText = result.text.replace(jsonMatch[0], '').trim(); 
        } catch(e) { console.error("Neural parse error", e); }
      }

      let updatedSite = { ...activeEditorSite };
      let currentTargetId = activePageId || updatedSite.pages[0].id;

      // Process actions in sequence, allowing for context inheritance (e.g., CREATE_PAGE -> ADD_WIDGET)
      for (const action of actions) {
        const step = executeCopilotAction(action, updatedSite, currentTargetId);
        updatedSite = step.site;
        currentTargetId = step.pageId;
      }
      
      // Update the global state with the final result of the batch
      setActivePageId(currentTargetId);
      await saveSiteState(updatedSite);
      
      setAssistantMsgs(prev => [...prev, { role: 'assistant', text: cleanedText, actionsApplied: actions }]);
      setIframeKey(k => k + 1); 
    } catch (err) {
      setAssistantMsgs(prev => [...prev, { role: 'assistant', text: 'Architectural link failed. Please retry your command.' }]);
    } finally {
      setIsAssistantThinking(false);
    }
  };

  const handleFullBuild = async () => {
    setActiveTab('ai');
    handleCopilotCommand("Construct a high-fidelity landing page for my brand. Also, create a 'Services' page and add relevant widgets describing our offerings.");
  };

  const addManualWidget = async (type: string) => {
    if (!activeEditorSite || !activePageId) return;
    const updatedSite = await WixService.addSection(activeEditorSite, activePageId, type);
    saveSiteState(updatedSite);
  };

  const removeSection = (id: string) => {
    if (!activeEditorSite) return;
    const updatedSite = { ...activeEditorSite };
    updatedSite.pages = updatedSite.pages.map(p => ({
      ...p,
      sections: p.sections.filter(s => s.id !== id)
    }));
    saveSiteState(updatedSite);
    if (selectedSectionId === id) setSelectedSectionId(null);
  };

  const updateAttr = (id: string, key: string, val: string) => {
    if (!activeEditorSite) return;
    const updatedSite = { ...activeEditorSite };
    updatedSite.pages = updatedSite.pages.map(p => ({
      ...p,
      sections: p.sections.map(s => s.id === id ? { ...s, attributes: { ...s.attributes, [key]: val } } : s)
    }));
    saveSiteState(updatedSite);
  };

  const selectedSection = activePage?.sections.find(s => s.id === selectedSectionId);

  if (activeEditorSite) {
    return (
      <div className="fixed inset-0 z-[150] bg-slate-900 flex flex-col animate-in fade-in duration-300">
        {isDemoOpen && (
          <div className="fixed inset-0 z-[200] bg-white flex flex-col animate-in fade-in zoom-in-95 duration-300">
            <div className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">P</div>
                <span className="text-xs font-black text-white uppercase tracking-widest">Live Site Preview</span>
              </div>
              <button onClick={() => setIsDemoOpen(false)} className="px-6 py-2 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl">
                Exit Preview
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
               <iframe srcDoc={currentSrcDoc} className="w-full h-full border-none bg-white" sandbox="allow-scripts allow-same-origin" />
            </div>
          </div>
        )}

        <div className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <button onClick={() => setActiveEditorSite(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <h2 className="text-sm font-black text-white truncate max-w-[200px]">{activeEditorSite.name}</h2>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
            {(['pages', 'design', 'ai', 'settings', 'templates'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setIsDemoOpen(true)} className="px-6 py-2.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-black uppercase shadow-xl hover:bg-slate-700 transition-all">
              Test Demo
            </button>
            <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase shadow-xl hover:bg-indigo-700 transition-all">
              Deploy Live
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <aside className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col overflow-y-auto no-scrollbar">
            <div className="p-6 h-full flex flex-col">
              {activeTab === 'ai' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pr-2 mb-4">
                    {assistantMsgs.map((msg, i) => (
                      <div key={i} className={`space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-300 ${msg.role === 'assistant' ? 'text-left' : 'text-right'}`}>
                        <div className={`inline-block p-4 rounded-2xl text-[11px] font-medium leading-relaxed max-w-[95%] ${msg.role === 'assistant' ? 'bg-slate-900 border border-slate-800 text-slate-200' : 'bg-indigo-600 text-white shadow-lg'}`}>
                          {msg.text}
                          {msg.actionsApplied && msg.actionsApplied.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                               {msg.actionsApplied.map((a, j) => (
                                 <span key={j} className="px-2 py-0.5 bg-white/10 rounded text-[8px] font-black uppercase text-indigo-300 border border-indigo-500/20">
                                   {a.type} {a.widget || a.pageName || ''}
                                 </span>
                               ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isAssistantThinking && (
                      <div className="flex flex-col gap-2 p-4 bg-slate-900 border border-slate-800 rounded-2xl w-fit">
                        <div className="flex gap-1"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.1s]"></div><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.2s]"></div></div>
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Architect thinking...</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-800 space-y-3">
                     <button onClick={handleFullBuild} disabled={isAssistantThinking} className="w-full py-3 bg-indigo-600/10 border border-indigo-600/30 text-indigo-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600/20 transition-all flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        Batch Provision Site
                     </button>
                     <div className="relative">
                        <textarea 
                          value={assistantInput}
                          onChange={(e) => setAssistantInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleCopilotCommand()}
                          placeholder="Command the Architect..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] text-white outline-none focus:border-indigo-600 transition-all h-24 resize-none"
                        />
                        <button onClick={() => handleCopilotCommand()} disabled={isAssistantThinking || !assistantInput.trim()} className="absolute bottom-3 right-3 p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                        </button>
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'pages' && (
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Hierarchy</h3>
                  <div className="space-y-2">
                    {activeEditorSite.pages.map(p => (
                      <button key={p.id} onClick={() => { setActivePageId(p.id); setSelectedSectionId(null); setIframeKey(k => k+1); }} className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all ${activePageId === p.id ? 'bg-indigo-600/10 border-indigo-600/40 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-900'}`}>
                        <span className="text-[11px] font-black uppercase tracking-wider">{p.name}</span>
                        <span className="text-[9px] opacity-40">{p.path}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'design' && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Presets</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {ENTERPRISE_WIDGETS.map(tool => (
                        <button key={tool} onClick={() => addManualWidget(tool)} className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-indigo-500 transition-all text-left flex flex-col group">
                          <p className="text-[9px] font-black text-white uppercase group-hover:text-indigo-400">{tool}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Blocks</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {ABSTRACT_WIDGETS.map(tool => (
                        <button key={tool} onClick={() => addManualWidget(tool)} className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-emerald-500 transition-all text-left flex flex-col group">
                          <p className="text-[9px] font-black text-white uppercase group-hover:text-emerald-400">{tool}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Attributes</h3>
                  {selectedSection ? (
                    <div className="space-y-5">
                       <div className="p-4 bg-indigo-600/10 rounded-2xl border border-indigo-600/20 flex justify-between items-center">
                          <p className="text-sm font-black text-white">{selectedSection.type}</p>
                          <button onClick={() => removeSection(selectedSection.id)} className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                       </div>
                       <div className="space-y-4">
                        {(WIDGET_DEFS[selectedSection.type] || []).map(attr => (
                          <div key={attr} className="space-y-2">
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{attr}</label>
                             <input type="text" value={selectedSection.attributes[attr] || ''} onChange={(e) => updateAttr(selectedSection.id, attr, e.target.value)} className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl outline-none text-xs font-bold text-white focus:border-indigo-600 transition-all" />
                          </div>
                        ))}
                       </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center opacity-30"><p className="text-[10px] font-black uppercase text-slate-500">Select a section in the editor</p></div>
                  )}
                </div>
              )}
            </div>
          </aside>

          <main className="flex-1 bg-slate-900 flex flex-col p-4 md:p-10 relative overflow-hidden">
            <div className="flex justify-center gap-2 mb-6 relative z-10">
              <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 gap-1 shadow-2xl">
                {(['Desktop', 'Tablet', 'Mobile'] as const).map(view => (
                  <button key={view} onClick={() => setEditorView(view)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${editorView === view ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    {view}
                  </button>
                ))}
              </div>
            </div>

            <div className="mx-auto flex-1 bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-800 flex flex-col transition-all duration-700 relative" style={{ width: getCanvasWidth() }}>
              <div className="w-full h-11 bg-slate-100 flex items-center px-6 border-b border-slate-200">
                <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-slate-300"></div><div className="w-3 h-3 rounded-full bg-slate-300"></div><div className="w-3 h-3 rounded-full bg-slate-300"></div></div>
                <div className="mx-auto bg-white px-4 py-1 rounded-full text-[10px] text-slate-400 font-black border border-slate-200 tracking-widest uppercase">
                  Velo Instance Canvas: {activePage?.path}
                </div>
              </div>
              <div className="flex-1 relative bg-white overflow-hidden">
                {isAssistantThinking && (
                  <div className="absolute inset-0 z-50 bg-indigo-900/10 backdrop-blur-[1px] border-4 border-indigo-600/20 rounded-b-[2.5rem] animate-pulse"></div>
                )}
                <iframe key={iframeKey} ref={iframeRef} srcDoc={currentSrcDoc} className="w-full h-full border-none bg-white" sandbox="allow-scripts allow-same-origin" />
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
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Web Instances</h1>
          <p className="text-slate-500 font-medium tracking-tight">Ground your digital presence in Enterprise Knowledge.</p>
        </div>
        <button onClick={() => handleCreateSite()} disabled={isBuilding} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-sm font-black uppercase shadow-2xl hover:bg-slate-800 transition-all">
          {isBuilding ? 'Synthesizing...' : 'Provision New Instance'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {sites.length === 0 ? (
          <div className="col-span-full bg-white border-4 border-dashed border-slate-100 rounded-[3rem] p-24 text-center">
             <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active web instances grounded.</p>
          </div>
        ) : (
          sites.map(site => (
            <div key={site.id} className="bg-white rounded-[3rem] p-10 shadow-xl border border-slate-100 flex flex-col md:flex-row gap-8 group hover:border-indigo-200 transition-all">
              <div className="flex-1 space-y-4">
                <h3 className="text-2xl font-black text-slate-900">{site.name}</h3>
                <div className="flex gap-4">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{site.pages.length} Pages</span>
                  <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Architect Enabled</span>
                </div>
              </div>
              <button onClick={() => { setActiveEditorSite(site); setActivePageId(site.pages[0].id); }} className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all">
                Enter Velo Editor
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SiteBuilder;
