
import { WixSite, ProductServiceDetail } from '../types';

/**
 * Simulates Wix Velo / REST API for programmatic site creation and management.
 * Generates high-fidelity HTML documents as strings for iframe srcdoc injection.
 */

const getComponentHtml = (type: string, attr: any) => {
  const safeAttr = attr || {};
  const templates: Record<string, (a: any) => string> = {
    'Header': (a) => `
      <nav class="p-6 flex justify-between items-center border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div class="font-black text-2xl tracking-tighter text-indigo-600">${a.siteName || 'BrandOS'}</div>
        <div class="hidden md:flex gap-8 text-sm font-bold text-gray-500">
          <a href="#" onclick="window.parent.postMessage({type: 'NAVIGATE', payload: {path: '${a.link1 || '/'}'}}, '*'); return false;" class="hover:text-indigo-600">${a.nav1 || 'Features'}</a>
          <a href="#" onclick="window.parent.postMessage({type: 'NAVIGATE', payload: {path: '${a.link2 || '/'}'}}, '*'); return false;" class="hover:text-indigo-600">${a.nav2 || 'Case Studies'}</a>
          <a href="#" onclick="window.parent.postMessage({type: 'NAVIGATE', payload: {path: '${a.link3 || '/'}'}}, '*'); return false;" class="hover:text-indigo-600">${a.nav3 || 'Enterprise'}</a>
        </div>
        <button class="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-100">${a.cta || 'Get Started'}</button>
      </nav>
    `,
    'Hero': (a) => `
      <header class="py-24 px-12 text-center max-w-5xl mx-auto space-y-8">
        <h1 class="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight">
          ${a.title || 'Build the <span class="text-indigo-600">Intelligent</span> Future.'}
        </h1>
        <p class="text-xl text-gray-500 font-medium max-w-3xl mx-auto leading-relaxed">
          ${a.subtitle || 'Next-generation brand scaling. Grounded in Enterprise RAG.'}
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button class="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-2xl hover:bg-black transition-all" onclick="window.parent.postMessage({type: 'NAVIGATE', payload: {path: '${a.btn1Link || '/'}'}}, '*')">
            ${a.btn1Text || 'Explore Now'}
          </button>
          <button class="px-8 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl font-black hover:bg-gray-50 transition-all">
            ${a.btn2Text || 'Documentation'}
          </button>
        </div>
      </header>
    `,
    'Grid': (a) => `
      <section class="bg-gray-50 py-24 px-12">
        <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          ${[
            {t: a.item1Title || 'Autonomous Agents', d: a.item1Desc || 'Adaptive scaling infrastructure.'},
            {t: a.item2Title || 'RAG Storage', d: a.item2Desc || 'Enterprise knowledge persistence.'},
            {t: a.item3Title || 'Global Sync', d: a.item3Desc || 'Real-time multi-cloud deployment.'}
          ].map(item => `
            <div class="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
              <div class="w-14 h-14 bg-indigo-50 rounded-2xl mb-8 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944" /></svg>
              </div>
              <h3 class="text-2xl font-black mb-4 text-gray-900">${item.t}</h3>
              <p class="text-gray-500 font-medium leading-relaxed">${item.d}</p>
            </div>
          `).join('')}
        </div>
      </section>
    `,
    'FeaturesList': (a) => `
      <section class="py-24 px-12 bg-white">
        <div class="max-w-5xl mx-auto">
          <h2 class="text-4xl font-black text-center mb-16">${a.title || 'Corporate Capabilities'}</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            ${[
              {f: a.feature1 || 'Neural Sync', d: a.desc1 || 'Real-time alignment with corporate brain.'},
              {f: a.feature2 || 'Brand Guardrails', d: a.desc2 || 'Automated compliance enforcement.'},
              {f: a.feature3 || 'Multi-Modal Generation', d: a.desc3 || 'Seamless cross-channel orchestration.'},
              {f: a.feature4 || 'Advanced RAG', d: a.desc4 || 'Hyper-grounded content intelligence.'}
            ].map(item => `
              <div class="flex gap-6 items-start">
                <div class="w-10 h-10 rounded-xl bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <h4 class="text-xl font-bold text-slate-900 mb-2">${item.f}</h4>
                  <p class="text-slate-500 font-medium leading-relaxed text-sm">${item.d}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `,
    'Testimonials': (a) => `
      <section class="py-24 px-12 bg-slate-50 overflow-hidden relative">
        <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-emerald-500"></div>
        <div class="max-w-4xl mx-auto text-center space-y-12">
          <h2 class="text-3xl font-black text-slate-900 tracking-tight">${a.title || 'Validated by Industry Leaders'}</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            ${[
              {q: a.quote1 || 'BrandOS transformed our global go-to-market speed by 400%.', aut: a.author1 || 'Sarah Chen', role: a.role1 || 'VP of Marketing, TechFlow'},
              {q: a.quote2 || 'The RAG integration ensures our voice is never compromised.', aut: a.author2 || 'David Miller', role: a.role2 || 'CTO, OmniScale'}
            ].map(item => `
              <div class="bg-white p-10 rounded-[2.5rem] text-left border border-slate-100 shadow-sm relative">
                <p class="text-lg italic font-medium text-slate-800 mb-8 leading-relaxed">"${item.q}"</p>
                <div>
                  <p class="font-black text-slate-900 text-sm">${item.aut}</p>
                  <p class="text-indigo-600 text-[10px] font-black uppercase tracking-widest mt-1">${item.role}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `,
    'Team': (a) => `
      <section class="py-24 px-12 bg-white">
        <div class="max-w-6xl mx-auto text-center">
          <h2 class="text-4xl font-black mb-16">${a.title || 'Leadership Collective'}</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
            ${[
              {n: a.name1 || 'Marcus Thorne', r: a.role1 || 'Chief Strategist'},
              {n: a.name2 || 'Elena Vance', r: a.role2 || 'Head of AI Architecture'},
              {n: a.name3 || 'Julian Grey', r: a.role3 || 'Ecosystem Lead'}
            ].map(item => `
              <div class="space-y-4">
                <div class="w-32 h-32 bg-slate-100 rounded-full mx-auto ring-4 ring-slate-50 flex items-center justify-center text-slate-400">
                  <svg class="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <h4 class="text-xl font-black text-slate-900">${item.n}</h4>
                <p class="text-indigo-600 text-xs font-black uppercase tracking-widest">${item.r}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `,
    'FAQ': (a) => `
      <section class="py-24 px-12 bg-slate-950 text-white">
        <div class="max-w-3xl mx-auto space-y-12">
          <div class="text-center space-y-4">
            <h2 class="text-4xl font-black tracking-tight">${a.title || 'Knowledge Exchange'}</h2>
            <p class="text-slate-400 font-medium">Common inquiries regarding our persistence layer.</p>
          </div>
          <div class="space-y-6">
            ${[
              {q: a.q1 || 'How secure is our brand data?', ans: a.a1 || 'All data is isolated per tenant using row-level security and encrypted at rest.'},
              {q: a.q2 || 'Can we integrate custom LLMs?', ans: a.a2 || 'Enterprise tiers support dedicated model fine-tuning and custom gateways.'},
              {q: a.q3 || 'What is the sync latency?', ans: a.a3 || 'Global sync targets <200ms for edge-replicated knowledge storage.'}
            ].map(item => `
              <div class="p-8 bg-slate-900 rounded-3xl border border-slate-800">
                <h4 class="text-lg font-black mb-3 text-indigo-400">${item.q}</h4>
                <p class="text-slate-400 text-sm leading-relaxed font-medium">${item.ans}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `,
    'Pricing': (a) => `
      <section class="py-24 px-12 bg-white">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div class="p-10 border-2 border-gray-100 rounded-[3rem] text-center">
            <p class="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">${a.plan1Name || 'Standard'}</p>
            <p class="text-5xl font-black mb-6">${a.plan1Price || '$199'}<span class="text-lg text-gray-400">/mo</span></p>
            <button class="w-full py-4 bg-gray-900 text-white rounded-2xl font-black">${a.plan1Btn || 'Pro Plan'}</button>
          </div>
          <div class="p-10 border-2 border-indigo-600 bg-indigo-600 rounded-[3rem] text-center text-white shadow-xl shadow-indigo-100">
            <p class="text-sm font-black opacity-60 uppercase tracking-widest mb-4">${a.plan2Name || 'Custom'}</p>
            <p class="text-5xl font-black mb-6">${a.plan2Price || 'Contact'}</p>
            <button class="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black">${a.plan2Btn || 'Enterprise'}</button>
          </div>
        </div>
      </section>
    `,
    'CallToAction': (a) => `
      <section class="py-24 px-12">
        <div class="max-w-5xl mx-auto bg-indigo-600 rounded-[4rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
          <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
          <div class="relative z-10 space-y-8">
            <h2 class="text-4xl md:text-6xl font-black tracking-tighter">${a.title || 'Join the Intelligent Frontier'}</h2>
            <p class="text-xl font-medium opacity-80 max-w-2xl mx-auto leading-relaxed">${a.subtitle || 'Experience the future of enterprise brand management today.'}</p>
            <button class="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black text-lg hover:bg-slate-50 transition-all shadow-xl" onclick="window.parent.postMessage({type: 'NAVIGATE', payload: {path: '${a.btnLink || '/'}'}}, '*')">
              ${a.btnText || 'Start My Trial'}
            </button>
          </div>
        </div>
      </section>
    `,
    'Newsletter': (a) => `
      <section class="py-24 px-12 bg-white border-t border-slate-100">
        <div class="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div class="flex-1 text-left space-y-4">
            <h2 class="text-3xl font-black text-slate-900">${a.title || 'Enterprise Intelligence Sync'}</h2>
            <p class="text-slate-500 font-medium">${a.subtitle || 'Receive weekly tactical reports on brand automation.'}</p>
          </div>
          <div class="w-full md:w-auto flex gap-3">
            <input type="email" placeholder="${a.placeholder || 'corporate@email.com'}" class="px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-600 min-w-[280px] font-bold" />
            <button class="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs whitespace-nowrap">${a.btnText || 'Subscribe'}</button>
          </div>
        </div>
      </section>
    `,
    'Contact': (a) => `
      <section class="bg-slate-900 py-24 px-12 text-white text-center">
        <h2 class="text-5xl font-black mb-8">${a.title || 'Ready to Scale?'}</h2>
        <p class="text-slate-400 mb-10 max-w-xl mx-auto">${a.subtitle || 'Join 500+ enterprises today.'}</p>
        <button class="px-10 py-5 bg-indigo-600 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/20">
          ${a.btnText || 'Get in Touch'}
        </button>
      </section>
    `
  };
  return templates[type] ? templates[type](safeAttr) : `<div class="p-10 text-rose-500 font-bold">Unknown Component: ${type}</div>`;
};

export const generatePageHtml = (siteName: string, templateType: string = 'Enterprise Base', sections: any[] = []): string => {
  const templateStyles: Record<string, string> = {
    'Enterprise Base': 'background: radial-gradient(circle at top right, #f8fafc, #ffffff);',
    'Modern Portfolio': 'background: #0f172a; color: white;',
    'SaaS Landing': 'background: #ffffff; color: #1e293b; --primary: #4f46e5;'
  };

  return `
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
            ${templateStyles[templateType] || templateStyles['Enterprise Base']}
            overflow-x: hidden;
            transition: background 0.5s ease;
          }
          .section-wrapper { 
            position: relative; 
            transition: all 0.2s ease; 
            border: 2px solid transparent;
            cursor: pointer;
          }
          .section-wrapper:hover { 
            border-color: rgba(79, 70, 229, 0.4); 
            background: rgba(79, 70, 229, 0.02);
          }
          .section-wrapper.active {
            border-color: #4f46e5;
            background: rgba(79, 70, 229, 0.04);
            box-shadow: inset 0 0 20px rgba(79, 70, 229, 0.05);
          }
          .section-controls {
            position: absolute;
            top: 1rem;
            right: 1rem;
            display: none;
            gap: 0.5rem;
            z-index: 100;
          }
          .section-wrapper:hover .section-controls, .section-wrapper.active .section-controls {
            display: flex;
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
            transition: transform 0.2s ease;
          }
          .control-btn:hover { transform: scale(1.1); }
          .empty-state { 
            border: 4px dashed rgba(148, 163, 184, 0.3); 
            border-radius: 3rem; 
            margin: 4rem 2rem; 
            padding: 8rem 2rem; 
            text-align: center; 
            color: #94a3b8; 
          }
        </style>
      </head>
      <body>
        <div id="canvas-root">
          <div id="sections-container"></div>
        </div>

        <script>
          const container = document.getElementById('sections-container');
          const siteName = "${siteName}";
          const getComponentHtml = ${getComponentHtml.toString()};

          function renderSections(sections) {
            container.innerHTML = '';
            if (!sections || sections.length === 0) {
              container.innerHTML = \`
                <div class="empty-state">
                  <div class="w-16 h-16 bg-slate-500/10 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-6">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                  </div>
                  <p class="text-2xl font-black mb-2">${templateType}</p>
                  <p class="text-sm font-bold opacity-60">Canvas ready. Start building by adding widgets.</p>
                </div>
              \`;
              return;
            }

            sections.forEach(payload => {
              const section = document.createElement('div');
              section.className = 'section-wrapper';
              section.id = payload.id;
              
              section.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.section-wrapper').forEach(el => el.classList.remove('active'));
                section.classList.add('active');
                window.parent.postMessage({type: 'SELECT_SECTION', payload: {id: payload.id}}, '*');
              };
              
              const controls = document.createElement('div');
              controls.className = 'section-controls';
              controls.innerHTML = \`
                <button class="control-btn" title="Remove Widget" onclick="event.stopPropagation(); window.parent.postMessage({type: 'REQUEST_DELETE', payload: {id: '\${payload.id}'}}, '*')">
                  <svg style="width:16px;height:16px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              \`;
              
              const content = document.createElement('div');
              content.id = 'content-' + payload.id;
              content.innerHTML = getComponentHtml(payload.type, payload.attributes);
              
              section.appendChild(controls);
              section.appendChild(content);
              container.appendChild(section);
            });
          }

          // Initial render
          const initialSections = ${JSON.stringify(sections)};
          renderSections(initialSections);

          window.addEventListener('message', (event) => {
            try {
              const { type, payload } = event.data;
              if (type === 'SYNC_STATE') {
                renderSections(payload.sections);
              }
              if (type === 'UPDATE_SECTION') {
                const contentEl = document.getElementById('content-' + payload.id);
                if (contentEl) {
                  contentEl.innerHTML = getComponentHtml(payload.type, payload.attributes);
                }
              }
              if (type === 'REMOVE_SECTION') {
                const el = document.getElementById(payload.id);
                if (el) el.remove();
                if (container.children.length === 0) renderSections([]);
              }
            } catch (err) {
              console.error("Iframe script error:", err);
            }
          });
        </script>
      </body>
    </html>
  `;
};

export const cloneTemplateSite = async (tenantId: string, siteName: string, templateType: string = 'Enterprise Base'): Promise<WixSite> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const siteId = `wix-${Math.random().toString(36).substr(2, 9)}`;
  const initialPage = { id: 'p-home', name: 'Home', path: '/', sections: [] };
  
  return {
    id: siteId,
    name: siteName,
    url: '', 
    status: 'Staging',
    lastSync: new Date().toISOString(),
    templateId: templateType,
    pages: [initialPage]
  };
};

export const syncEnterpriseCMS = async (tenantId: string, siteId: string, offerings: ProductServiceDetail[]): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
};
