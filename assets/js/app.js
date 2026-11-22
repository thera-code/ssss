/* =========================================================
   الملتقى السوري السويسري - منطق الموقع
   ========================================================= */

const I18N = {
  config: null,
  strings: {},
  lang: 'ar',
  supported: ['ar', 'fr'],
  labels: { ar: 'العربية', fr: 'Français' },
};

const THEME = {
  current: 'light',
  key: 'sms_theme',
};

const LANG_KEY = 'sms_lang';

/* ---------------------------------------------------------
   أدوات مساعدة
   --------------------------------------------------------- */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

async function fetchJSON(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

function getText(key, fallback = '') {
  return I18N.strings[key] ?? fallback;
}

/* ---------------------------------------------------------
   الثيم
   --------------------------------------------------------- */
function getSavedTheme() {
  return localStorage.getItem(THEME.key) || 'light';
}

function applyTheme(theme) {
  THEME.current = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME.key, theme);
  const btn = $('#themeToggle');
  if (btn) {
    btn.setAttribute('aria-label',
      theme === 'dark' ? getText('theme.light', 'Light mode') : getText('theme.dark', 'Dark mode'));
  }
}

function toggleThemeWithReveal(event) {
  if (document.querySelector('.theme-reveal')) return;

  const target = THEME.current === 'dark' ? 'light' : 'dark';
  const newBg = target === 'dark'
    ? 'rgba(11, 15, 23, 0.92)'
    : 'rgba(255, 255, 255, 0.92)';

  const rect = (event.currentTarget || event.target).getBoundingClientRect();
  const x = event.clientX ?? rect.left + rect.width / 2;
  const y = event.clientY ?? rect.top + rect.height / 2;

  const container = document.createElement('div');
  container.className = 'theme-reveal';
  container.style.setProperty('--reveal-color', newBg);
  document.body.appendChild(container);

  const COUNT = 20;
  for (let i = 0; i < COUNT; i++) {
    const tri = document.createElement('div');
    tri.className = 'theme-tri';
    tri.style.setProperty('--angle', `${(360 / COUNT) * i}deg`);
    tri.style.left = `${x}px`;
    tri.style.top  = `${y}px`;
    container.appendChild(tri);
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => container.classList.add('expanding'));
  });

  setTimeout(() => {
    applyTheme(target);
    container.style.transition = 'opacity 0.2s';
    container.style.opacity = '0';
    setTimeout(() => container.remove(), 220);
  }, 800);
}

/* ---------------------------------------------------------
   اللغة
   --------------------------------------------------------- */
function detectInitialLanguage() {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved && I18N.supported.includes(saved)) return saved;
  const nav = (navigator.language || 'ar').toLowerCase();
  if (nav.startsWith('ar')) return 'ar';
  if (nav.startsWith('fr')) return 'fr';
  return 'ar';
}

function updateLangUI() {
  document.documentElement.setAttribute('lang', I18N.lang);
  document.documentElement.setAttribute('dir', I18N.lang === 'ar' ? 'rtl' : 'ltr');

  const cur = $('#langCurrent');
  if (cur) cur.textContent = I18N.lang.toUpperCase();

  const menu = $('#langMenu');
  if (menu) {
    menu.innerHTML = I18N.supported.map(code => `
      <button data-lang="${code}" class="${code === I18N.lang ? 'active' : ''}">
        <span class="lang-flag ${code}">${code.toUpperCase()}</span>
        <span>${I18N.labels[code]}</span>
      </button>
    `).join('');
  }
}

async function loadLanguage(lang) {
  I18N.strings = await fetchJSON(`assets/data/${lang}.json`);
  I18N.lang = lang;
  localStorage.setItem(LANG_KEY, lang);
  updateLangUI();
  translatePage();
  renderDynamic();
}

function translatePage() {
  $$('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const txt = getText(key);
    if (txt) el.textContent = txt;
  });
  $$('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const txt = getText(key);
    if (txt) el.setAttribute('placeholder', txt);
  });
  $$('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const txt = getText(key);
    if (txt) el.setAttribute('title', txt);
  });
}

/* ---------------------------------------------------------
   رسم العناصر الديناميكية من config
   --------------------------------------------------------- */
function renderDynamic() {
  if (!I18N.config) return;
  const cfg = I18N.config;

  const logo = $('#brandLogo');
  if (logo && cfg.brand?.logo) logo.src = cfg.brand.logo;

  const nav = $('#sidebarNav');
  if (nav) {
    const currentPath = location.pathname.split('/').pop() || 'index.html';
    nav.innerHTML = (cfg.sidebar?.items || []).map(item => {
      const isActive = item.href === currentPath;
      const label = getText(item.labelKey, item.href);
      const icon = item.icon || 'circle';
      return `
        <a href="${item.href}" class="sidebar-item ${isActive ? 'active' : ''}">
          <i data-lucide="${icon}"></i>
          <span>${label}</span>
        </a>`;
    }).join('');
  }

  const heroBg = $('#heroBg');
  if (heroBg && cfg.home?.heroImage) {
    heroBg.style.backgroundImage = `url('${cfg.home.heroImage}')`;
  }

  const footerLinks = $('#footerLinks');
  if (footerLinks) {
    footerLinks.innerHTML = (cfg.sidebar?.items || []).map(item => {
      const label = getText(item.labelKey, item.href);
      return `<li><a href="${item.href}">${label}</a></li>`;
    }).join('');
  }

  const social = $('#footerSocial');
  if (social) {
    social.innerHTML = (cfg.footer?.social || []).map(s => `
      <a href="${s.url}" target="_blank" rel="noopener" class="social-btn" aria-label="${s.platform}">
        <i data-lucide="${s.icon || s.platform}"></i>
      </a>`).join('');
  }

  const copyright = $('#copyrightText');
  if (copyright) {
    const year = cfg.footer?.startYear || 2026;
    const name = getText('site.name', 'SMS');
    const rights = getText('footer.rights', 'All rights reserved');
    copyright.textContent = `© ${year} ${name} — ${rights}`;
  }

  /* ============================================
     Powered by — الترتيب: النص أولاً ثم الشعار
     ============================================ */
  const powered = $('#poweredBy');
  if (powered && cfg.footer?.poweredBy) {
    const pb = cfg.footer.poweredBy;
    const label = getText('footer.poweredBy', 'Powered by');
    const logoHtml = pb.logo
      ? `<img src="${pb.logo}" alt="${pb.name}" />`
      : '';
    powered.innerHTML =
      `<a href="${pb.url}" target="_blank" rel="noopener">` +
        `<span class="powered-text">${label} ${pb.name}</span>` +
        logoHtml +
      `</a>`;
  }

  if (window.lucide) window.lucide.createIcons();
}

/* ---------------------------------------------------------
   أحداث الواجهة
   --------------------------------------------------------- */
function bindUI() {
  const themeBtn = $('#themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', (e) => toggleThemeWithReveal(e));
  }

  const langBtn = $('#langBtn');
  const langMenu = $('#langMenu');
  if (langBtn && langMenu) {
    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langMenu.classList.toggle('open');
    });
    document.addEventListener('click', () => langMenu.classList.remove('open'));
    langMenu.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-lang]');
      if (!btn) return;
      const lang = btn.dataset.lang;
      if (lang === I18N.lang) return;
      await loadLanguage(lang);
    });
  }

  const menuToggle = $('#menuToggle');
  const sidebar = $('#sidebar');
  const backdrop = $('#sidebarBackdrop');

  const closeSidebar = () => {
    sidebar?.classList.remove('open');
    backdrop?.classList.remove('visible');
    document.body.style.overflow = '';
  };

  if (menuToggle && sidebar && backdrop) {
    menuToggle.addEventListener('click', () => {
      const opening = !sidebar.classList.contains('open');
      sidebar.classList.toggle('open', opening);
      backdrop.classList.toggle('visible', opening);
      document.body.style.overflow = opening ? 'hidden' : '';
    });
    backdrop.addEventListener('click', closeSidebar);
    sidebar.addEventListener('click', (e) => {
      if (e.target.closest('a')) closeSidebar();
    });
  }
}

/* ---------------------------------------------------------
   تحميل الفعاليات
   --------------------------------------------------------- */
async function renderEvents() {
  const grid = $('#eventsGrid');
  if (!grid) return;

  try {
    const data = await fetchJSON('assets/data/events.json');
    const events = (data.events || []).slice().sort((a, b) => new Date(a.date) - new Date(b.date));

    if (!events.length) {
      $('#eventsEmpty').style.display = 'block';
      return;
    }

    grid.innerHTML = events.map(ev => {
      const title = ev.title?.[I18N.lang] || ev.title?.ar || ev.title || '';
      const desc  = ev.description?.[I18N.lang] || ev.description?.ar || ev.description || '';
      const loc   = ev.location?.[I18N.lang] || ev.location?.ar || ev.location || '';
      const date  = formatDate(ev.date, I18N.lang);
      return `
        <article class="event-card">
          <div class="event-image" style="background-image:url('${ev.image || ''}')"></div>
          <div class="event-body">
            <div class="event-date"><i data-lucide="calendar"></i>${date}</div>
            <h3 class="event-title">${escapeHTML(title)}</h3>
            <p class="event-desc">${escapeHTML(desc)}</p>
            <div class="event-location"><i data-lucide="map-pin"></i>${escapeHTML(loc)}</div>
          </div>
        </article>`;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    console.error(err);
    $('#eventsEmpty').style.display = 'block';
  }
}

function formatDate(iso, lang) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'fr-CH', {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(d);
  } catch { return iso; }
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m]));
}

/* ---------------------------------------------------------
   التهيئة
   --------------------------------------------------------- */
(async function init() {
  applyTheme(getSavedTheme());

  const lang = detectInitialLanguage();
  updateLangUI();

  try {
    const [cfg] = await Promise.all([
      fetchJSON('assets/data/config.json'),
      loadLanguage(lang),
    ]);
    I18N.config = cfg;

    translatePage();
    renderDynamic();

    bindUI();
    await renderEvents();
  } catch (err) {
    console.error('Init error:', err);
  }
})();
