(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const canAnimate = !reducedMotion && typeof Element !== 'undefined' && 'animate' in Element.prototype;
  const ease = 'cubic-bezier(.22, 1, .36, 1)';
  const revealed = new WeakSet();

  function motion(el, frames, options = {}) {
    if (!canAnimate || !el) return null;
    return el.animate(frames, {duration: 520, easing: ease, ...options});
  }

  function reveal(el, delay = 0, distance = 16) {
    if (!canAnimate || !el || revealed.has(el)) return;
    revealed.add(el);
    motion(el, [
      {opacity: 0, transform: `translate3d(0, ${distance}px, 0)`},
      {opacity: 1, transform: 'translate3d(0, 0, 0)'}
    ], {delay, duration: 620});
  }

  let savedTheme;
  try { savedTheme = localStorage.getItem('content-theme'); } catch {}
  if (savedTheme === 'dark' || savedTheme === 'light') document.documentElement.dataset.theme = savedTheme;
  const themeButton = $('.theme-toggle');
  themeButton?.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('content-theme', dark ? 'light' : 'dark'); } catch {}
    motion($('svg', themeButton), [
      {transform: 'rotate(-18deg) scale(.86)'},
      {transform: 'rotate(0deg) scale(1)'}
    ], {duration: 360});
  });

  let toastTimer;
  const toast = text => {
    const el = $('#toast'); if (!el) return;
    el.textContent = text; el.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2200);
  };
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); }
    catch { toast('Clipboard unavailable. Select and copy the text manually.'); }
  }
  $$('.copy-code').forEach(button => button.addEventListener('click', () => {
    motion(button, [{transform:'scale(1)'},{transform:'scale(.94)'},{transform:'scale(1)'}], {duration: 220});
    copy($('code', button.closest('.code-block')).textContent);
  }));
  $$('.copy-link').forEach(button => button.addEventListener('click', () => {
    motion(button, [{transform:'translateX(0)'},{transform:'translateX(3px)'},{transform:'translateX(0)'}], {duration: 280});
    copy(button.dataset.url);
  }));
  $$('.copy-draft').forEach(button => button.addEventListener('click', () => copy($('textarea', button.parentElement).value)));

  let topic = '';
  function filter() {
    const query = ($('#article-search')?.value || '').toLowerCase().trim();
    let visible = 0;
    $$('.article-row').forEach(row => {
      const wasHidden = row.hidden;
      row.hidden = !row.dataset.search.includes(query) || !row.dataset.search.includes(topic);
      if (!row.hidden) {
        visible++;
        if (wasHidden) {
          revealed.delete(row);
          reveal(row, 0, 8);
        }
      }
    });
    const empty = $('#no-results'); if (empty) empty.hidden = visible > 0;
  }
  $('#article-search')?.addEventListener('input', filter);
  $$('.filter').forEach(button => button.addEventListener('click', () => {
    topic = button.dataset.filter;
    $$('.filter').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    motion(button, [{transform:'scale(.96)'},{transform:'scale(1)'}], {duration: 240});
    filter();
  }));

  const impacts = {
    identity: {nodes: ['identity', 'dashboard'], text: 'Identity and its dashboard consumer need checks. Billing has no modeled dependency on this change.'},
    billing: {nodes: ['billing', 'dashboard'], text: 'Billing and its dashboard consumer need checks. Identity can reuse a valid previous result.'},
    contracts: {nodes: ['identity', 'billing', 'dashboard'], text: 'The shared contract reaches all three projects. Broad invalidation is correct here—not a cache failure.'}
  };
  function change(key) {
    const impact = impacts[key];
    $$('.lab-node').forEach((node, index) => {
      const affected = impact.nodes.includes(node.dataset.node);
      node.classList.toggle('affected', affected);
      $('.node-status', node).textContent = affected ? 'Run checks' : 'Reuse result';
      if (canAnimate) {
        motion(node, [
          {transform:'translateY(0) scale(1)'},
          {transform:`translateY(${affected ? -4 : 0}px) scale(${affected ? 1.018 : .99})`},
          {transform:'translateY(0) scale(1)'}
        ], {duration: 380, delay: index * 45});
        if (affected) motion($('.node-dot', node), [
          {transform:'scale(1)', opacity:.65},
          {transform:'scale(1.8)', opacity:1},
          {transform:'scale(1)', opacity:1}
        ], {duration: 420, delay: index * 45});
      }
    });
    const result = $('#lab-result');
    if (result) {
      result.textContent = impact.text;
      motion(result, [{opacity:.35, transform:'translateY(4px)'},{opacity:1, transform:'translateY(0)'}], {duration: 360});
    }
    $$('[data-change]').forEach(b => { b.classList.toggle('active', b.dataset.change === key); b.setAttribute('aria-pressed', String(b.dataset.change === key)); });
  }
  $$('[data-change]').forEach(b => b.addEventListener('click', () => change(b.dataset.change)));
  if ($('.lab')) change('identity');

  const progress = $('.reading-progress');
  if (progress) {
    progress.style.width = '100%';
    progress.style.transformOrigin = '0 50%';
    progress.style.transform = 'scaleX(0)';
    progress.style.willChange = 'transform';
    let progressFrame = 0;
    const update = () => {
      progressFrame = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      const ratio = max > 0 ? Math.min(1, scrollY / max) : 1;
      progress.style.transform = `scaleX(${ratio})`;
    };
    const queue = () => { if (!progressFrame) progressFrame = requestAnimationFrame(update); };
    addEventListener('scroll', queue, {passive: true}); addEventListener('resize', queue); update();
  }

  if (canAnimate) {
    requestAnimationFrame(() => {
      const intro = $('.hero')
        ? ['.site-header', '.hero h1', '.hero-bottom']
        : ['.site-header', '.article-header .article-meta', '.article-header h1', '.article-deck', '.byline', '.article-cover'];
      intro.map(selector => $(selector)).filter(Boolean).forEach((el, index) => reveal(el, index * 75, index ? 18 : 8));
      if ($('.article-cover img')) motion($('.article-cover img'), [
        {opacity:.72, transform:'scale(.985)'},
        {opacity:1, transform:'scale(1)'}
      ], {duration: 780, delay: 240});
    });

    const targets = $$([
      '.section-line', '.featured', '.writing-head', '.article-row', '.about-strip > *',
      '.article-body > h2', '.article-body > .code-block', '.article-body > .table-scroll',
      '.article-body > blockquote', '.sources-section', '.article-end', '.lab'
    ].join(','));
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        reveal(entry.target, Number(entry.target.dataset.motionDelay || 0));
        if (entry.target.classList.contains('lab')) {
          $$('.lab-node', entry.target).forEach((node, index) => {
            if (!revealed.has(node)) reveal(node, 90 + index * 75, 10);
          });
        }
        observer.unobserve(entry.target);
      }), {rootMargin: '0px 0px -8% 0px', threshold: .12});
      targets.forEach((el, index) => {
        el.dataset.motionDelay = String((index % 4) * 45);
        if (el.getBoundingClientRect().top < innerHeight * .92) reveal(el, (index % 4) * 45);
        else observer.observe(el);
      });
    }

    $$('.text-link, .copy-link, .footer-links a').forEach(link => {
      const arrow = $('svg', link); if (!arrow) return;
      link.addEventListener('pointerenter', () => motion(arrow, [{transform:'translateX(0)'},{transform:'translateX(4px)'}], {duration:220, fill:'forwards'}));
      link.addEventListener('pointerleave', () => motion(arrow, [{transform:'translateX(4px)'},{transform:'translateX(0)'}], {duration:220, fill:'forwards'}));
    });
  }

  if ('IntersectionObserver' in window) {
    const links = $$('.toc a');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => {
        const current = link.hash === '#' + entry.target.id;
        const changed = current && !link.classList.contains('current');
        link.classList.toggle('current', current);
        if (changed) motion(link, [{opacity:.55, transform:'translateX(-3px)'},{opacity:1, transform:'translateX(0)'}], {duration:300});
      });
    }), {rootMargin: '-10% 0px -75% 0px'});
    $$('.article-body h2').forEach(h => observer.observe(h));
  }
})();
