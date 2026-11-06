import { list, put, del } from '@vercel/blob';
import { send, requireAuth, hasStore, readJson } from './_lib.js';

const PREFIX = 'menu/';
const KEEP = 10;

async function latestBlobs() {
  const { blobs } = await list({ prefix: PREFIX, limit: 1000 });
  return blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
}

function validate(menu) {
  if (!menu || typeof menu !== 'object') return 'Буруу формат';
  if (!menu.brand || typeof menu.brand !== 'object') return 'brand хэсэг алга';
  if (!Array.isArray(menu.categories)) return 'categories массив биш';
  for (const c of menu.categories) {
    if (!c.id || !c.name || !Array.isArray(c.items)) return 'Ангилал буруу: ' + (c.name || c.id);
    for (const i of c.items) {
      if (!i.id || !i.name) return 'Бүтээгдэхүүн нэргүй байна';
      if (typeof i.price !== 'number' || i.price < 0) return 'Үнэ буруу: ' + i.name;
    }
  }
  return null;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      if (!hasStore()) return send(res, 200, { source: 'default', menu: null });
      const blobs = await latestBlobs();
      if (!blobs.length) return send(res, 200, { source: 'default', menu: null });
      const r = await fetch(blobs[0].url, { cache: 'no-store' });
      if (!r.ok) return send(res, 200, { source: 'default', menu: null });
      const menu = await r.json();
      return send(res, 200, { source: 'blob', updatedAt: blobs[0].uploadedAt, menu });
    }

    if (req.method === 'PUT') {
      if (!(await requireAuth(req, res))) return;
      if (!hasStore()) return send(res, 503, { error: 'Vercel Blob холбогдоогүй байна' });
      const menu = await readJson(req);
      const problem = validate(menu);
      if (problem) return send(res, 400, { error: problem });
      const body = JSON.stringify(menu);
      if (body.length > 1_000_000) return send(res, 413, { error: 'Меню хэт том байна' });
      const blob = await put(`${PREFIX}menu-${Date.now()}.json`, body, {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: true,
        cacheControlMaxAge: 60,
      });
      const all = await latestBlobs();
      const old = all.slice(KEEP).map((b) => b.url);
      if (old.length) await del(old).catch(() => {});
      return send(res, 200, { ok: true, url: blob.url, updatedAt: new Date().toISOString() });
    }

    send(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: 'Серверийн алдаа', detail: String(err.message || err) });
  }
}
