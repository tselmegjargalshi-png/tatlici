import { send, requireAuth, hasStore } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  if (!(await requireAuth(req, res))) return;
  send(res, 200, { ok: true, storage: hasStore() });
}
