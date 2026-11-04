// Read-aloud voice: POST /api/tts {text} → audio/wav spoken by a Gemini voice (default Orus, the narrator of the lesson video).
// Free-tier TTS quotas are small, so every reading is cached on disk by its text and each model is rested once its quota runs out.
import { createHash } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { authRequired, userFromReq } from './auth.mjs';

const KEY = process.env.GEMINI_API_KEY;
const VOICE = process.env.MISBAR_VOICE || 'Orus';
const MODELS = (process.env.MISBAR_TTS_MODELS || 'gemini-2.5-flash-preview-tts,gemini-3.1-flash-tts-preview,gemini-3.8-flash-tts,gemini-3.8-flash-lite-tts').split(',').map((m) => m.trim()).filter(Boolean);
const MAX_TEXT = 6000;
const CACHE = path.join(tmpdir(), 'misbar-tts');
mkdirSync(CACHE, { recursive: true });
const resting = new Map();
const busy = new Map(); // text hash → pending reading, so two listeners share one request

// the 3.8 voices read slowly unless told to keep a brisk pace
const BRISK = '[fast-paced, energetic teacher voice] Read this text quickly and fluently, like a fast native speaker, no pauses between words, without adding any words:';
const STYLE = {
  ar: 'اقرأ النص التالي بالعربية الفصحى بصوت معلم فيزياء ودود وواضح، بنبرة شرح حيوية وواثقة وبسرعة كلام طبيعية مثل معلم في الفصل، دون إضافة أي كلمة:',
  en: 'Read the following text aloud as a friendly, clear physics teacher, at a natural classroom pace, without adding any words:',
};

export const ttsHash = (text) => createHash('sha1').update(text).digest('hex');

// raw 24 kHz 16-bit mono PCM → WAV (newer models already send WAV)
function wav(raw, mime) {
  if (/wav/.test(mime)) return raw;
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + raw.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(24000, 24); h.writeUInt32LE(48000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(raw.length, 40);
  return Buffer.concat([h, raw]);
}

export async function speak(text, lang = 'ar', { key = KEY, models = MODELS, voice = VOICE } = {}) {
  const body = (model) => JSON.stringify({ contents: [{ parts: [{ text: (/3\.8/.test(model) ? BRISK : STYLE[lang] || STYLE.ar) + '\n\n' + text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } });
  let last = Object.assign(new Error('No voice model available'), { code: 'rate_limited' });
  const usable = models.filter((m) => !(resting.get(m) > Date.now()));
  for (const model of usable.length ? usable : models) {
    let r, d, part;
    // an answer without audio happens now and then; ask the same model once more before moving on
    for (let k = 0; k < 2 && !part; k++) {
      r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: body(model) });
      d = await r.json().catch(() => ({}));
      part = d.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      if (!r.ok) break;
    }
    if (part) return wav(Buffer.from(part.inlineData.data, 'base64'), part.inlineData.mimeType);
    if (r.ok) continue;
    const msg = d.error?.message || `TTS HTTP ${r.status}`;
    last = Object.assign(new Error(msg), { code: r.status === 429 ? 'rate_limited' : 'upstream' });
    console.warn('[misbar tts]', model, r.status, msg.slice(0, 160));
    resting.set(model, Date.now() + (r.status === 429 ? (/per.?day|daily/i.test(msg) ? 60 : 1) : 2) * 60 * 1000);
  }
  throw last;
}

const send = (res, status, obj) => { res.statusCode = status; res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); };

export default async function ttsHandler(req, res) {
  if (req.method === 'GET') return send(res, 200, { configured: !!KEY, voice: VOICE });
  if (req.method !== 'POST') return send(res, 405, { error: { code: 'bad_request' } });
  if (!KEY) return send(res, 503, { error: { code: 'not_configured' } });
  if (authRequired() && !userFromReq(req)) return send(res, 401, { error: { code: 'login' } });
  const chunks = []; for await (const c of req) chunks.push(c);
  let text = '', lang = 'ar';
  try { ({ text = '', lang = 'ar' } = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch {}
  text = String(text).trim();
  if (!text || text.length > MAX_TEXT) return send(res, 400, { error: { code: 'bad_request', message: 'text must be 1–6000 characters' } });
  const id = ttsHash(text), file = path.join(CACHE, id + '.wav');
  try {
    if (!existsSync(file)) {
      if (!busy.has(id)) busy.set(id, speak(text, lang === 'en' ? 'en' : 'ar').then((buf) => writeFileSync(file, buf)).finally(() => busy.delete(id)));
      await busy.get(id);
    }
    const buf = readFileSync(file);
    res.statusCode = 200; res.setHeader('Content-Type', 'audio/wav'); res.setHeader('Content-Length', buf.length); res.setHeader('Cache-Control', 'private, max-age=86400'); res.end(buf);
  } catch (e) { send(res, e.code === 'rate_limited' ? 429 : 502, { error: { code: e.code || 'upstream', message: e.message } }); }
}
