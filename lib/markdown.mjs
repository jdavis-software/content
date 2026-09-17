/** Safe, deliberately small Markdown dialect. No raw HTML or executable MDX. */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function safeUrl(value, image = false) {
  if (/[\u0000-\u0020\\]/.test(value) || value.startsWith('//')) return null;
  if (/^https:\/\//i.test(value)) {
    try { const u = new URL(value); return u.username || u.password ? null : value; } catch { return null; }
  }
  if (!image && /^#[a-z0-9_-]+$/i.test(value)) return value;
  if (!image && /^mailto:[^\s<>]+@[^\s<>]+$/i.test(value)) return value;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  if (/^(assets|diagrams)\/[a-zA-Z0-9_./-]+$/.test(value) && !value.split('/').includes('..')) return value;
  return null;
}
export function inline(text) {
  // Tokenize once. Never re-parse generated HTML or run substitutions inside it.
  const re = /`([^`\n]+)`|!\[([^\]\n]*)\]\(([^\s)]+)\)|\[([^\]\n]+)\]\(([^\s)]+)\)|\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
  let out = '', at = 0;
  for (const m of text.matchAll(re)) {
    out += escapeHtml(text.slice(at, m.index));
    if (m[1] !== undefined) out += `<code>${escapeHtml(m[1])}</code>`;
    else if (m[2] !== undefined) {
      const u = safeUrl(m[3], true);
      out += u ? `<img src="${escapeHtml(u)}" alt="${escapeHtml(m[2])}" loading="lazy" decoding="async">` : escapeHtml(m[0]);
    } else if (m[4] !== undefined) {
      const u = safeUrl(m[5]);
      out += u ? `<a href="${escapeHtml(u)}"${u.startsWith('https:') ? ' rel="noopener noreferrer"' : ''}>${escapeHtml(m[4])}</a>` : escapeHtml(m[0]);
    } else if (m[6] !== undefined) out += `<strong>${escapeHtml(m[6])}</strong>`;
    else out += `<em>${escapeHtml(m[7])}</em>`;
    at = m.index + m[0].length;
  }
  return out + escapeHtml(text.slice(at));
}
export function highlight(code, language) {
  if (!['ts','typescript','js','javascript','json','go','bash','sh'].includes(language)) return escapeHtml(code);
  const re = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\b(const|let|export|import|from|type|interface|return|async|await|function|class|if|else|for|of|new|true|false|null|package|func|go|chan|defer|select|case|break|var|range|struct)\b|\b(\d+(?:\.\d+)?)\b/g;
  let out = '', at = 0;
  for (const m of code.matchAll(re)) {
    out += escapeHtml(code.slice(at,m.index));
    out += `<span class="syntax-${m[1] ? 'string' : m[2] ? 'keyword' : 'number'}">${escapeHtml(m[0])}</span>`;
    at = m.index + m[0].length;
  }
  return out + escapeHtml(code.slice(at));
}
export function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g,'\n').split('\n');
  const html = [], toc = [], ids = new Map();
  let i = 0;
  const startBlock = s => /^(#{1,6} |```|> |[-*] |\d+\. |---\s*$)/.test(s);
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim().toLowerCase(); const code = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      if (i === lines.length) throw new Error('Unclosed fenced code block');
      i++;
      html.push(`<div class="code-block"><div class="code-top"><span>${escapeHtml(lang || 'text')}</span><button type="button" class="copy-code">Copy code</button></div><pre><code class="language-${escapeHtml(lang)}">${highlight(code.join('\n'),lang)}</code></pre></div>`);
      continue;
    }
    const heading = line.match(/^(#{1,6}) (.+)$/);
    if (heading) {
      const text = heading[2].replace(/[*`]/g,'');
      const stem = text.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'section';
      const count = ids.get(stem) || 0; ids.set(stem,count + 1);
      const id = count ? `${stem}-${count}` : stem;
      html.push(`<h${heading[1].length} id="${id}">${inline(heading[2])}</h${heading[1].length}>`);
      if (heading[1].length === 2) toc.push({id,text});
      i++; continue;
    }
    if (/^---\s*$/.test(line)) { html.push('<hr>'); i++; continue; }
    if (line.startsWith('> ')) {
      const q=[]; while(i<lines.length && lines[i].startsWith('> ')) q.push(lines[i++].slice(2));
      html.push(`<blockquote><p>${inline(q.join(' '))}</p></blockquote>`); continue;
    }
    if (/^([-*] |\d+\. )/.test(line)) {
      const ordered = /^\d/.test(line); const pattern = ordered ? /^\d+\. / : /^[-*] /; const rows=[];
      while(i<lines.length && pattern.test(lines[i])) rows.push(`<li>${inline(lines[i++].replace(pattern,''))}</li>`);
      html.push(`<${ordered?'ol':'ul'}>${rows.join('')}</${ordered?'ol':'ul'}>`); continue;
    }
    if (line.startsWith('|') && i+1<lines.length && /^\|?[ :|-]+\|?$/.test(lines[i+1]) && lines[i+1].includes('---')) {
      const cells = s => s.replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
      const headers=cells(line); i+=2; const rows=[];
      while(i<lines.length && lines[i].startsWith('|')) rows.push(cells(lines[i++]));
      html.push(`<div class="table-scroll"><table><thead><tr>${headers.map(c=>`<th scope="col">${inline(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(c=>`<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`); continue;
    }
    const p=[line]; i++;
    while (i<lines.length && lines[i].trim() && !startBlock(lines[i])) p.push(lines[i++]);
    html.push(`<p>${inline(p.join(' '))}</p>`);
  }
  return {html:html.join('\n'),toc};
}
