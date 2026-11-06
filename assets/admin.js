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
  st.textContent = v ? 'Хадгалаагүй өөрчлөлт байна' : 'Хадгалагдсан';
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
  if (!r.ok) throw Object.assign(new Error(j.error || `Алдаа ${r.status}`), { status: r.status });
  return j;
}

async function status() {
  try {
    const j = await (await fetch('/api/status', { cache: 'no-store' })).json();
    S.storage = j.storage;
    $('statusLine').textContent = `Сервер: ${j.auth ? 'нууц үг тохируулсан' : 'нууц үг тохируулаагүй'} · Хадгалалт: ${j.storage ? 'Vercel Blob холбогдсон' : 'холбогдоогүй'}`;
  } catch {
    $('statusLine').textContent = 'API холбогдсонгүй (локал горим)';
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
  $('saveBtn').disabled = true; $('saveBtn').textContent = 'Хадгалж байна';
  try {
    await api('/api/menu', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(S.menu) });
    setDirty(false);
    toast('Хадгаллаа. Меню шинэчлэгдлээ ✓');
  } catch (e) {
    if (e.status === 401) { toast('Нэвтрэх хугацаа дууссан', true); logout(); return; }
    toast(e.message, true); setDirty(true);
  } finally { $('saveBtn').textContent = 'Хадгалах'; }
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
    <h2>Бүтээгдэхүүн</h2>
    <p class="hint">Ангилал сонгоод бүтээгдэхүүн дээр дарж нээн засна. Нэр, үнэ Турк хэлээр, тайлбар хоёр хэлээр.</p>
    <div class="catpick">${cats.map((x, i) => `<button type="button" data-cat="${i}" aria-pressed="${i === S.cat}">${esc(x.name)} (${x.items.length})</button>`).join('')}</div>
    ${c ? c.items.map((it, i) => `
      <details class="card" data-i="${i}" ${S.open === it.id ? 'open' : ''}>
        <summary><span class="nm">${esc(it.name || 'Нэргүй')}</span>${it.available === false ? '<span class="off">Дууссан</span>' : ''}<span class="pr">${esc(it.price)} ₺</span><span class="chev">›</span></summary>
        <div class="body">
          <div class="grid2">
            ${input(`${base}.${i}.name`, 'Нэр (Турк)')}
            <div class="grid3">
              ${input(`${base}.${i}.price`, 'Үнэ ₺', { type: 'number' })}
              ${input(`${base}.${i}.kcal`, 'Калори kcal', { type: 'number' })}
              <label class="field"><span>Чихэрлэг</span><select data-path="${base}.${i}.sweet" data-type="number">${[0, 1, 2, 3].map((n) => `<option value="${n}" ${Number(it.sweet) === n ? 'selected' : ''}>${n === 0 ? 'Үгүй' : n + ' / 3'}</option>`).join('')}</select></label>
            </div>
          </div>
          <div class="grid2">
            ${input(`${base}.${i}.desc.mn`, 'Тайлбар (Монгол)', { area: true })}
            ${input(`${base}.${i}.desc.tr`, 'Тайлбар (Турк)', { area: true })}
          </div>
          <div class="field"><span>Харшил үүсгэгч</span>
            <div class="algpick">${ALLERGENS.map((a) => `<button type="button" data-alg="${a.key}" aria-pressed="${(it.allergens || []).includes(a.key)}">${allergenIcon(a.key, 26)}${esc(a.mn)}</button>`).join('')}</div>
          </div>
          <div class="field"><span>Тэмдэг</span>
            <div class="checks">${Object.entries(BADGES).map(([k, b]) => `<label><input type="checkbox" data-badge="${k}" ${(it.badges || []).includes(k) ? 'checked' : ''}>${esc(b.mn)}</label>`).join('')}
              <label><input type="checkbox" data-avail ${it.available === false ? '' : 'checked'}>Байгаа</label></div>
          </div>
          <div class="field"><span>Ангилал солих</span>
            <select data-move-cat>${cats.map((x, ci) => `<option value="${ci}" ${ci === S.cat ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
          </div>
          <div class="rowactions">
            <button type="button" class="btn ghost sm" data-act="up" ${i === 0 ? 'disabled' : ''}>↑ Дээш</button>
            <button type="button" class="btn ghost sm" data-act="down" ${i === c.items.length - 1 ? 'disabled' : ''}>↓ Доош</button>
            <button type="button" class="btn ghost sm" data-act="dup">Хуулбарлах</button>
            <button type="button" class="btn danger sm" data-act="del">Устгах</button>
          </div>
        </div>
      </details>`).join('') : '<p>Эхлээд ангилал нэмнэ үү.</p>'}
    ${c ? '<button type="button" class="addbtn" id="addItem">+ Шинэ бүтээгдэхүүн нэмэх</button>' : ''}`;
}

function renderCats() {
  const cats = S.menu.categories;
  $('panel-cats').innerHTML = `
    <h2>Ангилал</h2>
    <p class="hint">Ангиллын нэр Турк хэлээр. Доорх жижиг бичвэр нь меню дээр гарчгийн доор гарна.</p>
    ${cats.map((c, i) => `
      <details class="card" data-ci="${i}" ${S.open === c.id ? 'open' : ''}>
        <summary><span class="nm">${esc(c.name)}</span><span class="pr">${c.items.length} бүтээгдэхүүн</span><span class="chev">›</span></summary>
        <div class="body">
          ${input(`categories.${i}.name`, 'Нэр (Турк)')}
          <div class="grid2">
            ${input(`categories.${i}.note.mn`, 'Уриа (Монгол)')}
            ${input(`categories.${i}.note.tr`, 'Уриа (Турк)')}
          </div>
          <div class="rowactions">
            <button type="button" class="btn ghost sm" data-cact="up" ${i === 0 ? 'disabled' : ''}>↑ Дээш</button>
            <button type="button" class="btn ghost sm" data-cact="down" ${i === cats.length - 1 ? 'disabled' : ''}>↓ Доош</button>
            <button type="button" class="btn danger sm" data-cact="del">Устгах</button>
          </div>
        </div>
      </details>`).join('')}
    <button type="button" class="addbtn" id="addCat">+ Шинэ ангилал нэмэх</button>`;
}

const SLOTS = [
  { key: 'logo', title: 'Лого', hint: 'Толгой хэсэг болон нуман хаалганд гарна. Тунгалаг PNG эсвэл SVG тохиромжтой.' },
  { key: 'hero', title: 'Нүүр зураг', hint: 'Нуман хаалганы дотор лого оронд гарна. Босоо зураг хамгийн гоё харагдана.' },
  { key: 'banner', title: 'Баннер / Урамшуулал', hint: 'Нүүрний доор өргөн карт болж гарна. 16:7 харьцаатай зураг.' }
];

function renderImages() {
  const img = S.menu.brand.images;
  $('panel-images').innerHTML = `
    <h2>Зураг</h2>
    <p class="hint">Зургийг автоматаар 1600px хүртэл багасгаж WebP болгоод Vercel Blob руу илгээнэ. Дараа нь "Хадгалах" дарна уу.</p>
    ${S.storage ? '' : '<p class="warn">Vercel Blob холбогдоогүй үед зураг илгээх боломжгүй.</p>'}
    ${SLOTS.map((s) => `
      <div class="imgslot" data-slot="${s.key}">
        <div class="prev">${img[s.key] ? `<img src="${esc(img[s.key])}" alt="${esc(s.title)}">` : '<em>Зураггүй</em>'}</div>
        <div>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.hint)}</p>
          <div class="rowactions">
            <label class="btn gold sm" ${S.storage ? '' : 'aria-disabled="true"'}>Зураг сонгох<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" data-upload="${s.key}" ${S.storage ? '' : 'disabled'}></label>
            ${img[s.key] ? `<button type="button" class="btn danger sm" data-clear="${s.key}">Арилгах</button>` : ''}
            ${s.key === 'logo' && img.logo !== '/assets/logo.webp' ? '<button type="button" class="btn ghost sm" data-reset-logo>Анхны лого</button>' : ''}
          </div>
        </div>
      </div>`).join('')}`;
}

function renderInfo() {
  const b = 'brand';
  $('panel-info').innerHTML = `
    <h2>Мэдээлэл</h2>
    <p class="hint">Уриа, мэдэгдэл, холбоо барих мэдээлэл. Үгийн хооронд зураас бүү ашиглаарай.</p>
    <div class="grid2">
      ${input(`${b}.slogan.mn`, 'Уриа (Монгол)')}${input(`${b}.slogan.tr`, 'Уриа (Турк)')}
      ${input(`${b}.tagline.mn`, 'Дэд уриа (Монгол)')}${input(`${b}.tagline.tr`, 'Дэд уриа (Турк)')}
      ${input(`${b}.notice.mn`, 'Мэдэгдлийн мөр (Монгол)')}${input(`${b}.notice.tr`, 'Мэдэгдлийн мөр (Турк)')}
      ${input(`${b}.hours.mn`, 'Ажлын цаг (Монгол)')}${input(`${b}.hours.tr`, 'Ажлын цаг (Турк)')}
      ${input(`${b}.story.mn`, 'Бидний түүх (Монгол)', { area: true })}${input(`${b}.story.tr`, 'Бидний түүх (Турк)', { area: true })}
      ${input(`${b}.city`, 'Хот')}${input(`${b}.address`, 'Хаяг')}
      ${input(`${b}.mapUrl`, 'Газрын зургийн холбоос', { type: 'url' })}${input(`${b}.phone`, 'Утас')}
      ${input(`${b}.instagram`, 'Instagram (@ гүй)')}${input(`${b}.wifi`, 'Wi Fi нэр')}
      <label class="field"><span>Төлбөрийн хэлбэр (таслалаар)</span><input type="text" data-list="brand.payments" value="${esc((S.menu.brand.payments || []).join(', '))}"></label>
    </div>`;
}

function renderBackup() {
  $('panel-backup').innerHTML = `
    <h2>Нөөц</h2>
    <p class="hint">Менюгээ JSON файлаар татаж хадгалах, эсвэл өмнөх файлаас сэргээх.</p>
    <div class="rowactions">
      <button type="button" class="btn solid" id="exportBtn">JSON татах</button>
      <label class="btn ghost">JSON оруулах<input type="file" accept="application/json" id="importFile" hidden></label>
      <button type="button" class="btn danger" id="resetBtn">Анхны меню руу буцаах</button>
    </div>
    <p class="hint" style="margin-top:16px">Сервер дээр сүүлийн 10 хувилбар хадгалагдана.</p>`;
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
  if (file.size > 15 * 1024 * 1024) return toast('Зураг хэт том байна (15MB аас бага)', true);
  toast('Зураг илгээж байна');
  try {
    const { blob, type } = await toWebp(file);
    if (blob.size > 4 * 1024 * 1024) return toast('Багасгасан ч 4MB аас их байна', true);
    const j = await api('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'x-file-type': type, 'x-slot': slot }, body: blob });
    S.menu.brand.images[slot] = j.url;
    setDirty(); renderImages();
    toast('Зураг орлоо. "Хадгалах" дарна уу');
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
        if (d.dataset.i != null) { const it = S.menu.categories[S.cat].items[d.dataset.i]; sum.querySelector('.nm').textContent = it.name || 'Нэргүй'; sum.querySelector('.pr').textContent = `${it.price} ₺`; } else sum.querySelector('.nm').textContent = el.value;
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
      S.menu.categories[to].items.push(it); setDirty(); toast(`"${it.name}" шилжлээ`); renderItems();
    }
    if (el.matches('[data-upload]') && el.files[0]) upload(el.dataset.upload, el.files[0]);
    if (el.id === 'importFile' && el.files[0]) {
      el.files[0].text().then((txt) => {
        const m = JSON.parse(txt);
        if (!m.brand || !Array.isArray(m.categories)) throw new Error('Буруу файл');
        S.menu = m; S.menu.brand.images ||= {}; setDirty(); toast('Файл ачааллаа. "Хадгалах" дарна уу');
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
      if (t.dataset.act === 'del') { if (!confirm(`"${items[i].name}" устгах уу?`)) return; items.splice(i, 1); }
      setDirty(); renderItems(); return;
    }
    if (t.id === 'addItem') {
      const it = { id: uid('i'), name: 'Yeni Tatlı', desc: { mn: '', tr: '' }, price: 0, kcal: 0, sweet: 2, allergens: [], badges: [], available: true };
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
        if (!confirm(n ? `"${cats[i].name}" ангилал ба доторх ${n} бүтээгдэхүүн устна. Итгэлтэй юу?` : `"${cats[i].name}" устгах уу?`)) return;
        cats.splice(i, 1); S.cat = 0;
      }
      setDirty(); renderCats(); return;
    }
    if (t.id === 'addCat') {
      const c = { id: uid('c'), name: 'Yeni Kategori', note: { mn: '', tr: '' }, items: [] };
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
      if (!confirm('Анхны меню ачаалах уу? Хадгалах дарж байж серверт орно.')) return;
      fetch('/data/menu.json', { cache: 'no-cache' }).then((r) => r.json()).then((m) => { S.menu = m; setDirty(); toast('Анхны меню ачааллаа'); });
    }
  });
}

bind();
status();
if (S.key) {
  api('/api/login', { method: 'POST' }).then((j) => { S.storage = j.storage; enter(); }).catch(() => { ss.del('td_admin_key'); S.key = null; });
}
