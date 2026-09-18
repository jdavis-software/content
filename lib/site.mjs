import {imageForArticle,socialImageTags} from './social-image.mjs';
import {insertDevops} from './devops-flow.mjs';
import {agentFlow} from './agent-flow.mjs';
import {readFile,writeFile,mkdir,rm,copyFile,open} from 'node:fs/promises';
import path from 'node:path';
import {escapeHtml as e,renderMarkdown} from './markdown.mjs';
import {configAt,packages,validatePackage,fingerprints,canonical,hash,atomicWrite,readJson} from './content.mjs';
const svgArrow='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const dateLabel=d=>new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
const readingTime=text=>Math.max(1,Math.ceil(text.split(/\s+/).length/220));
function layout(c,{title,description,body,route='',preview=false,article=null,toc=[]}) {
  const base=c.basePath, url=article?canonical(c,article.slug):`${canonical(c)}${route}`;
  const image=article?`${canonical(c,article.slug)}${imageForArticle(article.meta).src}`:null;
  const jsonld=article?JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:article.meta.title,description:article.meta.description,author:{'@type':'Person',name:c.author},datePublished:article.meta.createdAt,dateModified:article.meta.updatedAt,mainEntityOfPage:url,...(image?{image:[image]}:{})}).replace(/</g,'\\u003c'):null;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><title>${e(title)} | Jordan Davis</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${e(url)}"><meta property="og:type" content="${article?'article':'website'}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${e(url)}">${article?socialImageTags(article.meta,canonical(c,article.slug)):''}<meta name="twitter:card" content="${image?'summary_large_image':'summary'}">${preview?'<meta name="robots" content="noindex,nofollow">':''}<link rel="icon" href="${base}/favicon.svg" type="image/svg+xml"><link rel="alternate" type="application/rss+xml" title="Engineering Notes" href="${base}/rss.xml"><link rel="stylesheet" href="${base}/style.css">${article?.slug === 'parallel-agent-engineering' ? `<link rel="stylesheet" href="${base}/agent-flow.css"><script type="module" src="${base}/agent-flow.js"></script><link rel="stylesheet" href="${base}/devops-flow.css"><script type="module" src="${base}/devops-flow.js"></script>` : ''}${jsonld?`<script type="application/ld+json">${jsonld}</script>`:''}<script src="${base}/client.js" defer></script></head><body><a class="skip" href="#main">Skip to content</a><header class="site-header"><a class="brand" href="${base}/"><span class="monogram">jd<span>.</span></span><span>Jordan Davis<span class="brand-sub">Engineering notes</span></span></a><nav aria-label="Main navigation"><a href="${base}/#writing">Writing</a><a href="${base}/about/">About</a><a href="${e(c.repository)}" rel="noopener noreferrer">GitHub ${svgArrow}</a><button class="theme-toggle" type="button" aria-label="Switch color theme"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20 14.1A8.5 8.5 0 0 1 9.9 4 8.5 8.5 0 1 0 20 14.1Z"/></svg></button></nav></header>${preview?`<div class="preview-banner"><span>Local review build</span> Drafts are visible here, not in the production site or RSS. <a href="${base}/studio/">Review workspace ${svgArrow}</a></div>`:''}<main id="main">${body}</main><footer class="site-footer"><div><a class="footer-name" href="${base}/">Jordan Davis<span>.</span></a><p>Build thoughtfully. Ship deliberately.</p></div><div class="footer-links"><a href="${base}/rss.xml">RSS feed</a><a href="${e(c.repository)}">Source on GitHub ${svgArrow}</a></div><p class="footer-small">Independent engineering notes. No tracking. No subscription wall.</p></footer><div id="toast" role="status" aria-live="polite"></div></body></html>`;
}
function home(c,items,preview) {
  const [a]=items;
  const featureImage=a?imageForArticle(a.meta):null;
  const feature=a?`<article class="featured"><a class="featured-art" href="${c.basePath}/articles/${a.slug}/"><img src="${c.basePath}/articles/${a.slug}/${featureImage.src}" alt="${e(featureImage.alt)}" width="${featureImage.width??1200}" height="${featureImage.height??760}"></a><div class="featured-copy"><div class="article-meta"><span>${e(a.meta.category)}</span><span>${readingTime(a.article)} min read</span></div><h2><a href="${c.basePath}/articles/${a.slug}/">${e(a.meta.title)}</a></h2><p>${e(a.meta.description)}</p><a class="text-link" href="${c.basePath}/articles/${a.slug}/">Read the article ${svgArrow}</a><span class="date">${dateLabel(a.meta.createdAt)}${preview?' · Review draft':''}</span></div></article>`:`<div class="empty-state"><span class="empty-index">01</span><h2>The first field note is taking shape.</h2><p>A closer look at TypeScript, Go, Nx, and engineering systems built for parallel agents. Publication follows review.</p><a class="text-link" href="${e(c.repository)}">Explore the source ${svgArrow}</a></div>`;
  const tags=[...new Set(items.flatMap(p=>p.meta.tags))];
  const rows=items.map((a,i)=>`<article class="article-row" data-search="${e((a.meta.title+' '+a.meta.tags.join(' ')+' '+a.meta.description).toLowerCase())}"><span class="row-index">${String(i+1).padStart(2,'0')}</span><div><span class="small-meta">${e(a.meta.category)} · ${dateLabel(a.meta.createdAt)}</span><h3><a href="${c.basePath}/articles/${a.slug}/">${e(a.meta.title)}</a></h3><p>${e(a.meta.description)}</p></div><span class="row-time">${readingTime(a.article)} min ${svgArrow}</span></article>`).join('');
  return layout(c,{title:'Engineering for the agent era',description:c.description,preview,body:`<section class="hero"><h1>Engineering for<br>the <span>agent era.</span></h1><div class="hero-bottom"><p>Practical notes on software architecture, parallel agents, and the systems that make development faster.</p><a href="#writing" class="text-link">Explore the writing ${svgArrow}</a></div></section><section class="featured-section" aria-label="Featured writing"><div class="section-line"><span>Latest field note</span><span>Ideas, with implementation details.</span></div>${feature}</section><section id="writing" class="writing-section"><div class="writing-head"><h2>All writing<span> / ${String(items.length).padStart(2,'0')}</span></h2><label class="search-label"><span class="sr-only">Search articles</span><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" width="18" height="18" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5"/><path d="m13 13 4 4"/></svg><input type="search" id="article-search" placeholder="Find an article" autocomplete="off"></label></div><div class="filters" role="group" aria-label="Filter by topic"><button class="filter active" data-filter="" aria-pressed="true">All topics</button>${tags.map(t=>`<button class="filter" data-filter="${e(t.toLowerCase())}" aria-pressed="false">${e(t)}</button>`).join('')}</div><div id="article-list">${rows}</div><p id="no-results" class="empty-message" ${items.length?'hidden':''}>${items.length?'No articles match this search.':'New articles will appear here after review.'}</p></section><section class="about-strip"><span class="about-number">//</span><div><h2>Good tools matter.<br>Good boundaries matter more.</h2><p>I write about building software with explicit contracts, useful feedback loops, and room for independent work.</p><a class="text-link" href="${c.basePath}/about/">A little about me ${svgArrow}</a></div></section>`});
}
function articlePage(c,p,preview) {
  const rendered=renderMarkdown(p.article);
  if(p.slug==='parallel-agent-engineering') {
    rendered.html=insertDevops(rendered.html);
    const at=rendered.toc.findIndex(h=>h.id.startsWith('postgresql-belongs'));
    rendered.toc.splice(at,0,{id:'devops-title',text:'Interactive: the delivery system'});
  }
  const isPreview=preview&&p.meta.status!=='published';
  const body=`<div class="article-shell"><a class="back-link" href="${c.basePath}/#writing">← All writing</a><header class="article-header"><div class="article-meta"><span>${e(p.meta.category)}</span><span>${readingTime(p.article)} min read</span>${isPreview?'<span class="review-label">In review</span>':''}</div><h1>${e(p.meta.title)}</h1><p class="article-deck">${e(p.meta.description)}</p><div class="byline"><span class="author-avatar">JD</span><div><strong>${e(c.author)}</strong><span>${dateLabel(p.meta.createdAt)}</span></div><button class="copy-link" data-url="${e(canonical(c,p.slug))}" type="button">Copy article link ${svgArrow}</button></div></header>${p.slug === 'parallel-agent-engineering' ? agentFlow() : `<figure class="article-cover"><img src="${p.meta.coverImage}" alt="${e(p.meta.coverAlt)}" width="1200" height="760"><figcaption>Independent workstreams. Shared validation. An illustrative architecture.</figcaption></figure>`}<div class="reading-layout"><aside class="toc" aria-label="On this page"><span>On this page</span>${rendered.toc.map(h=>`<a href="#${h.id}">${e(h.text)}</a>`).join('')}</aside><div class="article-body">${rendered.html}<section class="sources-section"><h2 id="sources">Source notes</h2><p>Primary references checked for this draft. Personal direction and illustrative examples are distinguished from vendor claims.</p><ol>${p.sources.map(s=>`<li><a href="${e(s.url)}" rel="noopener noreferrer">${e(s.title)}</a><span>${e(s.supports)} Checked ${e(s.checkedAt)}.</span></li>`).join('')}</ol></section><div class="article-end"><strong>Continue the conversation.</strong><p>The code and editable article source live in the repository.</p><a class="text-link" href="${e(c.repository)}/tree/main/articles/${p.slug}">Explore the source ${svgArrow}</a></div></div></div></div><div class="reading-progress" aria-hidden="true"></div>`;
  return layout(c,{title:p.meta.title,description:p.meta.description,body,preview,article:p,toc:rendered.toc});
}
function about(c,preview) {
 return layout(c,{title:'About',description:'Jordan Davis writes about software architecture and agentic engineering.',route:'about/',preview,body:`<section class="about-page"><a class="back-link" href="${c.basePath}/">← Engineering notes</a><h1>I build software.<br>And question how<br>we build it.</h1><p class="about-lead">I’m Jordan Davis, a senior software engineer exploring the intersection of application architecture, developer tooling, and agentic workflows.</p><div class="article-body"><h2>What you will find here</h2><p>Practical explanations of technical decisions: what a tool does, how it fits into a system, and where the tradeoffs remain. The aim is useful implementation context rather than another list of fashionable tools.</p><h2>How these notes are made</h2><p>Articles begin with a question or source material, pass through research and editorial review, and become version-controlled content packages. AI assists the workflow. Claims still need evidence, and publishing still needs a human decision.</p><p>This site is intentionally static and lightweight. The repository holds the source, the revision history, and the tools used to prepare the content.</p><a class="text-link" href="${e(c.repository)}">View the content repository ${svgArrow}</a></div></section>`});
}
function studioPage(c,items) {
 return layout(c,{title:'Review workspace',description:'Local-only content review and publishing handoff.',route:'studio/',preview:true,body:`<section class="review-page"><h1>Review workspace.</h1><p class="article-deck">Inspect the package. Copy the derivative. Publish only after a separate approval.</p><div class="notice">This screen does not authenticate you, approve a release, or call LinkedIn. It is excluded from production builds.</div>${items.map(p=>`<section class="review-package"><div class="review-top"><div><span class="small-meta">${e(p.meta.status)} · ${p.slug}</span><h2>${e(p.meta.title)}</h2></div><a class="button" href="${c.basePath}/articles/${p.slug}/">Read preview ${svgArrow}</a></div><div class="review-columns"><div><h3>LinkedIn draft</h3><textarea readonly aria-label="LinkedIn draft" rows="19">${e(p.linkedin.replaceAll('{{articleUrl}}',canonical(c,p.slug)))}</textarea><button class="copy-draft button" type="button">Copy LinkedIn text</button></div><div class="review-checklist"><h3>Before publishing</h3><p><strong>01</strong> Review technical claims and actual personal experience.</p><p><strong>02</strong> Check public-safe assets and citations.</p><p><strong>03</strong> Approve the exact package and target account outside this page.</p><p><strong>04</strong> Deploy the approved article and verify its live URL.</p><p><strong>05</strong> Use the connected LinkedIn action, then record its actual receipt.</p><div class="code-block"><pre><code>npm run studio -- prepare ${e(p.slug)}
npm run studio -- status ${e(p.slug)}</code></pre></div><a class="text-link" href="${e(c.repository)}/blob/main/docs/PUBLISHING.md">Publishing runbook ${svgArrow}</a></div></div></section>`).join('')}</section>`});
}
async function buildUnlocked(root,{preview=false,outDir='dist',force=false}={}) {
  const c=await configAt(root), all=await packages(root);
  for(const p of all) { const errors=await validatePackage(p,c); if(errors.length) throw new Error(`${p.slug}:\n${errors.join('\n')}`); }
  // Only explicitly published, public-safe packages reach production.
  const visible=all.filter(p=>p.meta.status==='published'||(preview&&p.meta.status!=='archived')).sort((a,b)=>b.meta.createdAt.localeCompare(a.meta.createdAt));
  const out=path.resolve(root,outDir);
  if(out!==path.join(root,'dist') && !out.startsWith(path.join(root,'.studio')+path.sep)) throw new Error('Output must be dist or a directory under .studio');
  await mkdir(out,{recursive:true});
  const manifest={mode:preview?'preview':'production',articles:[],outputs:[],cache:{reused:0,rendered:0}};
  const put=async(rel,data)=>{await atomicWrite(path.join(out,rel),data);manifest.outputs.push(rel);};
  let prior={};
  try{prior=await readJson(path.join(root,'.studio','cache.json'));}catch{}
  const next={};
  for(const p of visible) {
    const f=await fingerprints(p,root), key=hash([f.article,f.visuals,f.renderer,preview?'preview':'production'].join(':'));
    const cacheFile=path.join(root,'.studio','cache',key+'.html');
    let html;
    try{if(force)throw new Error();html=await readFile(cacheFile,'utf8');const expected=await readFile(cacheFile+'.sha256','utf8');if(hash(html)!==expected)throw new Error('Cache integrity mismatch');manifest.cache.reused++;}
    catch{html=articlePage(c,p,preview);await atomicWrite(cacheFile,html);await atomicWrite(cacheFile+'.sha256',hash(html));manifest.cache.rendered++;}
    await put(`articles/${p.slug}/index.html`,html);
    for(const file of p.files.filter(f=>f.startsWith('assets/')&&/\.(svg|png|jpe?g|webp)$/.test(f))) {
      const rel=`articles/${p.slug}/${file}`;await mkdir(path.dirname(path.join(out,rel)),{recursive:true});await copyFile(path.join(p.dir,file),path.join(out,rel));manifest.outputs.push(rel);
    }
    const linked=p.linkedin.replaceAll('{{articleUrl}}',canonical(c,p.slug));
    if(preview)await put(`articles/${p.slug}/linkedin.txt`,linked);
    manifest.articles.push({slug:p.slug,title:p.meta.title,status:p.meta.status,url:canonical(c,p.slug),fingerprints:f});
    next[p.slug]=f;
  }
  await put('index.html',home(c,visible,preview));
  await put('about/index.html',about(c,preview));
  if(preview)await put('studio/index.html',studioPage(c,visible));
  const pub=visible.filter(p=>p.meta.status==='published');
  await put('rss.xml',`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${e(c.title)}</title><link>${e(canonical(c))}</link><description>${e(c.description)}</description>${pub.map(p=>`<item><title>${e(p.meta.title)}</title><link>${e(canonical(c,p.slug))}</link><guid>${e(canonical(c,p.slug))}</guid><description>${e(p.meta.description)}</description><pubDate>${new Date(p.meta.createdAt+'T12:00:00Z').toUTCString()}</pubDate></item>`).join('')}</channel></rss>`);
  await put('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${e(canonical(c))}</loc></url><url><loc>${e(canonical(c))}about/</loc></url>${pub.map(p=>`<url><loc>${e(canonical(c,p.slug))}</loc><lastmod>${p.meta.updatedAt}</lastmod></url>`).join('')}</urlset>`);
  await put('robots.txt',preview?'User-agent: *\nDisallow: /\n':`User-agent: *\nAllow: /\nSitemap: ${c.origin}${c.basePath}/sitemap.xml\n`);
  await put('404.html',layout(c,{title:'Page not found',description:'This page could not be found.',preview,body:`<section class="about-page"><span class="small-meta">404</span><h1>This branch<br>ends here.</h1><a class="button" href="${c.basePath}/">Back to the writing ${svgArrow}</a></section>`}));
  for(const file of ['style.css','client.js','favicon.svg'])await put(file,await readFile(path.join(root,'site',file)));
  if (visible.some(p => p.slug === 'parallel-agent-engineering')) {
    for (const file of ['devops-flow.css', 'devops-flow.js', 'devops-model.js', 'agent-flow.css', 'agent-flow.js', 'agent-flow-model.js', 'vendor/anime-4.5.0.esm.min.js', 'vendor/ANIME-LICENSE.txt'])
      await put(file, await readFile(path.join(root, 'site', file)));
  }
  await put('.nojekyll','');
  // Remove stale routes and media when an article is unpublished or renamed.
  const {walk}=await import('./content.mjs');
  for(const file of await walk(out))if(!manifest.outputs.includes(file)&&file!=='build-manifest.json')await rm(path.join(out,file));
  await atomicWrite(path.join(out,'build-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  await atomicWrite(path.join(root,'.studio','cache.json'),JSON.stringify(next,null,2)+'\n');
  return manifest;
}

// One integration build per checkout/output. Independent worktrees have independent locks.
// Never delete a live/stale lock automatically: the operator must confirm the owner exited.
export async function build(root,options={}) {
  const output=path.resolve(root,options.outDir||'dist');
  const lock=path.join(root,'.studio','locks',hash(output)+'.lock');
  await mkdir(path.dirname(lock),{recursive:true});
  let fd;
  try {fd=await open(lock,'wx');}catch(error){if(error.code==='EEXIST')throw new Error('Another build holds this output lock. Check .studio/locks before retrying.');throw error;}
  try {await fd.writeFile(JSON.stringify({pid:process.pid,output}));return await buildUnlocked(root,options);}
  finally {await fd.close();await rm(lock,{force:true});}
}
