(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  let savedTheme;
  try { savedTheme = localStorage.getItem('content-theme'); } catch {}
  if (savedTheme === 'dark' || savedTheme === 'light') document.documentElement.dataset.theme = savedTheme;
  $('.theme-toggle')?.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'light' : 'dark';
    try { localStorage.setItem('content-theme', dark ? 'light' : 'dark'); } catch {}
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
  $$('.copy-code').forEach(button => button.addEventListener('click', () => copy($('code', button.closest('.code-block')).textContent)));
  $$('.copy-link').forEach(button => button.addEventListener('click', () => copy(button.dataset.url)));
  $$('.copy-draft').forEach(button => button.addEventListener('click', () => copy($('textarea', button.parentElement).value)));
  let topic = '';
  function filter() {
    const query = ($('#article-search')?.value || '').toLowerCase().trim();
    let visible = 0;
    $$('.article-row').forEach(row => { row.hidden = !row.dataset.search.includes(query) || !row.dataset.search.includes(topic); if (!row.hidden) visible++; });
    const empty = $('#no-results'); if (empty) empty.hidden = visible > 0;
  }
  $('#article-search')?.addEventListener('input', filter);
  $$('.filter').forEach(button => button.addEventListener('click', () => {
    topic = button.dataset.filter;
    $$('.filter').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); }); filter();
  }));
  const impacts = {
    identity: {nodes: ['identity', 'dashboard'], text: 'Identity and its dashboard consumer need checks. Billing has no modeled dependency on this change.'},
    billing: {nodes: ['billing', 'dashboard'], text: 'Billing and its dashboard consumer need checks. Identity can reuse a valid previous result.'},
    contracts: {nodes: ['identity', 'billing', 'dashboard'], text: 'The shared contract reaches all three projects. Broad invalidation is correct here—not a cache failure.'}
  };
  function change(key) {
    const impact = impacts[key];
    $$('.lab-node').forEach(node => { const affected = impact.nodes.includes(node.dataset.node); node.classList.toggle('affected', affected); $('.node-status', node).textContent = affected ? 'Run checks' : 'Reuse result'; });
    if ($('#lab-result')) $('#lab-result').textContent = impact.text;
    $$('[data-change]').forEach(b => { b.classList.toggle('active', b.dataset.change === key); b.setAttribute('aria-pressed', String(b.dataset.change === key)); });
  }
  $$('[data-change]').forEach(b => b.addEventListener('click', () => change(b.dataset.change)));
  if ($('.lab')) change('identity');
  const progress = $('.reading-progress');
  if (progress) {
    const update = () => { const max = document.documentElement.scrollHeight - innerHeight; progress.style.width = `${max > 0 ? Math.min(100, scrollY / max * 100) : 100}%`; };
    addEventListener('scroll', update, {passive: true}); addEventListener('resize', update); update();
  }
  if ('IntersectionObserver' in window) {
    const links = $$('.toc a');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(link => link.classList.toggle('current', link.hash === '#' + entry.target.id));
    }), {rootMargin: '-10% 0px -75% 0px'});
    $$('.article-body h2').forEach(h => observer.observe(h));
  }
})();
