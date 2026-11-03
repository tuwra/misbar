// Transcribe a wav with Gemini to check what the narration actually says: node stt.mjs <file.wav>
import { readFileSync } from 'node:fs';
const data = readFileSync(process.argv[2]).toString('base64');
const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
  body: JSON.stringify({ contents: [{ parts: [{ inlineData: { mimeType: 'audio/wav', data } }, { text: 'Transcribe this Arabic audio verbatim, nothing else.' }] }] }) });
const d = await r.json(); console.log(d.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || JSON.stringify(d).slice(0, 300));
