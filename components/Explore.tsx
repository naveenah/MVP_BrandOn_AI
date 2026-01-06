
import React, { useState, useRef, useEffect } from 'react';
import { Tenant } from '../types';
import { getBrandAssistantResponse } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ExploreProps {
  tenant: Tenant;
}

const Explore: React.FC<ExploreProps> = ({ tenant }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: `Hello! I'm your Brand Intelligence Assistant for ${tenant.name}. Ask me anything about your brand strategy, content creation, or asset management.` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    const response = await getBrandAssistantResponse(userMsg, tenant.name, history);
    
    setMessages(prev => [...prev, { role: 'model', content: response }]);
    setIsLoading(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 ring-4 ring-indigo-50">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 tracking-tight">Brand Engine v3</h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active reasoning</span>
            </div>
          </div>
        </div>
        <button className="text-xs font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl transition-all border border-indigo-100">
          Brand Book
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#fcfcfd]"
      >
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-3xl px-6 py-4 shadow-sm ${
              m.role === 'user' 
                ? 'bg-slate-900 text-white shadow-slate-200' 
                : 'bg-white border border-slate-200 text-slate-800'
            }`}>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{m.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 border-t border-slate-100 bg-white">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2rem] blur opacity-20 group-hover:opacity-30 transition duration-1000 group-focus-within:opacity-40"></div>
          <div className="relative flex items-center gap-3 bg-white p-2 rounded-[1.8rem] border border-slate-200 shadow-xl shadow-slate-200/50">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Draft a social post or audit our brand voice..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-[15px] text-slate-900 font-semibold px-6 py-4 placeholder-slate-400"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-4 bg-indigo-600 text-white rounded-[1.4rem] shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-30 transition-all active:scale-90"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex justify-center gap-6 mt-4">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Powered by Gemini 3.0</p>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Enterprise Encryption Active</p>
        </div>
      </div>
    </div>
  );
};

export default Explore;
