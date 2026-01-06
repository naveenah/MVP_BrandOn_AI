
import React, { useState, useRef, useEffect } from 'react';
import { Tenant } from '../types';
import { getBrandAssistantResponse } from '../services/geminiService';

interface Citation {
  title: string;
  uri: string;
}

interface Message {
  role: 'user' | 'model';
  content: string;
  citations?: Citation[];
  toolUsed?: string;
}

interface ExploreProps {
  tenant: Tenant;
}

const Explore: React.FC<ExploreProps> = ({ tenant }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      content: `Welcome to the AI Explore Agentic Hub for **${tenant.name}**. I'm currently monitoring your brand guidelines and live market data. 
      \nHow can I help you strategize today?`,
      toolUsed: 'System'
    }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showSources, setShowSources] = useState<Citation[] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsThinking(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    const result = await getBrandAssistantResponse(userMsg, tenant.name, history);
    
    setMessages(prev => [...prev, { 
      role: 'model', 
      content: result.text,
      citations: result.citations,
      toolUsed: (result as any).toolUsed
    }]);
    setIsThinking(false);
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-6">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-purple-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 ring-4 ring-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">Agentic Explore</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stateful Reasoner v4.0</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="hidden sm:flex items-center px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Market Data</span>
               <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Live</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 bg-[#fcfcfd] no-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[85%] group`}>
                {m.toolUsed && (
                  <div className={`text-[10px] font-black uppercase tracking-[0.15em] mb-2 flex items-center gap-2 ${m.role === 'user' ? 'justify-end text-slate-400' : 'text-indigo-600'}`}>
                    {m.toolUsed === 'Internal RAG' && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" /></svg>}
                    {m.toolUsed === 'Market Analysis' && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" /></svg>}
                    {m.toolUsed}
                  </div>
                )}
                <div className={`relative rounded-3xl px-7 py-5 shadow-sm transition-all ${
                  m.role === 'user' 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                    : 'bg-white border border-slate-200 text-slate-800'
                }`}>
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{m.content}</p>
                  
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                      <button 
                        onClick={() => setShowSources(m.citations || null)}
                        className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors uppercase tracking-widest flex items-center gap-2"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        View {m.citations.length} Sources
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isThinking && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="space-y-3">
                 <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping"></div>
                    Synthesizing Agent Graph...
                 </div>
                 <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    </div>
                    <span className="text-xs font-bold text-slate-400 italic">Agent is consulting your brand documents...</span>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-8 border-t border-slate-100 bg-white">
          <div className="max-w-4xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.2rem] blur opacity-15 group-hover:opacity-25 transition duration-1000 group-focus-within:opacity-35"></div>
            <div className="relative flex items-center gap-4 bg-white p-3 rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-100">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your brand mission, or analyze competitors..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-[16px] text-slate-900 font-semibold px-6 py-4 placeholder-slate-400"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className="p-5 bg-indigo-600 text-white rounded-[1.6rem] shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-30 transition-all active:scale-90 flex-shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex justify-center gap-8 mt-6">
             <div className="flex items-center gap-2 opacity-40 grayscale hover:grayscale-0 transition-all cursor-default">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Grounding:</span>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Neon DB</span>
             </div>
             <div className="flex items-center gap-2 opacity-40 grayscale hover:grayscale-0 transition-all cursor-default">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Search:</span>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Google Market</span>
             </div>
          </div>
        </div>
      </div>

      {/* Sources Drawer / Side Panel */}
      {showSources && (
        <div className="fixed inset-0 md:relative md:inset-auto z-50 md:z-0 flex justify-end md:block">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm md:hidden" onClick={() => setShowSources(null)}></div>
          <div className="relative w-80 h-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in slide-in-from-right-8 duration-500">
            <div className="p-6 border-b border-slate-100 bg-white flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Citation Explorer</h3>
              <button onClick={() => setShowSources(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Verified Sources</div>
              {showSources.map((s, idx) => (
                <a 
                  key={idx} 
                  href={s.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-white">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Web Reference</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 truncate">{s.title}</p>
                </a>
              ))}
              <div className="pt-6 mt-6 border-t border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Enterprise Verification</div>
                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <p className="text-[11px] font-bold text-emerald-700 leading-tight">These sources are validated by your tenant's security layer.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explore;
