import { ALLERGENS, allergenIcon, BADGES } from './allergens.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ss = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } },
  del(k) { try { sessionStorage.removeItem(k); } catch { /* ignore */ } }
};

const S = { key: ss.get('td_admin_key'), storage: false, menu: null, dirty: false, tab: 'items', cat: 0, open: null };

function toast(msg, bad = false) {
  const el = $('toast');
  el.textContent = msg; el.className = 'toast' + (bad ? ' bad' : ''); el.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true; }, 3200);
}

function setDirty(v = true) {
  S.dirty = v;
  $('saveBtn').disabled = !v || !S.storage;
  const st = $('saveState');
  st.textContent = v ? 'Kaydedilmemiş değişiklik var' : 'Kaydedildi';
  st.classList.toggle('dirty', v);
}

const uid = (p) => p + Math.random().toString(36).slice(2, 8);

function getPath(obj, path) { return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj); }
function setPath(obj, path, val) {
  const ks = path.split('.'); const last = ks.pop();
  let o = obj;
  for (const k of ks) { if (o[k] == null || typeof o[k] !== 'object') o[k] = {}; o = o[k]; }
  o[last] = val;
}

/* ---------- auth ---------- */
async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}), 'x-admin-key': S.key || '' };
  const r = await fetch(path, { ...opts, headers });
  let j = {}; try { j = await r.json(); } catch { /* ignore */ }
  if (!r.ok) throw Object.assign(new Error(j.error || `Hata ${r.status}`), { status: r.status });
  return j;
}

async function status() {
  try {
    const j = await (await fetch('/api/status', { cache: 'no-store' })).json();
    S.storage = j.storage;
    $('statusLine').textContent = `Sunucu: ${j.auth ? 'şifre tanımlı' : 'şifre tanımlı değil'}, Depolama: ${j.storage ? 'Vercel Blob bağlı' : 'bağlı değil'}`;
  } catch {
    $('statusLine').textContent = 'API bağlantısı yok (yerel mod)';
  }
}

async function login(pw) {
  S.key = pw;
  try {
    const j = await api('/api/login', { method: 'POST' });
    S.storage = j.storage;
    ss.set('td_admin_key', pw);
    await enter();
  } catch (e) {
    S.key = null; ss.del('td_admin_key');
    $('loginErr').textContent = e.message;
  }
}

async function enter() {
  $('loginView').hidden = true; $('appView').hidden = false;
  $('storageWarn').hidden = S.storage;
  await loadMenu();
}

async function loadMenu() {
  let m = null;
  try { const j = await (await fetch('/api/menu', { cache: 'no-store' })).json(); m = j.menu; } catch { /* ignore */ }
  if (!m) m = await (await fetch('/data/menu.json', { cache: 'no-cache' })).json();
  S.menu = m;
  S.menu.brand.images ||= { logo: '/assets/logo.webp', hero: '', banner: '' };
  setDirty(false);
  render();
}

async function save() {
  $('saveBtn').disabled = true; $('saveBtn').textContent = 'Kaydediliyor';
  try {
    await api('/api/menu', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(S.menu) });
    setDirty(false);
    toast('Kaydedildi. Menü güncellendi ✓');
  } catch (e) {
    if (e.status === 401) { toast('Oturum süresi doldu', true); logout(); return; }
    toast(e.message, true); setDirty(true);
  } finally { $('saveBtn').textContent = 'Kaydet'; }
}

function logout() { ss.del('td_admin_key'); S.key = null; location.reload(); }

/* ---------- render ---------- */
function render() {
  document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === S.tab)));
  document.querySelectorAll('.panel').forEach((p) => { p.hidden = p.id !== 'panel-' + S.tab; });
  ({ items: renderItems, cats: renderCats, images: renderImages, info: renderInfo, backup: renderBackup })[S.tab]();
}

const input = (path, label, { type = 'text', area = false, ph = '' } = {}) => {
  const v = getPath(S.menu, path) ?? '';
  return `<label class="field"><span>${esc(label)}</span>${area
    ? `<textarea data-path="${path}" placeholder="${esc(ph)}">${esc(v)}</textarea>`
    : `<input type="${type}" data-path="${path}" data-type="${type}" value="${esc(v)}" placeholder="${esc(ph)}" ${type === 'number' ? 'inputmode="numeric" min="0" step="1"' : ''}>`}</label>`;
};

function renderItems() {
  const cats = S.menu.categories;
  if (S.cat >= cats.length) S.cat = 0;
  const c = cats[S.cat];
  const base = `categories.${S.cat}.items`;
  $('panel-items').innerHTML = `
    <h2>Ürünler</h2>
    <p class="hint">Bir kategori seçin, ürüne dokunup düzenleyin. Fiyatlar Türk lirası (₺) cinsindendir.</p>
    <div class="catpick">${cats.map((x, i) => `<button type="button" data-cat="${i}" aria-pressed="${i === S.cat}">${esc(x.name)} (${x.items.length})</button>`).join('')}</div>
    ${c ? c.items.map((it, i) => `
      <details class="card" data-i="${i}" ${S.open === it.id ? 'open' : ''}>
        <summary><span class="nm">${esc(it.name || 'Adsız')}</span>${it.available === false ? '<span class="off">Tükendi</span>' : ''}<span class="pr">${esc(it.price)} ₺</span><span class="chev">›</span></summary>
        <div class="body">
          <div class="grid2">
            ${input(`${base}.${i}.name`, 'Ürün adı')}
            <div class="grid3">
              ${input(`${base}.${i}.price`, 'Fiyat ₺', { type: 'number' })}
              ${input(`${base}.${i}.kcal`, 'Kalori kcal', { type: 'number' })}
              <label class="field"><span>Tatlılık</span><select data-path="${base}.${i}.sweet" data-type="number">${[0, 1, 2, 3].map((n) => `<option value="${n}" ${Number(it.sweet) === n ? 'selected' : ''}>${n === 0 ? 'Yok' : n + ' / 3'}</option>`).join('')}</select></label>
            </div>
          </div>
          <div class="grid2">
            ${input(`${base}.${i}.desc`, 'Açıklama', { area: true })}
          </div>
          <div class="field"><span>Alerjenler</span>
            <div class="algpick">${ALLERGENS.map((a) => `<button type="button" data-alg="${a.key}" aria-pressed="${(it.allergens || []).includes(a.key)}">${allergenIcon(a.key, 26)}${esc(a.tr)}</button>`).join('')}</div>
          </div>
          <div class="field"><span>Etiketler</span>
            <div class="checks">${Object.entries(BADGES).map(([k, b]) => `<label><input type="checkbox" data-badge="${k}" ${(it.badges || []).includes(k) ? 'checked' : ''}>${esc(b)}</label>`).join('')}
              <label><input type="checkbox" data-avail ${it.available === false ? '' : 'checked'}>Mevcut</label></div>
          </div>
          <div class="field"><span>Kategori değiştir</span>
            <select data-move-cat>${cats.map((x, ci) => `<option value="${ci}" ${ci === S.cat ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
          </div>
          <div class="rowactions">
            <button type="button" class="btn ghost sm" data-act="up" ${i === 0 ? 'disabled' : ''}>↑ Yukarı</button>
            <button type="button" class="btn ghost sm" data-act="down" ${i === c.items.length - 1 ? 'disabled' : ''}>↓ Aşağı</button>
            <button type="button" class="btn ghost sm" data-act="dup">Kopyala</button>
            <button type="button" class="btn danger sm" data-act="del">Sil</button>
          </div>
        </div>
      </details>`).join('') : '<p>Önce bir kategori ekleyin.</p>'}
    ${c ? '<button type="button" class="addbtn" id="addItem">+ Yeni ürün ekle</button>' : ''}`;
}

function renderCats() {
  const cats = S.menu.categories;
  $('panel-cats').innerHTML = `
    <h2>Kategoriler</h2>
    <p class="hint">Kategori adı ve altındaki kısa slogan menüde başlığın altında görünür.</p>
    ${cats.map((c, i) => `
      <details class="card" data-ci="${i}" ${S.open === c.id ? 'open' : ''}>
        <summary><span class="nm">${esc(c.name)}</span><span class="pr">${c.items.length} ürün</span><span class="chev">›</span></summary>
        <div class="body">
          ${input(`categories.${i}.name`, 'Ürün adı')}
          <div class="grid2">
            ${input(`categories.${i}.note`, 'Kategori sloganı')}
          </div>
          <div class="rowactions">
            <button type="button" class="btn ghost sm" data-cact="up" ${i === 0 ? 'disabled' : ''}>↑ Yukarı</button>
            <button type="button" class="btn ghost sm" data-cact="down" ${i === cats.length - 1 ? 'disabled' : ''}>↓ Aşağı</button>
            <button type="button" class="btn danger sm" data-cact="del">Sil</button>
          </div>
        </div>
      </details>`).join('')}
    <button type="button" class="addbtn" id="addCat">+ Yeni kategori ekle</button>`;
}

const SLOTS = [
  { key: 'logo', title: 'Logo', hint: 'Üst çubukta ve kemerin içinde görünür. Şeffaf PNG veya SVG idealdir.' },
  { key: 'hero', title: 'Kapak görseli', hint: 'Kemerin içinde logonun yerine görünür. Dikey görseller en güzel durur.' },
  { key: 'banner', title: 'Kampanya bannerı', hint: 'Kapağın altında geniş kart olarak görünür. 16:7 oranlı görsel önerilir.' }
];

function renderImages() {
  const img = S.menu.brand.images;
  $('panel-images').innerHTML = `
    <h2>Görseller</h2>
    <p class="hint">Görsel otomatik olarak 1600 px sınırına küçültülür, WebP yapılır ve Vercel Blob alanına yüklenir. Sonra "Kaydet" düğmesine basın.</p>
    ${S.storage ? '' : '<p class="warn">Vercel Blob bağlı değilken görsel yüklenemez.</p>'}
    ${SLOTS.map((s) => `
      <div class="imgslot" data-slot="${s.key}">
        <div class="prev">${img[s.key] ? `<img src="${esc(img[s.key])}" alt="${esc(s.title)}">` : '<em>Görsel yok</em>'}</div>
        <div>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.hint)}</p>
          <div class="rowactions">
            <label class="btn gold sm" ${S.storage ? '' : 'aria-disabled="true"'}>Görsel seç<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" data-upload="${s.key}" ${S.storage ? '' : 'disabled'}></label>
            ${img[s.key] ? `<button type="button" class="btn danger sm" data-clear="${s.key}">Kaldır</button>` : ''}
            ${s.key === 'logo' && img.logo !== '/assets/logo.webp' ? '<button type="button" class="btn ghost sm" data-reset-logo>İlk logo</button>' : ''}
          </div>
        </div>
      </div>`).join('')}`;
}

function renderInfo() {
  const b = 'brand';
  $('panel-info').innerHTML = `
    <h2>Bilgiler</h2>
    <p class="hint">Slogan, duyuru ve iletişim bilgileri. Kelimeler arasında tire kullanmayın.</p>
    <div class="grid2">
      ${input(`${b}.slogan`, 'Slogan')}
      ${input(`${b}.tagline`, 'Alt slogan')}
      ${input(`${b}.notice`, 'Duyuru satırı')}
      ${input(`${b}.hours`, 'Çalışma saatleri')}
      ${input(`${b}.story`, 'Hikayemiz', { area: true })}
      ${input(`${b}.city`, 'Şehir')}${input(`${b}.address`, 'Adres')}
      ${input(`${b}.mapUrl`, 'Harita bağlantısı', { type: 'url' })}${input(`${b}.phone`, 'Telefon')}
      ${input(`${b}.instagram`, 'Instagram (@ olmadan)')}${input(`${b}.wifi`, 'Wi Fi adı')}
      <label class="field"><span>Ödeme yöntemleri (virgülle)</span><input type="text" data-list="brand.payments" value="${esc((S.menu.brand.payments || []).join(', '))}"></label>
    </div>`;
}

function renderBackup() {
  $('panel-backup').innerHTML = `
    <h2>Yedek</h2>
    <p class="hint">Menüyü JSON dosyası olarak indirin veya önceki bir dosyadan geri yükleyin.</p>
    <div class="rowactions">
      <button type="button" class="btn solid" id="exportBtn">JSON indir</button>
      <label class="btn ghost">JSON yükle<input type="file" accept="application/json" id="importFile" hidden></label>
      <button type="button" class="btn danger" id="resetBtn">İlk menüye dön</button>
    </div>
    <p class="hint" style="margin-top:16px">Sunucuda son 10 sürüm saklanır.</p>`;
}

/* ---------- image helpers ---------- */
async function toWebp(file) {
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return { blob: file, type: file.type };
  const bmp = await createImageBitmap(file);
  const max = 1600; const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * k); cv.height = Math.round(bmp.height * k);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  const blob = await new Promise((res) => cv.toBlob(res, 'image/webp', 0.86));
  if (blob && blob.type === 'image/webp') return { blob, type: 'image/webp' };
  const png = await new Promise((res) => cv.toBlob(res, 'image/png'));
  return { blob: png, type: 'image/png' };
}

async function upload(slot, file) {
  if (file.size > 15 * 1024 * 1024) return toast('Görsel çok büyük (en fazla 15 MB)', true);
  toast('Görsel yükleniyor');
  try {
    const { blob, type } = await toWebp(file);
    if (blob.size > 4 * 1024 * 1024) return toast('Küçültülse de 4 MB üstünde', true);
    const j = await api('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'x-file-type': type, 'x-slot': slot }, body: blob });
    S.menu.brand.images[slot] = j.url;
    setDirty(); renderImages();
    toast('Görsel yüklendi. "Kaydet" düğmesine basın');
  } catch (e) { toast(e.message, true); }
}

/* ---------- events ---------- */
function bind() {
  $('loginForm').addEventListener('submit', (e) => { e.preventDefault(); $('loginErr').textContent = ''; login($('pw').value); });
  $('saveBtn').addEventListener('click', save);
  $('logoutBtn').addEventListener('click', logout);
  document.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]'); if (!b) return;
    S.tab = b.dataset.tab; S.open = null; render();
  });
  window.addEventListener('beforeunload', (e) => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's' && S.dirty && S.storage) { e.preventDefault(); save(); } });

  const main = document.querySelector('main');
  main.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.path) {
      let v = el.value;
      if (el.dataset.type === 'number') v = v === '' ? 0 : Math.max(0, Number(v));
      setPath(S.menu, el.dataset.path, v);
      setDirty();
      const sum = el.closest('details')?.querySelector('summary');
      if (sum && /\.(name|price)$/.test(el.dataset.path)) {
        const d = el.closest('details');
        if (d.dataset.i != null) { const it = S.menu.categories[S.cat].items[d.dataset.i]; sum.querySelector('.nm').textContent = it.name || 'Adsız'; sum.querySelector('.pr').textContent = `${it.price} ₺`; } else sum.querySelector('.nm').textContent = el.value;
      }
    } else if (el.dataset.list) {
      setPath(S.menu, el.dataset.list, el.value.split(',').map((s) => s.trim()).filter(Boolean));
      setDirty();
    }
  });
  main.addEventListener('change', (e) => {
    const el = e.target;
    const d = el.closest('details[data-i]');
    if (el.dataset.path && el.tagName === 'SELECT') { setPath(S.menu, el.dataset.path, Number(el.value)); setDirty(); }
    if (d && el.matches('[data-badge]')) {
      const it = S.menu.categories[S.cat].items[d.dataset.i];
      const set = new Set(it.badges || []); el.checked ? set.add(el.dataset.badge) : set.delete(el.dataset.badge);
      it.badges = [...set]; setDirty();
    }
    if (d && el.matches('[data-avail]')) { S.menu.categories[S.cat].items[d.dataset.i].available = el.checked; setDirty(); renderItems(); }
    if (d && el.matches('[data-move-cat]')) {
      const to = Number(el.value); if (to === S.cat) return;
      const [it] = S.menu.categories[S.cat].items.splice(Number(d.dataset.i), 1);
      S.menu.categories[to].items.push(it); setDirty(); toast(`"${it.name}" taşındı`); renderItems();
    }
    if (el.matches('[data-upload]') && el.files[0]) upload(el.dataset.upload, el.files[0]);
    if (el.id === 'importFile' && el.files[0]) {
      el.files[0].text().then((txt) => {
        const m = JSON.parse(txt);
        if (!m.brand || !Array.isArray(m.categories)) throw new Error('Geçersiz dosya');
        S.menu = m; S.menu.brand.images ||= {}; setDirty(); toast('Dosya yüklendi. "Kaydet" düğmesine basın');
      }).catch((err) => toast(err.message, true));
    }
  });
  main.addEventListener('toggle', (e) => {
    const d = e.target; if (!(d instanceof HTMLDetailsElement)) return;
    if (d.open) {
      const id = d.dataset.i != null ? S.menu.categories[S.cat].items[d.dataset.i]?.id : S.menu.categories[d.dataset.ci]?.id;
      S.open = id;
    }
  }, true);
  main.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    const d = t.closest('details[data-i]');
    const items = S.menu.categories[S.cat]?.items;
    if (t.dataset.cat != null) { S.cat = Number(t.dataset.cat); S.open = null; renderItems(); return; }
    if (d && t.dataset.alg) {
      const it = items[d.dataset.i]; const set = new Set(it.allergens || []);
      set.has(t.dataset.alg) ? set.delete(t.dataset.alg) : set.add(t.dataset.alg);
      it.allergens = ALLERGENS.map((a) => a.key).filter((k) => set.has(k));
      t.setAttribute('aria-pressed', String(set.has(t.dataset.alg))); setDirty(); return;
    }
    if (d && t.dataset.act) {
      const i = Number(d.dataset.i);
      if (t.dataset.act === 'up' && i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]];
      if (t.dataset.act === 'down' && i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]];
      if (t.dataset.act === 'dup') { const cp = structuredClone(items[i]); cp.id = uid('i'); cp.name += ' 2'; items.splice(i + 1, 0, cp); S.open = cp.id; }
      if (t.dataset.act === 'del') { if (!confirm(`"${items[i].name}" silinsin mi?`)) return; items.splice(i, 1); }
      setDirty(); renderItems(); return;
    }
    if (t.id === 'addItem') {
      const it = { id: uid('i'), name: 'Yeni Tatlı', desc: '', price: 0, kcal: 0, sweet: 2, allergens: [], badges: [], available: true };
      items.push(it); S.open = it.id; setDirty(); renderItems();
      setTimeout(() => document.querySelector('details[open] input')?.focus(), 30); return;
    }
    const cd = t.closest('details[data-ci]');
    const cats = S.menu.categories;
    if (cd && t.dataset.cact) {
      const i = Number(cd.dataset.ci);
      if (t.dataset.cact === 'up' && i > 0) [cats[i - 1], cats[i]] = [cats[i], cats[i - 1]];
      if (t.dataset.cact === 'down' && i < cats.length - 1) [cats[i + 1], cats[i]] = [cats[i], cats[i + 1]];
      if (t.dataset.cact === 'del') {
        const n = cats[i].items.length;
        if (!confirm(n ? `"${cats[i].name}" kategorisi ve içindeki ${n} ürün silinecek. Emin misiniz?` : `"${cats[i].name}" silinsin mi?`)) return;
        cats.splice(i, 1); S.cat = 0;
      }
      setDirty(); renderCats(); return;
    }
    if (t.id === 'addCat') {
      const c = { id: uid('c'), name: 'Yeni Kategori', note: '', items: [] };
      cats.push(c); S.open = c.id; setDirty(); renderCats(); return;
    }
    if (t.dataset.clear) { S.menu.brand.images[t.dataset.clear] = ''; setDirty(); renderImages(); return; }
    if (t.hasAttribute('data-reset-logo')) { S.menu.brand.images.logo = '/assets/logo.webp'; setDirty(); renderImages(); return; }
    if (t.id === 'exportBtn') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(S.menu, null, 2)], { type: 'application/json' }));
      a.download = `tatli-duragi-menu-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000); return;
    }
    if (t.id === 'resetBtn') {
      if (!confirm('İlk menü yüklensin mi? Sunucuya yazmak için Kaydet düğmesine basmalısınız.')) return;
      fetch('/data/menu.json', { cache: 'no-cache' }).then((r) => r.json()).then((m) => { S.menu = m; setDirty(); toast('İlk menü yüklendi'); });
    }
  });
}

bind();
status();
if (S.key) {
  api('/api/login', { method: 'POST' }).then((j) => { S.storage = j.storage; enter(); }).catch(() => { ss.del('td_admin_key'); S.key = null; });
}
