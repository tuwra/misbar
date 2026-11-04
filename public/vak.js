/* Misbar learning styles: one lesson, three ways in. Visual (video, 3D, map), auditory (read-aloud, narrated video), kinesthetic (drag-and-sort, lab, 3D sliders). */
(function () {
  const { $, $$, esc, t, uid, ai } = NL;
  NL.addT({
    tab_styles: ['أنماط التعلم', 'Learning styles'], tab_video: ['فيديو الدرس', 'Lesson video'], tab_listen: ['استمع للدرس', 'Listen'], tab_sort: ['نشاط السحب والإفلات', 'Drag and sort'],
    listenThis: ['استمع', 'Listen'], voiceWait: ['جارٍ تجهيز الصوت…', 'Preparing the voice…'], voiceFallback: ['الصوت الطبيعي غير متاح الآن، تُستخدم قراءة الجهاز.', 'The natural voice is not available right now; using the device voice.'], listenStop: ['أوقف القراءة', 'Stop reading'],
    noVoice: ['لا يوجد صوت عربي مثبّت في هذا الجهاز أو المتصفح. جرّب Chrome أو Safari، أو شاهد فيديو الدرس المسموع.', 'No voice for this language is installed on this device or browser. Try Chrome or Safari, or watch the narrated lesson video.'],
    // styles hub
    stLead: ['كل طالب يتعلم بطريقة مختلفة. اختر المدخل الذي يناسبك، أو اكتشف نمطك بالاستبانة القصيرة.', 'Everyone learns differently. Pick the way in that suits you, or discover your style with the short survey.'],
    st_v: ['بصري', 'Visual'], st_a: ['سمعي', 'Auditory'], st_k: ['حركي', 'Kinesthetic'],
    st_vS: ['تتعلم بالمشاهدة: الصور والمجسمات والمخططات.', 'You learn by seeing: pictures, models and diagrams.'],
    st_aS: ['تتعلم بالاستماع: الشرح المسموع والنقاش.', 'You learn by listening: spoken explanations and discussion.'],
    st_kS: ['تتعلم بالتجربة: الحركة واللمس والتحكم بالمتغيرات.', 'You learn by doing: moving, touching and changing variables.'],
    vakTitle: ['اكتشف نمط تعلمك', 'Discover your learning style'], vakLead: ['١٠ أسئلة قصيرة. لا توجد إجابة صحيحة أو خاطئة؛ اختر الأقرب لك.', '10 short questions. There are no right or wrong answers; pick what fits you best.'],
    vakGo: ['أظهر النتيجة', 'Show my result'], vakRedo: ['أعد الاستبانة', 'Retake the survey'], vakNeed: ['أجب عن كل الأسئلة أولًا ({n} متبقية).', 'Answer every question first ({n} left).'],
    vakRes: ['نمطك الغالب: {s}', 'Your main style: {s}'], vakMix: ['لديك مزيج متوازن، فاستفد من الأنماط الثلاثة.', 'You have a balanced mix, so use all three.'],
    vakPath: ['مسار مقترح لهذا الدرس', 'Suggested path for this lesson'], vakPathS: ['يبدأ بنمطك، ويمر بالأنماط الثلاثة ليثبت الفهم.', 'It starts with your style and passes through all three to lock in understanding.'],
    // video
    vidLead: ['شاهد واستمع: شرح مصوّر بالمجسمات ثلاثية الأبعاد مع تعليق صوتي وترجمة مكتوبة.', 'Watch and listen: a 3D animated explanation with narration and captions.'],
    chapters: ['الفصول', 'Chapters'], afterWatch: ['بعد المشاهدة', 'After watching'], tryIn3d: ['تحكّم بالمجسم بنفسك', 'Control the model yourself'], trySort: ['صنّف بالسحب والإفلات', 'Drag and sort'], tryQuiz: ['اختبر نفسك', 'Test yourself'],
    addVideo: ['أضف فيديو', 'Add a video'], vidTitle: ['عنوان الفيديو', 'Video title'], vidUrl: ['رابط يوتيوب أو رابط ملف MP4', 'YouTube link or MP4 link'], vidBad: ['الرابط غير مدعوم. استخدم رابط يوتيوب أو رابط ملف MP4 مباشر.', 'Unsupported link. Use a YouTube link or a direct MP4 link.'],
    vidLocal: ['الفيديوهات المضافة تُحفظ في هذا الجهاز فقط، فاعرضها من الجهاز الذي أضفتها منه.', 'Added videos are saved on this device only, so present them from the device you added them on.'],
    noVideo: ['لا يوجد فيديو لهذا الدرس بعد.', 'This lesson has no video yet.'], remove: ['احذف', 'Remove'], save: ['احفظ', 'Save'], cancel: ['إلغاء', 'Cancel'],
    // listen
    lsLead: ['استمع لشرح كل جزء بصوت مسموع، وتابع النص المقروء وهو يُظلَّل أمامك.', 'Listen to each part read aloud, and follow the highlighted text as it is read.'],
    lsPlay: ['تشغيل', 'Play'], lsPause: ['إيقاف مؤقت', 'Pause'], lsSpeed: ['السرعة', 'Speed'], lsSummary: ['الملخص', 'Summary'], lsAll: ['استمع للدرس كاملًا', 'Listen to the whole lesson'],
    // sort
    soLead: ['اسحب كل بطاقة إلى المكان الصحيح بيدك، أو اضغط البطاقة ثم اضغط المكان. تعلّم بالحركة.', 'Drag each card to the right place, or tap a card then tap a place. Learn by doing.'],
    soCheck: ['تحقق', 'Check'], soRetry: ['حاول مرة أخرى', 'Try again'], soNext: ['النشاط التالي', 'Next activity'], soScore: ['{r} من {n} صحيحة', '{r} of {n} correct'], soLeft: ['ضع كل البطاقات أولًا ({n} متبقية).', 'Place every card first ({n} left).'],
    soGen: ['أنشئ نشاطًا من الدرس', 'Build an activity from the lesson'], soPool: ['البطاقات', 'Cards'], soAct: ['النشاط {i} من {n}', 'Activity {i} of {n}'],
    creditsK: ['تنفيذ وإعداد · دراسة بحث إجرائي', 'Made by · an action research study'],
  });

  /* ---------- speech: the browser's own text-to-speech, no account needed ---------- */
  // LaTeX → spoken Arabic, applied in order inside $…$ only
  const NAME = { F: 'إف', d: 'دي', r: 'آر', R: 'آر', v: 'في', W: 'دبليو', N: 'إن', E: 'إي', e: 'إي', Q: 'كيو', L: 'إل', h: 'إتش', p: 'بي', f: 'إف', i: 'آي', o: 'أو', g: 'جي', m: 'إم', t: 'تي', a: 'إيه', P: 'بي', K: 'كيه', x: 'إكس', y: 'واي' };
  const say = (c) => NAME[c] || c;
  const SAY_AR = [
    [/\\text\{([^}]*)\}/g, ' $1 '], [/\\[dt]?frac\{([^}]*)\}\{([^}]*)\}/g, ' $1 على $2 '],
    [/\\leq?|≤/g, ' أصغر من أو يساوي '], [/\\geq?|≥/g, ' أكبر من أو يساوي '], [/\\approx|≈/g, ' يساوي تقريبًا '], [/\\neq|≠/g, ' لا يساوي '], [/</g, ' أصغر من '], [/>/g, ' أكبر من '],
    [/\\times|×|\\cdot/g, ' ضرب '], [/\\Delta|Δ/g, ' دلتا '], [/\\theta|θ/g, ' ثيتا '], [/\\mu|μ/g, ' ميو '], [/\\pi|π/g, ' باي '], [/\\sin/g, ' جا '], [/\\cos/g, ' جتا '], [/\\ell/g, ' إل '], [/\\%|%/g, ' بالمئة '],
    [/IMA_?\{?(\d?)\}?/g, ' آي إم إيه $1 '], [/MA_?\{?(\d?)\}?/g, ' إم إيه $1 '],
    [/Fᵣ/g, ' إف آر '], [/Fₑ/g, ' إف إي '], [/dᵣ/g, ' دي آر '], [/dₑ/g, ' دي إي '], [/W₀/g, ' دبليو أو '], [/Wᵢ/g, ' دبليو آي '],
    [/([A-Za-z])_\{?([a-z])(\d?)\}?/g, (_, x, y, n) => ` ${say(x)} ${say(y)} ${n} `], [/\b([A-Za-z])\b/g, (_, x) => ` ${say(x)} `],
    [/=/g, ' يساوي '], [/\//g, ' على '], [/\+/g, ' زائد '], [/ - |−/g, ' ناقص '], [/\\[a-zA-Z]+/g, ' '], [/[{}_^\\()]/g, ' ']];
  const spoken = (md) => {
    let s = String(md || '').replace(/:::extra|:::/g, '').replace(/\[p\.\s*([\d–\-, ]+)\]/g, NL.lang === 'ar' ? ' صفحة $1 ' : ' page $1 ');
    s = s.replace(/\$\$?([^$]+)\$\$?/g, (_, tex) => NL.lang === 'ar' ? SAY_AR.reduce((x, [re, to]) => x.replace(re, to), tex) : tex.replace(/[{}_^\\]/g, ' '));
    return s.replace(/[*#>`|]/g, ' ').replace(/\s+/g, ' ').trim();
  };
  // the natural voice: a Gemini voice (Orus) from the server, or a ready recording in tts/<sha1>.m4a; the browser's own voice is the fallback
  const audio = new Audio(), made = new Map();
  const sha1 = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(s)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  async function natural(text) {
    const id = await sha1(text);
    if (made.has(id)) return made.get(id);
    const job = (async () => {
      const ready = await fetch('tts/' + id + '.m4a', { method: 'HEAD' }).catch(() => null);
      if (ready?.ok) return 'tts/' + id + '.m4a';
      const r = await fetch('api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json', ...NL.auth.header() }, body: JSON.stringify({ text, lang: NL.lang }) });
      if (!r.ok) throw new Error('tts ' + r.status);
      return URL.createObjectURL(await r.blob());
    })();
    made.set(id, job); job.catch(() => made.delete(id));
    return job;
  }
  const S = (NL.speech = {
    ok: 'speechSynthesis' in window, rate: +NL.lsGet('ttsRate', 1) || 1, btn: null, run: 0, audio,
    natural, spoken, text: (parts) => parts.map(spoken).filter(Boolean).join('\n'),
    voice() {
      if (!S.ok) return null;
      const vs = speechSynthesis.getVoices(), want = NL.lang === 'ar' ? /^ar/i : /^en/i;
      return vs.filter((v) => want.test(v.lang)).sort((a, b) => (/ar-SA/i.test(b.lang) - /ar-SA/i.test(a.lang)) || (b.localService - a.localService))[0] || null;
    },
    // speaks the parts in order; onPart(i) fires as each one starts, onWait(true|false) while the voice is being prepared
    play(parts, { onPart, onEnd, onWait } = {}) {
      S.stop(); const run = ++S.run;
      const said = parts.map(spoken), total = said.reduce((n, p) => n + p.length + 1, 0) || 1;
      onWait?.(true);
      natural(said.filter(Boolean).join('\n')).then((src) => {
        if (run !== S.run) return;
        onWait?.(false);
        audio.src = src; audio.playbackRate = S.rate;
        // the recording is one piece, so the highlighted part follows its share of the text
        const marks = []; said.reduce((n, p) => (marks.push(n / total), n + p.length + 1), 0);
        let at = -1;
        audio.ontimeupdate = () => { if (run !== S.run || !audio.duration) return; const f = audio.currentTime / audio.duration; let i = 0; while (i + 1 < marks.length && marks[i + 1] <= f) i++; if (i !== at) { at = i; onPart?.(i); } };
        audio.onended = () => { if (run === S.run) { S.run++; onEnd?.(); } };
        return audio.play();
      }).catch((e) => {
        if (run !== S.run) return;
        console.warn('natural voice unavailable', e);
        onWait?.(false);
        if (!device(parts, run, { onPart, onEnd })) onEnd?.();
      });
      return true;
    },
    stop() { S.run++; audio.pause(); if (S.ok) speechSynthesis.cancel(); if (S.btn) { S.btn.classList.remove('speaking'); S.btn.textContent = S.btn.dataset.label || t('listenThis'); S.btn = null; } },
    // a single listen button that turns into stop while reading
    toggle(btn, parts) {
      if (S.btn === btn) return S.stop();
      S.stop(); btn.dataset.label ||= btn.textContent;
      S.btn = btn; btn.classList.add('speaking'); btn.textContent = t('voiceWait');
      S.play(parts, { onEnd: () => S.btn === btn && S.stop(), onWait: (w) => { if (S.btn === btn) btn.textContent = t(w ? 'voiceWait' : 'listenStop'); } });
      W().stat?.((st) => { st.labsUsed ||= {}; st.labsUsed.listen ||= Date.now(); });
    },
    fromExplain(s, d) { return [s.title, d.intro, ...(d.points || []).flatMap((p) => [p.title, p.body]), ...(d.realLife || [])].filter(Boolean); },
  });
  // the browser's own voice, used only when the natural voice cannot be reached
  function device(parts, run, { onPart, onEnd }) {
    const v = S.voice();
    if (!S.ok || !v) { NL.toast(t('noVoice'), 'warn'); return false; }
    NL.toast(t('voiceFallback'), 'warn');
    const next = (i) => {
      if (run !== S.run) return;
      if (i >= parts.length) { S.run++; onEnd?.(); return; }
      const u = new SpeechSynthesisUtterance(spoken(parts[i])); u.voice = v; u.lang = v.lang; u.rate = S.rate;
      u.onstart = () => run === S.run && onPart?.(i);
      u.onend = () => next(i + 1); u.onerror = (e) => { if (e.error !== 'interrupted' && e.error !== 'canceled') next(i + 1); };
      speechSynthesis.speak(u);
    };
    next(0); return true;
  }
  if (S.ok) speechSynthesis.getVoices(); // voices load lazily in Chrome
  const W = () => NL.ws;

  /* ---------- learning-styles hub ---------- */
  const STYLE_TABS = { v: ['video', '3d', 'map', 'summary'], a: ['listen', 'video', 'assistant', 'explain'], k: ['sort', 'lab', '3d', 'board'] };
  const VAK_Q = [
    ['عندما أتعلم قانونًا جديدًا في الفيزياء أفضّل أن:', 'أرى رسمًا أو مخططًا يوضّحه', 'أسمع المعلم يشرحه خطوة خطوة', 'أجرّبه بأداة أو محاكاة'],
    ['أتذكر الدرس أكثر عندما:', 'أتخيل الصور والرسوم التي رأيتها', 'أتذكر كلام المعلم والنقاش', 'أتذكر ما فعلته بيدي في التجربة'],
    ['عند حل مسألة صعبة:', 'أرسمها وأرتب المعطيات في جدول', 'أقرؤها بصوت مرتفع أو أناقشها مع زميل', 'أمثّلها بحركة أو بأداة أمامي'],
    ['في وقت الفراغ أفضّل:', 'مشاهدة فيديو أو صور', 'الاستماع لحديث أو بودكاست', 'تركيب شيء أو إصلاحه'],
    ['عند تركيب جهاز جديد:', 'أنظر إلى الرسومات في الدليل', 'أطلب من أحد أن يشرح لي', 'أبدأ التركيب وأتعلم بالتجربة'],
    ['عند المذاكرة للاختبار:', 'أستخدم الألوان والخرائط الذهنية', 'أكرر المعلومات بصوت مسموع', 'أحل تمارين وأتحرك أثناء المذاكرة'],
    ['يشتت انتباهي أكثر:', 'الفوضى في المكان', 'الضوضاء والأصوات', 'الجلوس طويلًا دون حركة'],
    ['أفهم آلة مثل الرافعة أكثر عندما:', 'أشاهد مجسمًا لها يتحرك', 'يشرح لي أحد كيف تعمل', 'أمسكها وأجرّبها بنفسي'],
    ['لتذكّر قانون أو رقم:', 'أتخيله مكتوبًا أمامي', 'أردده بصوتي كأنه نغمة', 'أكتبه بيدي عدة مرات'],
    ['في الحصة أستفيد أكثر من:', 'السبورة والعروض والصور', 'الشرح والأسئلة والنقاش', 'الأنشطة والتجارب العملية'],
  ];
  const vakKey = () => 'vak:' + (NL.auth.user || 'guest');
  const styleIcon = { v: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6', a: 'M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H4zM17 14h3v6h-3z', k: 'M9 11V5a2 2 0 0 1 4 0v6M13 10a2 2 0 0 1 4 0v3M9 11a2 2 0 0 0-4 0v3a7 7 0 0 0 14 0v-1' };
  const svgI = (d) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  NL.styleIcon = (k) => svgI(styleIcon[k]);

  NL.wsR.styles = (body) => {
    const w = W(), have = (k) => w.tabs.includes(k);
    let res = NL.lsGet(vakKey(), null);
    const draw = () => {
      const top = res ? ['v', 'a', 'k'].sort((x, y) => res[y] - res[x]) : null;
      const balanced = res && res[top[0]] - res[top[2]] <= 2;
      body.innerHTML = `${w.head(t('tab_styles'), t('stLead'))}
        <div class="vak-cards">${['v', 'a', 'k'].map((k) => `<section class="vak-card vk-${k} ${top && !balanced && top[0] === k ? 'mine' : ''}"><div class="vak-ic">${svgI(styleIcon[k])}</div><h3>${t('st_' + k)}</h3><p>${t('st_' + k + 'S')}</p>
          ${res ? `<div class="meter"><span style="width:${Math.round(res[k] / 10 * 100)}%"></span></div><small class="fine">${res[k]} / 10</small>` : ''}
          <div class="vak-tools">${STYLE_TABS[k].filter(have).map((tb) => `<button class="chip" data-goto="${tb}">${w.tabIcon(tb)} ${t('tab_' + tb)}</button>`).join('')}</div></section>`).join('')}</div>
        ${res ? `<section class="panel vak-res"><h3>${balanced ? t('vakMix') : t('vakRes', { s: t('st_' + top[0]) })}</h3><h4 class="sub">${t('vakPath')}</h4><p class="fine">${t('vakPathS')}</p>
            <ol class="vak-path">${path(top).map((tb, i) => `<li><button data-goto="${tb}"><span class="lmap-n">${i + 1}</span>${w.tabIcon(tb)}<span>${t('tab_' + tb)}</span></button></li>`).join('')}</ol>
            <button class="btn sm ghost" id="vak-redo">${t('vakRedo')}</button></section>`
          : `<section class="panel"><h3>${t('vakTitle')}</h3><p class="fine">${t('vakLead')}</p>
            <ol class="vak-q">${VAK_Q.map((q, i) => `<li><p>${esc(NL.lang === 'ar' ? q[0] : q[0])}</p><div class="opts">${['v', 'a', 'k'].map((k, j) => `<button data-q="${i}" data-k="${k}">${esc(q[j + 1])}</button>`).join('')}</div></li>`).join('')}</ol>
            <p class="bad" id="vak-err" hidden></p><button class="btn" id="vak-go">${t('vakGo')}</button></section>`}`;
      $$('[data-goto]', body).forEach((b) => (b.onclick = () => w.open(b.dataset.goto)));
      $('#vak-redo', body)?.addEventListener('click', () => { res = null; draw(); });
      const picks = {};
      $$('[data-q]', body).forEach((b) => (b.onclick = () => { picks[b.dataset.q] = b.dataset.k; $$(`[data-q="${b.dataset.q}"]`, body).forEach((x) => x.classList.toggle('picked', x === b)); }));
      $('#vak-go', body)?.addEventListener('click', () => {
        const left = VAK_Q.length - Object.keys(picks).length, err = $('#vak-err', body);
        if (left) { err.hidden = false; err.textContent = t('vakNeed', { n: left }); return; }
        res = { v: 0, a: 0, k: 0, at: Date.now() }; Object.values(picks).forEach((k) => res[k]++);
        NL.lsSet(vakKey(), res); w.touch('styles'); draw(); window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    };
    // start in the student's style, then cover the other two, then check understanding
    const path = (order) => {
      const first = { v: ['video', '3d'], a: ['listen', 'assistant'], k: ['3d', 'lab'] }, then = { v: ['map'], a: ['listen'], k: ['sort'] };
      const seq = [...first[order[0]], ...then[order[1]], ...then[order[2]], 'quiz'];
      return [...new Set(seq)].filter(have);
    };
    draw();
  };

  /* ---------- lesson video ---------- */
  const ytId = (u) => (/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/.exec(u) || [])[1];
  const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  NL.wsR.video = (body) => {
    const w = W();
    const draw = () => {
      const vids = [...(w.lesson.videos || []), ...(w.gen.videos || []).map((v) => ({ ...v, added: true }))];
      body.innerHTML = `${w.head(t('tab_video'), t('vidLead'), w.teacher ? `<button class="btn sm ghost" id="vid-add">${t('addVideo')}</button>` : '')}
        <div id="vid-form"></div>
        ${vids.length ? vids.map((v, i) => `<section class="vid">
          <div class="vid-frame">${v.yt ? `<iframe src="https://www.youtube-nocookie.com/embed/${esc(v.yt)}?rel=0" title="${esc(v.title)}" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe>`
            : `<video controls playsinline preload="metadata" ${v.poster ? `poster="${esc(v.poster)}"` : ''} data-v="${i}"><source src="${esc(v.src)}" type="video/mp4">${v.vtt ? `<track kind="captions" srclang="${NL.lang}" label="${NL.lang === 'ar' ? 'العربية' : 'Arabic'}" src="${esc(v.vtt)}" default>` : ''}</video>`}</div>
          <div class="vid-meta"><h3>${esc(v.title)}</h3>${v.sub ? `<p class="fine">${esc(v.sub)}</p>` : ''}
            ${v.chapters?.length ? `<h4 class="sub">${t('chapters')}</h4><ol class="vid-ch">${v.chapters.map((c) => `<li><button data-seek="${c.t}" data-vi="${i}"><b>${fmtT(c.t)}</b> ${esc(c.title)}</button></li>`).join('')}</ol>` : ''}
            ${v.added && w.teacher ? `<button class="btn sm ghost" data-del="${esc(v.id)}">${t('remove')}</button>` : ''}</div></section>`).join('')
          : `<div class="empty"><p>${t('noVideo')}</p></div>`}
        <section class="panel after-watch"><h3>${t('afterWatch')}</h3><div class="row gap wrap">
          ${w.tabs.includes('3d') ? `<button class="btn ghost" data-goto="3d">${w.tabIcon('3d')} ${t('tryIn3d')}</button>` : ''}
          <button class="btn ghost" data-goto="sort">${w.tabIcon('sort')} ${t('trySort')}</button><button class="btn ghost" data-goto="quiz">${w.tabIcon('quiz')} ${t('tryQuiz')}</button></div></section>`;
      $$('[data-goto]', body).forEach((b) => (b.onclick = () => w.open(b.dataset.goto)));
      $$('[data-seek]', body).forEach((b) => (b.onclick = () => { const v = $(`video[data-v="${b.dataset.vi}"]`, body); if (v) { v.currentTime = +b.dataset.seek; v.play().catch(() => {}); } }));
      $$('video', body).forEach((v) => {
        let counted = false;
        v.addEventListener('timeupdate', () => {
          if (!counted && v.duration && v.currentTime / v.duration > 0.5) { counted = true; w.stat((st) => { st.labsUsed ||= {}; st.labsUsed.video ||= Date.now(); }); }
          const ch = $$(`[data-vi="${v.dataset.v}"]`, body); let on = -1; ch.forEach((b, j) => { if (v.currentTime >= +b.dataset.seek - 0.2) on = j; }); ch.forEach((b, j) => b.classList.toggle('on', j === on));
        });
      });
      $$('[data-del]', body).forEach((b) => (b.onclick = () => { w.gen.videos = (w.gen.videos || []).filter((x) => x.id !== b.dataset.del); w.saveGen(); draw(); }));
      $('#vid-add', body)?.addEventListener('click', () => {
        const f = $('#vid-form', body);
        f.innerHTML = `<form class="panel vid-add"><label class="ctl"><span>${t('vidTitle')}</span><input name="title" required></label><label class="ctl"><span>${t('vidUrl')}</span><input name="url" dir="ltr" required placeholder="https://"></label><p class="fine">${t('vidLocal')}</p><p class="bad" hidden></p><div class="row gap"><button class="btn sm">${t('save')}</button><button class="btn sm ghost" type="button" data-x>${t('cancel')}</button></div></form>`;
        const form = $('form', f);
        $('[data-x]', f).onclick = () => (f.innerHTML = '');
        form.onsubmit = (e) => {
          e.preventDefault(); const url = form.url.value.trim(), yt = ytId(url);
          if (!yt && !/^https:\/\/\S+\.mp4(\?\S*)?$/i.test(url)) { const er = $('.bad', form); er.hidden = false; er.textContent = t('vidBad'); return; }
          w.gen.videos ||= []; w.gen.videos.push({ id: uid(), title: form.title.value.trim(), ...(yt ? { yt } : { src: url }) }); w.saveGen(); draw();
        };
        form.title.focus();
      });
    };
    draw();
  };

  /* ---------- listen: each section read aloud with read-along highlighting ---------- */
  NL.wsR.listen = (body) => {
    const w = W(), a = w.lesson.analysis, level = w.state.level || 'medium';
    const tracks = a.sections.map((s) => {
      const d = w.gen.explain?.[s.id]?.[level];
      return { title: s.title, parts: d ? S.fromExplain(s, d) : [s.title, s.summary, ...(s.conceptIds || []).map((id) => a.concepts.find((c) => c.id === id)).filter(Boolean).map((c) => `${c.name}: ${c.definition}`)].filter(Boolean) };
    });
    const sum = w.gen.summary?.standard?.keyIdeas;
    tracks.push({ title: t('lsSummary'), parts: [t('lsSummary'), ...(sum?.length ? sum : [a.summary])] });
    let cur = -1, playing = false, all = false;
    body.innerHTML = `${w.head(t('tab_listen'), t('lsLead'), `<div class="row gap"><span class="fine">${t('lsSpeed')}</span><div class="seg">${[0.8, 1, 1.2].map((r) => `<button role="radio" data-rate="${r}" aria-checked="${r === S.rate}">${r}×</button>`).join('')}</div></div>`)}
      <div class="ls-layout"><ol class="ls-list">${tracks.map((tr, i) => `<li><button data-tr="${i}"><span class="lmap-n">${i + 1}</span><span>${esc(tr.title)}</span></button></li>`).join('')}</ol>
        <article class="ls-read panel"><div class="row gap wrap ls-ctl"><button class="btn" id="ls-play">${t('lsAll')}</button><button class="btn ghost" id="ls-stop" hidden>${t('lsPause')}</button></div><div id="ls-text" class="prose"></div></article></div>`;
    const text = $('#ls-text', body), playB = $('#ls-play', body), stopB = $('#ls-stop', body);
    const showTrack = (i) => {
      cur = i; $$('[data-tr]', body).forEach((b) => b.classList.toggle('on', +b.dataset.tr === i));
      text.innerHTML = tracks[i].parts.map((p, j) => `<p data-p="${j}">${NL.md(p).replace(/^<p>|<\/p>$/g, '')}</p>`).join('');
    };
    const start = (i) => {
      showTrack(i); playing = true; stopB.hidden = false; playB.hidden = true;
      S.play(tracks[i].parts, {
        onWait: (wt) => { stopB.textContent = t(wt ? 'voiceWait' : 'lsPause'); },
        onPart: (j) => { $$('[data-p]', text).forEach((p) => p.classList.toggle('reading', +p.dataset.p === j)); $(`[data-p="${j}"]`, text)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); },
        onEnd: () => { if (!playing) return; if (all && i + 1 < tracks.length) start(i + 1); else stop(); },
      }) || stop();
      if (all && tracks[i + 1]) S.natural(S.text(tracks[i + 1].parts)).catch(() => {}); // get the next part ready while this one plays
      w.stat((st) => { st.labsUsed ||= {}; st.labsUsed.listen ||= Date.now(); });
    };
    const stop = () => { playing = false; all = false; S.stop(); stopB.hidden = true; playB.hidden = false; $$('[data-p]', text).forEach((p) => p.classList.remove('reading')); };
    $$('[data-tr]', body).forEach((b) => (b.onclick = () => { all = false; start(+b.dataset.tr); }));
    playB.onclick = () => { all = true; start(cur < 0 ? 0 : cur); };
    stopB.onclick = stop;
    $$('[data-rate]', body).forEach((b) => (b.onclick = () => { S.rate = +b.dataset.rate; NL.lsSet('ttsRate', S.rate); $$('[data-rate]', body).forEach((x) => x.setAttribute('aria-checked', x === b)); S.audio.playbackRate = S.rate; }));
    showTrack(0);
    w.stop.push(() => { playing = false; S.stop(); });
  };

  /* ---------- drag and sort: a kinesthetic activity ---------- */
  NL.wsR.sort = (body) => {
    const w = W();
    let acts = w.lesson.sortActs || w.gen.sort || null, ai_ = 0;
    const shuffle = (arr) => arr.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
    const run = () => {
      if (!acts?.length) {
        body.innerHTML = `${w.head(t('tab_sort'), t('soLead'))}<div id="so-gen" class="empty"><button class="btn" id="so-make">${t('soGen')}</button></div>`;
        $('#so-make', body).onclick = make; return;
      }
      const A = acts[ai_], items = shuffle(A.items.map((it, i) => ({ ...it, i })));
      body.innerHTML = `${w.head(t('tab_sort'), t('soLead'), acts.length > 1 ? `<span class="pill">${t('soAct', { i: ai_ + 1, n: acts.length })}</span>` : '')}
        <section class="so"><h3>${esc(A.title)}</h3>${A.prompt ? `<p class="fine">${esc(A.prompt)}</p>` : ''}
          <div class="so-pool" data-zone="pool" aria-label="${t('soPool')}">${items.map((it) => `<button class="so-chip" data-i="${it.i}">${NL.md(it.text).replace(/^<p>|<\/p>$/g, '')}</button>`).join('')}</div>
          <div class="so-zones" style="--n:${Math.min(A.cats.length, 3)}">${A.cats.map((c, ci) => `<div class="so-zone" data-zone="${ci}"><h4>${esc(c)}</h4><div class="so-drop"></div></div>`).join('')}</div>
          <p class="so-msg" hidden></p>
          <div class="row gap wrap"><button class="btn" id="so-check">${t('soCheck')}</button><button class="btn ghost" id="so-retry" hidden>${t('soRetry')}</button>${acts.length > 1 ? `<button class="btn ghost" id="so-next" hidden>${t('soNext')}</button>` : ''}</div></section>`;
      const box = $('.so', body); let sel = null, checked = false;
      const place = (chip, zone) => {
        if (checked) return;
        (zone.dataset.zone === 'pool' ? zone : $('.so-drop', zone)).append(chip);
        chip.classList.remove('sel', 'right', 'wrong'); sel = null;
      };
      const zoneAt = (x, y) => document.elementFromPoint(x, y)?.closest('[data-zone]');
      $$('.so-chip', box).forEach((chip) => {
        chip.addEventListener('pointerdown', (e) => {
          if (checked || e.button > 0) return;
          const r = chip.getBoundingClientRect(), dx = e.clientX - r.left, dy = e.clientY - r.top, sx = e.clientX, sy = e.clientY; let ghost = null;
          const move = (ev) => {
            if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 6) return;
            if (!ghost) { ghost = chip.cloneNode(true); ghost.className = 'so-chip so-ghost'; ghost.style.width = r.width + 'px'; document.body.append(ghost); chip.classList.add('lifting'); }
            ghost.style.transform = `translate(${ev.clientX - dx}px, ${ev.clientY - dy}px)`;
            $$('.so-zone, .so-pool', box).forEach((z) => z.classList.toggle('over', z === zoneAt(ev.clientX, ev.clientY)));
          };
          const up = (ev) => {
            removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', up);
            $$('.over', box).forEach((z) => z.classList.remove('over'));
            if (!ghost) return; // a plain tap is handled by click
            ghost.remove(); chip.classList.remove('lifting'); chip.dataset.dragged = '1';
            const z = zoneAt(ev.clientX, ev.clientY); if (z && box.contains(z)) place(chip, z);
          };
          addEventListener('pointermove', move); addEventListener('pointerup', up); addEventListener('pointercancel', up);
        });
        chip.addEventListener('click', (e) => {
          e.stopPropagation(); if (chip.dataset.dragged) { delete chip.dataset.dragged; return; } if (checked) return;
          if (sel === chip) { chip.classList.remove('sel'); sel = null; return; }
          $$('.so-chip.sel', box).forEach((c) => c.classList.remove('sel')); sel = chip; chip.classList.add('sel');
        });
      });
      $$('[data-zone]', box).forEach((z) => z.addEventListener('click', () => sel && place(sel, z)));
      const msg = $('.so-msg', box);
      $('#so-check', box).onclick = () => {
        const left = $$('.so-pool .so-chip', box).length;
        if (left) { msg.hidden = false; msg.className = 'so-msg warn-text'; msg.textContent = t('soLeft', { n: left }); return; }
        checked = true; let right = 0;
        $$('.so-zone', box).forEach((z) => $$('.so-chip', z).forEach((c) => { const ok = A.items[+c.dataset.i].cat === +z.dataset.zone; c.classList.add(ok ? 'right' : 'wrong'); if (ok) right++; }));
        msg.hidden = false; msg.className = 'so-msg ' + (right === A.items.length ? 'ok-text' : 'warn-text'); msg.textContent = t('soScore', { r: right, n: A.items.length });
        $('#so-check', box).hidden = true; $('#so-retry', box).hidden = false; $('#so-next', box)?.removeAttribute('hidden');
        w.state.sort ||= {}; w.state.sort[ai_] = Math.max(w.state.sort[ai_] || 0, Math.round(right / A.items.length * 100)); w.saveState();
        w.stat((st) => { st.labsUsed ||= {}; st.labsUsed.sort ||= Date.now(); });
      };
      $('#so-retry', box).onclick = run;
      $('#so-next', box)?.addEventListener('click', () => { ai_ = (ai_ + 1) % acts.length; run(); });
    };
    const make = async () => {
      const host = $('#so-gen', body); if (w.needAI(host)) return;
      const ctxText = await w.ctx(40000);
      const d = await w.withSpinner(host, t('generating'), (signal) => ai.json(`${w.RULES()}\n\n${ctxText}\n\nBuild 2 drag-and-sort activities from this lesson for a hands-on learner. Return ONLY JSON {"acts":[{"title":"short instruction","prompt":"one line","cats":["2-4 short category names"],"items":[{"text":"short card text, may use $LaTeX$","cat":0}]}]}. 8-10 items per activity, each belonging to exactly one category by index; every item must be correct according to the lesson pages.`, { signal, modelTier: 'default' }));
      if (!d?.acts?.length) return;
      acts = w.gen.sort = d.acts.filter((x) => x.cats?.length && x.items?.length); w.saveGen(); run();
    };
    run();
  };
})();
