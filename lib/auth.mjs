// Username/password sign-in for a small group. Accounts live in MISBAR_USERS as "name:salt:hash;…" (scrypt),
// created with: npm run add-user -- <name> <password>. Sessions are signed tokens (HMAC, 30 days).
import { scryptSync, randomBytes, createHmac, timingSafeEqual } from 'node:crypto';

const DAY = 86400000;
export const hashPassword = (password, salt = randomBytes(16).toString('hex')) => `${salt}:${scryptSync(password, salt, 32).toString('hex')}`;

function users() {
  const out = new Map();
  for (const entry of (process.env.MISBAR_USERS || '').split(/[;\n]/)) {
    const [name, salt, hash] = entry.trim().split(':');
    if (name && salt && hash) out.set(name.toLowerCase(), { name, salt, hash });
  }
  return out;
}
export const authRequired = () => users().size > 0;
// teachers can edit lesson content and use classroom tools; list them in MISBAR_TEACHERS (comma separated)
export const roleOf = (name) => ((process.env.MISBAR_TEACHERS || 'teacher,raeed').split(',').map((x) => x.trim().toLowerCase()).includes(String(name || '').toLowerCase()) ? 'teacher' : 'student');
const secret = () => process.env.MISBAR_SECRET || process.env.MISBAR_USERS || '';
const sign = (data) => createHmac('sha256', secret()).update(data).digest('base64url');

export function checkPassword(username, password) {
  const u = users().get(String(username || '').trim().toLowerCase());
  if (!u) { scryptSync(String(password), 'x'.repeat(32), 32); return null; } // same work either way
  const a = Buffer.from(scryptSync(String(password), u.salt, 32).toString('hex')), b = Buffer.from(u.hash);
  return a.length === b.length && timingSafeEqual(a, b) ? u.name : null;
}
export function issueToken(name) {
  const body = Buffer.from(JSON.stringify({ u: name, exp: Date.now() + 30 * DAY })).toString('base64url');
  return `${body}.${sign(body)}`;
}
export function verifyToken(token) {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) return null;
  const good = sign(body);
  if (sig.length !== good.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp > Date.now() && users().has(p.u.toLowerCase()) ? p.u : null; } catch { return null; }
}
export const userFromReq = (req) => verifyToken(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));

// slow down password guessing: 8 failed tries per address per 15 minutes
const fails = new Map();
async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = []; for await (const c of req) { chunks.push(c); if (chunks.length > 64) break; }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { return {}; }
}
export default async function loginHandler(req, res) {
  const send = (s, o) => { res.statusCode = s; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(o)); };
  if (req.method === 'GET') { const user = userFromReq(req); return send(200, { required: authRequired(), user, role: user ? roleOf(user) : null }); }
  if (req.method !== 'POST') return send(405, { error: { code: 'bad_request' } });
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local').split(',')[0].trim();
  const now = Date.now(), list = (fails.get(ip) || []).filter((t) => now - t < 15 * 60000);
  if (list.length >= 8) return send(429, { error: { code: 'rate_limited', message: 'Too many attempts' } });
  const { username, password } = await readJson(req);
  const name = checkPassword(username, password);
  if (!name) { list.push(now); fails.set(ip, list); return send(401, { error: { code: 'bad_login', message: 'Wrong username or password' } }); }
  fails.delete(ip);
  send(200, { token: issueToken(name), user: name, role: roleOf(name) });
}
