
import { WixSite, ProductServiceDetail, SiteSection, SitePage } from '../types';

/**
 * Simulates Wix Velo / REST API for programmatic site creation and management.
 * Generates high-fidelity HTML documents as strings for iframe srcdoc injection.
 */

const getComponentHtml = (type: string, attr: any) => {
  const safeAttr = attr || {};
  
  // Custom Style Parser
  const getCustomStyles = (a: any) => {
    let styles = '';
    if (a.backgroundColor) styles += `background-color: ${a.backgroundColor};`;
    if (a.padding) styles += `padding: ${a.padding};`;
    if (a.height) styles += `min-height: ${a.height};`;
    if (a.alignment) styles += `text-align: ${a.alignment};`;
    if (a.rounded) styles += `border-radius: ${a.rounded};`;
    if (a.borderStyle) styles += `border: ${a.borderStyle};`;
    if (a.verticalMargin) styles += `margin-top: ${a.verticalMargin}; margin-bottom: ${a.verticalMargin};`;
    return styles;
  };

  const templates: Record<string, (a: any) => string> = {
    // ENTERPRISE PRESETS
    'Hero': (a) => `
      <header class="py-24 px-12 text-center max-w-5xl mx-auto space-y-8" style="${getCustomStyles(a)}">
        <h1 class="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight">
          ${a.title || 'Brand <span class="text-indigo-600">Transformation</span>'}
        </h1>
        <p class="text-xl text-gray-500 font-medium max-w-3xl mx-auto leading-relaxed">
          ${a.subtitle || 'Built on Enterprise Knowledge Base RAG storage.'}
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button class="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-2xl hover:bg-black transition-all">
            ${a.btn1Text || 'Get Started'}
          </button>
        </div>
      </header>
    `,
    'Grid': (a) => `
      <section class="bg-gray-50 py-24 px-12" style="${getCustomStyles(a)}">
        <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          ${[
            {t: a.item1Title || 'Innovation', d: a.item1Desc || 'Modular architectural grounding.'},
            {t: a.item2Title || 'Performance', d: a.item2Desc || 'Enterprise জ্ঞান base persistence.'},
            {t: a.item3Title || 'Security', d: a.item3Desc || 'Isolated tenant context enabled.'}
          ].map(item => `
            <div class="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all">
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
          <h2 class="text-4xl font-black text-center mb-16">${a.title || 'Platform Capabilities'}</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            ${[
              {f: a.feature1 || 'Neural Logic', d: a.desc1 || 'Real-time alignment.'},
              {f: a.feature2 || 'Brand Voice', d: a.desc2 || 'Consistent GTM messaging.'}
            ].map(item => `
              <div class="flex gap-6 items-start">
                <div class="w-10 h-10 rounded-xl bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white font-bold">✓</div>
                <div><h4 class="text-xl font-bold text-slate-900 mb-2">${item.f}</h4><p class="text-slate-500 font-medium text-sm">${item.d}</p></div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `,
    'Testimonials': (a) => `
      <section class="py-24 px-12 bg-slate-50" style="${getCustomStyles(a)}">
        <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          ${[
            {q: a.quote1 || 'Exceptional scale speed.', aut: a.author1 || 'CEO, Acme'},
            {q: a.quote2 || 'Data accuracy is 100%.', aut: a.author2 || 'CTO, Global'}
          ].map(item => `
            <div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <p class="text-lg italic font-medium text-slate-800 mb-8 leading-relaxed">"${item.q}"</p>
              <p class="font-black text-slate-900 text-sm">${item.aut}</p>
            </div>
          `).join('')}
        </div>
      </section>
    `,
    'Team': (a) => `
      <section class="py-24 px-12" style="${getCustomStyles(a)}">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          ${[a.name1 || 'Sarah J', a.name2 || 'Mike K', a.name3 || 'Lee W'].map(n => `
            <div class="text-center">
              <div class="w-32 h-32 bg-slate-100 rounded-full mx-auto mb-6"></div>
              <h4 class="text-xl font-black">${n}</h4>
            </div>
          `).join('')}
        </div>
      </section>
    `,
    'FAQ': (a) => `
      <section class="py-24 px-12 bg-slate-900 text-white" style="${getCustomStyles(a)}">
        <div class="max-w-3xl mx-auto space-y-6">
          <div class="p-8 bg-slate-800 rounded-3xl"><h4 class="text-lg font-black text-indigo-400">${a.q1 || 'Security?'}</h4><p class="text-slate-400 text-sm">${a.a1 || 'AES-256 standard.'}</p></div>
        </div>
      </section>
    `,
    'Pricing': (a) => `
      <section class="py-24 px-12 bg-white" style="${getCustomStyles(a)}">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div class="p-12 border-2 border-slate-100 rounded-[3rem] text-center">
            <h4 class="text-xl font-black mb-4">${a.plan1Name || 'Standard'}</h4>
            <p class="text-5xl font-black mb-10">${a.plan1Price || '$99'}</p>
            <button class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase">Start</button>
          </div>
        </div>
      </section>
    `,
    'CallToAction': (a) => `
      <section class="py-24 px-12 bg-indigo-600 text-white text-center rounded-[4rem] m-12 shadow-2xl" style="${getCustomStyles(a)}">
        <h2 class="text-4xl font-black mb-6">${a.title || 'Join the Future'}</h2>
        <button class="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase shadow-xl">${a.btnText || 'Launch'}</button>
      </section>
    `,
    'Newsletter': (a) => `
      <section class="py-24 px-12 bg-slate-50 text-center" style="${getCustomStyles(a)}">
        <h2 class="text-3xl font-black mb-10">${a.title || 'Subscribe'}</h2>
        <div class="max-w-md mx-auto flex gap-3">
          <input type="email" placeholder="Email" class="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-200 outline-none" />
          <button class="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase">Join</button>
        </div>
      </section>
    `,
    'Contact': (a) => `
      <section class="py-24 px-12 bg-slate-900 text-white text-center" style="${getCustomStyles(a)}">
        <h2 class="text-5xl font-black mb-8">${a.title || 'Contact'}</h2>
        <button class="px-12 py-5 bg-indigo-600 rounded-2xl font-black uppercase">${a.btnText || 'Connect'}</button>
      </section>
    `,
    // ABSTRACT BLOCKS
    'TextContent': (a) => `<section class="py-16 px-12" style="${getCustomStyles(a)}"><div class="max-w-4xl mx-auto"><h2 class="text-4xl font-black mb-4">${a.heading || 'Block Heading'}</h2><p class="text-lg text-slate-600 leading-relaxed">${a.body || 'Block body text.'}</p></div></section>`,
    'MediaBlock': (a) => `<section class="py-12 px-12" style="${getCustomStyles(a)}"><div class="max-w-5xl mx-auto"><img src="${a.imageUrl || 'https://picsum.photos/1200/600'}" class="w-full h-auto rounded-3xl" /></div></section>`,
    'LinkList': (a) => `<section class="py-16 px-12 bg-white" style="${getCustomStyles(a)}"><div class="max-w-4xl mx-auto"><h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">${a.title || 'Links'}</h3><div class="grid grid-cols-2 gap-4"><a href="#" class="p-6 bg-slate-50 rounded-2xl font-bold">${a.link1Label || 'Link 1'}</a></div></div></section>`,
    'Spacer': (a) => `<div style="height: ${a.height || '4rem'}; ${getCustomStyles(a)}"></div>`,
    'CustomHtml': (a) => `<div style="${getCustomStyles(a)}">${a.htmlContent || '<p class="p-10 text-center opacity-30">HTML Block</p>'}</div>`,
    'ButtonBlock': (a) => `<div class="py-8 px-12 flex" style="justify-content: ${a.alignment || 'center'}; ${getCustomStyles(a)}"><button class="px-10 py-5 rounded-2xl font-black uppercase shadow-xl" style="background: ${a.buttonColor || '#4f46e5'}; color: white;">${a.text || 'Action'}</button></div>`,
    'Divider': (a) => `<div class="px-12 py-8" style="${getCustomStyles(a)}"><div style="height: ${a.thickness || '1px'}; background: ${a.color || '#e2e8f0'}; width: ${a.width || '100%'}; margin: 0 auto;"></div></div>`,
    'IconBox': (a) => `<div class="p-12 text-center" style="${getCustomStyles(a)}"><div class="w-16 h-16 rounded-[1.5rem] mb-6 bg-indigo-50 flex items-center justify-center mx-auto text-indigo-600 font-bold">★</div><h4 class="text-2xl font-black mb-4">${a.title || 'Feature'}</h4><p class="text-slate-500">${a.description || 'Description'}</p></div>`,
    'QuoteBlock': (a) => `<div class="px-12 py-24 bg-slate-50 text-center" style="${getCustomStyles(a)}"><blockquote class="text-3xl font-black text-slate-800 italic">"${a.quote || 'Quote text'}"</blockquote><p class="mt-8 font-black text-slate-900">${a.author || 'Author'}</p></div>`,
    'VideoBlock': (a) => `<div class="px-12 py-12" style="${getCustomStyles(a)}"><div class="max-w-5xl mx-auto aspect-video bg-slate-200 rounded-[3rem] flex items-center justify-center text-indigo-600 font-black">Video Placeholder</div></div>`
  };
  return templates[type] ? templates[type](safeAttr) : `<div class="p-10 text-rose-500 font-bold text-center border-2 border-dashed border-rose-100 rounded-3xl m-8">Unknown Component: ${type}</div>`;
};

export const generatePageHtml = (siteName: string, templateType: string = 'Enterprise Base', sections: any[] = []): string => {
  const templateStyles: Record<string, string> = {
    'Enterprise Base': 'background: radial-gradient(circle at top right, #f8fafc, #ffffff);',
    'Modern Portfolio': 'background: #0f172a; color: white;',
    'SaaS Landing': 'background: #ffffff; color: #1e293b;'
  };

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Plus Jakarta Sans', sans-serif; margin: 0; padding: 0; min-height: 100vh; ${templateStyles[templateType] || ''} overflow-x: hidden; }
          .section-wrapper { position: relative; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; }
          .section-wrapper:hover { border-color: rgba(79, 70, 229, 0.4); background: rgba(79, 70, 229, 0.02); }
          .section-wrapper.active { border-color: #4f46e5; background: rgba(79, 70, 229, 0.04); }
          .section-label { 
            position: absolute; top: -12px; left: 24px; 
            background: #4f46e5; color: white; padding: 2px 10px; 
            border-radius: 6px; font-size: 10px; font-weight: 800; 
            text-transform: uppercase; z-index: 50; opacity: 0;
          }
          .section-wrapper:hover .section-label, .section-wrapper.active .section-label { opacity: 1; }
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
              container.innerHTML = '<div class="py-40 text-center opacity-20 uppercase font-black tracking-widest text-slate-900">Canvas Ready. Command the Architect.</div>';
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
              
              const label = document.createElement('div');
              label.className = 'section-label';
              label.innerText = payload.type;
              
              const inner = document.createElement('div');
              inner.innerHTML = getComponentHtml(payload.type, payload.attributes);
              
              section.appendChild(label);
              section.appendChild(inner);
              container.appendChild(section);
            });
          }

          renderSections(${JSON.stringify(sections)});
        </script>
      </body>
    </html>
  `;
};

export const addSection = async (site: WixSite, pageId: string, type: string): Promise<WixSite> => {
  const newSec: SiteSection = { id: `sec-${Date.now()}-${Math.random()}`, type, attributes: {} };
  return {
    ...site,
    pages: site.pages.map(p => p.id === pageId ? { ...p, sections: [...p.sections, newSec] } : p)
  };
};

export const cloneTemplateSite = async (tenantId: string, siteName: string, templateType: string = 'Enterprise Base'): Promise<WixSite> => {
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
