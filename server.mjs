// Local server: serves public/ and the AI endpoint. Run: npm start (reads .env if present).
import http from 'node:http';
import { stat } from 'node:fs/promises';
import { createReadStream, existsSync, readFileSync } from 'node:fs';
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
const { default: ttsHandler } = await import('./lib/tts.mjs');
const root = path.join(here, 'public');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp4': 'video/mp4', '.m4a': 'audio/mp4', '.vtt': 'text/vtt; charset=utf-8' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/ai') return aiHandler(req, res);
  if (url.pathname === '/api/login') return loginHandler(req, res);
  if (url.pathname === '/api/tts') return ttsHandler(req, res);
  let file = path.normalize(path.join(root, decodeURIComponent(url.pathname)));
  if (!file.startsWith(root)) { res.statusCode = 403; return res.end(); }
  try {
    let st = await stat(file);
    if (st.isDirectory()) { file = path.join(file, 'index.html'); st = await stat(file); }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Accept-Ranges', 'bytes');
    // video players (Safari above all) need byte ranges to play and seek
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m && (m[1] || m[2])) {
      const start = m[1] ? +m[1] : Math.max(0, st.size - +m[2]), end = m[1] && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
      if (start > end || start >= st.size) { res.statusCode = 416; res.setHeader('Content-Range', `bytes */${st.size}`); return res.end(); }
      res.statusCode = 206; res.setHeader('Content-Range', `bytes ${start}-${end}/${st.size}`); res.setHeader('Content-Length', end - start + 1);
      return createReadStream(file, { start, end }).pipe(res);
    }
    res.setHeader('Content-Length', st.size);
    createReadStream(file).pipe(res);
  } catch { res.statusCode = 404; res.end('Not found'); }
}).listen(+process.env.PORT || 3000, () => console.log(`Misbar running at http://localhost:${+process.env.PORT || 3000}`));
