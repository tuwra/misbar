/* Misbar views: shell, home, library, lesson intake and analysis. */
(function () {
  const { $, $$, esc, t, tt, fmt, uid, store, ai } = NL;
  const app = (NL.app = { route: 'home', lessons: [], loaded: false, cleanup: [] });

  NL.addT({
    howTitle: ['كيف يعمل', 'How it works'],
    how1: ['ارفع الدرس', 'Upload the lesson'], how1s: ['PDF أو صور أو عروض أو نص. رتّب الصفحات واحذف ما لا تحتاجه.', 'PDF, photos, slides or text. Reorder pages and drop what you do not need.'],
    how2: ['يقرأه مِسبار', 'Misbar reads it'], how2s: ['يستخرج النصوص والمعادلات والرسومات، ويطلب منك إعادة رفع الصفحة غير الواضحة.', 'It extracts text, equations and figures, and asks you to re-upload unclear pages.'],
    how3: ['تتعلّم بطريقتك', 'Learn your way'], how3s: ['شرح ومختبر واختبارات وبطاقات وخرائط، كلها من درسك.', 'Explanations, labs, quizzes, cards and maps, all from your lesson.'],
    everySubject: ['أدوات تتغير بحسب المادة', 'Tools that change with the subject'],
    sv_physics: ['مختبر محاكاة بحسابات حقيقية', 'Simulations with real calculations'], sv_math: ['راسم دوال ولوح معادلات وسبورة', 'Grapher, equation pad and whiteboard'], sv_chemistry: ['معمل غازات ومعايرة وتخفيف', 'Gas, titration and dilution bench'], sv_history: ['أطلس تفاعلي وخط زمني', 'Interactive atlas and timeline'],
    openBench: ['جرّب المختبر المفتوح', 'Try the open lab'], benchTitle: ['المختبر المفتوح', 'Open lab'], benchLead: ['كل تجارب الفيزياء متاحة هنا بدون درس. داخل الدرس تُختار التجارب المناسبة لمحتواه.', 'Every simulation is here without a lesson. Inside a lesson, the lab picks experiments that fit its content.'],
    benchMath: ['الرياضيات', 'Math'], benchTools: ['أدوات الحساب والرسم', 'Graphing and calculation tools'],
    filesBlocked: ['لا يمكن قراءة {n}. احفظه بصيغة {f} ثم ارفعه.', 'Cannot read {n}. Save it as {f} and upload again.'],
    fileFail: ['تعذّرت قراءة {n}: {m}', 'Could not read {n}: {m}'],
    unsupported: ['نوع الملف غير مدعوم: {n}', 'Unsupported file type: {n}'],
    pageFrom: ['{f} · ص {n}', '{f} · p.{n}'], textBlock: ['نص ملصق', 'Pasted text'],
    readFirst: ['اقرأ المادة أولًا', 'Read the material first'], tooMany: ['الحد الأقصى {n} صفحة للدرس الواحد.', 'Maximum {n} pages per lesson.'],
    analyzeFail: ['تعذّر التحليل: {m}', 'Analysis failed: {m}'], noReadable: ['لا توجد صفحة مقروءة للتحليل.', 'There is no readable page to analyze.'],
    editingLesson: ['تعديل محتوى: {t}', 'Editing content: {t}'], reanalyzeNote: ['عند إعادة التحليل يُحفظ تقدّمك ونتائجك، وتُعاد كتابة الشرح والملخصات.', 'Re-analyzing keeps your progress and results; explanations and summaries are rebuilt.'],
    replaceHint: ['اختر صورة أوضح لهذه الصفحة', 'Pick a clearer image for this page'], fix: ['صحّح', 'Fix'],
    imagesOff: ['قراءة الصور غير متاحة في هذا العرض. يمكنك رفع PDF نصي أو Word أو لصق النص.', 'Image reading is not available in this view. Upload a text PDF or Word file, or paste the text.'],
    statusReady: ['جاهز للتحليل', 'Ready to analyze'],
    readyMade: ['درس جاهز', 'Ready-made'],
    or: ['أو', 'or'], guestGo: ['ادخل كضيف', 'Continue as a guest'], guestName: ['ضيف', 'Guest'],
    guestNote: ['للطلاب: بدون اسم مستخدم ولا كلمة مرور. يُحفظ تقدّمك في هذا الجهاز.', 'For students: no username or password. Your progress is saved on this device.'],
    homeStyles: ['تعلّم بالطريقة التي تناسبك', 'Learn the way that suits you'],
    hs_v: ['فيديو مشروح ومجسمات ثلاثية الأبعاد تتحرك أمامك، وخرائط مفاهيم ملوّنة.', 'Narrated video, moving 3D models and colourful concept maps.'],
    hs_a: ['كل جزء من الدرس يُقرأ لك بصوت مسموع مع تظليل النص، وفيديو بتعليق صوتي.', 'Every part of the lesson read aloud with highlighting, plus a narrated video.'],
    hs_k: ['مختبر محاكاة تغيّر فيه المتغيرات بيدك، ونشاطات سحب وإفلات، وسبورة للكتابة.', 'A simulation lab where you change variables by hand, drag-and-sort activities and a whiteboard.'],
  });

  /* ---------- shell ---------- */
  NL.renderShell = () => {
    $('#brand-name').textContent = t('brand');
    const ck = $('#cr-k'); if (ck) ck.textContent = t('creditsK');
    $('#nav-home').textContent = t('home');
    $('#nav-lib').textContent = t('library');
    $('#lang-btn').textContent = t('lang');
    $('#theme-btn').setAttribute('aria-label', t('theme'));
    $('#theme-btn').dataset.mode = NL.themePref;
    $('#theme-label').textContent = t('theme' + NL.themePref[0].toUpperCase() + NL.themePref.slice(1));
    const st = $('#status-store'), sa = $('#status-ai');
    st.className = 'pill ' + (store.mode === 'pending' ? '' : 'ok');
    st.querySelector('span').textContent = store.mode === 'pending' ? t('storagePending') : t('storageLocal');
    st.title = t('storageLocalHint');
    sa.className = 'pill ' + (ai.ready ? 'ok' : 'warn');
    const pick = ai.ready && ai.claude;
    sa.querySelector('span').textContent = ai.ready ? t('aiOn') + (pick ? ' · ' + (ai.provider === 'claude' ? 'Claude' : 'Gemini') : '') : t('aiOff');
    sa.title = pick ? t('provSwitch') : ai.ready ? '' : t(ai.needCode ? 'codeS' : ai.unreachable ? 'aiUnreachable' : 'aiNotConfigured');
    sa.classList.toggle('prov', pick);
    sa.onclick = pick ? () => { ai.provider = ai.provider === 'claude' ? 'gemini' : 'claude'; drawGo(); } : null;
    const ban = $('#ai-banner');
    if (ban) { const show = ai.checked && !ai.ready; ban.hidden = !show; if (show) ban.innerHTML = ai.offHtml(); }
    const who = $('#who');
    if (who) { who.hidden = !NL.auth.user; who.querySelector('span').textContent = NL.auth.isGuest() ? t('guestName') : NL.auth.user || ''; who.title = t('signOut'); }
    $$('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.r === app.route || (a.dataset.r === 'library' && app.route === 'lesson')));
  };

  NL.go = (route, params = {}) => {
    app.cleanup.forEach((f) => { try { f(); } catch {} }); app.cleanup = [];
    app.route = route; app.params = params;
    const hash = route === 'lesson' ? 'l-' + params.id : route === 'home' ? '' : route;
    try { history.replaceState(null, '', hash ? '#' + hash : location.pathname); } catch {}
    window.scrollTo({ top: 0 });
    NL.renderShell();
    const v = $('#view'); v.className = 'view r-' + route; v.innerHTML = '';
    if (NL.auth.required && !NL.auth.user) { app.route = route = 'login'; v.className = 'view r-login'; }
    document.body.classList.toggle('is-login', route === 'login');
    ({ login: renderLogin, home: renderHome, library: renderLibrary, new: renderIntake, lesson: NL.renderLesson, bench: renderBench })[route]?.(v, params);
    v.focus({ preventScroll: true });
  };

  NL.loadLessons = async () => {
    try { app.lessons = await store.listLessons(); } catch (e) { console.error(e); app.lessons = []; }
    app.loaded = true;
    NL.emit('lessons');
  };

  /* ---------- progress, computed only from saved activity ---------- */
  NL.deckSize = (a) => (a?.concepts?.length || 0) + (a?.laws?.length || 0) + (a?.laws || []).reduce((n, l) => n + (l.symbols?.length || 0), 0) + (a?.misconceptions?.length || 0);
  NL.progress = (lesson, s) => {
    const a = lesson.analysis; if (!a) return { pct: 0, status: 'draft', parts: {} };
    s = s || lesson.stats || {};
    const secs = a.sections?.length || 0;
    const parts = {
      explain: secs ? Math.min(1, Object.keys(s.sectionsDone || {}).length / secs) : 0,
      quiz: (s.bestQuiz || 0) / 100,
      cards: NL.deckSize(a) ? Math.min(1, (s.cardsMastered || 0) / NL.deckSize(a)) : 0,
      labs: Math.min(1, Object.keys(s.labsUsed || {}).length / Math.max(1, Math.min(2, (a.labs || []).length || 1))),
      practice: Math.min(1, ((s.solverCount || 0) + (s.coachCount || 0)) / 3),
    };
    const W = { explain: 35, quiz: 30, cards: 15, labs: 10, practice: 10 };
    const pct = Math.round(Object.keys(W).reduce((n, k) => n + parts[k] * W[k], 0));
    const any = s.activity > 0;
    return { pct, parts, W, status: !any ? 'not' : pct >= 85 ? 'done' : 'prog' };
  };
  const statusLabel = (st) => ({ not: t('stNot'), prog: t('stProg'), done: t('stDone'), draft: t('stDraft') })[st];

  /* ---------- covers: subject art drawn from the lesson id (deterministic, no stock images) ---------- */
  NL.coverSvg = (lesson) => {
    const seed = [...lesson.id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7), rnd = (i) => ((Math.sin(seed + i * 99.13) + 1) / 2);
    const s = lesson.subject, W = 320, H = 150; let g = '';
    if (s === 'physics') { for (let i = 0; i < 4; i++) g += `<ellipse cx="${200 + rnd(i) * 60}" cy="${75}" rx="${40 + i * 26}" ry="${14 + i * 9}" transform="rotate(${-20 + rnd(i + 9) * 40} 230 75)" class="cv-l"/>`; g += `<circle cx="230" cy="75" r="9" class="cv-a"/><circle cx="${150 + rnd(3) * 40}" cy="${50 + rnd(4) * 50}" r="4" class="cv-s"/>`; }
    else if (s === 'math') { let d = ''; for (let x = 0; x <= W; x += 6) d += `${x ? 'L' : 'M'}${x},${75 - Math.sin(x / (22 + rnd(1) * 20)) * (30 + rnd(2) * 20) * Math.cos(x / 140)}`; g += `<path d="${d}" class="cv-a" fill="none" stroke-width="2.5"/>`; for (let x = 20; x < W; x += 30) g += `<line x1="${x}" x2="${x}" y1="0" y2="${H}" class="cv-g"/>`; for (let y = 15; y < H; y += 30) g += `<line y1="${y}" y2="${y}" x1="0" x2="${W}" class="cv-g"/>`; }
    else if (s === 'chemistry') { for (let i = 0; i < 7; i++) { const cx = 170 + (i % 4) * 36 + (Math.floor(i / 4) % 2) * 18, cy = 40 + Math.floor(i / 4) * 32 + rnd(i) * 8; g += `<polygon points="${[0, 1, 2, 3, 4, 5].map((k) => `${cx + 17 * Math.cos(k * Math.PI / 3)},${cy + 17 * Math.sin(k * Math.PI / 3)}`).join(' ')}" class="cv-l"/>`; } g += `<circle cx="${190 + rnd(5) * 80}" cy="${60 + rnd(6) * 40}" r="6" class="cv-a"/>`; }
    else if (s === 'history' || s === 'geography') { for (let i = 0; i < 6; i++) { let d = ''; for (let x = 0; x <= W; x += 10) d += `${x ? 'L' : 'M'}${x},${20 + i * 22 + Math.sin(x / 30 + i + rnd(i) * 3) * 8}`; g += `<path d="${d}" class="cv-l" fill="none"/>`; } g += `<circle cx="${180 + rnd(2) * 90}" cy="${50 + rnd(3) * 50}" r="6" class="cv-a"/><circle cx="${180 + rnd(2) * 90}" cy="${50 + rnd(3) * 50}" r="14" class="cv-l"/>`; }
    else if (s === 'biology') { for (let i = 0; i < 18; i++) { const y = 10 + i * 7.5, a = Math.sin(i / 2.4 + rnd(1)) * 34; g += `<line x1="${230 - a}" x2="${230 + a}" y1="${y}" y2="${y}" class="cv-l"/><circle cx="${230 - a}" cy="${y}" r="2.6" class="cv-a"/><circle cx="${230 + a}" cy="${y}" r="2.6" class="cv-s"/>`; } }
    else { for (let i = 0; i < 5; i++) g += `<rect x="${160 + i * 24}" y="${30 + rnd(i) * 30}" width="14" height="${50 + rnd(i + 3) * 40}" rx="3" class="cv-l"/>`; }
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" class="cover-art s-${esc(s)}" aria-hidden="true">${g}</svg>`;
  };

  /* ---------- sign-in ---------- */
  function renderLogin(v) {
    v.innerHTML = `<section class="login">
      <canvas class="hero-field" aria-hidden="true"></canvas>
      <form class="login-card" id="login-form" autocomplete="on">
        <svg class="login-mark" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="none" stroke="var(--line-2)" stroke-width="1.5"/><ellipse cx="16" cy="16" rx="14" ry="5.5" fill="none" stroke="var(--signal)" stroke-width="1.6" transform="rotate(-28 16 16)"/><circle cx="16" cy="16" r="4.2" fill="var(--accent)"/><circle cx="27.4" cy="10" r="2.1" fill="var(--signal)"/></svg>
        <h1>${t('loginT')}</h1><p class="lead-sm">${t('loginS')}</p>
        <label class="ctl"><span>${t('username')}</span><input id="login-user" name="username" autocomplete="username" autocapitalize="off" spellcheck="false" dir="ltr" required></label>
        <label class="ctl"><span>${t('password')}<button type="button" class="link" id="pw-toggle">${t('showPw')}</button></span><input id="login-pass" name="password" type="password" autocomplete="current-password" dir="ltr" required></label>
        <p class="login-err bad" id="login-err" role="alert" hidden></p>
        <button class="btn big" type="submit" id="login-go">${t('signIn')}</button>
        ${NL.auth.guests ? `<div class="login-or"><span>${t('or')}</span></div><button class="btn big ghost" type="button" id="login-guest">${t('guestGo')}</button><p class="fine">${t('guestNote')}</p>` : ''}
        <p class="fine">${t('loginNote')}</p>
      </form></section>`;
    app.cleanup.push(heroField($('.hero-field', v)));
    const pass = $('#login-pass', v), err = $('#login-err', v), go = $('#login-go', v);
    $('#pw-toggle', v).onclick = (e) => { const show = pass.type === 'password'; pass.type = show ? 'text' : 'password'; e.target.textContent = t(show ? 'hidePw' : 'showPw'); };
    $('#login-user', v).focus();
    const enter = async () => { await NL.store.init(); await NL.loadLessons(); NL.ai.init(); NL.go('home'); };
    $('#login-guest', v)?.addEventListener('click', async (e) => {
      err.hidden = true; e.target.disabled = true;
      try { await NL.auth.signInGuest(); await enter(); }
      catch { err.hidden = false; err.textContent = t('loginErr_network'); e.target.disabled = false; }
    });
    $('#login-form', v).onsubmit = async (e) => {
      e.preventDefault(); err.hidden = true; go.disabled = true; go.textContent = t('signingIn');
      try {
        await NL.auth.signIn($('#login-user', v).value.trim(), pass.value);
        await NL.store.init(); await NL.loadLessons(); NL.ai.init();
        NL.go('home');
      } catch (x) {
        err.hidden = false; err.textContent = t('loginErr_' + (['bad_login', 'rate_limited'].includes(x?.code) ? x.code : 'network'));
        go.disabled = false; go.textContent = t('signIn'); pass.select();
      }
    };
  }

  /* ---------- home ---------- */
  function renderHome(v) {
    const n = app.lessons.length;
    v.innerHTML = `
      <section class="hero">
        <canvas class="hero-field" aria-hidden="true"></canvas>
        <div class="hero-copy">
          <p class="eyebrow">${t('brand')} · ${NL.lang === 'ar' ? 'منصة تعلّم ذكية' : 'AI learning platform'}</p>
          <h1>${t('tagline')}</h1>
          <p class="lead">${t('heroSub')}</p>
        </div>
        <div class="choices">
          <a class="choice primary" href="#new" data-go="new">
            <span class="choice-icon">${icon('plus')}</span>
            <span class="choice-t">${t('newLesson')}</span><span class="choice-s">${t('newLessonSub')}</span>
            <span class="choice-go">${icon('arrow')}</span>
          </a>
          <a class="choice" href="#library" data-go="library">
            <span class="choice-icon">${icon('books')}</span>
            <span class="choice-t">${t('myLessons')}</span><span class="choice-s">${app.loaded ? (n ? t('lessonsCount', { n }) + ' · ' + t('myLessonsSub') : t('emptyLibT')) : t('storagePending')}</span>
            <span class="choice-go">${icon('arrow')}</span>
          </a>
        </div>
        <p class="store-note">${icon('device')} <span>${store.mode === 'pending' ? t('storagePending') : t('storageLocalHint')}</span></p>
      </section>
      <section class="home-recent" ${n ? '' : 'hidden'}>
        <div class="sec-head"><h2>${t('recent')}</h2><a href="#library" data-go="library" class="link">${t('viewAll')}</a></div>
        <div class="cards-row">${app.lessons.slice().sort((a, b) => (b.lastActivity?.at || b.createdAt) - (a.lastActivity?.at || a.createdAt)).slice(0, 3).map(lessonCard).join('')}</div>
      </section>
      <section class="how">
        <h2>${t('howTitle')}</h2>
        <ol class="how-steps">${[1, 2, 3].map((i) => `<li><span class="how-n">${i}</span><div><h3>${t('how' + i)}</h3><p>${t('how' + i + 's')}</p></div></li>`).join('')}</ol>
      </section>
      <section class="subjects">
        <h2>${t('homeStyles')}</h2>
        <div class="vak-cards">${['v', 'a', 'k'].map((k) => `<div class="vak-card vk-${k}"><div class="vak-ic">${NL.styleIcon(k)}</div><h3>${t('st_' + k)}</h3><p>${t('hs_' + k)}</p></div>`).join('')}</div>
        <a class="btn ghost" href="#bench" data-go="bench">${t('openBench')} ${icon('arrow')}</a>
      </section>`;
    bindGo(v); bindCards(v);
    app.cleanup.push(heroField($('.hero-field', v)));
    app.cleanup.push(NL.on('lessons', () => app.route === 'home' && NL.go('home')));
  }

  // ambient field: charges and their field lines, drawn once per frame, still when reduced motion is on
  function heroField(cv) {
    const ctx = cv.getContext('2d'); let raf, W, H;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fit = () => { const b = cv.getBoundingClientRect(), d = devicePixelRatio || 1; W = b.width; H = b.height; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    const ro = new ResizeObserver(fit); ro.observe(cv); fit();
    const charges = [{ x: 0.78, y: 0.32, q: 1 }, { x: 0.9, y: 0.75, q: -1 }, { x: 0.62, y: 0.82, q: 1 }];
    const frame = (time) => {
      const c = NL.pal(); ctx.clearRect(0, 0, W, H);
      const ch = charges.map((p, i) => ({ x: (p.x + Math.sin(time / 4000 + i) * 0.015) * W, y: (p.y + Math.cos(time / 5000 + i) * 0.02) * H, q: p.q }));
      ctx.lineWidth = 1;
      ch.filter((p) => p.q > 0).forEach((p) => {
        for (let k = 0; k < 18; k++) {
          let x = p.x + Math.cos(k / 18 * Math.PI * 2) * 6, y = p.y + Math.sin(k / 18 * Math.PI * 2) * 6;
          ctx.beginPath(); ctx.moveTo(x, y);
          for (let s = 0; s < 160; s++) {
            let ex = 0, ey = 0; for (const o of ch) { const dx = x - o.x, dy = y - o.y, r2 = dx * dx + dy * dy + 30, r = Math.sqrt(r2); ex += o.q * dx / (r2 * r); ey += o.q * dy / (r2 * r); }
            const m = Math.hypot(ex, ey) || 1; x += ex / m * 6; y += ey / m * 6; ctx.lineTo(x, y);
            if (x < -20 || y < -20 || x > W + 20 || y > H + 20 || ch.some((o) => o.q < 0 && Math.hypot(x - o.x, y - o.y) < 6)) break;
          }
          ctx.strokeStyle = c.line; ctx.globalAlpha = 0.9; ctx.stroke(); ctx.globalAlpha = 1;
        }
      });
      ch.forEach((p) => { ctx.fillStyle = p.q > 0 ? c.acc : c.sig; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 7); ctx.fill(); });
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }

  /* ---------- library ---------- */
  function lessonCard(l) {
    const p = NL.progress(l), st = l.status === 'draft' ? 'draft' : p.status;
    return `<article class="lcard" data-id="${esc(l.id)}">
      <a class="lcard-cover s-${esc(l.subject)}" href="#l-${esc(l.id)}" data-open="${esc(l.id)}" aria-label="${esc(l.title)}">
        ${l.cover ? `<img src="${l.cover}" alt="" loading="lazy">` : NL.coverSvg(l)}
        <span class="badge st-${st}">${statusLabel(st)}</span>${l.builtin ? `<span class="badge st-ready">${t('readyMade')}</span>` : ''}
      </a>
      <div class="lcard-body">
        <p class="lcard-meta"><span class="subj-dot s-${esc(l.subject)}"></span>${esc(NL.subjectName(l.subject))}${l.unit ? ' · ' + esc(l.unit) : ''}</p>
        <h3 class="lcard-title" data-title>${esc(l.title)}</h3>
        ${st === 'draft' ? `<p class="fine">${t('emptyLibS')}</p>` : `<div class="meter" role="progressbar" aria-valuenow="${p.pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${p.pct}%"></span></div>
        <p class="lcard-prog"><b>${p.pct}%</b> ${t('progress')}</p>`}
        <dl class="lcard-dates"><div><dt>${t('created')}</dt><dd>${NL.date(l.createdAt)}</dd></div><div><dt>${t('lastAct')}</dt><dd>${l.lastActivity?.at ? NL.ago(l.lastActivity.at) : t('never')}</dd></div></dl>
        <div class="lcard-actions">
          <button class="btn sm" data-open="${esc(l.id)}">${l.lastActivity?.at ? t('resume') : t('open')}</button>
          ${l.builtin ? `<span class="fine">${esc(l.grade || '')}</span>` : `<div class="menu"><button class="icon-btn" data-menu aria-label="${NL.lang === 'ar' ? 'خيارات' : 'Options'}" aria-haspopup="true">${icon('dots')}</button>
            <div class="menu-pop" hidden>
              <button data-act="rename">${t('rename')}</button>
              <button data-act="edit">${t('editContent')}</button>
              <button data-act="regen" ${l.status === 'draft' ? 'disabled' : ''}>${t('regen')}</button>
              <button data-act="delete" class="danger">${t('delete')}</button>
            </div></div>`}
        </div>
        <div class="confirm" hidden></div>
      </div>
    </article>`;
  }
  function bindCards(root) {
    root.addEventListener('click', async (e) => {
      const open = e.target.closest('[data-open]'); if (open) { e.preventDefault(); NL.go('lesson', { id: open.dataset.open }); return; }
      const mb = e.target.closest('[data-menu]');
      $$('.menu-pop', root).forEach((m) => { if (!mb || m !== mb.nextElementSibling) m.hidden = true; });
      if (mb) { const pop = mb.nextElementSibling; pop.hidden = !pop.hidden; return; }
      const act = e.target.closest('[data-act]'); if (!act) return;
      const card = act.closest('.lcard'), id = card.dataset.id, l = app.lessons.find((x) => x.id === id);
      act.closest('.menu-pop').hidden = true;
      const box = $('.confirm', card);
      if (act.dataset.act === 'rename') {
        box.hidden = false; box.innerHTML = `<label class="ctl"><span>${t('rename')}</span><input id="rn-${id}" value="${esc(l.title)}"></label><div class="row gap"><button class="btn sm" data-ok>${t('save')}</button><button class="btn sm ghost" data-no>${t('cancel')}</button></div>`;
        const inp = $('input', box); inp.focus(); inp.select();
        const done = async () => { const v2 = inp.value.trim(); if (v2) { l.title = v2; $('[data-title]', card).textContent = v2; await store.putLesson(l); NL.toast(t('saved'), 'ok'); } box.hidden = true; };
        $('[data-ok]', box).onclick = done; inp.onkeydown = (ev) => { if (ev.key === 'Enter') done(); if (ev.key === 'Escape') box.hidden = true; };
        $('[data-no]', box).onclick = () => (box.hidden = true);
      }
      if (act.dataset.act === 'edit') NL.go('new', { edit: id });
      if (act.dataset.act === 'regen') {
        await store.putPart(id, 'gen', {}); NL.toast(t('regenDone'), 'ok');
      }
      if (act.dataset.act === 'delete') {
        box.hidden = false; box.className = 'confirm danger';
        box.innerHTML = `<p>${esc(t('delAsk', { t: l.title }))}</p><div class="row gap"><button class="btn sm danger" data-ok>${t('delete')}</button><button class="btn sm ghost" data-no>${t('cancel')}</button></div>`;
        $('[data-no]', box).onclick = () => { box.hidden = true; box.className = 'confirm'; };
        $('[data-ok]', box).onclick = async () => { card.classList.add('leaving'); await store.deleteLesson(l); app.lessons = app.lessons.filter((x) => x.id !== id); NL.emit('lessons'); };
      }
    });
  }

  function renderLibrary(v) {
    const prefs = NL.lsGet('libprefs', { q: '', subj: '', unit: '', sort: 'recent' });
    v.innerHTML = `<div class="page-head"><div><h1>${t('libTitle')}</h1><p class="lead-sm" id="lib-count"></p></div>
        <div class="row gap wrap"><button class="btn ghost sm" id="bk-export">${icon('down')} ${t('exportB')}</button><label class="btn ghost sm">${icon('up')} ${t('importB')}<input type="file" accept="application/json,.json" id="bk-import" hidden></label><a class="btn" href="#new" data-go="new">${icon('plus')} ${t('newLesson')}</a></div></div>
      <div class="filters">
        <label class="search">${icon('search')}<input id="lib-q" type="search" placeholder="${t('search')}" value="${esc(prefs.q)}" aria-label="${t('search')}"></label>
        <select id="lib-subj" hidden aria-label="${t('subject')}"><option value="">${t('allSubjects')}</option>${NL.SUBJECTS.map((s) => `<option value="${s}">${NL.subjectName(s)}</option>`).join('')}</select>
        <select id="lib-unit" aria-label="${t('unit')}"></select>
        <select id="lib-sort" aria-label="sort"><option value="recent">${t('sortRecent')}</option><option value="created">${t('sortCreated')}</option><option value="name">${t('sortName')}</option><option value="progress">${t('sortProgress')}</option></select>
      </div>
      <div class="lib-grid" id="lib-grid"></div>`;
    bindGo(v);
    $('#bk-export', v).onclick = async () => {
      const data = await store.exportAll();
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
      a.download = `misbar-backup-${new Date().toISOString().slice(0, 10)}.json`; document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000); NL.toast(t('exported'), 'ok');
    };
    $('#bk-import', v).onchange = async (e) => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      try { const n = await store.importAll(JSON.parse(await f.text())); NL.toast(t('imported', { n }), 'ok'); await NL.loadLessons(); }
      catch { NL.toast(t('importBad'), 'bad'); }
    };
    const grid = $('#lib-grid', v); bindCards(grid);
    $('#lib-subj', v).value = prefs.subj; $('#lib-sort', v).value = prefs.sort;
    const draw = () => {
      const q = $('#lib-q', v).value.trim().toLowerCase(), subj = $('#lib-subj', v).value, sort = $('#lib-sort', v).value;
      const units = [...new Set(app.lessons.filter((l) => !subj || l.subject === subj).map((l) => l.unit).filter(Boolean))];
      const us = $('#lib-unit', v), keep = us.value || prefs.unit;
      us.innerHTML = `<option value="">${t('allUnits')}</option>` + units.map((u) => `<option>${esc(u)}</option>`).join('');
      us.value = units.includes(keep) ? keep : '';
      const unit = us.value;
      NL.lsSet('libprefs', { q, subj, unit, sort });
      let list = app.lessons.filter((l) => (!subj || l.subject === subj) && (!unit || l.unit === unit) && (!q || [l.title, l.unit, l.chapter, ...(l.analysis?.concepts || []).map((c) => c.name)].join(' ').toLowerCase().includes(q)));
      const key = { recent: (l) => -(l.lastActivity?.at || l.createdAt), created: (l) => -l.createdAt, name: (l) => l.title, progress: (l) => -NL.progress(l).pct }[sort];
      list.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
      $('#lib-count', v).textContent = app.loaded ? t('lessonsCount', { n: app.lessons.length }) : t('storagePending');
      if (!app.loaded) { grid.innerHTML = `<div class="skeleton-row">${'<div class="sk"></div>'.repeat(3)}</div>`; return; }
      if (!app.lessons.length) { grid.innerHTML = emptyLibrary(); bindGo(grid); return; }
      grid.innerHTML = list.length ? list.map(lessonCard).join('') : `<div class="empty-mini">${t('noMatch')}</div>`;
    };
    ['#lib-q', '#lib-subj', '#lib-unit', '#lib-sort'].forEach((s) => $(s, v).addEventListener('input', draw));
    draw();
    app.cleanup.push(NL.on('lessons', draw));
  }
  function emptyLibrary() {
    return `<div class="empty">
      <svg viewBox="0 0 240 150" class="empty-art" aria-hidden="true"><ellipse cx="120" cy="80" rx="96" ry="30" class="cv-l"/><ellipse cx="120" cy="80" rx="60" ry="52" class="cv-l" transform="rotate(30 120 80)"/><circle cx="120" cy="80" r="11" class="cv-a"/><circle cx="208" cy="72" r="5" class="cv-s"/><rect x="92" y="112" width="56" height="8" rx="4" class="cv-g"/></svg>
      <h2>${t('emptyLibT')}</h2><p>${t('emptyLibS')}</p><a class="btn" href="#new" data-go="new">${icon('plus')} ${t('newLesson')}</a></div>`;
  }

  /* ---------- open lab bench (no lesson needed) ---------- */
  function renderBench(v) {
    const groups = [['physics', Object.values(NL.LABS).filter((l) => l.subject === 'physics')]];
    v.innerHTML = `<div class="page-head"><div><h1>${t('benchTitle')}</h1><p class="lead-sm">${t('benchLead')}</p></div></div>
      <div class="bench-pick">${groups.map(([s, labs]) => `<div><h3>${NL.subjectName(s)}</h3><div class="chips">${labs.map((l) => `<button class="chip" data-lab="${l.id}">${esc(tt(l.title))}</button>`).join('')}</div></div>`).join('')}
        <div><h3>${t('benchTools')}</h3><div class="chips"><button class="chip" data-lab="grapher">${t('grTitle')}</button><button class="chip" data-lab="pad">${t('padTitle')}</button><button class="chip" data-lab="board">${t('tab_board')}</button></div></div></div>
      <div id="bench-stage"></div>`;
    let stop = null;
    const open = (id) => {
      stop?.(); const host = $('#bench-stage', v); $$('[data-lab]', v).forEach((b) => b.classList.toggle('on', b.dataset.lab === id));
      if (id === 'grapher') { host.innerHTML = `<h2 class="lab-title">${t('grTitle')}</h2><p class="lead-sm">${t('grLead')}</p><div></div>`; stop = NL.mountGrapher(host.lastElementChild); }
      else if (id === 'pad') { host.innerHTML = `<h2 class="lab-title">${t('padTitle')}</h2><p class="lead-sm">${t('padLead')}</p><div></div>`; NL.mountPad(host.lastElementChild); stop = null; }
      else if (id === 'board') { host.innerHTML = `<h2 class="lab-title">${t('tab_board')}</h2><div></div>`; const b = NL.mountBoard(host.lastElementChild); stop = b.destroy; }
      else { host.innerHTML = `<h2 class="lab-title">${esc(tt(NL.LABS[id].title))}</h2><div></div>`; stop = NL.mountLab(host.lastElementChild, NL.LABS[id]); }
    };
    $$('[data-lab]', v).forEach((b) => (b.onclick = () => open(b.dataset.lab)));
    open('motion');
    app.cleanup.push(() => stop?.());
  }

  /* ---------- intake: add, read, review, analyze ---------- */
  const intake = (NL.intake = { pages: [], title: '', subject: '', unit: '', edit: null, phase: 'add', textLayerOnly: false });

  async function renderIntake(v, params) {
    if (params.edit && intake.edit !== params.edit) {
      const l = await store.getLesson(params.edit); if (!l) return NL.go('library');
      const pages = await store.getPages(l.id, l.pageCount || 0);
      Object.assign(intake, { edit: l.id, title: l.title, subject: l.subject, unit: l.unit || '', phase: 'review', pages: pages.map((p) => ({ id: uid(), label: p.label, kind: p.kind || 'text', text: p.text, status: p.quality === 'good' || !p.quality ? 'ok' : p.quality === 'blank' ? 'empty' : 'weak', issue: p.issue, thumb: p.thumb, image: p.image, stored: true })) });
    } else if (!params.edit && intake.edit) Object.assign(intake, { pages: [], title: '', subject: '', unit: '', edit: null, phase: 'add' });
    const editing = intake.edit ? app.lessons.find((l) => l.id === intake.edit) : null;
    v.innerHTML = `
      <div class="page-head"><div><a href="#${editing ? 'library' : ''}" data-go="${editing ? 'library' : 'home'}" class="link back">${icon('back')} ${t('back')}</a>
        <h1>${editing ? esc(t('editingLesson', { t: editing.title })) : t('intakeTitle')}</h1><p class="lead-sm">${editing ? t('reanalyzeNote') : t('intakeLead')}</p></div></div>
      <ol class="steps" id="steps">${['stepAdd', 'stepRead', 'stepReview', 'stepAnalyze'].map((k, i) => `<li data-s="${i}">${t(k)}</li>`).join('')}</ol>
      <div class="intake">
        <div class="intake-main">
          <div class="drop" id="drop" tabindex="0">
            <div class="drop-art">${icon('upload')}</div>
            <p class="drop-t">${t('dropTitle')}</p><p class="drop-s">${t('dropSub')}</p>
            <div class="row gap wrap center">
              <label class="btn">${t('browse')}<input type="file" id="file-in" multiple accept=".pdf,.docx,.pptx,.txt,.md,image/*" hidden></label>
              <label class="btn ghost">${icon('camera')} ${t('takePhoto')}<input type="file" id="cam-in" accept="image/*" capture="environment" hidden></label>
            </div>
            <p class="fine imgs-off" hidden>${t('imagesOff')}</p>
          </div>
          <details class="paste"><summary>${icon('text')} ${t('pasteText')}</summary>
            <textarea id="paste-in" rows="7" placeholder="${t('pastePh')}"></textarea>
            <button class="btn sm" id="paste-add">${t('addText')}</button></details>
          <div id="pdf-range"></div>
          <section class="material">
            <div class="sec-head"><h2>${t('material')}</h2><span class="fine" id="mat-count"></span></div>
            <div class="pages" id="pages"></div>
          </section>
        </div>
        <aside class="intake-side">
          <div class="panel">
            <label class="ctl"><span>${t('lessonTitle')}</span><input id="in-title" value="${esc(intake.title)}" placeholder="${t('lessonTitlePh')}"></label>
            <label class="ctl" hidden><span>${t('subject')}</span><select id="in-subj"><option value="">${t('autoDetect')}</option>${NL.SUBJECTS.map((s) => `<option value="${s}" ${intake.subject === s ? 'selected' : ''}>${NL.subjectName(s)}</option>`).join('')}</select></label>
            <label class="ctl"><span>${t('unit')}</span><input id="in-unit" value="${esc(intake.unit)}" placeholder="${t('unitPh')}"></label>
            <div class="go-area" id="go-area"></div>
          </div>
          ${editing ? '' : `<details class="panel title-only"><summary>${t('titleOnly')}</summary><p class="fine">${t('titleOnlyHint')}</p><button class="btn ghost sm" id="draft-btn">${t('createDraft')}</button></details>`}
        </aside>
      </div>`;
    bindGo(v);
    const sync = () => { intake.title = $('#in-title', v).value; intake.subject = $('#in-subj', v).value; intake.unit = $('#in-unit', v).value; };
    ['#in-title', '#in-subj', '#in-unit'].forEach((s) => $(s, v).addEventListener('input', sync));
    if (ai.ready && !ai.images) $('.imgs-off', v).hidden = false;
    const fin = $('#file-in', v), cam = $('#cam-in', v), drop = $('#drop', v);
    fin.onchange = () => { addFiles([...fin.files]); fin.value = ''; };
    cam.onchange = () => { addFiles([...cam.files]); cam.value = ''; };
    drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('over'));
    drop.addEventListener('drop', (e) => { e.preventDefault(); drop.classList.remove('over'); addFiles([...e.dataTransfer.files]); });
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fin.click(); } });
    document.addEventListener('paste', onPaste); app.cleanup.push(() => document.removeEventListener('paste', onPaste));
    $('#paste-add', v).onclick = () => { const s = $('#paste-in', v).value.trim(); if (!s) return; s.split(/\n{3,}/).length; addTextPages(s, t('textBlock')); $('#paste-in', v).value = ''; };
    $('#draft-btn', v)?.addEventListener('click', createDraft);
    drawPages();
  }
  function onPaste(e) {
    const files = [...(e.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
    if (files.length && app.route === 'new') { e.preventDefault(); addFiles(files); }
  }
  function addTextPages(text, label) {
    const chunks = text.length > 4000 ? text.match(/[\s\S]{1,3800}(\n|$)/g) : [text];
    chunks.forEach((c, i) => intake.pages.push({ id: uid(), kind: 'text', label: chunks.length > 1 ? `${label} ${i + 1}` : label, text: c.trim(), status: 'ok' }));
    intake.phase = 'review'; drawPages();
  }

  async function addFiles(files) {
    for (const f of files) {
      const kind = NL.reader.kindOf(f);
      try {
        if (kind === 'legacy') { NL.toast(t('filesBlocked', { n: f.name, f: f.name.endsWith('.doc') ? '.docx' : '.pptx' }), 'warn'); continue; }
        if (kind === 'unknown') { NL.toast(t('unsupported', { n: f.name }), 'warn'); continue; }
        if (kind === 'pdf') {
          const pdf = await NL.reader.loadPdf(f);
          if (pdf.numPages > 12) { askRange(pdf, f.name); continue; }
          await addPdfPages(pdf, f.name, 1, pdf.numPages);
        }
        if (kind === 'image') {
          const c = await NL.reader.imageToCanvas(f);
          intake.pages.push({ id: uid(), kind: 'image', label: f.name, blob: await NL.reader.blob(c), thumb: NL.reader.jpeg(c, 240, 0.6), image: NL.reader.jpeg(c, 900, 0.55), text: '', status: 'pending' });
        }
        if (kind === 'docx') (await NL.reader.docx(f)).forEach((tx, i) => intake.pages.push({ id: uid(), kind: 'docx', label: t('pageFrom', { f: f.name, n: i + 1 }), text: tx, status: tx.trim() ? 'ok' : 'empty' }));
        if (kind === 'pptx') (await NL.reader.pptx(f)).forEach((tx, i) => intake.pages.push({ id: uid(), kind: 'pptx', label: t('pageFrom', { f: f.name, n: i + 1 }), text: tx, status: tx.trim() ? 'ok' : 'empty' }));
        if (kind === 'txt') addTextPages(await f.text(), f.name);
      } catch (e) { console.error(e); NL.toast(t('fileFail', { n: f.name, m: e.message || e }), 'bad'); }
      if (intake.pages.length > NL.reader.MAX_PAGES) { intake.pages.length = NL.reader.MAX_PAGES; NL.toast(t('tooMany', { n: NL.reader.MAX_PAGES }), 'warn'); }
      drawPages();
    }
    if (intake.pages.some((p) => p.status === 'pending')) intake.phase = 'add';
    drawPages();
  }
  async function addPdfPages(pdf, name, from, to) {
    for (let n = from; n <= to && intake.pages.length < NL.reader.MAX_PAGES; n++) {
      const { canvas, text } = await NL.reader.renderPdfPage(pdf, n, 2000);
      intake.pages.push({ id: uid(), kind: 'pdf', label: t('pageFrom', { f: name, n }), blob: await NL.reader.blob(canvas, 0.9), thumb: NL.reader.jpeg(canvas, 240, 0.6), image: NL.reader.jpeg(canvas, 900, 0.55), layer: text, text: '', status: 'pending' });
      drawPages();
    }
  }
  function askRange(pdf, name) {
    const host = $('#pdf-range'); if (!host) return;
    const max = Math.min(NL.reader.MAX_PAGES - intake.pages.length, 20);
    host.innerHTML = `<div class="panel range"><p>${icon('pdf')} <b>${esc(name)}</b></p><p>${t('pdfRange', { n: pdf.numPages, max })}</p>
      <div class="row gap wrap"><label class="ctl inline"><span>${t('from')}</span><input type="number" id="r-from" min="1" max="${pdf.numPages}" value="1"></label>
      <label class="ctl inline"><span>${t('to')}</span><input type="number" id="r-to" min="1" max="${pdf.numPages}" value="${Math.min(pdf.numPages, 6)}"></label>
      <button class="btn sm" id="r-ok">${t('apply')}</button><button class="btn sm ghost" id="r-no">${t('cancel')}</button></div></div>`;
    $('#r-no', host).onclick = () => (host.innerHTML = '');
    $('#r-ok', host).onclick = async () => {
      let a = +$('#r-from', host).value, b = +$('#r-to', host).value; if (b < a) [a, b] = [b, a];
      a = NL.clamp(a, 1, pdf.numPages); b = NL.clamp(Math.min(b, a + max - 1), 1, pdf.numPages);
      host.innerHTML = `<div class="panel"><div class="spinner"></div></div>`;
      await addPdfPages(pdf, name, a, b); host.innerHTML = ''; intake.phase = 'add'; drawPages();
    };
  }

  function drawPages() {
    const host = $('#pages'); if (!host) return;
    const P = intake.pages;
    $('#mat-count').textContent = P.length ? t('pagesN', { n: P.length }) : '';
    $$('#steps li').forEach((li) => { const s = +li.dataset.s, cur = { add: 0, reading: 1, review: 2, analyzing: 3 }[intake.phase] ?? 0; li.classList.toggle('done', s < cur); li.classList.toggle('on', s === cur); });
    if (!P.length) { host.innerHTML = `<div class="empty-mini">${icon('layers')} ${t('noMaterial')}</div>`; drawGo(); return; }
    host.innerHTML = P.map((p, i) => `<div class="ptile st-${p.status}" draggable="true" data-i="${i}">
        <div class="ptile-img">${p.thumb ? `<img src="${p.thumb}" alt="">` : `<div class="ptile-text">${esc((p.text || '').slice(0, 160))}</div>`}<span class="ptile-n">${i + 1}</span></div>
        <div class="ptile-body"><p class="ptile-label" title="${esc(p.label)}">${esc(p.label)}</p>
          <span class="badge st-${p.status}">${t({ ok: 'pageOk', weak: 'pageWeak', empty: 'pageEmpty', pending: 'pagePending', reading: 'pagePending' }[p.status])}</span>
          ${p.status === 'weak' ? `<p class="ptile-issue">${esc(p.issue || '')}</p>` : ''}
          <div class="ptile-actions">
            <button class="icon-btn" data-mv="-1" aria-label="${t('moveUp')}" ${i ? '' : 'disabled'}>${icon('up')}</button>
            <button class="icon-btn" data-mv="1" aria-label="${t('moveDown')}" ${i < P.length - 1 ? '' : 'disabled'}>${icon('down')}</button>
            ${p.status !== 'pending' ? `<button class="icon-btn" data-edit aria-label="${t('editText')}">${icon('pen')}</button>` : ''}
            ${p.kind === 'image' || p.kind === 'pdf' ? `<label class="icon-btn" aria-label="${t('replace')}" title="${t('replaceHint')}">${icon('swap')}<input type="file" accept="image/*" data-rep hidden></label>` : ''}
            <button class="icon-btn danger" data-rm aria-label="${t('remove')}">${icon('x')}</button>
          </div></div>
        <div class="ptile-editor" hidden>${p.status === 'weak' ? `<p class="warn-text">${t('unclearAsk')}</p>` : ''}<textarea rows="9" dir="auto" aria-label="${t('editText')}">${esc(p.text || '')}</textarea><div class="row gap"><button class="btn sm" data-save>${t('save')}</button></div></div>
      </div>`).join('');
    let dragI = null;
    $$('.ptile', host).forEach((el) => {
      const i = +el.dataset.i, p = P[i];
      el.addEventListener('dragstart', () => { dragI = i; el.classList.add('dragging'); });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
      el.addEventListener('dragover', (e) => e.preventDefault());
      el.addEventListener('drop', (e) => { e.preventDefault(); if (dragI == null || dragI === i) return; const [m] = P.splice(dragI, 1); P.splice(i, 0, m); drawPages(); });
      $$('[data-mv]', el).forEach((b) => (b.onclick = () => { const j = i + +b.dataset.mv; [P[i], P[j]] = [P[j], P[i]]; drawPages(); }));
      $('[data-rm]', el).onclick = () => { P.splice(i, 1); drawPages(); };
      $('[data-edit]', el)?.addEventListener('click', () => { const ed = $('.ptile-editor', el); ed.hidden = !ed.hidden; el.classList.toggle('editing', !ed.hidden); });
      $('[data-save]', el).onclick = () => { p.text = $('textarea', el).value; if (p.text.trim()) { p.status = 'ok'; p.issue = ''; } drawPages(); };
      $('[data-rep]', el)?.addEventListener('change', async (e) => {
        const f = e.target.files[0]; if (!f) return; const c = await NL.reader.imageToCanvas(f);
        Object.assign(p, { kind: 'image', blob: await NL.reader.blob(c), thumb: NL.reader.jpeg(c, 240, 0.6), image: NL.reader.jpeg(c, 900, 0.55), text: '', layer: '', status: 'pending', issue: '' });
        intake.phase = 'add'; drawPages();
      });
    });
    drawGo();
  }

  function drawGo() {
    const host = $('#go-area'); if (!host) return;
    const P = intake.pages, pending = P.filter((p) => p.status === 'pending').length, weak = P.filter((p) => p.status === 'weak').length, ok = P.filter((p) => p.status === 'ok').length;
    if (intake.phase === 'reading') return;
    if (intake.phase === 'analyzing') return;
    let html = ai.ready && ai.claude && (pending || ok || weak) ? `<div class="prov-pick"><span class="ctl-l">${t('provPick')}</span><div class="seg" role="radiogroup">${['gemini', 'claude'].map((p) => `<button type="button" role="radio" aria-checked="${ai.provider === p}" class="${ai.provider === p ? 'on' : ''}" data-prov="${p}">${p === 'claude' ? 'Claude' : 'Gemini'}</button>`).join('')}</div><p class="fine">${t('provHint')}</p></div>` : '';
    if (pending) html += `<button class="btn big" id="read-btn">${icon('eye')} ${t('readMaterial')}</button><p class="fine">${t('readingHint')}</p>`;
    else if (ok || weak) html += `${weak ? `<p class="warn-text">${t('weakPagesWarn', { n: weak })}</p>` : ''}${intake.textLayerOnly ? `<p class="fine">${t('textLayerOnly')}</p>` : ''}
      <button class="btn big glow" id="an-btn" ${ai.ready ? '' : 'disabled'}>${icon('spark')} ${t('analyzeStart')}</button>${ai.ready ? '' : ai.checked ? ai.offHtml() : `<p class="fine">${t('reconnecting')}</p>`}`;
    else html = `<p class="fine">${t('noMaterial')}</p>`;
    host.innerHTML = html;
    $$('[data-prov]', host).forEach((b) => b.addEventListener('click', () => { ai.provider = b.dataset.prov; drawGo(); }));
    $('#read-btn', host)?.addEventListener('click', readAll);
    $('#an-btn', host)?.addEventListener('click', analyzeIntake);
  }

  async function readAll() {
    const host = $('#go-area'), P = intake.pages, todo = P.filter((p) => p.status === 'pending');
    intake.phase = 'reading'; drawPages();
    const prog = (i) => { host.innerHTML = `<div class="reading"><div class="spinner"></div><p>${t('reading', { i: Math.min(i, todo.length), n: todo.length })}</p><div class="meter"><span style="width:${i / todo.length * 100}%"></span></div><p class="fine">${t('readingHint')}</p></div>`; };
    const vision = ai.ready && ai.images;
    intake.textLayerOnly = !vision && todo.some((p) => p.kind !== 'pdf' || !p.layer);
    const size = vision ? Math.max(1, Math.min(3, ai.images.maxCount || 1)) : 1;
    for (let i = 0; i < todo.length; i += size) {
      prog(i + 1);
      const batch = todo.slice(i, i + size);
      if (vision) {
        try {
          const hints = batch.map((p, k) => p.layer ? `--- page ${i + k + 1} text layer ---\n${p.layer.slice(0, 2500)}` : '').join('\n');
          const res = await NL.transcribe(batch.map((p) => p.blob), i + 1, hints);
          batch.forEach((p, k) => {
            const r = res.find((x) => +x.n === i + k + 1) || res[k];
            if (!r) { p.status = 'weak'; p.issue = NL.lang === 'ar' ? 'لم تُرجع القراءة نصًا لهذه الصفحة' : 'No text came back for this page'; return; }
            p.text = r.text || ''; p.quality = r.quality;
            p.status = r.quality === 'good' ? 'ok' : r.quality === 'blank' ? 'empty' : 'weak';
            p.issue = r.issue || '';
          });
        } catch (e) {
          if (e.code === 'cancelled') break;
          NL.toast(ai.errText(e), 'bad');
          batch.forEach((p) => { if (p.layer && p.layer.length > 60) { p.text = p.layer; p.status = 'weak'; p.issue = NL.lang === 'ar' ? 'استُخدم نص الملف فقط، راجعه' : 'Only the file’s text layer was used; check it'; } else p.status = 'pending'; });
          if (e.code === 'rate_limited' || e.code === 'not_granted') break;
        }
      } else {
        batch.forEach((p) => {
          if (p.layer && p.layer.replace(/\s/g, '').length > 60) { p.text = p.layer; p.status = 'ok'; }
          else { p.status = 'weak'; p.issue = NL.lang === 'ar' ? 'لا يوجد نص قابل للاستخراج في هذه الصفحة (صورة). اكتب نصها يدويًا، أو ارفعها كصورة لتُقرأ بالذكاء الاصطناعي.' : 'No extractable text on this page (image). Type it in, or upload it as an image so the AI can read it.'; }
        });
      }
      drawPages();
    }
    // a second, closer look: unclear pages are read again one at a time by the stronger setting, and the better reading is kept
    const again = vision ? todo.filter((p) => p.status === 'weak' && p.blob && p.quality) : [];
    for (let i = 0; i < again.length; i++) {
      const p = again[i];
      host.innerHTML = `<div class="reading"><div class="spinner"></div><p>${t('rereading', { i: i + 1, n: again.length })}</p><div class="meter"><span style="width:${(i + 1) / again.length * 100}%"></span></div></div>`;
      try {
        const [r] = await NL.transcribe([p.blob], todo.indexOf(p) + 1, p.layer ? p.layer.slice(0, 2500) : '', { closer: true });
        const rank = { good: 3, partial: 2, unreadable: 1, blank: 0 };
        if (r && (rank[r.quality] ?? 0) >= (rank[p.quality] ?? 0) && (r.text || '').length >= (p.text || '').length * 0.6) {
          p.text = r.text || p.text; p.quality = r.quality; p.issue = r.issue || '';
          p.status = r.quality === 'good' ? 'ok' : r.quality === 'blank' ? 'empty' : 'weak';
        }
      } catch (e) { if (e.code === 'cancelled' || e.code === 'rate_limited') break; }
      drawPages();
    }
    intake.phase = 'review'; drawPages();
  }

  /* ---------- analysis: one structured source of truth for every tool ---------- */
  const LAB_CATALOG = () => Object.values(NL.LABS).map((l) => `${l.id} (${l.subject}): ${l.title[1]} — params ${l.params.map((p) => `${p.k}${p.type === 'select' ? '[' + p.options.map((o) => o[0]).join('|') + ']' : `[${p.min}..${p.max} ${p.unit}]`}`).join(', ')}`).join('\n');
  NL.sourceText = (pages, max = 140000) => {
    let s = '';
    pages.forEach((p, i) => { if (p.text?.trim()) s += `\n\n[p.${p.n || i + 1}] (${p.label || ''})\n${p.text.trim()}`; });
    return s.length > max ? s.slice(0, max) + '\n[...truncated]' : s;
  };
  NL.analyze = async (pages, meta, onStep) => {
    const src = NL.sourceText(pages), outLang = NL.lang === 'ar' ? 'Arabic' : 'English';
    const base = `You are analysing a school lesson for a study platform. The LESSON PAGES below are the only source of truth.
Rules: extract only what is in the pages; never invent laws, examples, numbers or page numbers. If you add a clarifying item that is not in the pages, set "source":"extra". Page numbers refer to the [p.N] markers. Write all descriptive fields in ${outLang} (keep names of laws and terms as in the book where natural, and keep symbols/units as written).
${meta.title ? `Student's title: ${meta.title}\n` : ''}${meta.subject ? `Student's subject: ${meta.subject}\n` : ''}${meta.unit ? `Student's unit: ${meta.unit}\n` : ''}
LESSON PAGES:${src}`;
    const A = `${base}

Return ONLY JSON with this shape:
{"title":"lesson title as in the book","subject":"physics|math|chemistry|biology|history|geography|language|other","unit":"unit/chapter if stated, else empty","chapter":"","summary":"3-4 sentence overview","objectives":["learning objective (from the book if listed, else inferred, marked by starting with *)"],"estimatedMinutes":40,
"sections":[{"id":"s1","title":"","pages":[1],"summary":"2 sentences","conceptIds":["c1"],"lawIds":["l1"]}],
"concepts":[{"id":"c1","name":"","definition":"definition as the book states it","page":1,"source":"book"}],
"laws":[{"id":"l1","name":"","latex":"F = m a","equation":"F = m * a","symbols":[{"var":"F","tex":"F","name":"force","unit":"N","sample":10}],"page":1,"conditions":"when it applies","source":"book"}],
"relations":[{"from":"c1","to":"c2","label":"short verb phrase"}],
"skills":[""],"needsExplanation":[{"topic":"","why":""}],"unclear":[{"page":1,"issue":"what could not be read or is ambiguous"}]}
Laws: include every formula or equation in the pages (physics, chemistry, math). "equation" must be valid math.js syntax using ONLY the ASCII identifiers in symbols[].var (letters, digits, underscore; never use e, i or pi as a variable; use explicit * for multiplication; trig in degrees as sin(theta deg) is NOT allowed — use radians-free forms only when the book does). "sample" is a typical value in the given unit. Use 3-8 sections that follow the lesson order. relations: 4-20 meaningful links between concept ids, taken from the text.`;
    const B = `${base}

Return ONLY JSON with this shape:
{"examples":[{"id":"e1","title":"","page":1,"problem":"full problem text","given":[{"var":"m","value":2,"unit":"kg"}],"find":"what is asked","lawIds":[],"steps":["step in markdown with $latex$"],"answer":"final answer with unit","source":"book"}],
"bookQuestions":[{"page":1,"text":"question as written","type":"mcq|numeric|conceptual|other"}],
"figures":[{"page":1,"description":"what the figure shows","why":"what it teaches"}],
"misconceptions":[{"wrong":"common wrong idea","right":"correct idea","concept":"concept name"}],
"labs":[{"id":"lab id from catalog","why":"which part of THIS lesson it demonstrates","params":{"param":value}}],
"places":[{"name":"","lat":0,"lon":0,"year":"","desc":"","page":1}],
"events":[{"year":"as written","sortKey":1744,"title":"","desc":"","place":"must equal a places[].name when known","page":1}],
"functions":[{"expr":"math.js expression in x","desc":""}],
"reactions":[{"equation":"","type":"","desc":""}]}
Examples: only worked examples that appear in the pages. bookQuestions: only questions printed in the pages. misconceptions: 2-6, may be general (they are not attributed to the book).
labs: choose 0-4 from this catalog ONLY when the lesson really covers that physics/chemistry; set params within ranges to match the lesson's own numbers when possible:
${LAB_CATALOG()}
places/events: only for history/geography (or lessons naming real places/dates); lat/lon are your best estimate. functions: only for math lessons (functions/graphs in the pages). reactions: only for chemistry. Use [] when not applicable.`;
    onStep?.(0);
    const pa = ai.json(A, { modelTier: 'complex' }).then((r) => (onStep?.(1), r));
    const pb = ai.json(B, { modelTier: 'complex' }).then((r) => (onStep?.(2), r));
    const [a, b] = await Promise.all([pa, pb]);
    onStep?.(3);
    return normalizeAnalysis({ ...b, ...a }, pages.length);
  };
  function normalizeAnalysis(a, nPages) {
    const arr = (x) => (Array.isArray(x) ? x : []);
    a.subject = NL.SUBJECTS.includes(a.subject) ? a.subject : 'other';
    ['objectives', 'sections', 'concepts', 'laws', 'relations', 'skills', 'needsExplanation', 'unclear', 'examples', 'bookQuestions', 'figures', 'misconceptions', 'labs', 'places', 'events', 'functions', 'reactions'].forEach((k) => (a[k] = arr(a[k])));
    a.concepts.forEach((c, i) => (c.id ||= 'c' + (i + 1)));
    a.laws.forEach((l, i) => { l.id ||= 'l' + (i + 1); l.symbols = arr(l.symbols); l.valid = !!NL.eq.parse(l.equation); });
    a.sections.forEach((s, i) => { s.id ||= 's' + (i + 1); s.conceptIds = arr(s.conceptIds); s.lawIds = arr(s.lawIds); s.pages = arr(s.pages); });
    if (!a.sections.length) a.sections = [{ id: 's1', title: a.title || '', pages: [], summary: a.summary || '', conceptIds: a.concepts.map((c) => c.id), lawIds: a.laws.map((l) => l.id) }];
    const ids = new Set(a.concepts.map((c) => c.id));
    a.relations = a.relations.filter((r) => ids.has(r.from) && ids.has(r.to) && r.from !== r.to);
    a.labs = a.labs.filter((l) => NL.LABS[l.id]);
    a.examples.forEach((e, i) => (e.id ||= 'e' + (i + 1)));
    const inRange = (p) => !p || (p >= 1 && p <= nPages);
    [...a.concepts, ...a.laws, ...a.examples].forEach((x) => { if (!inRange(x.page)) x.page = null; });
    a.places = a.places.filter((p) => isFinite(+p.lat) && isFinite(+p.lon)).map((p) => ({ ...p, lat: +p.lat, lon: +p.lon }));
    a.estimatedMinutes = NL.clamp(+a.estimatedMinutes || 40, 10, 240);
    return a;
  }

  async function analyzeIntake() {
    const host = $('#go-area'), P = intake.pages.filter((p) => p.status === 'ok' || p.status === 'weak');
    if (!P.some((p) => p.text?.trim())) { NL.toast(t('noReadable'), 'warn'); return; }
    intake.phase = 'analyzing'; drawPages();
    const stepsArr = NL.T.analyzeSteps.map((s) => s[NL.lang === 'ar' ? 0 : 1]);
    let cur = 0;
    const paint = () => (host.innerHTML = `<div class="analyzing"><div class="orbit-loader" aria-hidden="true"><span></span><span></span><span></span></div><p class="big">${t('analyzing')}</p><ol class="an-steps">${stepsArr.map((s, i) => `<li class="${i < cur ? 'done' : i === cur ? 'on' : ''}">${s}</li>`).join('')}</ol></div>`);
    paint();
    try {
      const analysis = await NL.analyze(P, { title: intake.title, subject: intake.subject, unit: intake.unit }, (i) => { cur = Math.max(cur, i); paint(); });
      cur = 4; paint();
      const prev = intake.edit ? await store.getLesson(intake.edit) : null;
      const id = prev?.id || uid();
      const lesson = {
        ...(prev || {}), id, status: 'ready', version: 2,
        title: intake.title.trim() || analysis.title || (NL.lang === 'ar' ? 'درس بلا عنوان' : 'Untitled lesson'),
        subject: 'physics', unit: intake.unit.trim() || analysis.unit || '', chapter: analysis.chapter || '',
        createdAt: prev?.createdAt || Date.now(), pageCount: P.length,
        cover: P.find((p) => p.thumb)?.thumb || null,
        readNotes: { weak: P.map((p, i) => (p.status === 'weak' ? { page: i + 1, issue: p.issue } : null)).filter(Boolean), textLayerOnly: intake.textLayerOnly },
        analysis, stats: prev?.stats || { activity: 0 },
      };
      const pageDocs = P.map((p, i) => ({ n: i + 1, label: p.label, kind: p.kind, text: p.text, quality: p.status === 'ok' ? 'good' : 'partial', issue: p.issue || '', thumb: p.thumb || null, image: p.image && p.image.length < 200000 ? p.image : null }));
      await store.putPages(id, pageDocs, prev?.pageCount || 0);
      await store.putLesson(lesson);
      if (prev) await store.putPart(id, 'gen', {});
      const i = app.lessons.findIndex((x) => x.id === id); if (i >= 0) app.lessons[i] = lesson; else app.lessons.push(lesson);
      Object.assign(intake, { pages: [], title: '', subject: '', unit: '', edit: null, phase: 'add' });
      NL.go('lesson', { id });
    } catch (e) {
      console.error(e);
      intake.phase = 'review'; drawPages();
      NL.toast(t('analyzeFail', { m: ai.errText(e) }), 'bad');
    }
  }

  async function createDraft() {
    const title = $('#in-title').value.trim();
    if (!title) { $('#in-title').focus(); $('#in-title').classList.add('shake'); setTimeout(() => $('#in-title')?.classList.remove('shake'), 500); return; }
    const l = { id: uid(), title, subject: 'physics', unit: $('#in-unit').value.trim(), createdAt: Date.now(), status: 'draft', pageCount: 0, stats: { activity: 0 } };
    await store.putLesson(l); app.lessons.push(l);
    NL.go('lesson', { id: l.id });
  }

  /* ---------- shared bits ---------- */
  function bindGo(root) { $$('[data-go]', root).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); NL.go(a.dataset.go); })); }
  NL.bindGo = bindGo;
  const ICONS = {
    plus: '<path d="M12 5v14M5 12h14"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    books: '<path d="M4 19V5a1 1 0 0 1 1-1h3v15H5a1 1 0 0 1-1-1zM8 4h4v15H8zM14 5.5l3.6-1 3.4 13.5-3.6 1z"/>', cloud: '<path d="M7 18a4 4 0 0 1-.6-7.96A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9z"/>', device: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M11 18h2"/>',
    search: '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/>', dots: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', text: '<path d="M5 6h14M5 11h14M5 16h9"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5"/>', up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/>', swap: '<path d="M7 7h11l-3-3M17 17H6l3 3"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>', pdf: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
    send: '<path d="M4 12 20 4l-6 16-3-7z"/>', image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-6-6-8 8"/>', play: '<path d="M7 5v14l12-7z"/>', check: '<path d="m5 12 5 5 9-10"/>', flip: '<path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2"/><path d="M20 4v5h-5M4 20v-5h5"/>',
  };
  const icon = (NL.icon = (n) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`);
})();
