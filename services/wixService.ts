
import { WixSite, ProductServiceDetail } from '../types';

/**
 * Simulates Wix Velo / REST API for programmatic site creation and management.
 * Generates high-fidelity HTML documents as strings for iframe srcdoc injection.
 */

const getComponentHtml = (type: string, attr: any) => {
  const safeAttr = attr || {};
  
  // Custom Style Parser (NFR-905)
  const getCustomStyles = (a: any) => {
    let styles = '';
    if (a.backgroundColor) styles += `background-color: ${a.backgroundColor};`;
    if (a.padding) styles += `padding: ${a.padding};`;
    if (a.height) styles += `min-height: ${a.height};`;
    if (a.alignment) styles += `text-align: ${a.alignment};`;
    if (a.rounded) styles += `border-radius: ${a.rounded};`;
    if (a.borderStyle) styles += `border: ${a.borderStyle};`;
    return styles;
  };

  const templates: Record<string, (a: any) => string> = {
    // Presets
    'Hero': (a) => `
      <header class="py-24 px-12 text-center max-w-5xl mx-auto space-y-8" style="${getCustomStyles(a)}">
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
      <section class="bg-gray-50 py-24 px-12" style="${getCustomStyles(a)}">
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
      <section class="py-24 px-12 bg-white" style="${getCustomStyles(a)}">
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
      <section class="py-24 px-12 bg-slate-50 overflow-hidden relative" style="${getCustomStyles(a)}">
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

    // Abstract Blocks
    'TextContent': (a) => `
      <section class="py-16 px-12" style="${getCustomStyles(a)}">
        <div class="max-w-4xl mx-auto space-y-4">
          ${a.heading ? `<h2 class="text-3xl font-black text-slate-900 leading-tight">${a.heading}</h2>` : ''}
          ${a.body ? `<p class="text-lg text-slate-600 font-medium leading-relaxed">${a.body}</p>` : ''}
        </div>
      </section>
    `,
    'MediaBlock': (a) => `
      <section class="py-12 px-12" style="${getCustomStyles(a)}">
        <div class="max-w-5xl mx-auto space-y-4">
          <div class="overflow-hidden" style="width: ${a.imageWidth || '100%'}; border-radius: ${a.rounded || '2rem'};">
            <img src="${a.imageUrl || 'https://picsum.photos/1200/600?random=' + Math.random()}" class="w-full h-auto object-cover hover:scale-105 transition-transform duration-700" alt="Brand Asset" />
          </div>
          ${a.caption ? `<p class="text-xs font-black text-slate-400 uppercase tracking-widest text-center">${a.caption}</p>` : ''}
        </div>
      </section>
    `,
    'LinkList': (a) => `
      <section class="py-16 px-12 bg-slate-900 text-white" style="${getCustomStyles(a)}">
        <div class="max-w-4xl mx-auto">
          <h3 class="text-sm font-black text-indigo-400 uppercase tracking-[0.2em] mb-8">${a.title || 'Resources'}</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${[
              {l: a.link1Label || 'Terms of Service', u: a.link1Url || '#'},
              {l: a.link2Label || 'Privacy Policy', u: a.link2Url || '#'},
              {l: a.link3Label || 'API Docs', u: a.link3Url || '#'}
            ].filter(i => i.l).map(item => `
              <a href="${item.u}" class="flex items-center justify-between p-5 bg-slate-800 rounded-2xl hover:bg-slate-700 transition-all border border-slate-700 group">
                <span class="font-bold text-sm">${item.l}</span>
                <svg class="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
              </a>
            `).join('')}
          </div>
        </div>
      </section>
    `,
    'Spacer': (a) => `
      <div style="${getCustomStyles(a)}"></div>
    `,
    'CustomHtml': (a) => `
      <div class="${a.cssClass || ''}" style="${getCustomStyles(a)}">
        ${a.htmlContent || '<p class="text-slate-400 font-bold p-8 border-2 border-dashed border-slate-100 rounded-3xl text-center">Custom HTML block: Open Settings to edit raw code.</p>'}
      </div>
    `,
    
    'Contact': (a) => `
      <section class="bg-slate-900 py-24 px-12 text-white text-center" style="${getCustomStyles(a)}">
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
            margin: 0; padding: 0; min-height: 100vh;
            ${templateStyles[templateType] || templateStyles['Enterprise Base']}
            overflow-x: hidden;
          }
          .section-wrapper { 
            position: relative; 
            transition: all 0.2s ease; 
            border: 2px solid transparent;
            cursor: pointer;
          }
          .section-wrapper:hover { 
            border-color: rgba(79, 70, 229, 0.4); 
            background: rgba(79, 70, 229, 0.01);
          }
          .section-wrapper.active {
            border-color: #4f46e5;
            background: rgba(79, 70, 229, 0.04);
            box-shadow: inset 0 0 40px rgba(79, 70, 229, 0.05);
          }
          .section-controls {
            position: absolute; top: 1rem; right: 1rem;
            display: none; gap: 0.5rem; z-index: 100;
          }
          .section-wrapper:hover .section-controls, .section-wrapper.active .section-controls {
            display: flex;
          }
          .control-btn {
            background: #ef4444; color: white; border: none; padding: 8px;
            border-radius: 10px; cursor: pointer; display: flex; align-items: center;
          }
          .empty-state { 
            border: 4px dashed rgba(148, 163, 184, 0.3); 
            border-radius: 3rem; margin: 4rem 2rem; 
            padding: 8rem 2rem; text-align: center; color: #94a3b8; 
          }
        </style>
      </head>
      <body>
        <div id="canvas-root"><div id="sections-container"></div></div>
        <script>
          const container = document.getElementById('sections-container');
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
                  <p class="text-sm font-bold opacity-60">Canvas ready. Drag or select blocks to build your page.</p>
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
                <button class="control-btn" onclick="event.stopPropagation(); window.parent.postMessage({type: 'REQUEST_DELETE', payload: {id: '\${payload.id}'}}, '*')">
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

          const initialSections = ${JSON.stringify(sections)};
          renderSections(initialSections);

          window.addEventListener('message', (event) => {
            const { type, payload } = event.data;
            if (type === 'SYNC_STATE') renderSections(payload.sections);
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
