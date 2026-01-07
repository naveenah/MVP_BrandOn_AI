
import React, { useState, useRef, useEffect } from 'react';
import { Tenant } from '../types';
import * as GeminiService from '../services/geminiService';

interface Citation { title: string; uri: string; }
interface Message { role: 'user' | 'model'; content: string; citations?: Citation[]; }

interface ExploreProps { tenant: Tenant; }

const Explore: React.FC<ExploreProps> = ({ tenant }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showSources, setShowSources] = useState<Citation[] | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHistory = async () => {
      const history = await GeminiService.getChatHistory(tenant.id);
      const formatted = history.map(h => ({
        role: h.role,
        content: h.parts[0].text
      })) as Message[];
      
      if (formatted.length === 0) {
        setMessages([{ role: 'model', content: `Welcome back. I am synced with the **${tenant.name}** context. How can I assist?` }]);
      } else {
        setMessages(formatted);
      }
    };
    loadHistory();
  }, [tenant.id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsThinking(true);

    const result = await GeminiService.getBrandAssistantResponse(userMsg, tenant.id, tenant.name);
    
    setMessages(prev => [...prev, { 
      role: 'model', 
      content: result.text,
      citations: result.citations
    }]);
    setIsThinking(false);
  };

  const handleClear = async () => {
    await GeminiService.clearChatHistory(tenant.id);
    setMessages([{ role: 'model', content: "Memory cleared. How can I help?" }]);
  };

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-6">
      <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 ring-4 ring-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">Persistent Explore</h2>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 block">Contextual AI Agent</span>
            </div>
          </div>
          <button onClick={handleClear} className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors">Clear History</button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-10 bg-[#fcfcfd] no-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[85%] group`}>
                <div className={`relative rounded-3xl px-7 py-5 shadow-sm transition-all ${
                  m.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-800'
                }`}>
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{m.content}</p>
                  {m.citations && m.citations.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <button onClick={() => setShowSources(m.citations || null)} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">View {m.citations.length} Sources</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isThinking && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm flex items-center gap-3">
                <div className="flex gap-1.5"><div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div><div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div></div>
                <span className="text-xs font-bold text-slate-400 italic">Consulting Neon DB...</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 bg-white">
          <div className="max-w-4xl mx-auto relative group">
            <div className="relative flex items-center gap-4 bg-white p-3 rounded-[2rem] border border-slate-200 shadow-2xl">
              <input 
                type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your brand mission..." className="flex-1 bg-transparent border-none focus:ring-0 text-[16px] text-slate-900 font-semibold px-6 py-4"
              />
              <button 
                onClick={handleSend} disabled={!input.trim() || isThinking}
                className="p-5 bg-indigo-600 text-white rounded-[1.6rem] shadow-xl hover:bg-indigo-700 disabled:opacity-30 transition-all active:scale-90"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
