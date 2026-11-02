/* Misbar teacher tools: classroom presentation, content editing, question bank, printable worksheets. */
(function () {
  const { $, $$, esc, t, fmt, uid } = NL;
  NL.addT({
    present: ['اعرض للطلاب', 'Present to class'], presentLead: ['وضع عرض بخط كبير: شريحة لكل فكرة، والأسئلة تُكشف بضغطة.', 'Large-type slides: one idea per slide, answers revealed on click.'],
    pFrom: ['ابدأ من', 'Start from'], pAll: ['بداية الدرس', 'The beginning'], pGo: ['ابدأ العرض', 'Start presenting'],
    pPrev: ['السابق', 'Previous'], pNext: ['التالي', 'Next'], pDraw: ['قلم', 'Pen'], pClear: ['امسح', 'Clear'], pTimer: ['مؤقت', 'Timer'], p3d: ['ثلاثي الأبعاد', '3D'], pFull: ['ملء الشاشة', 'Full screen'], pExit: ['خروج', 'Exit'],
    pReveal: ['اضغط لإظهار الإجابة', 'Click to reveal the answer'], pObjectives: ['أهداف الدرس', 'Lesson objectives'], pSection: ['الجزء {i} من {n}', 'Part {i} of {n}'], pKeys: ['الأسهم أو المسافة للتنقل · D للقلم · F لملء الشاشة · Esc للخروج', 'Arrows or space to move · D pen · F full screen · Esc to exit'],
    pSummary: ['خلاصة الدرس', 'Lesson wrap-up'], pBack3d: ['رجوع للشرائح', 'Back to slides'],
    editPart: ['تعديل هذا الجزء', 'Edit this part'], editT: ['تعديل الشرح', 'Edit the explanation'], editHint: ['يمكنك استخدام **عريض** والمعادلات بين $...$. التعديل يُحفظ في حسابك ويظهر في العرض.', 'Use **bold** and equations between $...$. Edits are saved to your account and used when presenting.'],
    fIntro: ['المقدمة', 'Intro'], fPoints: ['الأفكار', 'Ideas'], fPointT: ['عنوان الفكرة', 'Idea title'], fPointB: ['نص الفكرة', 'Idea text'], fAddPoint: ['أضف فكرة', 'Add idea'], fLife: ['أمثلة من الحياة (سطر لكل مثال)', 'Real-life examples (one per line)'], fSci: ['الشرح العلمي الأدق', 'More precise explanation'],
    fChecks: ['أسئلة التحقق', 'Check questions'], fQ: ['السؤال', 'Question'], fOpt: ['الخيار {n}', 'Option {n}'], fCorrect: ['الصحيح', 'Correct'], fWhy: ['التفسير', 'Explanation'], fAddQ: ['أضف سؤالًا', 'Add question'], fRemove: ['حذف', 'Remove'],
    fSave: ['حفظ التعديل', 'Save changes'], fReset: ['استعادة الأصل', 'Restore original'], fCancel: ['إلغاء', 'Cancel'], fSaved: ['حُفظ التعديل', 'Changes saved'], fRestored: ['عاد المحتوى الأصلي', 'Original restored'],
    bankT: ['بنك الأسئلة', 'Question bank'], bankManage: ['إدارة بنك الأسئلة', 'Manage question bank'], bankLead: ['عدّل أسئلة الدرس أو أضف أسئلتك. تُستخدم في الاختبارات وأوراق العمل.', 'Edit the lesson’s questions or add your own. Used in quizzes and worksheets.'], bankAdd: ['أضف سؤال اختيار', 'Add multiple choice'], bankAddTf: ['أضف صح/خطأ', 'Add true/false'], bankCount: ['{n} سؤال', '{n} questions'],
    wsT: ['ورقة عمل للطباعة', 'Printable worksheet'], wsLead: ['اختر الأسئلة، وتُطبع ورقة للطلاب وصفحة إجابات منفصلة لك.', 'Pick questions; prints a student sheet and a separate answer key.'], wsPrint: ['اطبع ورقة العمل', 'Print worksheet'], wsName: ['الاسم: ....................   الفصل: ..........   التاريخ: ..........', 'Name: ....................   Class: ..........   Date: ..........'], wsKey: ['نموذج الإجابة (للمعلم)', 'Answer key (teacher)'], wsCount: ['عدد الأسئلة', 'Questions'],
    teacherTools: ['أدوات المعلّم', 'Teacher tools'],
  });

  /* ---------- slides from the lesson's own content ---------- */
  function buildSlides(L, gen, level, startSec) {
    const a = L.analysis, slides = [];
    if (!startSec) slides.push({ kind: 'cover' });
    a.sections.forEach((s, i) => {
      if (startSec && a.sections.findIndex((x) => x.id === startSec) > i) return;
      const d = gen.explain?.[s.id]?.[level] || gen.explain?.[s.id]?.medium;
      slides.push({ kind: 'sec', s, i });
      if (!d) { slides.push({ kind: 'text', s, title: s.title, body: s.summary }); return; }
      if (d.intro) slides.push({ kind: 'text', s, title: s.title, body: d.intro });
      (d.points || []).forEach((p) => slides.push({ kind: 'text', s, title: p.title, body: p.body }));
      const lawIds = [...new Set([...(d.lawIds || []), ...(s.lawIds || [])])];
      lawIds.map((id) => a.laws.find((l) => l.id === id)).filter(Boolean).forEach((l) => slides.push({ kind: 'law', s, l }));
      if (d.workedExample?.steps?.length) slides.push({ kind: 'example', s, ex: d.workedExample, steps: d.workedExample.steps.length + 1 });
      if (d.realLife?.length) slides.push({ kind: 'life', s, items: d.realLife });
      (d.checks || []).forEach((c) => slides.push({ kind: 'check', s, c, steps: 1 }));
    });
    const sum = gen.summary?.standard;
    if (sum?.keyIdeas?.length) slides.push({ kind: 'end', items: sum.keyIdeas });
    return slides;
  }
  const strip = (h) => h.replace(/^<p>|<\/p>$/g, '');

  NL.present = (L, gen, { level = 'medium', startSec } = {}) => {
    const slides = buildSlides(L, gen, level, startSec), a = L.analysis;
    let i = 0, rev = 0, drawing = false, timerEnd = 0, timerT = null, stop3d = null;
    const ov = document.createElement('div'); ov.className = 'present'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', t('present'));
    ov.innerHTML = `<div class="pr-stage"><div class="pr-slide"></div><canvas class="pr-ink"></canvas><div class="pr-3d" hidden></div></div>
      <div class="pr-bar"><span class="pr-where"></span>
        <div class="pr-tools"><button data-p="prev">${t('pPrev')}</button><span class="pr-count"></span><button data-p="next" class="main">${t('pNext')}</button>
          <button data-p="draw">${t('pDraw')}</button><button data-p="clear">${t('pClear')}</button><button data-p="timer">${t('pTimer')}</button>
          ${L.scenes3d?.length ? `<button data-p="3d">${t('p3d')}</button>` : ''}<button data-p="full">${t('pFull')}</button><button data-p="exit">${t('pExit')}</button></div>
        <span class="pr-keys">${t('pKeys')}</span></div>`;
    document.body.append(ov); document.body.classList.add('presenting');
    const slideEl = $('.pr-slide', ov), ink = $('.pr-ink', ov), ctx = ink.getContext('2d');
    const fitInk = () => { const b = ink.getBoundingClientRect(), d = devicePixelRatio || 1; ink.width = b.width * d; ink.height = b.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    const render = () => {
      const s = slides[i], sec = s.s;
      $('.pr-count', ov).textContent = `${i + 1} / ${slides.length}`;
      $('.pr-where', ov).textContent = sec ? `${t('pSection', { i: a.sections.indexOf(sec) + 1, n: a.sections.length })} · ${sec.title}` : L.title;
      let h = '';
      if (s.kind === 'cover') h = `<p class="pr-eyebrow">${esc(L.grade || NL.subjectName(L.subject))}${L.unit ? ' · ' + esc(L.unit) : ''}</p><h1 class="pr-h1">${esc(L.title)}</h1><h3>${t('pObjectives')}</h3><ul class="pr-list">${a.objectives.map((o) => `<li>${esc(o.replace(/^\*\s*/, ''))}</li>`).join('')}</ul>`;
      if (s.kind === 'sec') h = `<p class="pr-eyebrow">${t('pSection', { i: s.i + 1, n: a.sections.length })}</p><h1 class="pr-h1">${esc(s.s.title)}</h1><p class="pr-lead">${NL.md(s.s.summary || '').replace(/<\/?p>/g, '')}</p>`;
      if (s.kind === 'text') h = `<h2 class="pr-h2">${esc(s.title)}</h2><div class="pr-body prose">${NL.md(s.body)}</div>`;
      if (s.kind === 'law') h = `<h2 class="pr-h2">${esc(s.l.name)}</h2><div class="pr-law">${NL.tex(s.l.latex || s.l.equation, true)}</div>${s.l.symbols?.length ? `<table class="pr-sym">${s.l.symbols.map((y) => `<tr><td>${NL.tex(y.tex || y.var)}</td><td>${esc(y.name)}</td><td dir="ltr">${esc(y.unit || '—')}</td></tr>`).join('')}</table>` : ''}${s.l.conditions ? `<p class="pr-note">${NL.md(s.l.conditions).replace(/<\/?p>/g, '')}</p>` : ''}`;
      if (s.kind === 'example') h = `<h2 class="pr-h2">${t('workedEx')}</h2><div class="pr-body prose">${NL.md(s.ex.problem)}</div><ol class="pr-steps">${s.ex.steps.map((x, k) => `<li class="${k < rev ? 'on' : ''}">${strip(NL.md(x))}</li>`).join('')}</ol>${rev > s.ex.steps.length - 1 ? `<p class="pr-answer"><b>${t('answer')}:</b> ${strip(NL.md(s.ex.answer || ''))}</p>` : ''}`;
      if (s.kind === 'life') h = `<h2 class="pr-h2">${t('realLife')}</h2><ul class="pr-list">${s.items.map((x) => `<li>${strip(NL.md(x))}</li>`).join('')}</ul>`;
      if (s.kind === 'check') h = `<h2 class="pr-h2">${t('checkU')}</h2><div class="pr-body prose">${NL.md(s.c.q)}</div><div class="pr-opts">${s.c.options.map((o, k) => `<button data-opt="${k}" class="${rev ? (k === +s.c.answer ? 'right' : 'dim') : ''}"><span>${'أبجد'[k] || k + 1}</span>${strip(NL.md(o))}</button>`).join('')}</div>${rev ? `<p class="pr-note">${strip(NL.md(s.c.why || ''))}</p>` : `<p class="pr-hint">${t('pReveal')}</p>`}`;
      if (s.kind === 'end') h = `<h2 class="pr-h2">${t('pSummary')}</h2><ol class="pr-list">${s.items.map((x) => `<li>${strip(NL.md(x))}</li>`).join('')}</ol>`;
      slideEl.innerHTML = `<div class="pr-inner k-${s.kind}">${h}</div>`;
      $$('[data-opt]', slideEl).forEach((b) => (b.onclick = () => { rev = 1; render(); }));
      fitInk(); ctx.clearRect(0, 0, ink.width, ink.height);
    };
    const next = () => { const s = slides[i]; if (s.steps && rev < s.steps) { rev++; return render(); } if (i < slides.length - 1) { i++; rev = 0; render(); } };
    const prev = () => { if (rev > 0 && slides[i].steps) { rev--; return render(); } if (i > 0) { i--; rev = 0; render(); } };
    // pen for annotating the current slide
    let pen = null;
    ink.addEventListener('pointerdown', (e) => { if (!drawing) return; ink.setPointerCapture(e.pointerId); const b = ink.getBoundingClientRect(); pen = [e.clientX - b.left, e.clientY - b.top]; });
    ink.addEventListener('pointermove', (e) => { if (!pen) return; const b = ink.getBoundingClientRect(), p = [e.clientX - b.left, e.clientY - b.top]; ctx.strokeStyle = '#F2B544'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(...pen); ctx.lineTo(...p); ctx.stroke(); pen = p; });
    ink.addEventListener('pointerup', () => (pen = null));
    const setDraw = (v) => { drawing = v; ink.classList.toggle('on', v); $('[data-p="draw"]', ov).classList.toggle('on', v); };
    const tick = () => { const left = Math.max(0, timerEnd - Date.now()), b = $('[data-p="timer"]', ov); if (!timerEnd) { b.textContent = t('pTimer'); b.classList.remove('on', 'late'); return; } const m = Math.floor(left / 60000), sec = Math.floor(left / 1000) % 60; b.textContent = `${m}:${String(sec).padStart(2, '0')}`; b.classList.add('on'); b.classList.toggle('late', left === 0); };
    const timerSteps = [0, 3, 5, 10]; let ts = 0;
    const close = () => { stop3d?.(); clearInterval(timerT); document.removeEventListener('keydown', onKey); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); ov.remove(); document.body.classList.remove('presenting'); };
    const show3d = async () => {
      const box = $('.pr-3d', ov);
      if (!box.hidden) { stop3d?.(); stop3d = null; box.hidden = true; box.innerHTML = ''; slideEl.hidden = false; return; }
      slideEl.hidden = true; box.hidden = false; box.innerHTML = `<button class="pr-back">${t('pBack3d')}</button><div></div>`;
      $('.pr-back', box).onclick = show3d;
      stop3d = await NL.mount3D(box.lastElementChild, { sceneIds: L.scenes3d });
    };
    ov.addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      const k = b.dataset.p;
      if (k === 'next') next(); if (k === 'prev') prev(); if (k === 'exit') close();
      if (k === 'draw') setDraw(!drawing); if (k === 'clear') ctx.clearRect(0, 0, ink.width, ink.height);
      if (k === 'full') (document.fullscreenElement ? document.exitFullscreen() : ov.requestFullscreen?.())?.catch?.(() => {});
      if (k === 'timer') { ts = (ts + 1) % timerSteps.length; timerEnd = timerSteps[ts] ? Date.now() + timerSteps[ts] * 60000 : 0; clearInterval(timerT); if (timerEnd) timerT = setInterval(tick, 500); tick(); }
      if (k === '3d') show3d();
    });
    const rtl = document.documentElement.dir === 'rtl';
    const onKey = (e) => {
      if (e.target.closest?.('input,textarea,select') || !$('.pr-3d', ov).hidden && e.key !== 'Escape') return;
      if (e.key === 'Escape') { if (!$('.pr-3d', ov).hidden) return show3d(); return close(); }
      if (e.key === ' ' || e.key === 'PageDown' || e.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) { e.preventDefault(); next(); }
      if (e.key === 'PageUp' || e.key === (rtl ? 'ArrowRight' : 'ArrowLeft')) { e.preventDefault(); prev(); }
      if (e.key.toLowerCase() === 'd') setDraw(!drawing);
      if (e.key.toLowerCase() === 'f') (document.fullscreenElement ? document.exitFullscreen() : ov.requestFullscreen?.())?.catch?.(() => {});
    };
    document.addEventListener('keydown', onKey);
    addEventListener('resize', fitInk);
    render();
    return close;
  };

  /* ---------- editing an explanation ---------- */
  NL.editExplain = (host, data, { onSave, onReset, canReset }) => {
    const d = structuredClone(data || { intro: '', points: [], realLife: [], scientific: '', checks: [] });
    d.points ||= []; d.checks ||= []; d.realLife ||= [];
    const draw = () => {
      host.innerHTML = `<form class="editor panel" id="ed-form"><h3>${t('editT')}</h3><p class="fine">${NL.md(t('editHint')).replace(/<\/?p>/g, '')}</p>
        <label class="ctl"><span>${t('fIntro')}</span><textarea id="ed-intro" rows="3" dir="auto">${esc(d.intro || '')}</textarea></label>
        <fieldset class="ed-group"><legend>${t('fPoints')}</legend>${d.points.map((p, k) => `<div class="ed-item" data-pt="${k}"><input id="ed-pt-${k}" value="${esc(p.title)}" placeholder="${t('fPointT')}" dir="auto"><textarea rows="3" dir="auto" placeholder="${t('fPointB')}">${esc(p.body)}</textarea><button type="button" class="btn sm ghost" data-rm-pt="${k}">${t('fRemove')}</button></div>`).join('')}
          <button type="button" class="btn sm ghost" data-add-pt>+ ${t('fAddPoint')}</button></fieldset>
        <label class="ctl"><span>${t('fLife')}</span><textarea id="ed-life" rows="3" dir="auto">${esc(d.realLife.join('\n'))}</textarea></label>
        <label class="ctl"><span>${t('fSci')}</span><textarea id="ed-sci" rows="4" dir="auto">${esc(d.scientific || '')}</textarea></label>
        <fieldset class="ed-group"><legend>${t('fChecks')}</legend>${d.checks.map((c, k) => `<div class="ed-item" data-ck="${k}"><input id="ed-q-${k}" value="${esc(c.q)}" placeholder="${t('fQ')}" dir="auto">
            <div class="ed-opts">${[0, 1, 2, 3].map((o) => `<label class="ed-opt"><input type="radio" name="ed-c-${k}" value="${o}" ${+c.answer === o ? 'checked' : ''} aria-label="${t('fCorrect')}"><input class="ed-o" value="${esc(c.options?.[o] || '')}" placeholder="${t('fOpt', { n: o + 1 })}" dir="auto"></label>`).join('')}</div>
            <input class="ed-why" value="${esc(c.why || '')}" placeholder="${t('fWhy')}" dir="auto"><button type="button" class="btn sm ghost" data-rm-ck="${k}">${t('fRemove')}</button></div>`).join('')}
          <button type="button" class="btn sm ghost" data-add-ck>+ ${t('fAddQ')}</button></fieldset>
        <div class="row gap wrap"><button class="btn" type="submit">${t('fSave')}</button>${canReset ? `<button class="btn ghost" type="button" data-reset>${t('fReset')}</button>` : ''}<button class="btn ghost" type="button" data-cancel>${t('fCancel')}</button></div></form>`;
      const f = $('#ed-form', host);
      const collect = () => {
        d.intro = $('#ed-intro', f).value.trim(); d.scientific = $('#ed-sci', f).value.trim();
        d.realLife = $('#ed-life', f).value.split('\n').map((x) => x.trim()).filter(Boolean);
        d.points = $$('[data-pt]', f).map((el) => ({ title: $('input', el).value.trim(), body: $('textarea', el).value.trim() })).filter((p) => p.title || p.body);
        d.checks = $$('[data-ck]', f).map((el) => ({ q: $('input', el).value.trim(), options: $$('.ed-o', el).map((x) => x.value.trim()), answer: +($('input[type=radio]:checked', el)?.value || 0), why: $('.ed-why', el).value.trim() }))
          .filter((c) => c.q && c.options.filter(Boolean).length >= 2).map((c) => { const keep = c.options.map((o, k) => [o, k]).filter(([o]) => o); return { ...c, options: keep.map(([o]) => o), answer: Math.max(0, keep.findIndex(([, k]) => k === c.answer)) }; });
      };
      $('[data-add-pt]', f).onclick = () => { collect(); d.points.push({ title: '', body: '' }); draw(); };
      $('[data-add-ck]', f).onclick = () => { collect(); d.checks.push({ q: '', options: ['', '', '', ''], answer: 0, why: '' }); draw(); };
      $$('[data-rm-pt]', f).forEach((b) => (b.onclick = () => { collect(); d.points.splice(+b.dataset.rmPt, 1); draw(); }));
      $$('[data-rm-ck]', f).forEach((b) => (b.onclick = () => { collect(); d.checks.splice(+b.dataset.rmCk, 1); draw(); }));
      $('[data-cancel]', f).onclick = () => onSave(null);
      $('[data-reset]', f)?.addEventListener('click', onReset);
      f.onsubmit = (e) => { e.preventDefault(); collect(); onSave(d); };
    };
    draw();
  };

  /* ---------- question bank manager ---------- */
  NL.manageBank = (host, L, { onSave, onClose }) => {
    const bank = structuredClone(L.bank || []), a = L.analysis;
    const typeName = (q) => t('ty_' + q.type);
    const draw = () => {
      host.innerHTML = `<div class="panel bank"><div class="row gap wrap"><h3>${t('bankT')}</h3><span class="fine">${t('bankCount', { n: bank.length })}</span><button class="btn sm ghost" data-close style="margin-inline-start:auto">${t('close')}</button></div><p class="fine">${t('bankLead')}</p>
        <ol class="bank-list">${bank.map((q, k) => `<li data-k="${k}"><div class="row gap wrap"><span class="tag">${typeName(q)}</span><span class="tag">${esc(a.sections.find((s) => s.id === q.sectionId)?.title || '')}</span><button class="btn sm ghost" data-edit>${t('editPart').split(' ')[0]}</button><button class="btn sm ghost danger" data-del>${t('fRemove')}</button></div><div class="prose">${NL.md(q.q)}</div><div class="bank-edit" hidden></div></li>`).join('')}</ol>
        <div class="row gap wrap"><button class="btn sm" data-add="mcq">+ ${t('bankAdd')}</button><button class="btn sm ghost" data-add="tf">+ ${t('bankAddTf')}</button></div></div>`;
      $('[data-close]', host).onclick = onClose;
      $$('[data-add]', host).forEach((b) => (b.onclick = () => { bank.unshift(b.dataset.add === 'tf' ? { id: uid(), type: 'tf', diff: 'medium', sectionId: a.sections[0].id, q: '', answer: true, why: '' } : { id: uid(), type: 'mcq', diff: 'medium', sectionId: a.sections[0].id, q: '', options: ['', '', '', ''], answer: 0, why: '' }); draw(); openEdit(0); }));
      $$('[data-del]', host).forEach((b) => (b.onclick = () => { bank.splice(+b.closest('[data-k]').dataset.k, 1); onSave(bank); draw(); }));
      $$('[data-edit]', host).forEach((b) => (b.onclick = () => openEdit(+b.closest('[data-k]').dataset.k)));
    };
    const openEdit = (k) => {
      const q = bank[k], box = $(`[data-k="${k}"] .bank-edit`, host); box.hidden = false;
      box.innerHTML = `<form class="editor"><label class="ctl"><span>${t('fQ')}</span><textarea rows="2" dir="auto" id="bq-q">${esc(q.q)}</textarea></label>
        ${q.type === 'mcq' || q.type === 'graph' ? `<div class="ed-opts">${(q.options || []).concat(q.type === 'mcq' ? ['', '', '', ''] : []).slice(0, Math.max(4, q.options?.length || 0)).map((o, i) => `<label class="ed-opt"><input type="radio" name="bq-c" value="${i}" ${+q.answer === i ? 'checked' : ''}><input class="ed-o" value="${esc(o)}" placeholder="${t('fOpt', { n: i + 1 })}" dir="auto"></label>`).join('')}</div>` : ''}
        ${q.type === 'tf' ? `<div class="checks-row"><label class="check"><input type="radio" name="bq-tf" value="1" ${q.answer ? 'checked' : ''}> ${t('tfTrue')}</label><label class="check"><input type="radio" name="bq-tf" value="0" ${!q.answer ? 'checked' : ''}> ${t('tfFalse')}</label></div>` : ''}
        ${q.type === 'numeric' ? `<p class="fine">${NL.lang === 'ar' ? 'الناتج يُحسب تلقائيًا من القانون؛ عدّل نص السؤال فقط بما يطابق القيم.' : 'The answer is computed from the law; edit only the wording to match the values.'}</p>` : ''}
        <label class="ctl"><span>${t('lessonMap')}</span><select id="bq-sec">${a.sections.map((s) => `<option value="${s.id}" ${s.id === q.sectionId ? 'selected' : ''}>${esc(s.title)}</option>`).join('')}</select></label>
        <label class="ctl"><span>${t('fWhy')}</span><textarea rows="2" dir="auto" id="bq-why">${esc(q.why || q.modelAnswer || '')}</textarea></label>
        <div class="row gap"><button class="btn sm" type="submit">${t('fSave')}</button></div></form>`;
      $('form', box).onsubmit = (e) => {
        e.preventDefault();
        q.q = $('#bq-q', box).value.trim(); q.sectionId = $('#bq-sec', box).value;
        const sec = a.sections.find((s) => s.id === q.sectionId); if (sec && !sec.conceptIds.includes(q.conceptId)) q.conceptId = sec.conceptIds[0];
        if (q.type === 'conceptual') q.modelAnswer = $('#bq-why', box).value.trim(); else q.why = $('#bq-why', box).value.trim();
        if (q.type === 'mcq' || q.type === 'graph') { const opts = $$('.ed-o', box).map((x) => x.value.trim()); const ans = +($('input[name=bq-c]:checked', box)?.value || 0); const keep = opts.map((o, i) => [o, i]).filter(([o]) => o); q.options = keep.map(([o]) => o); q.answer = Math.max(0, keep.findIndex(([, i]) => i === ans)); }
        if (q.type === 'tf') q.answer = $('input[name=bq-tf]:checked', box)?.value === '1';
        if (!q.q || ((q.type === 'mcq' || q.type === 'graph') && q.options.length < 2)) return;
        onSave(bank); NL.toast(t('fSaved'), 'ok'); draw();
      };
    };
    draw();
  };

  /* ---------- printable worksheet ---------- */
  NL.printWorksheet = (L, questions) => {
    let root = $('#print-root'); if (!root) { root = document.createElement('div'); root.id = 'print-root'; document.body.append(root); }
    const letters = 'أبجد';
    const qHtml = (q, k) => {
      let body = `<p class="ws-q"><b>${k + 1}.</b> ${strip(NL.md(q.q))}</p>`;
      if (q.type === 'graph') body += `<div class="ws-graph">${NL.lineChart({ series: [{ pts: q.graph.points }], xLabel: q.graph.xLabel, yLabel: q.graph.yLabel, height: 200 })}</div>`;
      if (q.type === 'mcq' || q.type === 'graph') body += `<ol class="ws-opts">${q.options.map((o, i) => `<li><span>${letters[i] || i + 1})</span> ${strip(NL.md(String(o)))}</li>`).join('')}</ol>`;
      if (q.type === 'tf') body += `<p class="ws-tf">( ${t('tfTrue')} )     ( ${t('tfFalse')} )</p>`;
      if (q.type === 'numeric') body += `<div class="ws-lines"><div></div><div></div><div></div><p>${t('answer')}: .................. ${esc(q.unit || '')}</p></div>`;
      if (q.type === 'conceptual') body += `<div class="ws-lines"><div></div><div></div><div></div><div></div></div>`;
      return `<li class="ws-item">${body}</li>`;
    };
    const keyHtml = (q, k) => {
      const ans = q.type === 'tf' ? (q.answer ? t('tfTrue') : t('tfFalse')) : q.type === 'numeric' ? `${fmt(q.value, 4)} ${q.unit || ''}` : q.type === 'conceptual' ? q.modelAnswer : `${letters[+q.answer] || ''}) ${q.options[+q.answer]}`;
      return `<li><b>${k + 1}.</b> ${strip(NL.md(String(ans)))}${q.why && q.type !== 'conceptual' ? `<div class="ws-why">${strip(NL.md(q.why))}</div>` : ''}</li>`;
    };
    root.innerHTML = `<section class="ws-page" dir="${document.documentElement.dir}"><header><h1>${esc(L.title)}</h1><p>${esc(L.grade || '')}${L.unit ? ' · ' + esc(L.unit) : ''}</p><p class="ws-name">${t('wsName')}</p></header><ol class="ws-list">${questions.map(qHtml).join('')}</ol></section>
      <section class="ws-page ws-key" dir="${document.documentElement.dir}"><header><h1>${t('wsKey')}</h1><p>${esc(L.title)}</p></header><ol class="ws-keys">${questions.map(keyHtml).join('')}</ol></section>`;
    document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); removeEventListener('afterprint', done); };
    addEventListener('afterprint', done);
    setTimeout(() => window.print(), 300);
  };
})();
