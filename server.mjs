// Local server: serves public/ and the AI endpoint. Run: npm start (reads .env if present).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
if (existsSync(path.join(here, '.env'))) {
  for (const raw of readFileSync(path.join(here, '.env'), 'utf8').split('\n')) {
    const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const { default: aiHandler } = await import('./lib/ai-handler.mjs');
const { default: loginHandler } = await import('./lib/auth.mjs');
const root = path.join(here, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/ai') return aiHandler(req, res);
  if (url.pathname === '/api/login') return loginHandler(req, res);
  let file = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
  if (!file.startsWith(root)) { res.statusCode = 403; return res.end(); }
  try { if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html'); res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream'); res.end(await readFile(file)); }
  catch { res.statusCode = 404; res.end('Not found'); }
}).listen(+process.env.PORT || 3000, () => console.log(`Misbar running at http://localhost:${+process.env.PORT || 3000}`));
