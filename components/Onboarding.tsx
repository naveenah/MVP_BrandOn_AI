
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tenant, OnboardingDraft, OnboardingAsset } from '../types';
import * as OnboardingService from '../services/onboardingService';
import * as ActionEngineService from '../services/actionEngineService';

interface OnboardingProps {
  tenant: Tenant;
  onComplete: (tenantId: string) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ tenant, onComplete }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState(1);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStage, setDeploymentStage] = useState('');
  
  const [formData, setFormData] = useState<OnboardingDraft>({
    companyName: tenant.name,
    industry: '',
    brandVoice: 'Professional',
    mission: '',
    valueProps: [''],
    services: [''],
    assets: [],
    currentStep: 1,
    updatedAt: new Date().toISOString()
  });

  useEffect(() => {
    const loadDraft = async () => {
      const savedDraft = await OnboardingService.getOnboardingDraft(tenant.id);
      if (savedDraft) {
        setFormData(savedDraft);
        setStep(savedDraft.currentStep);
      }
      setIsLoadingDraft(false);
    };
    loadDraft();
  }, [tenant.id]);

  const saveCurrentProgress = async (newStep?: number) => {
    const dataToSave = { ...formData, currentStep: newStep || step };
    await OnboardingService.saveOnboardingDraft(tenant.id, dataToSave);
  };

  const nextStep = async () => {
    const next = Math.min(step + 1, 3);
    setStep(next);
    await saveCurrentProgress(next);
  };

  const prevStep = async () => {
    const prev = Math.max(step - 1, 1);
    setStep(prev);
    await saveCurrentProgress(prev);
  };

  const handleSaveAndClose = async () => {
    await saveCurrentProgress();
    navigate('/');
  };

  const handleAddField = (type: 'valueProps' | 'services') => {
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], '']
    }));
  };

  const handleFieldChange = (type: 'valueProps' | 'services', index: number, value: string) => {
    const updated = [...formData[type]];
    updated[index] = value;
    setFormData(prev => ({ ...prev, [type]: updated }));
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

    setFormData(prev => ({
      ...prev,
      assets: [...prev.assets, newAssetPlaceholder]
    }));

    try {
      const syncedAsset = await OnboardingService.uploadAsset(tenant.id, file, (progress) => {
        setFormData(prev => ({
          ...prev,
          assets: prev.assets.map(a => a.id === newAssetPlaceholder.id ? { ...a, progress } : a)
        }));
      });

      setFormData(prev => ({
        ...prev,
        assets: prev.assets.map(a => a.id === newAssetPlaceholder.id ? syncedAsset : a)
      }));
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  const handleFinalize = () => {
    setIsDeploying(true);
    const stages = [
      'Provisioning Isolated Database Context...',
      'Mapping Neural Vectors to Enterprise Assets...',
      'Finalizing API Handlers...',
      'Activating Action Engine & Brand Hub...'
    ];

    let currentIdx = 0;
    setDeploymentStage(stages[0]);

    const interval = setInterval(async () => {
      currentIdx++;
      if (currentIdx >= stages.length) {
        clearInterval(interval);
        
        // Final completion logic
        onComplete(tenant.id);
        
        // Trigger the Action Engine Ripple (FR-501 to FR-504)
        await ActionEngineService.triggerAutomationRipple(tenant.id);
        
        navigate('/');
      } else {
        setDeploymentStage(stages[currentIdx]);
      }
    }, 1500);
  };

  if (isLoadingDraft) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Resuming Session...</p>
        </div>
      </div>
    );
  }

  const steps = [
    { title: 'Core Identity', desc: 'Strategic basics' },
    { title: 'Value Map', desc: 'Propositions & Services' },
    { title: 'Media Hub', desc: 'Sync multi-modal assets' }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 relative">
      {isDeploying && (
        <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center text-center p-6 transition-all duration-1000">
           <div className="w-32 h-32 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-2xl shadow-indigo-500/50 animate-bounce">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
           </div>
           <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Deploying {tenant.name} Environment</h3>
           <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-sm">{deploymentStage}</p>
           </div>
        </div>
      )}

      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Enterprise Onboarding</h1>
          <p className="text-slate-500 mt-2 font-medium">Configuring isolated instance for <span className="text-indigo-600 font-black">{tenant.name}</span></p>
        </div>
        <button 
          onClick={handleSaveAndClose}
          className="px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          Save & Close
        </button>
      </div>

      {/* Modern Progress Line */}
      <div className="flex items-center gap-4 mb-12 overflow-x-auto pb-4 no-scrollbar">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black transition-all duration-700 ${
                step > i + 1 ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-100' : 
                step === i + 1 ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 ring-8 ring-indigo-50' : 'bg-white border-2 border-slate-200 text-slate-400'
              }`}>
                {step > i + 1 ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                ) : (i + 1)}
              </div>
              <div className="hidden sm:block">
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
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Foundational Context</h2>
                <p className="text-slate-500 font-medium mt-2">Establish the primary metadata for your brand agent.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Enterprise Designation</label>
                  <input 
                    type="text" 
                    value={formData.companyName} 
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-600 transition-all outline-none text-slate-900 font-bold" 
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Industry Classification</label>
                  <select 
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-600 outline-none transition-all text-slate-900 font-bold"
                  >
                    <option value="">Select Domain</option>
                    <option value="saas">SaaS & Enterprise Tech</option>
                    <option value="fintech">FinTech & Crypto</option>
                    <option value="healthcare">Healthcare Systems</option>
                    <option value="retail">Global D2C Retail</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Strategic Mission</label>
                <textarea 
                  rows={4}
                  value={formData.mission}
                  onChange={(e) => setFormData({...formData, mission: e.target.value})}
                  placeholder="The primary objective your brand serves..."
                  className="w-full px-7 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:border-indigo-600 transition-all outline-none text-slate-900 font-medium"
                ></textarea>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Strategic Content Map</h2>
                <p className="text-slate-500 font-medium mt-2">Define your value propositions and core service offerings.</p>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Unique Value Propositions</label>
                    <button onClick={() => handleAddField('valueProps')} className="text-xs font-black text-indigo-600 hover:text-indigo-700">+ Add Value Prop</button>
                  </div>
                  {formData.valueProps.map((prop, idx) => (
                    <input 
                      key={idx}
                      type="text" 
                      value={prop} 
                      onChange={(e) => handleFieldChange('valueProps', idx, e.target.value)}
                      placeholder={`Proposition 0${idx + 1}`}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-3 focus:border-indigo-600 outline-none text-slate-800 font-bold"
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Core Offerings / Services</label>
                    <button onClick={() => handleAddField('services')} className="text-xs font-black text-indigo-600 hover:text-indigo-700">+ Add Service</button>
                  </div>
                  {formData.services.map((service, idx) => (
                    <input 
                      key={idx}
                      type="text" 
                      value={service} 
                      onChange={(e) => handleFieldChange('services', idx, e.target.value)}
                      placeholder={`Service 0${idx + 1}`}
                      className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl mb-3 focus:border-indigo-600 outline-none text-slate-800 font-bold"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Cloud Asset Hub</h2>
                <p className="text-slate-500 font-medium max-w-lg mx-auto">Sync your visual identity assets. We support large-scale video and vector imaging via Google File Store.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative h-64 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all overflow-hidden"
                >
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,video/*" />
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 shadow-lg transition-all mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <span className="text-lg font-black text-slate-900">Upload Media</span>
                  <span className="text-xs font-bold text-slate-400 mt-2">Images or Videos (up to 2GB)</span>
                </div>

                <div className="space-y-4 h-64 overflow-y-auto no-scrollbar pr-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest sticky top-0 bg-white pb-2">Active Syncs</label>
                  {formData.assets.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-slate-100 border-dashed">
                      <p className="text-slate-400 text-xs font-bold">No assets linked yet.</p>
                    </div>
                  ) : (
                    formData.assets.map((asset) => (
                      <div key={asset.id} className="p-5 bg-white border-2 border-slate-100 rounded-3xl flex items-center gap-4 shadow-sm">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                           {asset.mimeType.startsWith('video') ? (
                             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                           ) : (
                             <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                           )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-black text-slate-900 truncate mb-1">{asset.fileName}</p>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-indigo-600 transition-all duration-300 ${asset.status === 'Synced' ? 'bg-emerald-500' : ''}`} 
                              style={{ width: `${asset.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        {asset.status === 'Synced' && (
                          <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-10 bg-[#fafafa] border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={prevStep} 
            disabled={step === 1 || isDeploying}
            className="px-8 py-4 text-sm font-black text-slate-400 hover:text-slate-900 disabled:opacity-20 transition-all uppercase tracking-[0.2em]"
          >
            Back
          </button>
          
          <button 
            onClick={step === 3 ? handleFinalize : nextStep}
            disabled={isDeploying || (step === 3 && formData.assets.filter(a => a.status === 'Synced').length === 0)}
            className={`px-14 py-5 rounded-[1.8rem] text-[16px] font-black shadow-2xl transition-all active:scale-95 disabled:opacity-50 tracking-tight ${
              step === 3 
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {step === 3 ? 'Deploy Brand Ecosystem' : 'Next Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
