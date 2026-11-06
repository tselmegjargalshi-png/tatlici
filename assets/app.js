import { ALLERGENS, ALLERGEN_MAP, allergenIcon, BADGES } from './allergens.js';

const UI = {
  mn: {
    search: 'Амттан хайх', close: 'Хаах', filterTitle: 'Харшлын шүүлтүүр',
    filterDesc: 'Харшилтай орцоо сонговол түүнийг агуулсан амттан нуугдана.',
    clear: 'Цэвэрлэх', apply: 'Харуулах', empty: 'Тохирох амттан олдсонгүй',
    hidden: (n) => `${n} бүтээгдэхүүн харшлын шүүлтүүрээр нуугдсан`, showAll: 'Бүгдийг харуулах',
    legend: 'Харшлын тэмдэглэгээ', legendScript: 'Харшилтай бол бидэнд хэлээрэй.',
    location: 'Байршил', map: 'Газрын зураг', hours: 'Ажлын цаг', pay: 'Төлбөрийн хэлбэр',
    story: 'Бидний түүх', foot: 'Бүх үнэ Türk lirası (₺), KDV багтсан', kcal: 'ккал',
    soldout: 'Дууссан', items: 'төрөл', wifi: 'Wi Fi', sweet: 'Чихэрлэг байдал',
    noAllergen: 'Харшил үүсгэгчгүй'
  },
  tr: {
    search: 'Tatlı ara', close: 'Kapat', filterTitle: 'Alerjen filtresi',
    filterDesc: 'Alerjiniz olan içerikleri seçin, bunları içeren ürünler gizlenir.',
    clear: 'Temizle', apply: 'Göster', empty: 'Aradığınız tatlı bulunamadı',
    hidden: (n) => `${n} ürün alerjen filtresiyle gizlendi`, showAll: 'Tümünü göster',
    legend: 'Alerjen bilgisi', legendScript: 'Alerjiniz varsa lütfen bize söyleyin.',
    location: 'Konum', map: 'Yol tarifi', hours: 'Çalışma saatleri', pay: 'Ödeme seçenekleri',
    story: 'Hikayemiz', foot: 'Tüm fiyatlar Türk lirası (₺), KDV dahil', kcal: 'kcal',
    soldout: 'Tükendi', items: 'çeşit', wifi: 'Wi Fi', sweet: 'Tatlılık',
    noAllergen: 'Alerjen içermez'
  }
};

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
};

const state = {
  menu: null,
  lang: store.get('td_lang', 'mn') === 'tr' ? 'tr' : 'mn',
  q: '',
  exclude: new Set(store.get('td_exclude', [])),
  draft: new Set()
};

const t = (k) => UI[state.lang][k];
const L = (v) => (v && typeof v === 'object' ? (v[state.lang] || v.mn || '') : (v || ''));
const fmtPrice = (n) => new Intl.NumberFormat('tr-TR').format(n);
const norm = (s) => String(s).toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');

async function loadMenu() {
  const cached = store.get('td_menu_cache', null);
  if (cached) { state.menu = cached; renderAll(); }
  try {
    const r = await fetch('/api/menu', { cache: 'no-store' });
    if (r.ok) {
      const j = await r.json();
      if (j.menu) { state.menu = j.menu; store.set('td_menu_cache', j.menu); renderAll(); return; }
    }
  } catch { /* fall through to static */ }
  try {
    const r = await fetch('/data/menu.json', { cache: 'no-cache' });
    const m = await r.json();
    state.menu = m; store.set('td_menu_cache', m); renderAll();
  } catch {
    if (!state.menu) $('menu').innerHTML = '<p class="empty">Меню ачаалж чадсангүй</p>';
  }
}

function renderBrand() {
  const b = state.menu.brand;
  const img = b.images || {};
  document.documentElement.lang = state.lang === 'tr' ? 'tr' : 'mn';
  if (img.logo) $('hdrLogo').src = img.logo;
  const win = $('archWindow');
  $('heroImg').src = img.hero || img.logo || '/assets/logo.webp';
  win.classList.toggle('photo', Boolean(img.hero));
  if (img.banner) { $('bannerImg').src = img.banner; $('bannerWrap').hidden = false; } else { $('bannerWrap').hidden = true; }
  $('cityLine').textContent = `${b.city || ''} · 1987`;
  $('slogan').textContent = L(b.slogan);
  $('tagline').textContent = L(b.tagline);
  $('notice').textContent = L(b.notice);
  $('heroChips').innerHTML = [
    `<li>◷ ${esc(L(b.hours))}</li>`,
    b.wifi ? `<li>⌔ ${esc(t('wifi'))}: ${esc(b.wifi)}</li>` : ''
  ].join('');
  $('address').textContent = b.address || '';
  $('mapLink').href = b.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(b.address || '')}`;
  const ig = String(b.instagram || '').replace(/^@/, '');
  $('instaLink').href = `https://instagram.com/${encodeURIComponent(ig)}`;
  $('instaText').textContent = '@' + ig;
  $('phoneLink').href = 'tel:' + String(b.phone || '').replace(/\s+/g, '');
  $('phoneText').textContent = b.phone || '';
  $('hours').textContent = L(b.hours);
  $('payments').innerHTML = (b.payments || []).map((p) => `<li>${esc(p)}</li>`).join('');
  $('wifi').textContent = b.wifi ? `${t('wifi')}: ${b.wifi}` : '';
  $('story').textContent = L(b.story);

  $('searchInput').placeholder = t('search');
  $('searchClose').textContent = t('close');
  $('sheetTitle').textContent = t('filterTitle');
  $('sheetDesc').textContent = t('filterDesc');
  $('sheetClear').textContent = t('clear');
  $('sheetApply').textContent = t('apply');
  $('legendTitle').textContent = t('legend');
  $('legendScript').textContent = t('legendScript');
  $('tLocation').textContent = t('location');
  $('tMap').textContent = t('map');
  $('tHours').textContent = t('hours');
  $('tPay').textContent = t('pay');
  $('tStory').textContent = t('story');
  $('footNote').textContent = t('foot');
  document.querySelectorAll('.lang button').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.lang === state.lang)));
}

function matches(item) {
  if (state.exclude.size && (item.allergens || []).some((a) => state.exclude.has(a))) return false;
  if (state.q) {
    const hay = norm(`${item.name} ${L(item.desc)} ${item.desc?.tr || ''}`);
    return hay.includes(norm(state.q));
  }
  return true;
}

function itemHTML(it) {
  const badges = (it.badges || []).filter((b) => BADGES[b]).map((b) => `<span class="badge ${b}">${esc(BADGES[b][state.lang])}</span>`).join('');
  const algs = (it.allergens || []).filter((a) => ALLERGEN_MAP[a]);
  const algHTML = algs.length
    ? `<span class="algs" role="list" aria-label="${esc(t('legend'))}">${algs.map((a) => `<span role="listitem" title="${esc(ALLERGEN_MAP[a][state.lang])}">${allergenIcon(a, 26)}</span>`).join('')}</span>`
    : `<span class="kcal">${esc(t('noAllergen'))}</span>`;
  const sweet = it.sweet > 0
    ? `<span class="sweet" title="${esc(t('sweet'))} ${it.sweet}/3" aria-label="${esc(t('sweet'))} ${it.sweet}/3">${[1, 2, 3].map((n) => `<i class="${n <= it.sweet ? 'on' : ''}"></i>`).join('')}</span>`
    : '';
  const out = it.available === false;
  return `<article class="item${(it.badges || []).includes('signature') ? ' sig' : ''}${out ? ' out' : ''}">
    ${badges || out ? `<div class="badges">${badges}${out ? `<span class="soldout">${esc(t('soldout'))}</span>` : ''}</div>` : ''}
    <h3>${esc(it.name)}</h3>
    ${L(it.desc) ? `<p class="desc">${esc(L(it.desc))}</p>` : ''}
    <div class="meta">
      ${it.kcal || it.kcal === 0 ? `<span class="kcal">${esc(it.kcal)} ${esc(t('kcal'))}</span>` : ''}
      ${algHTML}
      ${sweet}
      <span class="price">${fmtPrice(it.price)}<small>₺</small></span>
    </div>
  </article>`;
}

function renderMenu() {
  const cats = state.menu.categories || [];
  let shown = 0; let hiddenByFilter = 0;
  const html = cats.map((c) => {
    const visible = (c.items || []).filter((it) => {
      const ok = matches(it);
      if (!ok && state.exclude.size && !state.q) hiddenByFilter++;
      return ok;
    });
    shown += visible.length;
    if (!visible.length) return '';
    return `<section class="cat" id="cat-${esc(c.id)}" data-cat="${esc(c.id)}" aria-labelledby="h-${esc(c.id)}">
      <div class="cat-head"><h2 id="h-${esc(c.id)}">${esc(c.name)}</h2><span class="count">${visible.length} ${esc(t('items'))}</span></div>
      ${L(c.note) ? `<p class="cat-note">${esc(L(c.note))}</p>` : ''}
      <div class="items">${visible.map(itemHTML).join('')}</div>
    </section>`;
  }).join('');
  $('menu').innerHTML = html;
  $('empty').hidden = shown > 0;
  $('empty').textContent = t('empty');

  const fn = $('filterNote');
  if (state.exclude.size && hiddenByFilter) {
    fn.hidden = false;
    fn.innerHTML = `<span>${esc(t('hidden')(hiddenByFilter))}</span><button type="button" id="clearFilter">${esc(t('showAll'))}</button>`;
    $('clearFilter').onclick = () => { state.exclude.clear(); persistFilter(); renderMenu(); };
  } else fn.hidden = true;

  const cnt = $('filterCount');
  cnt.hidden = !state.exclude.size; cnt.textContent = state.exclude.size;
  $('filterBtn').classList.toggle('active', state.exclude.size > 0);

  renderTabs();
  observeSections();
}

function renderTabs() {
  const secs = [...document.querySelectorAll('.cat')];
  $('tabs').innerHTML = secs.map((s, i) => {
    const c = state.menu.categories.find((x) => x.id === s.dataset.cat);
    return `<button class="tab" role="tab" type="button" data-target="${esc(s.id)}" aria-selected="${i === 0}">${esc(c.name)}</button>`;
  }).join('');
}

let io;
let lockUntil = 0;
function setActiveTab(id) {
  document.querySelectorAll('.tab').forEach((b) => {
    const on = b.dataset.target === id;
    b.setAttribute('aria-selected', String(on));
    if (on) {
      const bar = $('tabs');
      const left = b.offsetLeft - bar.clientWidth / 2 + b.clientWidth / 2;
      bar.scrollTo({ left, behavior: 'smooth' });
    }
  });
}
function observeSections() {
  io?.disconnect();
  io = new IntersectionObserver((entries) => {
    if (Date.now() < lockUntil) return;
    const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (vis[0]) setActiveTab(vis[0].target.id);
  }, { rootMargin: '-90px 0px -60% 0px' });
  document.querySelectorAll('.cat').forEach((s) => io.observe(s));
}

function renderLegend() {
  $('legendGrid').innerHTML = ALLERGENS.map((a) => `<li>${allergenIcon(a.key, 52)}<span>${esc(a[state.lang])}</span></li>`).join('');
}

function renderSheet() {
  $('sheetGrid').innerHTML = ALLERGENS.map((a) => `<button type="button" class="algtoggle" data-key="${a.key}" aria-pressed="${state.draft.has(a.key)}">${allergenIcon(a.key, 30)}<span>${esc(a[state.lang])}</span></button>`).join('');
}

function persistFilter() { store.set('td_exclude', [...state.exclude]); }

function openSheet() {
  state.draft = new Set(state.exclude);
  renderSheet();
  $('sheet').hidden = false; $('sheetBackdrop').hidden = false;
  document.body.style.overflow = 'hidden';
  $('sheet').querySelector('button')?.focus();
}
function closeSheet() {
  $('sheet').hidden = true; $('sheetBackdrop').hidden = true;
  document.body.style.overflow = '';
  $('filterBtn').focus();
}

function renderAll() {
  if (!state.menu) return;
  renderBrand();
  renderLegend();
  renderMenu();
}

function bind() {
  document.querySelectorAll('.lang button').forEach((btn) => btn.addEventListener('click', () => {
    state.lang = btn.dataset.lang; store.set('td_lang', state.lang); renderAll();
  }));
  $('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('.tab'); if (!b) return;
    lockUntil = Date.now() + 900;
    setActiveTab(b.dataset.target);
    document.getElementById(b.dataset.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('searchBtn').addEventListener('click', () => {
    const row = $('searchRow'); const open = row.hidden;
    row.hidden = !open; $('searchBtn').setAttribute('aria-expanded', String(open));
    if (open) $('searchInput').focus(); else { state.q = ''; $('searchInput').value = ''; renderMenu(); }
  });
  $('searchClose').addEventListener('click', () => $('searchBtn').click());
  let timer;
  $('searchInput').addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.q = e.target.value.trim(); renderMenu(); }, 120);
  });
  $('filterBtn').addEventListener('click', openSheet);
  $('sheetBackdrop').addEventListener('click', closeSheet);
  $('sheetGrid').addEventListener('click', (e) => {
    const b = e.target.closest('.algtoggle'); if (!b) return;
    const k = b.dataset.key;
    state.draft.has(k) ? state.draft.delete(k) : state.draft.add(k);
    b.setAttribute('aria-pressed', String(state.draft.has(k)));
  });
  $('sheetClear').addEventListener('click', () => { state.draft.clear(); renderSheet(); });
  $('sheetApply').addEventListener('click', () => { state.exclude = new Set(state.draft); persistFilter(); renderMenu(); closeSheet(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('sheet').hidden) closeSheet(); });
  $('year').textContent = new Date().getFullYear();
}

bind();
loadMenu();
