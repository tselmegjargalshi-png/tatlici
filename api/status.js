import { send, hasStore, hasPassword } from './_lib.js';

export default function handler(req, res) {
  send(res, 200, { storage: hasStore(), auth: hasPassword() });
}
