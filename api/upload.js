import { put } from '@vercel/blob';
import { send, requireAuth, hasStore, readRaw } from './_lib.js';

const TYPES = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg', 'image/gif': 'gif' };
const MAX = 4 * 1024 * 1024;

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
    if (!(await requireAuth(req, res))) return;
    if (!hasStore()) return send(res, 503, { error: 'Vercel Blob bağlı değil' });
    const type = String(req.headers['x-file-type'] || '');
    const ext = TYPES[type];
    if (!ext) return send(res, 415, { error: 'Yalnızca webp, png, jpg, svg, gif görselleri' });
    const slot = String(req.headers['x-slot'] || 'image').replace(/[^a-z0-9]/gi, '').slice(0, 20) || 'image';
    const data = await readRaw(req);
    if (!data.length) return send(res, 400, { error: 'Dosya boş' });
    if (data.length > MAX) return send(res, 413, { error: 'Görsel 4 MB üstünde' });
    const blob = await put(`images/${slot}-${Date.now()}.${ext}`, data, {
      access: 'public',
      contentType: type,
      addRandomSuffix: true,
    });
    send(res, 200, { ok: true, url: blob.url });
  } catch (err) {
    console.error(err);
    send(res, 500, { error: 'Sunucu hatası', detail: String(err.message || err) });
  }
}
