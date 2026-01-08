
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tenant, OnboardingDraft, OnboardingAsset, ProductServiceDetail } from '../types';
import * as OnboardingService from '../services/onboardingService';
import * as ActionEngineService from '../services/actionEngineService';

interface OnboardingProps {
  tenant: Tenant;
  onComplete: (tenantId: string) => Promise<void>;
}

const ORG_SIZES = [
  '0-1 employees', '2-10 employees', '11-50 employees', '51-200 employees',
  '201-500 employees', '501-1,000 employees', '1,001-5,000 employees',
  '5,001-10,000 employees', '10,001+ employees'
];

const ORG_TYPES = [
  'Public company', 'Self-employed', 'Government agency', 'Non-profit',
  'Sole proprietorship', 'Privately held', 'Partnership'
];

type OfferingTab = 'Basic' | 'Marketing' | 'Strategic' | 'Operations';

const Onboarding: React.FC<OnboardingProps> = ({ tenant, onComplete }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deploymentStage, setDeploymentStage] = useState('');
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [activeOfferingId, setActiveOfferingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<OfferingTab>('Basic');
  
  const [formData, setFormData] = useState<OnboardingDraft>({
    companyName: tenant.name,
    linkedinUrl: '',
    website: '',
    industry: '',
    orgSize: '',
    orgType: '',
    tagline: '',
    isAuthorized: false,
    brandVoice: 'Professional',
    mission: '',
    valueProps: [''],
    services: [],
    offerings: [],
    assets: [],
    currentStep: 1,
    updatedAt: new Date().toISOString(),
    wixAutomationEnabled: true
  });

  const saveCurrentProgress = useCallback(async (dataToSave: OnboardingDraft) => {
    setIsSaving(true);
    await OnboardingService.saveOnboardingDraft(tenant.id, dataToSave);
    setTimeout(() => setIsSaving(false), 500);
  }, [tenant.id]);

  useEffect(() => {
    const loadDraft = async () => {
      const savedDraft = await OnboardingService.getOnboardingDraft(tenant.id);
      if (savedDraft) {
        setFormData(prev => ({ ...prev, ...savedDraft }));
        setStep(savedDraft.currentStep);
        if (savedDraft.offerings && savedDraft.offerings.length > 0) {
            setActiveOfferingId(savedDraft.offerings[0].id);
        }
      }
      setIsLoadingDraft(false);
    };
    loadDraft();
  }, [tenant.id]);

  const handleInputChange = (field: keyof OnboardingDraft, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value, updatedAt: new Date().toISOString() };
      // Move async save outside of state setter callback
      OnboardingService.saveOnboardingDraft(tenant.id, updated);
      return updated;
    });
  };

  const nextStep = async () => {
    if (step === 1 && (!formData.companyName || !formData.industry || !formData.orgSize || !formData.orgType)) {
      alert("Please fill in all required fields marked with *");
      return;
    }
    const next = Math.min(step + 1, 5);
    setStep(next);
    const updated = { ...formData, currentStep: next };
    setFormData(updated);
    await saveCurrentProgress(updated);
  };

  const prevStep = async () => {
    const prev = Math.max(step - 1, 1);
    setStep(prev);
    const updated = { ...formData, currentStep: prev };
    setFormData(updated);
    await saveCurrentProgress(updated);
  };

  const handleSaveAndClose = async () => {
    await saveCurrentProgress(formData);
    navigate('/');
  };

  const handleAddField = (type: 'valueProps') => {
    const updatedList = [...formData[type], ''];
    handleInputChange(type, updatedList);
  };

  const handleFieldChange = (type: 'valueProps', index: number, value: string) => {
    const updated = [...formData[type]];
    updated[index] = value;
    handleInputChange(type, updated);
  };

  // Offering Handlers
  const handleAddOffering = () => {
      const newOffering: ProductServiceDetail = {
          id: `off-${Date.now()}`,
          name: 'New Offering',
          type: 'Product',
          description: '',
          targetAudience: '',
          keyFeatures: [''],
          pricingModel: '',
          marketPosition: '',
          status: 'Beta',
          usp: '',
          competitors: [''],
          useCases: [''],
          techStack: '',
          documentationUrl: '',
          painPointsSolved: '',
          launchDate: ''
      };
      const updated = [...formData.offerings, newOffering];
      handleInputChange('offerings', updated);
      setActiveOfferingId(newOffering.id);
      setActiveTab('Basic');
  };

  const handleUpdateOffering = (id: string, updates: Partial<ProductServiceDetail>) => {
      const updated = formData.offerings.map(o => o.id === id ? { ...o, ...updates } : o);
      handleInputChange('offerings', updated);
  };

  const handleDeleteOffering = (id: string) => {
      if (!confirm('Are you sure you want to remove this offering?')) return;
      const updated = formData.offerings.filter(o => o.id !== id);
      handleInputChange('offerings', updated);
      if (activeOfferingId === id) {
          setActiveOfferingId(updated.length > 0 ? updated[0].id : null);
      }
  };

  const handleDeleteAsset = (assetId: string) => {
    const updatedAssets = formData.assets.filter(a => a.id !== assetId);
    handleInputChange('assets', updatedAssets);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    const newAssetPlaceholder: OnboardingAsset = {
      id: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      mimeType: file.type,
      publicUrl: '',
      status: 'Uploading',
      progress: 0
    };

    const initialAssets = [...formData.assets, newAssetPlaceholder];
    setFormData(prev => ({ ...prev, assets: initialAssets }));

    try {
      const syncedAsset = await OnboardingService.uploadAsset(tenant.id, file, (progress) => {
        setFormData(prev => ({
          ...prev,
          assets: prev.assets.map(a => a.id === newAssetPlaceholder.id ? { ...a, progress } : a)
        }));
      });

      setFormData(prev => {
        const finalAssets = prev.assets.map(a => a.id === newAssetPlaceholder.id ? syncedAsset : a);
        const updated = { ...prev, assets: finalAssets };
        OnboardingService.saveOnboardingDraft(tenant.id, updated);
        return updated;
      });
    } catch (err) { 
      console.error("Upload failed", err); 
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFinalize = async () => {
    if (!formData.isAuthorized) {
      alert("Please verify that you are an authorized representative.");
      return;
    }

    setIsDeploying(true);
    await saveCurrentProgress(formData);

    const stages = [
      'Provisioning Isolated Database Context...',
      'Mapping Neural Vectors to Enterprise Assets...',
      'Syncing to Google File Search RAG Store...',
      'Synthesizing Wix REST API Digital Twin...',
      'Configuring Velo Headless Handlers...',
      'Activating Action Engine & Brand Hub...'
    ];

    let currentIdx = 0;
    setDeploymentStage(stages[0]);
    setDeploymentProgress(16);

    const interval = setInterval(async () => {
      currentIdx++;
      if (currentIdx >= stages.length) {
        clearInterval(interval);
        setDeploymentProgress(100);
        
        await onComplete(tenant.id);
        await ActionEngineService.triggerAutomationRipple(tenant.id);
        
        setTimeout(() => {
          navigate('/');
        }, 800);
      } else {
        setDeploymentStage(stages[currentIdx]);
        setDeploymentProgress((currentIdx + 1) * (100/stages.length));
      }
    }, 1200);
  };

  if (isLoadingDraft) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing Knowledge Store...</p>
        </div>
      </div>
    );
  }

  const steps = [
    { title: 'Identity', desc: 'Core' },
    { title: 'Strategy', desc: 'Map' },
    { title: 'Offerings', desc: 'Portfolio' },
    { title: 'Presence', desc: 'Wix Twin' },
    { title: 'Asset Hub', desc: 'Media' }
  ];

  const activeOffering = formData.offerings.find(o => o.id === activeOfferingId);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload} 
        onClick={(e) => e.stopPropagation()}
        accept="image/*,video/*,application/pdf" 
      />

      {isDeploying && (
        <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-500">
           <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-2xl shadow-indigo-500/50 animate-bounce">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
           </div>
           <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Deploying {tenant.name} Environment</h3>
           <div className="w-full max-w-sm h-1.5 bg-slate-800 rounded-full mb-6 overflow-hidden">
             <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${deploymentProgress}%` }}></div>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-xs">{deploymentStage}</p>
           </div>
        </div>
      )}

      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Enterprise Onboarding</h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-slate-500 font-medium tracking-tight">Configuring instance for <span className="text-indigo-600 font-black">{tenant.name}</span></p>
            {isSaving && (
              <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-full">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Syncing to Store</span>
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={handleSaveAndClose}
          className="px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          Save & Exit
        </button>
      </div>

      <div className="flex items-center gap-4 mb-12 overflow-x-auto pb-4 no-scrollbar">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black transition-all duration-700 ${
                step > i + 1 ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-100' : 
                step === i + 1 ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 ring-8 ring-indigo-50' : 'bg-white border-2 border-slate-200 text-slate-400'
              }`}>
                {step > i + 1 ? <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> : (i + 1)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Step 0{i + 1}</p>
                <p className={`text-[16px] font-black ${step === i + 1 ? 'text-slate-900' : 'text-slate-500'}`}>{s.title}</p>
              </div>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-0.5 bg-slate-100 min-w-[40px] rounded-full"></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
        <div className="p-10 sm:p-14 min-h-[650px]">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 text-left">
              <div className="border-b border-slate-100 pb-6 mb-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ecosystem Presence</h2>
                <p className="text-slate-500 font-medium mt-2">Map your existing footprint to initialize the RAG store.</p>
              </div>
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Organization Name*</label>
                  <input type="text" value={formData.companyName} onChange={(e) => handleInputChange('companyName', e.target.value)} placeholder="Acme Corporation" className="w-full px-5 py-3.5 bg-white border border-slate-300 rounded focus:border-indigo-600 outline-none text-slate-900" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">LinkedIn URL*</label>
                  <input type="text" value={formData.linkedinUrl} onChange={(e) => handleInputChange('linkedinUrl', e.target.value)} placeholder="linkedin.com/company/..." className="w-full px-5 py-3.5 bg-white border border-slate-300 rounded focus:border-indigo-600 outline-none text-slate-900" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Official Website</label>
                  <input type="text" value={formData.website} onChange={(e) => handleInputChange('website', e.target.value)} placeholder="https://..." className="w-full px-5 py-3.5 bg-white border border-slate-300 rounded focus:border-indigo-600 outline-none text-slate-900" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Industry*</label>
                    <input type="text" value={formData.industry} onChange={(e) => handleInputChange('industry', e.target.value)} placeholder="ex: Information Services" className="w-full px-5 py-3.5 bg-white border border-slate-300 rounded focus:border-indigo-600 outline-none text-slate-900" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700">Organization Size*</label>
                    <select value={formData.orgSize} onChange={(e) => handleInputChange('orgSize', e.target.value)} className="w-full px-5 py-3.5 bg-white border border-slate-300 rounded focus:border-indigo-600 outline-none text-slate-900">
                      <option value="">Select size</option>
                      {ORG_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Legal Type*</label>
                  <select value={formData.orgType} onChange={(e) => handleInputChange('orgType', e.target.value)} className="w-full px-5 py-3.5 bg-white border border-slate-300 rounded focus:border-indigo-600 outline-none text-slate-900">
                    <option value="">Select type</option>
                    {ORG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700">Tagline</label>
                  <textarea rows={2} maxLength={120} value={formData.tagline} onChange={(e) => handleInputChange('tagline', e.target.value)} placeholder="Brief brand description..." className="w-full px-5 py-3.5 bg-white border border-slate-300 rounded focus:border-indigo-600 outline-none text-slate-900" />
                </div>
                <div className="flex items-start gap-3 pt-6">
                  <input type="checkbox" id="auth" checked={formData.isAuthorized} onChange={(e) => handleInputChange('isAuthorized', e.target.checked)} className="w-5 h-5 mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600" />
                  <label htmlFor="auth" className="text-sm text-slate-600 font-medium leading-relaxed">I verify that I am an authorized representative of this organization.</label>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 text-left">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Strategy Alignment</h2>
                <p className="text-slate-500 font-medium mt-2">Define your core value propositions for the Brand Assistant.</p>
              </div>
              <div className="space-y-8">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Brand Mission</label>
                  <textarea rows={4} value={formData.mission} onChange={(e) => handleInputChange('mission', e.target.value)} placeholder="Describe your long-term vision..." className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:border-indigo-600 outline-none text-slate-900 font-medium" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Core Value Props</label>
                    <button onClick={() => handleAddField('valueProps')} className="text-xs font-black text-indigo-600">+ Add</button>
                  </div>
                  {formData.valueProps.map((prop, idx) => (
                    <input key={idx} type="text" value={prop} onChange={(e) => handleFieldChange('valueProps', idx, e.target.value)} placeholder={`Proposition 0${idx + 1}`} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-3 focus:border-indigo-600 outline-none text-slate-800 font-bold" />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 text-left h-full flex flex-col">
              <div className="border-b border-slate-100 pb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Offerings Portfolio</h2>
                  <p className="text-slate-500 font-medium mt-2">Detail products and services to ground AI in your corporate context.</p>
                </div>
                <button onClick={handleAddOffering} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                   New Offering
                </button>
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row gap-8 min-h-[500px]">
                {/* List View */}
                <div className="w-full md:w-72 flex flex-col gap-3">
                   <div className="space-y-2 max-h-[500px] overflow-y-auto no-scrollbar">
                     {formData.offerings.length === 0 ? (
                       <p className="text-xs text-slate-400 font-bold text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">Click "New Offering" to begin.</p>
                     ) : (
                       formData.offerings.map(off => (
                         <button 
                           key={off.id}
                           onClick={() => { setActiveOfferingId(off.id); setActiveTab('Basic'); }}
                           className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all flex items-center justify-between group ${
                             activeOfferingId === off.id ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-50' : 'border-slate-50 bg-white hover:border-slate-200 shadow-sm'
                           }`}
                         >
                           <div className="overflow-hidden">
                             <p className={`text-[13px] font-black truncate ${activeOfferingId === off.id ? 'text-indigo-900' : 'text-slate-900'}`}>{off.name || 'Untitled Offering'}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{off.type}</span>
                                <span className={`w-1.5 h-1.5 rounded-full ${off.status === 'Live' ? 'bg-emerald-500' : off.status === 'Beta' ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                             </div>
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); handleDeleteOffering(off.id); }} className="p-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-all rounded-lg">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                         </button>
                       ))
                     )}
                   </div>
                </div>

                <div className="flex-1 bg-[#fcfcfd] rounded-[2.5rem] border border-slate-100 flex flex-col overflow-hidden shadow-inner">
                   {activeOffering ? (
                     <div className="flex flex-col h-full animate-in fade-in duration-300">
                        <div className="flex items-center gap-6 px-8 border-b border-slate-200 bg-white/50 pt-2">
                           {(['Basic', 'Marketing', 'Strategic', 'Operations'] as OfferingTab[]).map(t => (
                             <button 
                               key={t}
                               onClick={() => setActiveTab(t)}
                               className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                                 activeTab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                               }`}
                             >
                               {t}
                             </button>
                           ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                           {activeTab === 'Basic' && (
                             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <div className="space-y-1.5">
                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                                     <input type="text" value={activeOffering.name} onChange={(e) => handleUpdateOffering(activeOffering.id, { name: e.target.value })} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-slate-900" />
                                   </div>
                                   <div className="space-y-1.5">
                                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</label>
                                     <select value={activeOffering.type} onChange={(e) => handleUpdateOffering(activeOffering.id, { type: e.target.value as any })} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-slate-900">
                                       <option value="Product">Product</option>
                                       <option value="Service">Service</option>
                                     </select>
                                   </div>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</label>
                                  <textarea rows={4} value={activeOffering.description} onChange={(e) => handleUpdateOffering(activeOffering.id, { description: e.target.value })} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-medium text-slate-900" />
                                </div>
                             </div>
                           )}
                        </div>
                     </div>
                   ) : (
                     <div className="h-full flex flex-col items-center justify-center text-center py-24 opacity-40">
                        <p className="text-sm font-black text-slate-900">Select an offering to detail specs.</p>
                     </div>
                   )}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 text-left">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Digital Presence Engine</h2>
                <p className="text-slate-500 font-medium max-w-lg mx-auto">Initialize your brand's digital presence via programmatic Wix REST APIs.</p>
              </div>
              <div className="max-w-2xl mx-auto space-y-8">
                 <div className={`p-8 rounded-[2.5rem] border-2 transition-all ${formData.wixAutomationEnabled ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-6">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg text-indigo-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900">Automate Wix Digital Twin</h3>
                            <p className="text-xs font-bold text-slate-500">Programmatically clone and sync brand data.</p>
                          </div>
                       </div>
                       <div className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-colors ${formData.wixAutomationEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`} onClick={() => handleInputChange('wixAutomationEnabled', !formData.wixAutomationEnabled)}>
                         <div className={`w-5 h-5 bg-white rounded-full transition-transform ${formData.wixAutomationEnabled ? 'translate-x-7' : ''}`}></div>
                       </div>
                    </div>
                    <ul className="space-y-3">
                       {['REST API Site Cloning', 'Bulk CMS Sync', 'Headless Velo Config'].map((item, i) => (
                         <li key={i} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            {item}
                         </li>
                       ))}
                    </ul>
                 </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 text-left">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Advanced Media Hub</h2>
                <p className="text-slate-500 font-medium max-w-lg mx-auto">Upload and manage strategic documents to ground AI context.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div onClick={() => fileInputRef.current?.click()} className="group h-64 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all overflow-hidden">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-lg mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <span className="text-lg font-black text-slate-900">Link Asset</span>
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">PDF, Images, or Video</p>
                </div>
                
                <div className="space-y-4 h-64 overflow-y-auto no-scrollbar pr-2 flex flex-col">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-white pb-2 z-10">Linked Enterprise Knowledge</label>
                  {formData.assets.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl opacity-40">
                       <p className="text-slate-400 text-xs font-bold">No assets linked yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.assets.map((asset) => (
                        <div key={asset.id} className="p-5 bg-white border-2 border-slate-100 rounded-3xl flex items-center gap-4 group transition-all hover:border-indigo-100 hover:shadow-sm">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-black text-slate-900 truncate">{asset.fileName}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{asset.status}</p>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.id); }} 
                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            title="Remove Asset"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-10 bg-[#fafafa] border-t border-slate-100 flex items-center justify-between">
          <button onClick={prevStep} disabled={step === 1 || isDeploying} className="px-8 py-4 text-sm font-black text-slate-400 hover:text-slate-900 disabled:opacity-20 uppercase tracking-widest">Back</button>
          <button onClick={step === 5 ? handleFinalize : nextStep} disabled={isDeploying || (step === 5 && !formData.isAuthorized)} className={`px-14 py-5 rounded-[1.8rem] text-[16px] font-black shadow-2xl transition-all active:scale-95 ${step === 5 ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'}`}>{step === 5 ? 'Initialize Deployment' : 'Save & Continue'}</button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
