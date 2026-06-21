'use strict';

// Central tool registry — each tool file pushes its tools here
const ToolRegistry = [];

const CATEGORIES = {
  encoding:   { name: 'Encoding & Decoding', icon: '</>' },
  hashing:    { name: 'Hashing',             icon: '#'   },
  password:   { name: 'Password Tools',      icon: '🔒'  },
  data:       { name: 'JSON & Data',         icon: '{}'  },
  networking: { name: 'Networking',          icon: 'IP/' },
  soc:        { name: 'SOC & DFIR',         icon: 'SOC' },
  developer:  { name: 'Developer Utilities', icon: 'DEV' },
};

const Search = (() => {
  function normalize(str) {
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  }

  function score(tool, query) {
    const q = normalize(query);
    const name  = normalize(tool.name);
    const tags  = normalize((tool.tags || []).join(' '));
    const cat   = normalize(tool.category);
    const desc  = normalize(tool.description || '');

    if (name === q) return 100;
    if (name.startsWith(q)) return 90;
    if (name.includes(q)) return 80;
    if (tags.includes(q)) return 70;
    if (desc.includes(q)) return 50;
    if (cat.includes(q)) return 40;

    // word-by-word partial
    const words = q.split(/\s+/).filter(Boolean);
    if (words.every(w => name.includes(w) || tags.includes(w))) return 60;

    return 0;
  }

  function highlight(text, query) {
    if (!query) return _esc(text);
    const escaped = _esc(text);
    const re = new RegExp(`(${_escRe(query)})`, 'gi');
    return escaped.replace(re, '<mark>$1</mark>');
  }

  function _esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function _escRe(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function query(input, maxResults = 8) {
    if (!input || input.length < 1) return [];
    const q = input.trim();
    return ToolRegistry
      .map(tool => ({ tool, s: score(tool, q) }))
      .filter(r => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, maxResults)
      .map(r => r.tool);
  }

  function renderDropdown(results, query, container) {
    container.innerHTML = '';
    if (!results.length) {
      container.innerHTML = `<div class="search-no-results">No tools found for "<strong>${_esc(query)}</strong>"</div>`;
      container.classList.add('open');
      return;
    }
    results.forEach(tool => {
      const a = document.createElement('a');
      a.className = 'search-result-item';
      a.href = `tools.html#${tool.id}`;
      const cat = CATEGORIES[tool.category];
      a.innerHTML = `
        <div class="search-result-icon" aria-hidden="true">${cat ? _esc(cat.icon) : '?'}</div>
        <div class="search-result-content">
          <div class="search-result-name">${highlight(tool.name, query)}</div>
          <div class="search-result-cat">${cat ? _esc(cat.name) : ''}</div>
        </div>
        <span class="search-result-badge">${_esc(tool.id)}</span>
      `;
      container.appendChild(a);
    });
    container.classList.add('open');
  }

  function initSearchBar(inputId, resultsId) {
    const input   = document.getElementById(inputId);
    const results = document.getElementById(resultsId);
    if (!input || !results) return;

    let focusIdx = -1;

    input.addEventListener('input', () => {
      const q = input.value.trim();
      focusIdx = -1;
      if (!q) { results.classList.remove('open'); results.innerHTML = ''; return; }
      renderDropdown(query(q), q, results);
    });

    input.addEventListener('keydown', e => {
      const items = results.querySelectorAll('.search-result-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        focusIdx = Math.min(focusIdx + 1, items.length - 1);
        _setFocus(items, focusIdx);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        focusIdx = Math.max(focusIdx - 1, -1);
        _setFocus(items, focusIdx);
        if (focusIdx === -1) input.focus();
      } else if (e.key === 'Enter' && focusIdx >= 0) {
        e.preventDefault();
        items[focusIdx]?.click();
      } else if (e.key === 'Escape') {
        results.classList.remove('open');
        input.blur();
      }
    });

    document.addEventListener('click', e => {
      if (!input.contains(e.target) && !results.contains(e.target)) {
        results.classList.remove('open');
      }
    });
  }

  function _setFocus(items, idx) {
    items.forEach(i => i.classList.remove('focused'));
    if (idx >= 0 && items[idx]) {
      items[idx].classList.add('focused');
      items[idx].scrollIntoView({ block: 'nearest' });
    }
  }

  return { query, renderDropdown, initSearchBar, highlight };
})();
