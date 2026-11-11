import { createHash, timingSafeEqual } from 'node:crypto';

export const hasStore = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);
export const hasPassword = () => Boolean(process.env.ADMIN_PASSWORD);

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

const digest = (s) => createHash('sha256').update(String(s)).digest();

export function isAuthorized(req) {
  const expected = process.env.ADMIN_PASSWORD;
  const given = req.headers['x-admin-key'];
  if (!expected || !given) return false;
  return timingSafeEqual(digest(expected), digest(given));
}

export async function requireAuth(req, res) {
  if (!hasPassword()) {
    send(res, 503, { error: 'ADMIN_PASSWORD tanımlı değil' });
    return false;
  }
  if (!isAuthorized(req)) {
    await new Promise((r) => setTimeout(r, 600));
    send(res, 401, { error: 'Şifre yanlış' });
    return false;
  }
  return true;
}

export async function readRaw(req) {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return Buffer.concat(chunks);
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const raw = await readRaw(req);
  return JSON.parse(raw.toString('utf8') || '{}');
}
