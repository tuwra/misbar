// Arabic narration with Gemini TTS: node tts.mjs <voice> <out.wav> <text>
import { writeFileSync } from 'node:fs';
const [voice, out, text] = process.argv.slice(2), model = process.env.TTS_MODEL || 'gemini-3.8-flash-tts';
const prompt = 'اقرأ النص التالي بالعربية الفصحى بصوت معلم فيزياء ودود وواضح، بنبرة شرح حيوية وواثقة وبسرعة كلام طبيعية مثل معلم في الفصل، دون إضافة أي كلمة:\n\n' + text;
const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } };
for (let attempt = 1; ; attempt++) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY }, body: JSON.stringify(body) });
  const d = await r.json();
  const part = d.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) { if (attempt < 4) { await new Promise((s) => setTimeout(s, 4000 * attempt)); continue; } console.error(JSON.stringify(d).slice(0, 400)); process.exit(1); }
  const raw = Buffer.from(part.inlineData.data, 'base64');
  // newer models already return a WAV file; older ones return raw 24 kHz PCM
  if (/wav/.test(part.inlineData.mimeType)) { writeFileSync(out, raw); console.log(out, 'wav'); break; }
  const pcm = raw, h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(24000, 24); h.writeUInt32LE(48000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  writeFileSync(out, Buffer.concat([h, pcm])); console.log(out, (pcm.length / 48000).toFixed(2), part.inlineData.mimeType); break;
}
