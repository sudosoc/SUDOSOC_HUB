'use strict';

// ═══════════════════════════════════════════════════
// SUDOSOC TOOLBOX — Core Application
// ═══════════════════════════════════════════════════

const App = (() => {

  // ─── Theme ───
  const Theme = {
    current: 'dark',

    init() {
      this.current = localStorage.getItem('theme') || 'dark';
      this.apply(this.current);
      document.getElementById('themeToggle')?.addEventListener('click', () => this.toggle());
    },

    apply(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      const dark  = document.getElementById('themeIconDark');
      const light = document.getElementById('themeIconLight');
      if (dark)  dark.style.display  = theme === 'dark' ? '' : 'none';
      if (light) light.style.display = theme === 'light' ? '' : 'none';
      this.current = theme;
    },

    toggle() {
      const next = this.current === 'dark' ? 'light' : 'dark';
      this.apply(next);
      localStorage.setItem('theme', next);
    }
  };

  // ─── Mobile Nav ───
  const MobileNav = {
    init() {
      const toggle = document.getElementById('menuToggle');
      const menu   = document.getElementById('mobileMenu');
      if (!toggle || !menu) return;

      toggle.addEventListener('click', () => {
        const open = menu.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open);
      });

      document.addEventListener('click', e => {
        if (!toggle.contains(e.target) && !menu.contains(e.target)) {
          menu.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  };

  // ─── Keyboard Shortcuts ───
  const Keys = {
    init() {
      document.addEventListener('keydown', e => {
        // Cmd/Ctrl+K → focus search
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          const s = document.getElementById('heroSearch') || document.getElementById('sidebarSearch');
          s?.focus();
          s?.select();
        }
      });
    }
  };

  // ─── Tools Page ───
  const ToolsPage = {
    currentTool: null,

    init() {
      if (!document.getElementById('workspace')) return;
      this.renderSidebar();
      this.initSidebarSearch();
      this.initSidebarToggle();
      this.loadFromHash();
      window.addEventListener('hashchange', () => this.loadFromHash());
    },

    renderSidebar() {
      const nav = document.getElementById('sidebarNav');
      if (!nav) return;

      const categories = {};
      ToolRegistry.forEach(tool => {
        if (!categories[tool.category]) categories[tool.category] = [];
        categories[tool.category].push(tool);
      });

      const catOrder = ['encoding','hashing','password','data','networking','soc','developer'];

      nav.innerHTML = catOrder.map(catId => {
        const tools = categories[catId];
        if (!tools) return '';
        const cat = CATEGORIES[catId];
        return `
          <div class="sidebar-cat" data-cat="${catId}">
            <button class="sidebar-cat-btn" aria-expanded="false">
              <span class="sidebar-cat-icon">${_esc(cat.icon)}</span>
              <span>${_esc(cat.name)}</span>
              <svg class="sidebar-cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div class="sidebar-tools">
              ${tools.map(t => `
                <a class="sidebar-tool-link" href="#${t.id}" data-tool="${t.id}">
                  <span class="sidebar-tool-dot"></span>
                  ${_esc(t.name)}
                </a>
              `).join('')}
            </div>
          </div>`;
      }).join('');

      // Category toggle
      nav.querySelectorAll('.sidebar-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const expanded = btn.classList.toggle('expanded');
          btn.setAttribute('aria-expanded', expanded);
          btn.nextElementSibling.classList.toggle('open', expanded);
        });
      });

      // Tool link click
      nav.querySelectorAll('.sidebar-tool-link').forEach(link => {
        link.addEventListener('click', e => {
          const sid = document.getElementById('sidebar');
          if (sid?.classList.contains('mobile-open')) {
            sid.classList.remove('mobile-open');
          }
        });
      });
    },

    loadFromHash() {
      const hash = location.hash.replace('#', '');
      if (!hash) { this.showEmpty(); return; }

      // Category anchor → expand that category
      if (CATEGORIES[hash]) {
        const catBtn = document.querySelector(`[data-cat="${hash}"] .sidebar-cat-btn`);
        catBtn?.click();
        const firstTool = ToolRegistry.find(t => t.category === hash);
        if (firstTool) { location.hash = firstTool.id; return; }
      }

      const tool = ToolRegistry.find(t => t.id === hash);
      if (tool) this.loadTool(tool);
      else this.showEmpty();
    },

    loadTool(tool) {
      const container = document.getElementById('toolContainer');
      const empty     = document.getElementById('workspaceEmpty');
      if (!container) return;

      // Update sidebar active state
      document.querySelectorAll('.sidebar-tool-link').forEach(l => l.classList.remove('active'));
      const activeLink = document.querySelector(`[data-tool="${tool.id}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
        // Expand parent category
        const catTools = activeLink.closest('.sidebar-tools');
        if (catTools && !catTools.classList.contains('open')) {
          catTools.classList.add('open');
          const btn = catTools.previousElementSibling;
          btn?.classList.add('expanded');
          btn?.setAttribute('aria-expanded', 'true');
        }
      }

      const cat = CATEGORIES[tool.category];
      container.innerHTML = `
        <div class="tool-header">
          <div class="tool-breadcrumb">
            <span>${_esc(cat ? cat.name : tool.category)}</span>
            <span class="tool-breadcrumb-sep">/</span>
            <span style="color:var(--text-2)">${_esc(tool.name)}</span>
          </div>
          <h1 class="tool-title">${_esc(tool.name)}</h1>
          <p class="tool-desc">${_esc(tool.description)}</p>
        </div>
        ${tool.render()}
      `;

      empty.style.display = 'none';
      container.style.display = 'block';

      tool.init?.();
      this.currentTool = tool;

      // Save last used
      localStorage.setItem('lastTool', tool.id);
    },

    showEmpty() {
      const container = document.getElementById('toolContainer');
      const empty     = document.getElementById('workspaceEmpty');
      if (container) container.style.display = 'none';
      if (empty) empty.style.display = 'flex';
    },

    initSidebarSearch() {
      const input = document.getElementById('sidebarSearch');
      if (!input) return;

      input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        document.querySelectorAll('.sidebar-tool-link').forEach(link => {
          const name = link.textContent.toLowerCase();
          const show = !q || name.includes(q);
          link.style.display = show ? '' : 'none';
        });

        if (q) {
          // Auto-expand all categories when searching
          document.querySelectorAll('.sidebar-cat-btn').forEach(btn => {
            btn.classList.add('expanded');
            btn.nextElementSibling.classList.add('open');
          });
        }
      });
    },

    initSidebarToggle() {
      const toggle  = document.getElementById('sidebarToggle');
      const sidebar = document.getElementById('sidebar');
      if (!toggle || !sidebar) return;

      toggle.addEventListener('click', () => {
        const open = sidebar.classList.toggle('mobile-open');
        toggle.setAttribute('aria-expanded', open);
      });

      // Close on backdrop click
      document.addEventListener('click', e => {
        if (window.innerWidth <= 768 &&
            sidebar.classList.contains('mobile-open') &&
            !sidebar.contains(e.target) &&
            !toggle.contains(e.target)) {
          sidebar.classList.remove('mobile-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  };

  // ─── Home Page Search ───
  const HomeSearch = {
    init() {
      if (!document.getElementById('heroSearch')) return;
      Search.initSearchBar('heroSearch', 'heroSearchResults');
    }
  };

  // ─── Lazy Animations ───
  const Animations = {
    init() {
      const items = document.querySelectorAll('.cat-card, .feature-card, .stat-item');
      if (!items.length || !window.IntersectionObserver) return;

      const observer = new IntersectionObserver(entries => {
        entries.forEach(el => {
          if (el.isIntersecting) {
            el.target.style.opacity = '1';
            el.target.style.transform = 'translateY(0)';
            observer.unobserve(el.target);
          }
        });
      }, { threshold: 0.1 });

      items.forEach((item, i) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(16px)';
        item.style.transition = `opacity 0.4s ease ${i * 0.03}s, transform 0.4s ease ${i * 0.03}s`;
        observer.observe(item);
      });
    }
  };

  function _esc(s) {
    return String(s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  // ─── Init ───
  function init() {
    Theme.init();
    MobileNav.init();
    Keys.init();
    HomeSearch.init();
    ToolsPage.init();
    Animations.init();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { Theme, ToolsPage };
})();
