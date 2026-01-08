
import { WixSite, ProductServiceDetail } from '../types';

/**
 * Simulates Wix REST API for programmatic site creation and management.
 * Generates high-fidelity HTML documents as Base64 Data URLs.
 */

const getComponentHtml = (type: string, data: any) => {
  const templates: Record<string, (d: any) => string> = {
    'Header': (d) => `
      <nav class="p-6 flex justify-between items-center border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div class="font-black text-2xl tracking-tighter text-indigo-600">${d.siteName}</div>
        <div class="hidden md:flex gap-8 text-sm font-bold text-gray-500">
          <a href="#" class="hover:text-indigo-600">Features</a>
          <a href="#" class="hover:text-indigo-600">Case Studies</a>
          <a href="#" class="hover:text-indigo-600">Enterprise</a>
        </div>
        <button class="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100">Get Started</button>
      </nav>
    `,
    'Hero': (d) => `
      <header class="py-24 px-12 text-center max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <h1 class="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight" id="hero-title">
          Build the <span class="text-indigo-600">Intelligent</span> Future.
        </h1>
        <p class="text-xl text-gray-500 font-medium max-w-3xl mx-auto leading-relaxed" id="hero-subtitle">
          Next-generation brand scaling for ${d.siteName}. Grounded in Enterprise RAG.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button class="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-2xl hover:bg-black transition-all">Launch Dashboard</button>
          <button class="px-8 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl font-black hover:bg-gray-50 transition-all">Documentation</button>
        </div>
      </header>
    `,
    'Grid': (d) => `
      <section class="bg-gray-50 py-24 px-12">
        <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          ${['Autonomous Agents', 'RAG Storage', 'Global Sync'].map(title => `
            <div class="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
              <div class="w-14 h-14 bg-indigo-50 rounded-2xl mb-8 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944" /></svg>
              </div>
              <h3 class="text-2xl font-black mb-4 text-gray-900">${title}</h3>
              <p class="text-gray-500 font-medium leading-relaxed">Scaling infrastructure that adapts to your corporate identity in real-time.</p>
            </div>
          `).join('')}
        </div>
      </section>
    `,
    'Pricing': (d) => `
      <section class="py-24 px-12 bg-white">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div class="p-10 border-2 border-gray-100 rounded-[3rem] text-center">
            <p class="text-5xl font-black mb-6">$199<span class="text-lg text-gray-400">/mo</span></p>
            <button class="w-full py-4 bg-gray-900 text-white rounded-2xl font-black">Pro Plan</button>
          </div>
          <div class="p-10 border-2 border-indigo-600 bg-indigo-600 rounded-[3rem] text-center text-white">
            <p class="text-5xl font-black mb-6">Custom</p>
            <button class="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black">Enterprise</button>
          </div>
        </div>
      </section>
    `,
    'Contact': (d) => `
      <section class="bg-slate-900 py-24 px-12 text-white text-center">
        <h2 class="text-5xl font-black mb-8">Ready to Scale?</h2>
        <button class="px-10 py-5 bg-indigo-600 rounded-2xl font-black hover:bg-indigo-700 transition-all">Get in Touch</button>
      </section>
    `
  };
  return templates[type] ? templates[type](data) : '';
};

const generateMockSiteHtml = (siteName: string, templateType: string = 'Enterprise Base') => {
  const templateStyles: Record<string, string> = {
    'Enterprise Base': 'background: radial-gradient(circle at top right, #f8fafc, #ffffff);',
    'Modern Portfolio': 'background: #0f172a; color: white;',
    'SaaS Landing': 'background: #ffffff; color: #1e293b; --primary: #4f46e5;'
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            margin: 0; 
            padding: 0; 
            min-height: 100vh;
            ${templateStyles[templateType] || ''}
          }
          .section-wrapper { 
            position: relative; 
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
            border: 2px solid transparent;
          }
          .section-wrapper:hover { 
            border-color: #4f46e5; 
            background: rgba(79, 70, 229, 0.05);
          }
          .section-controls {
            position: absolute;
            top: 1rem;
            right: 1rem;
            display: none;
            gap: 0.5rem;
            z-index: 100;
          }
          .section-wrapper:hover .section-controls {
            display: flex;
            animation: fadeIn 0.2s ease-out;
          }
          .control-btn {
            background: #ef4444;
            color: white;
            border: none;
            padding: 8px;
            border-radius: 10px;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .empty-state { 
            border: 4px dashed rgba(148, 163, 184, 0.3); 
            border-radius: 3rem; 
            margin: 4rem 2rem; 
            padding: 8rem 2rem; 
            text-align: center; 
            color: #94a3b8; 
          }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
        </style>
      </head>
      <body>
        <div id="canvas-root">
          <div id="sections-container">
             <div class="empty-state">
               <div class="w-16 h-16 bg-slate-500/10 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-6">
                 <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
               </div>
               <p class="text-2xl font-black mb-2">${templateType}</p>
               <p class="text-sm font-bold opacity-60">Canvas initialized for ${siteName}. Add sections to build.</p>
             </div>
          </div>
        </div>

        <script>
          const container = document.getElementById('sections-container');
          
          window.addEventListener('message', (event) => {
            const { type, payload } = event.data;
            
            if (type === 'ADD_SECTION') {
              if (container.querySelector('.empty-state')) {
                container.innerHTML = '';
              }
              const section = document.createElement('div');
              section.className = 'section-wrapper';
              section.id = payload.id;
              
              const templates = {
                'Header': \`${getComponentHtml('Header', { siteName: siteName }).replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
                'Hero': \`${getComponentHtml('Hero', { siteName: siteName }).replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
                'Grid': \`${getComponentHtml('Grid', { siteName: siteName }).replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
                'Pricing': \`${getComponentHtml('Pricing', { siteName: siteName }).replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
                'Contact': \`${getComponentHtml('Contact', { siteName: siteName }).replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`
              };
              
              const controls = document.createElement('div');
              controls.className = 'section-controls';
              controls.innerHTML = \`
                <button class="control-btn" onclick="window.parent.postMessage({type: 'REQUEST_DELETE', payload: {id: '\${payload.id}'}}, '*')">
                  <svg style="width:16px;height:16px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              \`;
              
              section.appendChild(controls);
              const content = document.createElement('div');
              content.innerHTML = templates[payload.type];
              section.appendChild(content);
              container.appendChild(section);
              section.scrollIntoView({ behavior: 'smooth' });
            }
            
            if (type === 'REMOVE_SECTION') {
              const el = document.getElementById(payload.id);
              if (el) {
                el.style.opacity = '0';
                el.style.transform = 'scale(0.95)';
                setTimeout(() => el.remove(), 300);
              }
            }

            if (type === 'UPDATE_ELEMENT') {
              const el = document.getElementById(payload.id);
              if (el) el.innerText = payload.text;
            }
          });
        </script>
      </body>
    </html>
  `;
  
  // High-reliability UTF-8 Base64 encoding
  const encoded = btoa(encodeURIComponent(htmlContent).replace(/%([0-9A-F]{2})/g, (match, p1) => 
    String.fromCharCode(parseInt(p1, 16))
  ));
  return `data:text/html;base64,${encoded}`;
};

export const cloneTemplateSite = async (tenantId: string, siteName: string, templateType: string = 'Enterprise Base'): Promise<WixSite> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return {
    id: `wix-${Math.random().toString(36).substr(2, 9)}`,
    name: siteName,
    url: generateMockSiteHtml(siteName, templateType),
    status: 'Staging',
    lastSync: new Date().toISOString(),
    templateId: templateType
  };
};

export const updateSiteTemplate = async (siteId: string, siteName: string, templateType: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return generateMockSiteHtml(siteName, templateType);
};

export const syncEnterpriseCMS = async (tenantId: string, siteId: string, offerings: ProductServiceDetail[]): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
};
