
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tenant, OnboardingDraft, OnboardingAsset } from '../types';
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

const Onboarding: React.FC<OnboardingProps> = ({ tenant, onComplete }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deploymentStage, setDeploymentStage] = useState('');
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  
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
    services: [''],
    assets: [],
    currentStep: 1,
    updatedAt: new Date().toISOString()
  });

  const saveCurrentProgress = useCallback(async (dataOverride?: Partial<OnboardingDraft>, newStep?: number) => {
    setIsSaving(true);
    const dataToSave = { 
      ...formData, 
      ...dataOverride, 
      currentStep: newStep || step,
      updatedAt: new Date().toISOString()
    };
    await OnboardingService.saveOnboardingDraft(tenant.id, dataToSave);
    setTimeout(() => setIsSaving(false), 500);
  }, [formData, step, tenant.id]);

  useEffect(() => {
    const loadDraft = async () => {
      const savedDraft = await OnboardingService.getOnboardingDraft(tenant.id);
      if (savedDraft) {
        setFormData(prev => ({ ...prev, ...savedDraft }));
        setStep(savedDraft.currentStep);
      }
      setIsLoadingDraft(false);
    };
    loadDraft();
  }, [tenant.id]);

  const handleInputChange = (field: keyof OnboardingDraft, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      OnboardingService.saveOnboardingDraft(tenant.id, updated);
      return updated;
    });
  };

  const nextStep = async () => {
    if (step === 1 && (!formData.companyName || !formData.industry || !formData.orgSize || !formData.orgType)) {
      alert("Please fill in all required fields marked with *");
      return;
    }
    const next = Math.min(step + 1, 3);
    setStep(next);
    await saveCurrentProgress({}, next);
  };

  const prevStep = async () => {
    const prev = Math.max(step - 1, 1);
    setStep(prev);
    await saveCurrentProgress({}, prev);
  };

  const handleSaveAndClose = async () => {
    await saveCurrentProgress();
    navigate('/');
  };

  const handleAddField = (type: 'valueProps' | 'services') => {
    const updatedList = [...formData[type], ''];
    handleInputChange(type, updatedList);
  };

  const handleFieldChange = (type: 'valueProps' | 'services', index: number, value: string) => {
    const updated = [...formData[type]];
    updated[index] = value;
    handleInputChange(type, updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    const newAssetPlaceholder: OnboardingAsset = {
      id: Math.random().toString(),
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
    
    // Clear the input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFinalize = async () => {
    if (!formData.isAuthorized) {
      alert("Please verify that you are an authorized representative.");
      return;
    }

    setIsDeploying(true);
    await saveCurrentProgress();

    const stages = [
      'Provisioning Isolated Database Context...',
      'Mapping Neural Vectors to Enterprise Assets...',
      'Syncing to Google File Search RAG Store...',
      'Finalizing API Handlers...',
      'Activating Action Engine & Brand Hub...'
    ];

    let currentIdx = 0;
    setDeploymentStage(stages[0]);
    setDeploymentProgress(20);

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
        setDeploymentProgress((currentIdx + 1) * 20);
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
    { title: 'Brand Identity', desc: 'Core presence' },
    { title: 'Strategic Map', desc: 'Value & Mission' },
    { title: 'Asset Hub', desc: 'Media sync' }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 relative">
      {/* Hidden File Input outside the clickable container to prevent bubbles */}
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
        <div className="p-10 sm:p-14">
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
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 text-left">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Advanced Media Hub</h2>
                <p className="text-slate-500 font-medium max-w-lg mx-auto">Upload strategic documents to ground the AI in your specific corporate context.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className="group h-64 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all overflow-hidden"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 shadow-lg mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <span className="text-lg font-black text-slate-900">Link Asset</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Click to select files</span>
                </div>
                <div className="space-y-4 h-64 overflow-y-auto no-scrollbar pr-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-white pb-2">Sync Queue</label>
                  {formData.assets.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-slate-100 border-dashed">
                      <p className="text-slate-400 text-xs font-bold">No assets linked.</p>
                    </div>
                  ) : (
                    formData.assets.map((asset) => (
                      <div key={asset.id} className="p-5 bg-white border-2 border-slate-100 rounded-3xl flex items-center gap-4 shadow-sm animate-in fade-in slide-in-from-right-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                          {asset.status === 'Synced' ? (
                            <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          ) : (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-black text-slate-900 truncate mb-1">{asset.fileName}</p>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-300 ${asset.status === 'Synced' ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{ width: `${asset.progress}%` }}></div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-10 bg-[#fafafa] border-t border-slate-100 flex items-center justify-between">
          <button onClick={prevStep} disabled={step === 1 || isDeploying} className="px-8 py-4 text-sm font-black text-slate-400 hover:text-slate-900 disabled:opacity-20 transition-all uppercase tracking-widest">Back</button>
          <button 
            onClick={step === 3 ? handleFinalize : nextStep} 
            disabled={isDeploying || (step === 3 && !formData.isAuthorized)} 
            className={`px-14 py-5 rounded-[1.8rem] text-[16px] font-black shadow-2xl transition-all active:scale-95 tracking-tight ${
              step === 3 ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {step === 3 ? 'Initialize Deployment' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
