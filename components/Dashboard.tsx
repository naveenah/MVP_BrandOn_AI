
import React, { useState, useEffect } from 'react';
import { Tenant, ScheduledPost, AutomationChannel } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as ActionEngineService from '../services/actionEngineService';

interface DashboardProps {
  tenant: Tenant;
}

const analyticsData = [
  { name: 'Mon', reach: 4000, engagement: 2400 },
  { name: 'Tue', reach: 3000, engagement: 1398 },
  { name: 'Wed', reach: 2000, engagement: 9800 },
  { name: 'Thu', reach: 2780, engagement: 3908 },
  { name: 'Fri', reach: 1890, engagement: 4800 },
  { name: 'Sat', reach: 2390, engagement: 3800 },
  { name: 'Sun', reach: 3490, engagement: 4300 },
];

const Dashboard: React.FC<DashboardProps> = ({ tenant }) => {
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant>(tenant);

  useEffect(() => {
    setActiveTenant(tenant);
    setScheduledPosts(ActionEngineService.getScheduledPosts(tenant.id));

    const handleUpdate = () => {
      const savedTenants = JSON.parse(localStorage.getItem('tenants') || '[]');
      const updated = savedTenants.find((t: any) => t.id === tenant.id);
      if (updated) {
        setActiveTenant(updated);
        setScheduledPosts(ActionEngineService.getScheduledPosts(tenant.id));
      }
    };

    window.addEventListener('tenantUpdated', handleUpdate);
    return () => window.removeEventListener('tenantUpdated', handleUpdate);
  }, [tenant]);

  const channels = activeTenant.automationWorkflow?.channels || [];
  const progress = activeTenant.automationWorkflow?.overallProgress || 0;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Brand OS Core</h1>
          <p className="text-slate-500 font-medium">Monitoring orchestrations for <span className="text-indigo-600 font-black">{activeTenant.name}</span></p>
        </div>
        <div className="flex gap-3">
          <button className="px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">Export Intelligence</button>
          <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Manual Intervention</button>
        </div>
      </div>

      {/* Action Engine Status Grid (FR-501 to FR-505) */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 md:p-10 text-white overflow-hidden relative border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
        
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div>
            <h2 className="text-xl font-black tracking-tight uppercase tracking-widest text-indigo-400">Action Engine Status</h2>
            <p className="text-slate-400 text-sm mt-1">Real-time projection of enterprise identity across platforms.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Global Coverage</p>
              <p className="text-2xl font-black text-white">{progress}%</p>
            </div>
            <div className="w-16 h-16 rounded-2xl border-4 border-slate-800 flex items-center justify-center p-1">
               <div className="w-full h-full bg-indigo-600 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 relative z-10">
          {channels.length > 0 ? channels.map((channel, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700 p-6 rounded-[2rem] hover:bg-slate-800 transition-all group">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                  channel.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 
                  channel.status === 'Generating' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700 text-slate-500'
                }`}>
                   {channel.type === 'LinkedIn' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>}
                   {channel.type === 'X' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>}
                   {channel.type === 'YouTube' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>}
                   {channel.type === 'Google Business' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.48 10.92v3.28h4.74c-.2 1.06-1.22 3.12-4.74 3.12-3.04 0-5.52-2.52-5.52-5.62s2.48-5.62 5.52-5.62c1.72 0 2.88.74 3.54 1.38l2.58-2.58c-1.66-1.54-3.8-2.48-6.12-2.48-5.22 0-9.48 4.26-9.48 9.48s4.26 9.48 9.48 9.48c5.44 0 9.06-3.82 9.06-9.22 0-.62-.06-1.1-.18-1.58h-8.88z"/></svg>}
                   {channel.type === 'Medium' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zm7.42 0c0 3.54-1.51 6.42-3.38 6.42S14.2 15.54 14.2 12s1.52-6.42 3.38-6.42 3.38 2.88 3.38 6.42zM24 12c0 3.17-.53 5.75-1.19 5.75s-1.19-2.58-1.19-5.75.54-5.75 1.19-5.75S24 8.83 24 12z"/></svg>}
                   {channel.type === 'Shopify' && <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm4.333 16.8c-.267.333-.667.533-1.066.533H8.733c-.4 0-.8-.2-1.066-.533L5.333 13.8l.667-.667h1.333l1.333-2.666v-2.667h6.667v2.667l1.333 2.666h1.333l.667.667-2.333 3z"/></svg>}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-300">{channel.type}</p>
                  <p className={`text-[10px] font-bold mt-1 ${
                    channel.status === 'Active' ? 'text-emerald-400' : 
                    channel.status === 'Generating' ? 'text-amber-400' : 'text-slate-500'
                  }`}>
                    {channel.status}
                  </p>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-[2.5rem]">
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-sm">Action Engine Inactive. Complete Onboarding to Initialize.</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analytics Hub */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Enterprise Visibility</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-600 rounded-full"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reach</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Engagement</span>
                </div>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData}>
                  <defs>
                    <linearGradient id="colorReach" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)'}}
                  />
                  <Area type="monotone" dataKey="reach" stroke="#4f46e5" fillOpacity={1} fill="url(#colorReach)" strokeWidth={4} />
                  <Area type="monotone" dataKey="engagement" stroke="#10b981" fillOpacity={1} fill="url(#colorEng)" strokeWidth={4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-8">Active Synchronizations</h2>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    <th className="pb-5 px-2">Ecosystem Asset</th>
                    <th className="pb-5 px-2">Medium</th>
                    <th className="pb-5 px-2">Verification</th>
                    <th className="pb-5 px-2 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    { name: 'Primary Logo Architecture', type: 'Vector', status: 'Verified', date: '2h ago' },
                    { name: 'Campaign Manifesto v2', type: 'Article', status: 'Pending Review', date: '5h ago' },
                    { name: 'Global Brand Guidelines', type: 'PDF Architecture', status: 'Draft', date: '1d ago' },
                    { name: 'Product Reel Alpha', type: 'Video Meta', status: 'Verified', date: '3d ago' },
                  ].map((item, i) => (
                    <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-6 px-2 font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{item.name}</td>
                      <td className="py-6 px-2 text-slate-500 text-xs font-bold uppercase tracking-widest">{item.type}</td>
                      <td className="py-6 px-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                          item.status === 'Verified' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                          item.status === 'Pending Review' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-6 px-2 text-right text-slate-400 text-[10px] font-black uppercase tracking-widest">{item.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI Content Pipeline (Calendar FR-506) */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">AI Pipeline</h2>
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
            </div>

            <div className="space-y-6">
              {scheduledPosts.length > 0 ? scheduledPosts.map((post, i) => (
                <div key={i} className="relative pl-8 pb-8 border-l-2 border-slate-100 last:pb-0">
                  <div className="absolute top-0 left-0 -ml-[9px] w-4 h-4 rounded-full border-4 border-white bg-indigo-600 shadow-md"></div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all cursor-pointer group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">{post.platform}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {new Date(post.publishAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 mb-2 group-hover:text-indigo-700 transition-colors">{post.title}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{post.contentSummary}</p>
                    <div className="mt-4 flex items-center gap-2">
                       <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Auto-Gen Ready</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-200">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Pipeline Empty</p>
                </div>
              )}
            </div>

            <button className="w-full mt-8 py-5 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 font-black uppercase tracking-widest text-xs hover:border-indigo-400 hover:text-indigo-600 transition-all">
              Initialize Custom Workflow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
