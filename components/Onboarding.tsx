
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tenant } from '../types';

interface OnboardingProps {
  tenant: Tenant;
  onComplete: (tenantId: string) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ tenant, onComplete }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState(0);
  const [assetsFound, setAssetsFound] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStage, setDeploymentStage] = useState('');
  
  const [formData, setFormData] = useState({
    companyName: tenant.name,
    industry: '',
    brandVoice: 'Professional',
    mission: ''
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 3));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSelectVoice = (voice: string) => {
    setFormData(prev => ({ ...prev, brandVoice: voice }));
  };

  const simulateIndexing = () => {
    setIsModalOpen(false);
    setIsIndexing(true);
    setIndexingProgress(0);
    
    const interval = setInterval(() => {
      setIndexingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setAssetsFound(['brand_guidelines_v1.pdf', 'logo_primary.svg', 'font_config.json', 'social_templates.fig']);
          setIsIndexing(false);
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  const handleFinalize = () => {
    setIsDeploying(true);
    const stages = [
      'Initializing Bounded Contexts...',
      'Mapping Neural Networks to Brand Voice...',
      'Calibrating Asset Vectors...',
      'Finalizing Enterprise Deployment...'
    ];

    let currentIdx = 0;
    setDeploymentStage(stages[0]);

    const interval = setInterval(() => {
      currentIdx++;
      if (currentIdx >= stages.length) {
        clearInterval(interval);
        onComplete(tenant.id);
        navigate('/');
      } else {
        setDeploymentStage(stages[currentIdx]);
      }
    }, 1200);
  };

  const steps = [
    { title: 'Identity', desc: 'The basics' },
    { title: 'Personality', desc: 'Define your sound' },
    { title: 'Assets', desc: 'Connect cloud storage' }
  ];

  const GoogleIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 relative">
      {/* Deployment Overlay */}
      {isDeploying && (
        <div className="fixed inset-0 z-[200] bg-slate-900 flex flex-col items-center justify-center text-center p-6 transition-all duration-1000">
           <div className="w-32 h-32 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white mb-8 shadow-2xl shadow-blue-500/50 animate-bounce">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
           </div>
           <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Deploying {tenant.name}</h3>
           <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-sm animate-pulse">{deploymentStage}</p>
           </div>
        </div>
      )}

      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Enterprise Onboarding</h1>
          <p className="text-slate-500 mt-1 font-medium">Calibrating workspace for <span className="text-blue-600 font-bold">{tenant.name}</span></p>
        </div>
        <div className="hidden sm:block text-right">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security Level</span>
          <p className="text-sm font-bold text-slate-900 flex items-center gap-2 justify-end">
            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 4.946-3.076 9.165-7.427 10.776a.75.75 0 01-.547 0C5.576 16.165 2.5 11.946 2.5 7.001c0-.68.056-1.35.166-2.002zM10 4.25a.75.75 0 01.75.75v3.25a.75.75 0 01-1.5 0V5a.75.75 0 01.75-.75zM10 11a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
            </svg>
            SOC2 Verified
          </p>
        </div>
      </div>

      {/* Progress Tracker */}
      <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-4 no-scrollbar">
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all duration-500 ${
                step > i + 1 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' : 
                step === i + 1 ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 ring-4 ring-blue-50' : 'bg-white border-2 border-slate-200 text-slate-400'
              }`}>
                {step > i + 1 ? (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (i + 1)}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Phase {i + 1}</p>
                <p className={`text-[15px] font-bold ${step === i + 1 ? 'text-slate-900' : 'text-slate-500'}`}>{s.title}</p>
              </div>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-0.5 bg-slate-100 min-w-[30px] rounded-full"></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-200/60 overflow-hidden">
        <div className="p-8 sm:p-12">
          {step === 1 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Identity Foundations</h2>
                <p className="text-slate-500 font-medium mt-2">Anchor the brand context for your dedicated LLM instance.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Enterprise Name</label>
                  <input 
                    type="text" 
                    value={formData.companyName} 
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-600 transition-all outline-none text-slate-900 font-bold" 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Strategic Category</label>
                  <select 
                    value={formData.industry}
                    onChange={(e) => setFormData({...formData, industry: e.target.value})}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-600 outline-none transition-all text-slate-900 font-bold"
                  >
                    <option value="">Choose segment</option>
                    <option value="tech">Technology (B2B SaaS)</option>
                    <option value="fintech">Financial Technologies</option>
                    <option value="retail">Consumer Retail & D2C</option>
                    <option value="media">Modern Media & Content</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Brand Manifesto</label>
                <textarea 
                  rows={4}
                  value={formData.mission}
                  onChange={(e) => setFormData({...formData, mission: e.target.value})}
                  placeholder="Draft your company mission to align AI creative output..."
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-600 transition-all outline-none text-slate-900 font-medium"
                ></textarea>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Brand Personality</h2>
                <p className="text-slate-500 font-medium mt-2">Define the tonal parameters for the automation engine.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { id: 'Professional', icon: '💼', desc: 'Trustworthy, formal, and precise communication.' },
                  { id: 'Friendly', icon: '✨', desc: 'Empathetic, clear, and community-focused.' },
                  { id: 'Bold', icon: '⚡', desc: 'High-contrast, energetic, and disruptive.' },
                  { id: 'Minimalist', icon: '⚪', desc: 'Premium, quiet, and understated luxury.' },
                  { id: 'High-Energy', icon: '🔥', desc: 'Provocative, fast-paced, and modern.' },
                  { id: 'Academic', icon: '🔬', desc: 'Rigorous, data-driven, and authoritative.' }
                ].map(voice => (
                  <button 
                    key={voice.id}
                    onClick={() => handleSelectVoice(voice.id)}
                    className={`group relative p-6 rounded-[2rem] border-2 text-left transition-all overflow-hidden ${
                      formData.brandVoice === voice.id 
                        ? 'border-blue-600 bg-blue-50/50 shadow-xl shadow-blue-100' 
                        : 'border-slate-100 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="text-3xl mb-4 transform group-hover:scale-110 transition-transform">{voice.icon}</div>
                    <span className={`block font-black text-lg mb-2 ${formData.brandVoice === voice.id ? 'text-blue-900' : 'text-slate-900'}`}>{voice.id}</span>
                    <p className={`text-xs leading-relaxed font-bold ${formData.brandVoice === voice.id ? 'text-blue-700' : 'text-slate-500'}`}>{voice.desc}</p>
                    
                    {formData.brandVoice === voice.id && (
                      <div className="absolute top-4 right-4">
                        <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 text-center">
              <div className="max-w-md mx-auto space-y-8">
                <div className="w-28 h-28 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 transform hover:scale-105 transition-transform duration-500">
                  <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Syncing Brand Assets</h2>
                  <p className="text-slate-500 font-bold mt-3 leading-relaxed">Connect your enterprise shared storage to index logos, colors, and font families.</p>
                </div>

                {!isIndexing && assetsFound.length === 0 && (
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="w-full px-8 py-5 bg-white border-2 border-slate-200 rounded-[2rem] font-black text-slate-800 flex items-center justify-center gap-4 hover:border-blue-600 hover:bg-blue-50/30 transition-all shadow-lg shadow-slate-100 group"
                  >
                    <GoogleIcon />
                    <span className="text-lg">Connect Google Drive</span>
                    <svg className="w-6 h-6 text-slate-300 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                )}

                {isIndexing && (
                  <div className="space-y-6 py-6 px-10">
                    <div className="flex justify-between items-end text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                      <span>Neural Indexing</span>
                      <span>{indexingProgress}%</span>
                    </div>
                    <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-out shadow-lg" 
                        style={{ width: `${indexingProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                       <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></span>
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Parsing Brand Guidelines</p>
                    </div>
                  </div>
                )}

                {assetsFound.length > 0 && (
                  <div className="space-y-6 text-left bg-[#f8fafc] p-8 rounded-[2rem] border-2 border-slate-100 animate-in zoom-in-95 duration-500 shadow-xl shadow-slate-100/50">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-50">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-lg font-black text-slate-900 tracking-tight">Sync Complete</span>
                    </div>
                    <ul className="grid grid-cols-1 gap-3">
                      {assetsFound.map((asset, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-[13px] font-bold text-slate-600 bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-sm">
                           <div className="p-1.5 bg-blue-50 rounded-lg">
                             <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                               <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
                             </svg>
                           </div>
                           {asset}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-8 bg-[#fafafa] border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={prevStep} 
            disabled={step === 1 || isIndexing || isDeploying}
            className="px-8 py-3 text-sm font-black text-slate-400 hover:text-slate-900 disabled:opacity-20 transition-all uppercase tracking-widest"
          >
            Back
          </button>
          <div className="flex gap-4">
             <button className="hidden sm:block px-8 py-3 text-sm font-black text-blue-600 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-slate-200">Save Progress</button>
             <button 
              onClick={step === 3 ? handleFinalize : nextStep}
              disabled={isIndexing || isDeploying || (step === 3 && assetsFound.length === 0)}
              className={`px-12 py-4 rounded-2xl text-[15px] font-black shadow-2xl transition-all active:scale-95 disabled:opacity-50 tracking-tight ${
                step === 3 
                  ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
              }`}
            >
              {step === 3 ? 'Deploy Brand OS' : 'Advance Stage'}
            </button>
          </div>
        </div>
      </div>

      {/* Mock Google Picker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <GoogleIcon />
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Cloud Directory</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-8">
              <div className="space-y-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Enterprise Drives</div>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { name: 'Brand Strategy & Media', size: '1.8 GB', date: 'Active Oct 24' },
                    { name: 'Identity Vectors v2.1', size: '240 MB', date: 'Active Sep 24' },
                    { name: 'Legal Guidelines', size: '45 MB', date: 'Active Aug 24' }
                  ].map((drive, idx) => (
                    <button 
                      key={idx}
                      onClick={simulateIndexing}
                      className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-3xl group transition-all"
                    >
                      <div className="flex items-center gap-5">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                           <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                             <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                           </svg>
                        </div>
                        <div className="text-left">
                          <p className="text-[15px] font-black text-slate-900 leading-none mb-1.5">{drive.name}</p>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{drive.date} • {drive.size}</p>
                        </div>
                      </div>
                      <svg className="w-6 h-6 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-center text-slate-400 font-bold mt-8 leading-relaxed px-12 uppercase tracking-tighter">Read-only connection for indexing. Security tokens expire in 24h.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
