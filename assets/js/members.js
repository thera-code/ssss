/* ═══════════════════════════════════════════════════════════════
   Members — About Grid + Member Profile
   ملف مشترك لصفحتي about.html و member.html
   ═══════════════════════════════════════════════════════════════ */
(function () {
'use strict';

/* ─── الترجمات الخاصة بالأعضاء ─── */
const STRINGS = {
  title:          { ar: 'أعضاؤنا',                fr: 'Nos membres' },
  subtitle:       { ar: 'تعرّف على أعضاء الجمعية ومؤسسيها', fr: 'Découvrez les membres et fondateurs de l\'association' },
  readMore:       { ar: 'اقرأ المزيد',            fr: 'Lire la suite' },
  readLess:       { ar: 'إخفاء',                  fr: 'Réduire' },
  back:           { ar: 'العودة إلى الأعضاء',      fr: 'Retour aux membres' },
  about:          { ar: 'نبذة',                   fr: 'Biographie' },
  experience:     { ar: 'الخبرات',                fr: 'Expérience' },
  education:      { ar: 'التعليم',                fr: 'Formation' },
  publications:   { ar: 'المؤلفات',               fr: 'Publications' },
  projects:       { ar: 'المشاريع',               fr: 'Projets' },
  skills:         { ar: 'المهارات',               fr: 'Compétences' },
  languages:      { ar: 'اللغات',                 fr: 'Langues' },
  contact:        { ar: 'التواصل',                fr: 'Contact' },
  with:           { ar: 'بالاشتراك مع',           fr: 'En collaboration avec' },
  noMembers:      { ar: 'لا يوجد أعضاء حالياً',    fr: 'Aucun membre pour le moment' },
  loading:        { ar: 'جار التحميل…',           fr: 'Chargement…' },
  error:          { ar: 'تعذّر تحميل البيانات',     fr: 'Impossible de charger les données' },
  memberNotFound: { ar: 'العضو غير موجود',         fr: 'Membre introuvable' },
  notSelected:    { ar: 'لم يتم تحديد عضو',        fr: 'Aucun membre sélectionné' },
};

const LEVELS_SKILL = {
  expert:       { ar: 'خبير',   fr: 'Expert' },
  advanced:     { ar: 'متقدم',  fr: 'Avancé' },
  intermediate: { ar: 'متوسط',  fr: 'Intermédiaire' },
  beginner:     { ar: 'مبتدئ',  fr: 'Débutant' },
};
const LEVELS_LANG = {
  native:       { ar: 'لغة أم', fr: 'Langue maternelle' },
  fluent:       { ar: 'طليق',   fr: 'Courant' },
  intermediate: { ar: 'متوسط',  fr: 'Intermédiaire' },
  basic:        { ar: 'أساسي',  fr: 'Basique' },
};
const STATUS_PROJ = {
  completed: { ar: 'مكتمل', fr: 'Terminé' },
  ongoing:   { ar: 'جارٍ',  fr: 'En cours' },
  planned:   { ar: 'مخطط',  fr: 'Prévu' },
};

/* ─── الحالة ─── */
let data = null;
let currentLang = 'ar';
let renderedGrid = null;
let renderedProfile = null;

/* ─── مساعدات ─── */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function s(key) {
  return STRINGS[key]?.[currentLang] || STRINGS[key]?.ar || key;
}

function detectLang() {
  const htmlLang = document.documentElement.getAttribute('lang');
  if (htmlLang === 'ar' || htmlLang === 'fr') return htmlLang;
  const saved = localStorage.getItem('sms_lang');
  if (saved === 'ar' || saved === 'fr') return saved;
  const nav = (navigator.language || 'ar').toLowerCase();
  if (nav.startsWith('fr')) return 'fr';
  return 'ar';
}

/* استخراج النص بلغة محددة من كائن i18n */
function t(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number') return String(obj);
  return obj[currentLang] || obj['ar'] || obj['fr'] || '';
}

/* هل الحقل يحتوي قيمة فعلية؟ (لتجاهل null) */
function hasValue(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') {
    return Object.values(v).some(x => {
      if (x === null || x === undefined) return false;
      if (typeof x === 'string') return x.trim() !== '';
      return true;
    });
  }
  return true;
}

/* تحويل \n\n إلى <p> */
function paragraphs(text) {
  if (!text) return '';
  return text.split(/\n\n+/).filter(p => p.trim()).map(p =>
    `<p>${esc(p).replace(/\n/g, '<br>')}</p>`
  ).join('');
}

/* تنسيق سنوات */
function formatYears(start, end, current) {
  if (current) {
    const since = currentLang === 'ar' ? 'حتى الآن' : 'Présent';
    return start ? `${start} — ${since}` : since;
  }
  if (start && end) return `${start} — ${end}`;
  return start ? String(start) : (end ? String(end) : '');
}

/* ─── تحميل البيانات (مع كاش) ─── */
async function loadData() {
  const CACHE_KEY = 'sms_members_cache';
  const CACHE_T = 'sms_members_time';
  const TTL = 5 * 60 * 1000;

  const cached = localStorage.getItem(CACHE_KEY);
  const cachedTime = parseInt(localStorage.getItem(CACHE_T) || '0', 10);
  if (cached && (Date.now() - cachedTime) < TTL) {
    try { return JSON.parse(cached); } catch {}
  }

  try {
    const res = await fetch('assets/data/members.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    localStorage.setItem(CACHE_KEY, JSON.stringify(json));
    localStorage.setItem(CACHE_T, String(Date.now()));
    return json;
  } catch (err) {
    if (cached) return JSON.parse(cached);
    throw err;
  }
}

/* ═══════════════════════════════════════════════════════════════
   صفحة من نحن — شبكة الأعضاء
   ═══════════════════════════════════════════════════════════════ */
function renderGrid(container) {
  const members = (data.members || []).filter(m => m.active !== false);
  if (!members.length) {
    container.innerHTML = `<div class="member-empty">${s('noMembers')}</div>`;
    return;
  }

  container.innerHTML = members.map(m => {
    const name = t(m.name);
    const role = t(m.role);
    const brief = t(m.bio?.short);
    const slug = m.slug || m.id;
    const href = `member.html?slug=${encodeURIComponent(slug)}`;
    const photo = m.photo
      ? `background-image:url('${esc(m.photo)}');background-position:${esc(m.photo_position || 'center bottom')}`
      : `background:linear-gradient(135deg, var(--accent-soft), var(--bg-alt))`;

    return `
      <article class="member-card">
        <div class="member-photo" style="${photo}"></div>
        <h3 class="member-name">${esc(name)}</h3>
        ${role ? `<div class="member-role">${esc(role)}</div>` : ''}
        ${brief ? `<p class="member-brief">${esc(brief)}</p>` : ''}
        <a href="${href}" class="member-cta">
          <span>${esc(s('readMore'))}</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </a>
      </article>`;
  }).join('');
}

function renderAboutHeader() {
  const title = document.getElementById('membersTitle');
  const subtitle = document.getElementById('membersSubtitle');
  if (title) title.textContent = s('title');
  if (subtitle) subtitle.textContent = s('subtitle');
}

/* ═══════════════════════════════════════════════════════════════
   صفحة العضو — التفاصيل الكاملة
   ═══════════════════════════════════════════════════════════════ */
function renderProfile(container) {
  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug) {
    container.innerHTML = `<div class="member-empty">${s('notSelected')}</div>`;
    return;
  }

  const member = (data.members || []).find(m => m.slug === slug || m.id === slug);
  if (!member) {
    container.innerHTML = `<div class="member-empty">${s('memberNotFound')}</div>`;
    return;
  }

  const name = t(member.name);
  const role = t(member.role);
  const nationality = t(member.nationality);
  const origin = t(member.origin);
  const location = t(member.location);
  const bioFull = t(member.bio?.full) || t(member.bio?.short);
  const photo = member.photo
    ? `background-image:url('${esc(member.photo)}');background-position:${esc(member.photo_position || 'center bottom')}`
    : `background:linear-gradient(135deg, var(--accent-soft), var(--bg-alt))`;

  const locIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/><circle cx="12" cy="10" r="3"/></svg>`;
  const flagIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`;
  const homeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;

  let html = `
    <a href="about.html" class="back-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
      <span>${esc(s('back'))}</span>
    </a>

    <header class="profile-header">
      <div class="profile-photo" style="${photo}"></div>
      <div class="profile-info">
        <h1>${esc(name)}</h1>
        ${role ? `<div class="profile-role">${esc(role)}</div>` : ''}
        <div class="profile-meta">
          ${nationality ? `<span>${flagIcon}${esc(nationality)}</span>` : ''}
          ${origin ? `<span>${locIcon}${esc(origin)}</span>` : ''}
          ${location ? `<span>${homeIcon}${esc(location)}</span>` : ''}
        </div>
      </div>
    </header>
  `;

  if (bioFull) {
    html += `<section class="profile-section">
      <h2>${esc(s('about'))}</h2>
      ${paragraphs(bioFull)}
    </section>`;
  }

  if (hasValue(member.bio_sections)) {
    member.bio_sections.forEach(sec => {
      const title = t(sec.title);
      const content = t(sec.content);
      if (!content) return;
      html += `<section class="profile-section">
        <h2>${esc(title)}</h2>
        ${paragraphs(content)}
      </section>`;
    });
  }

  if (hasValue(member.experience)) {
    html += `<section class="profile-section">
      <h2>${esc(s('experience'))}</h2>
      <div class="timeline">
        ${member.experience.map(e => {
          const pos = t(e.position);
          const comp = t(e.company);
          const loc = t(e.location);
          const desc = t(e.description);
          const yrs = formatYears(e.year_start, e.year_end, e.current);
          const org = [comp, loc].filter(Boolean).join(' · ');
          return `<div class="timeline-item">
            ${yrs ? `<div class="timeline-year">${esc(yrs)}</div>` : ''}
            <div class="timeline-title">${esc(pos)}</div>
            ${org ? `<div class="timeline-org">${esc(org)}</div>` : ''}
            ${desc ? `<div class="timeline-desc">${esc(desc)}</div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </section>`;
  }

  if (hasValue(member.education)) {
    html += `<section class="profile-section">
      <h2>${esc(s('education'))}</h2>
      <div class="timeline">
        ${member.education.map(e => {
          const deg = t(e.degree);
          const inst = t(e.institution);
          const field = t(e.field);
          const loc = t(e.location);
          const yrs = formatYears(e.year_start, e.year_end, false);
          const org = [inst, loc].filter(Boolean).join(' · ');
          return `<div class="timeline-item">
            ${yrs ? `<div class="timeline-year">${esc(yrs)}</div>` : ''}
            <div class="timeline-title">${esc(deg)}</div>
            ${org ? `<div class="timeline-org">${esc(org)}</div>` : ''}
            ${field ? `<div class="timeline-desc">${esc(field)}</div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </section>`;
  }

  if (hasValue(member.publications)) {
    html += `<section class="profile-section">
      <h2>${esc(s('publications'))}</h2>
      <div class="publications-list">
        ${member.publications.map(p => {
          const title = t(p.title);
          const pub = t(p.publisher);
          const loc = t(p.location);
          const meta = [pub, loc, p.year].filter(Boolean).join(' · ');
          const collabs = (p.collaborators || []).map(c => t(c.name)).filter(Boolean);
          return `<div class="publication-item">
            <div class="publication-title">${esc(title)}</div>
            ${meta ? `<div class="publication-meta">${esc(meta)}</div>` : ''}
            ${collabs.length ? `<div class="publication-collab">${esc(s('with'))}: ${collabs.map(esc).join('، ')}</div>` : ''}
          </div>`;
        }).join('')}
      </div>
    </section>`;
  }

  if (hasValue(member.projects)) {
    html += `<section class="profile-section">
      <h2>${esc(s('projects'))}</h2>
      <div class="projects-grid">
        ${member.projects.map(p => {
          const title = t(p.title);
          const short = t(p.short);
          const full = t(p.full);
          const status = STATUS_PROJ[p.status]?.[currentLang] || '';
          const awards = (p.awards || []).map(a => t(a.name)).filter(Boolean);
          const pid = esc(p.id);
          return `<div class="project-card">
            ${p.image ? `<div class="project-cover" style="background-image:url('${esc(p.image)}')"></div>` : ''}
            <div class="project-body">
              <div class="project-title">${esc(title)}</div>
              ${status ? `<span class="project-status ${esc(p.status)}">${esc(status)}</span>` : ''}
              ${short ? `<p class="project-short">${esc(short)}</p>` : ''}
              ${full ? `<span class="project-toggle" data-toggle="${pid}">${esc(s('readMore'))} ↓</span>` : ''}
              ${full ? `<div class="project-full" id="proj-${pid}">
                ${paragraphs(full)}
                ${awards.length ? `<div class="project-award">🏆 ${awards.map(esc).join(' · ')}</div>` : ''}
              </div>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    </section>`;
  }

  if (hasValue(member.skills)) {
    html += `<section class="profile-section">
      <h2>${esc(s('skills'))}</h2>
      <div class="skills-wrap">
        ${member.skills.map(sk => {
          const nm = t(sk.name);
          const lv = LEVELS_SKILL[sk.level]?.[currentLang] || '';
          return `<span class="skill-badge">${esc(nm)}${lv ? `<span class="skill-level">${esc(lv)}</span>` : ''}</span>`;
        }).join('')}
      </div>
    </section>`;
  }

  if (hasValue(member.languages)) {
    html += `<section class="profile-section">
      <h2>${esc(s('languages'))}</h2>
      <div class="languages-list">
        ${member.languages.map(l => {
          const nm = t(l.name);
          const lv = LEVELS_LANG[l.level]?.[currentLang] || '';
          return `<span class="lang-chip"><strong>${esc(nm)}</strong>${lv ? ` · ${esc(lv)}` : ''}</span>`;
        }).join('')}
      </div>
    </section>`;
  }

  const social = member.social || {};
  const contact = member.contact || {};
  const links = [];
  if (contact.email) links.push({ href: `mailto:${contact.email}`, label: contact.email });
  if (contact.website) links.push({ href: contact.website, label: contact.website });
  ['linkedin','github','twitter','facebook','instagram'].forEach(k => {
    if (social[k]) links.push({ href: social[k], label: k[0].toUpperCase() + k.slice(1) });
  });

  if (links.length) {
    html += `<section class="profile-section">
      <h2>${esc(s('contact'))}</h2>
      <div class="contact-row">
        ${links.map(c => `<a href="${esc(c.href)}" target="_blank" rel="noopener" class="contact-btn">${esc(c.label)}</a>`).join('')}
      </div>
    </section>`;
  }

  container.innerHTML = html;

  // Project expand toggles
  container.querySelectorAll('.project-toggle').forEach(el => {
    el.addEventListener('click', () => {
      const target = document.getElementById('proj-' + el.dataset.toggle);
      if (!target) return;
      const open = target.classList.toggle('open');
      el.textContent = open
        ? `${s('readLess')} ↑`
        : `${s('readMore')} ↓`;
    });
  });

  // Update document title
  document.title = `${name} — ${document.title.split('—').pop().trim()}`;
}

/* ─── إبراز «من نحن» في القائمة عند فتح صفحة العضو ─── */
function highlightAboutInSidebar() {
  const tryHighlight = () => {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return false;
    const item = nav.querySelector('.sidebar-item[href="about.html"]');
    if (!item) return false;
    nav.querySelectorAll('.sidebar-item').forEach(x => x.classList.remove('active'));
    item.classList.add('active');
    return true;
  };
  if (tryHighlight()) return;
  const nav = document.getElementById('sidebarNav');
  if (!nav) return;
  const obs = new MutationObserver(() => { if (tryHighlight()) obs.disconnect(); });
  obs.observe(nav, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 5000);
}

/* ═══════════════════════════════════════════════════════════════
   نقطة البداية
   ═══════════════════════════════════════════════════════════════ */
async function renderAll() {
  currentLang = detectLang();

  try {
    if (!data) data = await loadData();
  } catch (err) {
    console.error('members.js:', err);
    const c = renderedGrid || renderedProfile;
    if (c) c.innerHTML = `<div class="member-empty">${s('error')}</div>`;
    return;
  }

  if (renderedGrid) {
    renderAboutHeader();
    renderGrid(renderedGrid);
  }
  if (renderedProfile) {
    renderProfile(renderedProfile);
  }
}

async function init() {
  renderedGrid = document.getElementById('membersGrid');
  renderedProfile = document.getElementById('memberProfile');

  if (!renderedGrid && !renderedProfile) return;

  currentLang = detectLang();

  try {
    data = await loadData();
  } catch (err) {
    console.error('members.js:', err);
    const c = renderedGrid || renderedProfile;
    if (c) c.innerHTML = `<div class="member-empty">${s('error')}</div>`;
    return;
  }

  if (renderedGrid) {
    renderAboutHeader();
    renderGrid(renderedGrid);
  }
  if (renderedProfile) {
    renderProfile(renderedProfile);
    highlightAboutInSidebar();
  }

  // إعادة الرسم عند تغيير اللغة من قِبل app.js
  const obs = new MutationObserver(() => {
    const newLang = detectLang();
    if (newLang !== currentLang) {
      currentLang = newLang;
      if (renderedGrid) { renderAboutHeader(); renderGrid(renderedGrid); }
      if (renderedProfile) renderProfile(renderedProfile);
    }
  });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
