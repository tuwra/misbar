// Misbar AI endpoint. The browser never sees the API key: every model call goes through here.
// POST /api/ai  → streams NDJSON lines: {t:"text",text} … {t:"done",text,stop} | {t:"error",code,message}
// GET  /api/ai  → {configured, accessCode, model}
import Anthropic from '@anthropic-ai/sdk';
import { evaluate, format } from 'mathjs';
import { authRequired, userFromReq } from './auth.mjs';

// Provider: Gemini (free tier available) when GEMINI_API_KEY is set, otherwise Anthropic. AI_PROVIDER forces one.
const PROVIDER = process.env.AI_PROVIDER || (process.env.GEMINI_API_KEY ? 'gemini' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'gemini');
const KEY = PROVIDER === 'gemini' ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.MISBAR_MODEL || (PROVIDER === 'gemini' ? 'gemini-3.5-flash' : 'claude-opus-5-5');
// Claude as a second choice, only for the accounts in MISBAR_CLAUDE_USERS (default: raeed) and only when ANTHROPIC_API_KEY is set
const CLAUDE_MODEL = process.env.MISBAR_CLAUDE_MODEL || 'claude-opus-5-5';
const claudeFor = (user) => !!process.env.ANTHROPIC_API_KEY && !!user && (process.env.MISBAR_CLAUDE_USERS || 'raeed').split(',').map((x) => x.trim().toLowerCase()).includes(String(user).toLowerCase());
// Gemini only: when the main model's free quota runs out, switch to this one (larger free daily quota)
const FALLBACK_MODEL = process.env.MISBAR_FALLBACK_MODEL ?? (PROVIDER === 'gemini' ? 'gemini-3.5-flash-lite' : '');
const resting = new Map(); // model → time until which it is skipped after a quota error
const EFFORT = { quick: 'low', default: 'medium', complex: 'high' };
const ACCESS_CODE = process.env.MISBAR_ACCESS_CODE || '';
const RATE_LIMIT = +process.env.MISBAR_RATE_LIMIT || 60; // requests per visitor per 10 minutes
const MAX_ROUNDS = 8;
const MAX_TEXT = 700_000; // characters across all messages
const MAX_IMAGES = 6;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

let client = null;
const getClient = () => (client ||= new Anthropic());

const CALCULATE = {
  name: 'calculate',
  description: 'Evaluate a math.js expression exactly. Supports units (e.g. "5 m/s * 3 s", "to(72 km/h, m/s)"), sqrt, sin(30 deg), etc. Use it for every numeric step.',
  input_schema: { type: 'object', properties: { expression: { type: 'string' } }, required: ['expression'], additionalProperties: false },
  strict: true,
};
function runCalculate(input) {
  const expression = String(input?.expression ?? '');
  try { return { content: JSON.stringify({ expression, result: format(evaluate(expression), { precision: 10 }) }) }; }
  catch (e) { return { content: `math.js could not evaluate "${expression}": ${e.message}`, is_error: true }; }
}

// best-effort per-visitor limit; on serverless it resets with each cold start
const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter((t) => now - t < win);
  list.push(now); hits.set(ip, list);
  if (hits.size > 5000) for (const [k, v] of hits) if (now - v.at(-1) > win) hits.delete(k);
  return list.length > RATE_LIMIT;
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > 12 * 1024 * 1024) throw Object.assign(new Error('Request too large'), { code: 'too_large' }); chunks.push(c); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function validate(body) {
  const bad = (m) => Object.assign(new Error(m), { code: 'bad_request' });
  if (!Array.isArray(body.messages) || !body.messages.length || body.messages.length > 80) throw bad('messages must be a non-empty array');
  let total = String(body.system || '').length;
  const messages = body.messages.map((m) => {
    if (!['user', 'assistant'].includes(m?.role) || typeof m.content !== 'string' || !m.content) throw bad('each message needs role and text content');
    total += m.content.length;
    return { role: m.role, content: m.content };
  });
  if (messages[0].role !== 'user' || messages.at(-1).role !== 'user') throw bad('conversation must start and end with a user message');
  if (total > MAX_TEXT) throw Object.assign(new Error('Too much text in one request'), { code: 'too_large' });
  const images = Array.isArray(body.images) ? body.images : [];
  if (images.length > MAX_IMAGES) throw Object.assign(new Error(`At most ${MAX_IMAGES} images per request`), { code: 'too_large' });
  for (const im of images) if (!IMAGE_TYPES.has(im?.media_type) || typeof im.data !== 'string') throw bad('unsupported image');
  // merge consecutive same-role turns so the API always sees alternating roles
  const merged = [];
  for (const m of messages) { const last = merged.at(-1); if (last && last.role === m.role) last.content += '\n\n' + m.content; else merged.push({ ...m }); }
  return { messages: merged, images, system: String(body.system || ''), provider: body.provider === 'claude' ? 'claude' : '', tier: EFFORT[body.tier] ? body.tier : 'default', json: !!body.json, tools: !!body.tools };
}

function sendJson(res, status, obj) {
  res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj));
}

export default async function handler(req, res) {
  if (req.method === 'GET') return sendJson(res, 200, { configured: !!KEY, provider: PROVIDER, accessCode: !!ACCESS_CODE, codeOk: !ACCESS_CODE || req.headers['x-access-code'] === ACCESS_CODE, model: MODEL, claude: claudeFor(userFromReq(req)) });
  if (req.method !== 'POST') return sendJson(res, 405, { error: { code: 'bad_request', message: 'Use POST' } });
  let input;
  try { input = validate(await readBody(req)); }
  catch (e) { return sendJson(res, e.code === 'too_large' ? 413 : 400, { error: { code: e.code || 'bad_request', message: e.message } }); }
  const useClaude = input.provider === 'claude' || PROVIDER === 'anthropic';
  if (input.provider === 'claude' && !claudeFor(userFromReq(req))) return sendJson(res, 403, { error: { code: 'claude_denied', message: 'Claude is not enabled for this account' } });
  if (!useClaude && !KEY) return sendJson(res, 503, { error: { code: 'not_configured', message: `${PROVIDER === 'gemini' ? 'GEMINI_API_KEY' : 'ANTHROPIC_API_KEY'} is not set on the server` } });
  if (authRequired() && !userFromReq(req)) return sendJson(res, 401, { error: { code: 'login', message: 'Sign in first' } });
  if (ACCESS_CODE && req.headers['x-access-code'] !== ACCESS_CODE) return sendJson(res, 401, { error: { code: 'access_code', message: 'Access code required' } });
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'local').split(',')[0].trim();
  if (limited(ip)) return sendJson(res, 429, { error: { code: 'rate_limited', message: 'Too many requests, wait a few minutes' } });

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Accel-Buffering', 'no');
  const line = (o) => res.write(JSON.stringify(o) + '\n');
  const ac = new AbortController();
  res.on('close', () => { if (!res.writableEnded) ac.abort(); });

  const system = input.system + (input.json ? '\n\nYour final message will be machine-parsed: reply with exactly one JSON value and nothing else (no prose, no code fences).' : '');
  try {
    const { text, stop } = await (useClaude ? runAnthropic : runGemini)(input, system, line, ac.signal);
    line({ t: 'done', text, stop });
  } catch (e) {
    if (ac.signal.aborted) return res.end();
    let code = e.code || errorCode(e);
    if (code === 'not_configured' && input.provider === 'claude') code = 'claude_key';
    console.error('[misbar ai]', useClaude ? 'claude' : PROVIDER, code, e?.status, e?.message);
    line({ t: 'error', code, message: e?.message || String(e) });
  }
  res.end();
}

function errorCode(e) {
  if (e instanceof Anthropic.AuthenticationError) return 'not_configured';
  if (e instanceof Anthropic.RateLimitError) return 'rate_limited';
  if (e instanceof Anthropic.BadRequestError) return 'bad_request';
  return 'upstream';
}

async function runAnthropic(input, system, line, signal) {
  const messages = input.messages.map((m) => ({ ...m }));
  if (input.images.length) {
    const last = messages.at(-1);
    last.content = [...input.images.map((im) => ({ type: 'image', source: { type: 'base64', media_type: im.media_type, data: im.data } })), { type: 'text', text: last.content }];
  }
  let text = '', stop = null;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const stream = getClient().beta.messages.stream({
      model: PROVIDER === 'anthropic' ? MODEL : CLAUDE_MODEL,
      max_tokens: 32000,
      ...(system.trim() ? { system } : {}),
      messages,
      output_config: { effort: EFFORT[input.tier] },
      ...(input.tools ? { tools: [CALCULATE] } : {}),
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
    }, { signal });
    text = '';
    stream.on('text', (_delta, snapshot) => { text = snapshot; line({ t: 'text', text }); });
    const msg = await stream.finalMessage();
    stop = msg.stop_reason;
    if (stop === 'refusal') throw Object.assign(new Error('The request was declined'), { code: 'refusal' });
    if (stop !== 'tool_use') { text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join(''); break; }
    messages.push({ role: 'assistant', content: msg.content });
    messages.push({ role: 'user', content: msg.content.filter((b) => b.type === 'tool_use').map((b) => ({ type: 'tool_result', tool_use_id: b.id, ...(b.name === 'calculate' ? runCalculate(b.input) : { content: `Unknown tool ${b.name}`, is_error: true }) })) });
  }
  return { text, stop };
}

// Gemini REST (streamGenerateContent over SSE). No tool loop here: the page re-checks every number with math.js itself.
async function runGemini(input, system, line, signal) {
  const contents = input.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  if (input.images.length) contents.at(-1).parts.unshift(...input.images.map((im) => ({ inlineData: { mimeType: im.media_type, data: im.data } })));
  const calcHint = input.tools ? '\n\nCompute every number carefully step by step; the platform re-checks numeric results.' : '';
  const body = {
    contents,
    ...((system + calcHint).trim() ? { systemInstruction: { parts: [{ text: system + calcHint }] } } : {}),
    generationConfig: { maxOutputTokens: 32768, ...(input.json ? { responseMimeType: 'application/json' } : {}) },
  };
  // try the main model, then the fallback when the main one is out of quota
  const models = [MODEL, FALLBACK_MODEL].filter((m, i, a) => m && a.indexOf(m) === i);
  const usable = models.filter((m) => !(resting.get(m) > Date.now()));
  let res, lastErr;
  const tryList = usable.length ? usable : models;
  for (const model of tryList) {
    // a busy model can take a long time to refuse; give every model but the last 10 s to start answering
    const ac = new AbortController(), onAbort = () => ac.abort();
    signal?.addEventListener('abort', onAbort);
    const timer = model !== tryList.at(-1) ? setTimeout(() => ac.abort(), 10000) : null;
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, {
        method: 'POST', signal: ac.signal, headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY }, body: JSON.stringify(body),
      });
    } catch (e) {
      if (signal?.aborted) throw e;
      resting.set(model, Date.now() + 2 * 60 * 1000); console.warn('[misbar ai] slow, skipped:', model);
      lastErr = Object.assign(new Error('The AI model took too long to answer'), { code: 'upstream' }); res = null; continue;
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', onAbort); }
    if (res.ok) break;
    let msg = `Gemini HTTP ${res.status}`; try { msg = (await res.json()).error?.message || msg; } catch {}
    const code = res.status === 429 ? 'rate_limited' : res.status === 401 || res.status === 403 ? 'not_configured' : res.status === 400 ? 'bad_request' : 'upstream';
    lastErr = Object.assign(new Error(msg), { code, status: res.status });
    // a daily quota stays empty for hours; a per-minute one clears quickly
    // out of quota (429) or overloaded (500/503): rest this model and try the next one
    if (res.status === 429) { resting.set(model, Date.now() + (/per.?day|daily/i.test(msg) ? 60 : 1) * 60 * 1000); console.warn('[misbar ai] quota hit on', model); continue; }
    if (res.status === 503 || res.status === 500) { resting.set(model, Date.now() + 2 * 60 * 1000); console.warn('[misbar ai] overloaded:', model); continue; }
    throw lastErr;
  }
  if (!res?.ok) throw lastErr;
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = '', text = '', stop = null;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let k;
    while ((k = buf.indexOf('\n')) >= 0) {
      const ln = buf.slice(0, k).trim(); buf = buf.slice(k + 1);
      if (!ln.startsWith('data:')) continue;
      let chunk; try { chunk = JSON.parse(ln.slice(5)); } catch { continue; }
      if (chunk.promptFeedback?.blockReason) throw Object.assign(new Error('Blocked: ' + chunk.promptFeedback.blockReason), { code: 'refusal' });
      const cand = chunk.candidates?.[0];
      const add = (cand?.content?.parts || []).filter((p) => p.text && !p.thought).map((p) => p.text).join('');
      if (add) { text += add; line({ t: 'text', text }); }
      if (cand?.finishReason) stop = cand.finishReason;
    }
  }
  if (['SAFETY', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII', 'RECITATION'].includes(stop)) throw Object.assign(new Error('Blocked: ' + stop), { code: 'refusal' });
  return { text, stop: stop === 'MAX_TOKENS' ? 'max_tokens' : stop === 'STOP' ? 'end_turn' : stop };
}

export const _test = { validate, runCalculate, setClient: (c) => (client = c) };
