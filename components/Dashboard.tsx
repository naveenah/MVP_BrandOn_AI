
import React, { useState, useEffect } from 'react';
import { Tenant, ScheduledPost, AutomationChannel, ChannelType } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as ActionEngineService from '../services/actionEngineService';
import { DB } from '../services/db';

interface DashboardProps { tenant: Tenant; }

const Dashboard: React.FC<DashboardProps> = ({ tenant }) => {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(tenant);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [analytics, setAnalytics] = useState<any[]>([]);
  
  const [manualPost, setManualPost] = useState<{ platform: ChannelType; title: string; contentSummary: string; publishAt: string; }>({
    platform: 'LinkedIn', title: '', contentSummary: '', publishAt: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!tenant) return;
    
    const init = async () => {
      setActiveTenant(tenant);
      const posts = await ActionEngineService.getScheduledPosts(tenant.id);
      setScheduledPosts(posts);

      let data = await DB.get<any[]>(DB.keys.ANALYTICS(tenant.id));
      if (!data) {
        data = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(name => ({
          name, reach: Math.floor(Math.random() * 5000) + 1000, engagement: Math.floor(Math.random() * 3000) + 500
        }));
        await DB.set(DB.keys.ANALYTICS(tenant.id), data);
      }
      setAnalytics(data);
    };
    init();

    const handleUpdate = async () => {
      const tenants = await DB.get<Tenant[]>(DB.keys.TENANTS);
      const updated = tenants?.find(t => t.id === tenant.id);
      if (updated) setActiveTenant(updated);
    };

    const handlePipelineUpdate = async (e: any) => {
      if (e.detail.tenantId === tenant.id) {
        const posts = await ActionEngineService.getScheduledPosts(tenant.id);
        setScheduledPosts(posts);
      }
    };

    window.addEventListener('tenantUpdated', handleUpdate);
    window.addEventListener('pipelineUpdated', handlePipelineUpdate);
    return () => {
      window.removeEventListener('tenantUpdated', handleUpdate);
      window.removeEventListener('pipelineUpdated', handlePipelineUpdate);
    };
  }, [tenant]);

  if (!activeTenant) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Synchronizing Workspace...</p>
        </div>
      </div>
    );
  }

  const handleInitializeWorkflow = async () => {
    if (isGenerating || !activeTenant) return;
    setIsGenerating(true);
    const newPosts = await ActionEngineService.synthesizeAIPipeline(activeTenant.id);
    const existing = await ActionEngineService.getScheduledPosts(activeTenant.id);
    await DB.set(DB.keys.PIPELINE(activeTenant.id), [...newPosts, ...existing]);
    window.dispatchEvent(new CustomEvent('pipelineUpdated', { detail: { tenantId: activeTenant.id } }));
    setIsGenerating(false);
  };

  const handleExportIntelligence = async () => {
    if (!activeTenant) return;
    setIsExporting(true);
    const report = await ActionEngineService.generateBrandIntelligenceReport(activeTenant.id);
    setReportContent(report);
    setIsExporting(false);
  };

  const handleCreateManualPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant) return;
    await ActionEngineService.createScheduledPost(activeTenant.id, {
      ...manualPost,
      publishAt: new Date(manualPost.publishAt).toISOString(),
      status: 'Scheduled'
    });
    setShowManualModal(false);
  };

  const channels = activeTenant.automationWorkflow?.channels || [];
  const progress = activeTenant.automationWorkflow?.overallProgress || 0;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Brand OS Core</h1>
          <p className="text-slate-500 font-medium tracking-tight">Enterprise Persistence Layer: <span className="text-indigo-600 font-black">Online (Neon)</span></p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportIntelligence} disabled={isExporting} className="px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50">
            {isExporting ? 'Synthesizing...' : 'Export Intelligence'}
          </button>
          <button onClick={() => setShowManualModal(true)} className="px-6 py-3 bg-indigo-600 border-2 border-indigo-600 rounded-2xl text-sm font-black uppercase tracking-widest text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
            Manual Control
          </button>
        </div>
      </div>

      {reportContent && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl" onClick={() => setReportContent(null)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col h-[85vh] border border-slate-200">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-[3rem]">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Intelligence Report</h2>
                <button onClick={() => setReportContent(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
             </div>
             <div className="flex-1 overflow-y-auto p-10 bg-white no-scrollbar">
                <div className="prose prose-slate max-w-none">{reportContent.split('\n').map((line, idx) => (<p key={idx} className="mb-4 text-slate-800 font-medium leading-relaxed">{line}</p>))}</div>
             </div>
          </div>
        </div>
      )}

      {showManualModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowManualModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">Manual Post Entry</h2>
            <form onSubmit={handleCreateManualPost} className="space-y-6">
              <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Platform</label>
                <select className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all" value={manualPost.platform} onChange={e => setManualPost({...manualPost, platform: e.target.value as ChannelType})}>
                  <option value="LinkedIn">LinkedIn</option><option value="X">X (Twitter)</option><option value="YouTube">YouTube</option><option value="Medium">Medium</option>
                </select>
              </div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Title</label>
                <input type="text" required className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 outline-none" value={manualPost.title} onChange={e => setManualPost({...manualPost, title: e.target.value})} />
              </div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Summary</label>
                <textarea required rows={3} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-medium text-slate-900 outline-none" value={manualPost.contentSummary} onChange={e => setManualPost({...manualPost, contentSummary: e.target.value})}></textarea>
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">Initialize Post</button>
            </form>
          </div>
        </div>
      )}

      <section className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white overflow-hidden relative border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div><h2 className="text-xl font-black tracking-tight uppercase tracking-widest text-indigo-400">Action Engine Cluster</h2><p className="text-slate-400 text-sm mt-1">Real-time projection from Neon-backed persistent state.</p></div>
          <div className="flex items-center gap-4"><p className="text-2xl font-black text-white">{progress}%</p></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 relative z-10">
          {channels.map((channel, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 p-6 rounded-[2rem] hover:bg-slate-800 transition-all group">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform ${channel.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                   {channel.type === 'LinkedIn' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>}
                </div>
                <div><p className="text-xs font-black uppercase tracking-widest text-slate-300">{channel.type}</p><p className="text-[10px] font-bold mt-1 text-slate-500">{channel.status}</p></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-10">Persistent Analytics</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)'}} />
                  <Area type="monotone" dataKey="reach" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.05} strokeWidth={4} />
                  <Area type="monotone" dataKey="engagement" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 h-full">
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-8">AI Pipeline</h2>
            <div className="space-y-6">
              {scheduledPosts.map((post, i) => (
                <div key={post.id} className="relative pl-8 pb-8 border-l-2 border-slate-100 last:pb-0">
                  <div className="absolute top-0 left-0 -ml-[9px] w-4 h-4 rounded-full border-4 border-white bg-indigo-600 shadow-md"></div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex items-center justify-between mb-3"><span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">{post.platform}</span><span className="text-[10px] font-black text-slate-400">{new Date(post.publishAt).toLocaleDateString()}</span></div>
                    <h4 className="text-sm font-black text-slate-900 mb-2">{post.title}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{post.contentSummary}</p>
                  </div>
                </div>
              ))}
              <button onClick={handleInitializeWorkflow} disabled={isGenerating} className={`w-full py-5 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-black uppercase tracking-widest text-xs hover:border-indigo-400 hover:text-indigo-600 transition-all ${isGenerating ? 'opacity-50' : ''}`}>
                {isGenerating ? 'Synthesizing Persistent Strategy...' : 'Initialize AI Workflow'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
