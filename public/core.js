/* Misbar core: utilities, i18n, preferences, storage, AI bridge, math rendering, file reading. */
(function () {
  const NL = (window.NL = {});

  /* ---------- utilities ---------- */
  NL.$ = (s, r = document) => r.querySelector(s);
  NL.$$ = (s, r = document) => [...r.querySelectorAll(s)];
  NL.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  NL.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  NL.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  NL.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  NL.fmt = (v, d = 3) => {
    if (v == null || !isFinite(v)) return '—';
    const a = Math.abs(v);
    if (a !== 0 && (a >= 1e6 || a < 1e-3)) return v.toExponential(2).replace('e', '×10^');
    return (+v.toPrecision(d + 1)).toLocaleString(NL.lang === 'ar' ? 'ar-SA-u-nu-latn' : 'en-US', { maximumFractionDigits: 4 });
  };
  NL.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  NL.shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  NL.date = (ts) => ts ? new Date(ts).toLocaleDateString(NL.lang === 'ar' ? 'ar-SA-u-ca-gregory-nu-latn' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  NL.ago = (ts) => {
    if (!ts) return NL.t('never');
    const s = (Date.now() - ts) / 1000, rtf = new Intl.RelativeTimeFormat(NL.lang, { numeric: 'auto' });
    if (s < 60) return rtf.format(0, 'second');
    if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute');
    if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour');
    return rtf.format(-Math.round(s / 86400), 'day');
  };
  NL.lsGet = (k, d) => { try { const v = localStorage.getItem('misbar:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  NL.lsSet = (k, v) => { try { localStorage.setItem('misbar:' + k, JSON.stringify(v)); } catch {} };

  /* ---------- i18n ---------- */
  const T = {
    brand: ['مِسبار', 'Misbar'],
    loginT: ['أهلًا بك في مِسبار', 'Welcome to Misbar'], loginS: ['سجّل دخولك لتكمل دروسك.', 'Sign in to continue your lessons.'],
    username: ['اسم المستخدم', 'Username'], password: ['كلمة المرور', 'Password'], signIn: ['دخول', 'Sign in'], signingIn: ['جارٍ الدخول…', 'Signing in…'],
    showPw: ['إظهار', 'Show'], hidePw: ['إخفاء', 'Hide'], signOut: ['تسجيل الخروج', 'Sign out'],
    loginErr_bad_login: ['اسم المستخدم أو كلمة المرور غير صحيحة.', 'Wrong username or password.'], loginErr_rate_limited: ['محاولات كثيرة. انتظر ربع ساعة ثم حاول.', 'Too many attempts. Wait 15 minutes and try again.'], loginErr_network: ['تعذّر الاتصال بالخادم.', 'Could not reach the server.'],
    loginNote: ['الحسابات يضيفها مشرف المنصة.', 'Accounts are added by the platform administrator.'],
    tagline: ['حوّل أي درس إلى تجربة تعلّم كاملة', 'Turn any lesson into a complete learning experience'],
    heroSub: ['ارفع صفحات كتابك، وسيقرؤها مِسبار ويحوّلها إلى شرح ومختبر واختبارات وبطاقات وخرائط، كلها مأخوذة من درسك أنت.', 'Upload your textbook pages. Misbar reads them and builds explanations, labs, quizzes, flashcards and maps from your own lesson.'],
    newLesson: ['إنشاء درس جديد', 'Create a new lesson'],
    newLessonSub: ['ارفع PDF أو صورًا أو عروضًا، أو الصق النص', 'Upload a PDF, photos, slides, or paste text'],
    myLessons: ['دروسي المحفوظة', 'My saved lessons'],
    myLessonsSub: ['تابع من حيث توقفت', 'Pick up where you left off'],
    recent: ['آخر الدروس', 'Recent lessons'], viewAll: ['عرض الكل', 'View all'],
    home: ['الرئيسية', 'Home'], library: ['المكتبة', 'Library'],
    lessonsCount: ['{n} درس', '{n} lessons'],
    storageLocal: ['محفوظ على هذا الجهاز فقط', 'Saved on this device only'],
    storagePending: ['جارٍ الاتصال بالحفظ…', 'Connecting storage…'],
    storageLocalHint: ['تُحفظ دروسك ونتائجك في متصفح هذا الجهاز دون حساب. مسح بيانات المتصفح يحذفها، ولنقلها لجهاز آخر استخدم «تصدير دروسي» من المكتبة.', 'Your lessons and results are kept in this browser, no account needed. Clearing browser data removes them; to move them to another device use “Export my lessons” in the library.'],
    aiOn: ['الذكاء الاصطناعي جاهز', 'AI ready'], aiOff: ['الذكاء الاصطناعي غير متاح هنا', 'AI not available here'],
    theme: ['المظهر', 'Theme'], themeSystem: ['تلقائي', 'System'], themeLight: ['فاتح', 'Light'], themeDark: ['داكن', 'Dark'],
    lang: ['English', 'العربية'],
    never: ['لم يبدأ بعد', 'not yet'],
    // intake
    intakeTitle: ['درس جديد', 'New lesson'],
    intakeLead: ['أضف مادة الدرس بأي طريقة. يمكنك الجمع بين الملفات والصور والنص في درس واحد.', 'Add the lesson material any way you like. Mix files, photos and text in one lesson.'],
    stepAdd: ['أضف المادة', 'Add material'], stepRead: ['قراءة المادة', 'Read material'], stepReview: ['راجع ما قُرئ', 'Review'], stepAnalyze: ['التحليل', 'Analyze'],
    dropTitle: ['اسحب الملفات هنا أو اخترها', 'Drop files here or browse'],
    dropSub: ['PDF · PowerPoint · Word · صور صفحات الكتاب (JPG / PNG / HEIC غير مدعوم)', 'PDF · PowerPoint · Word · page photos (JPG / PNG)'],
    browse: ['اختر ملفات', 'Browse files'], takePhoto: ['صوّر صفحة', 'Take a photo'],
    pasteText: ['الصق نص الدرس', 'Paste lesson text'], pastePh: ['الصق محتوى الدرس أو اكتبه هنا…', 'Paste or type the lesson content here…'],
    addText: ['أضف النص', 'Add text'],
    titleOnly: ['ابدأ بعنوان فقط', 'Start with a title only'], titleOnlyHint: ['أنشئ الدرس الآن وأضف محتواه لاحقًا.', 'Create the lesson now and add content later.'],
    lessonTitle: ['عنوان الدرس', 'Lesson title'], lessonTitlePh: ['مثال: قانون نيوتن الثاني', 'e.g. Newton’s second law'],
    subject: ['المادة', 'Subject'], unit: ['الوحدة / الفصل', 'Unit / chapter'], unitPh: ['مثال: الوحدة 2 · القوى', 'e.g. Unit 2 · Forces'],
    autoDetect: ['يُحدَّد تلقائيًا', 'Auto-detect'],
    createDraft: ['أنشئ الدرس', 'Create lesson'],
    material: ['المادة المستلمة', 'Received material'], pagesN: ['{n} صفحة', '{n} pages'],
    noMaterial: ['لم تُضف أي مادة بعد', 'No material added yet'],
    moveUp: ['أعلى', 'Move up'], moveDown: ['أسفل', 'Move down'], remove: ['حذف', 'Remove'], replace: ['استبدال', 'Replace'],
    pdfRange: ['هذا الملف فيه {n} صفحة. اختر صفحات الدرس فقط (حتى {max} صفحة).', 'This file has {n} pages. Choose only the lesson pages (up to {max}).'],
    from: ['من', 'From'], to: ['إلى', 'To'], apply: ['تطبيق', 'Apply'],
    readMaterial: ['اقرأ المادة', 'Read the material'],
    reading: ['جارٍ قراءة الصفحة {i} من {n}…', 'Reading page {i} of {n}…'],
    readingHint: ['يقرأ مِسبار النصوص والمعادلات والرسومات من كل صفحة قبل أي تحليل.', 'Misbar reads text, equations and figures from every page before any analysis.'],
    pageOk: ['مقروءة', 'Read'], pageWeak: ['غير واضحة', 'Unclear'], pageEmpty: ['فارغة', 'Empty'], pagePending: ['بانتظار القراءة', 'Waiting'],
    unclearAsk: ['لم تُقرأ هذه الصفحة بوضوح. أعد رفعها بصورة أوضح بدل أن نخمّن محتواها، أو صحّح النص يدويًا.', 'This page could not be read clearly. Re-upload a clearer image instead of letting us guess, or fix the text by hand.'],
    editText: ['تعديل النص المقروء', 'Edit the extracted text'],
    analyzeStart: ['حلّل الدرس وابدأ التعلّم', 'Analyze the lesson and start learning'],
    analyzing: ['يحلّل مِسبار الدرس…', 'Analyzing the lesson…'],
    analyzeSteps: [['استخراج المفاهيم والتعريفات', 'Extracting concepts and definitions'], ['استخراج القوانين والرموز', 'Extracting laws and symbols'], ['الأمثلة والأسئلة والرسومات', 'Examples, questions and figures'], ['اختيار التجارب والأدوات المناسبة', 'Choosing labs and tools'], ['حفظ الدرس', 'Saving the lesson']],
    weakPagesWarn: ['{n} صفحة غير واضحة. يمكنك المتابعة، لكن لن يُستخدم محتواها المفقود.', '{n} unclear pages. You can continue, but their missing content will not be used.'],
    textLayerOnly: ['قراءة الصور غير متاحة هنا، فاستُخدم نص الملف فقط.', 'Image reading is unavailable here, so only the file’s text layer was used.'],
    back: ['رجوع', 'Back'], cancel: ['إلغاء', 'Cancel'], save: ['حفظ', 'Save'], close: ['إغلاق', 'Close'], retry: ['أعد المحاولة', 'Try again'], continue: ['متابعة', 'Continue'], delete: ['حذف', 'Delete'], confirm: ['تأكيد', 'Confirm'],
    // library
    libTitle: ['دروسي', 'My lessons'], search: ['ابحث في دروسك…', 'Search your lessons…'],
    allSubjects: ['كل المواد', 'All subjects'], allUnits: ['كل الوحدات', 'All units'],
    sortRecent: ['آخر نشاط', 'Last activity'], sortCreated: ['تاريخ الإنشاء', 'Date created'], sortName: ['الاسم', 'Name'], sortProgress: ['التقدم', 'Progress'],
    stNot: ['لم يبدأ', 'Not started'], stProg: ['قيد الدراسة', 'In progress'], stDone: ['مكتمل', 'Completed'], stDraft: ['بلا محتوى', 'No content'],
    created: ['أُنشئ', 'Created'], lastAct: ['آخر نشاط', 'Last activity'], progress: ['التقدم', 'Progress'],
    open: ['افتح', 'Open'], resume: ['تابع', 'Resume'], rename: ['إعادة تسمية', 'Rename'], editContent: ['تعديل المحتوى / إضافة صفحات', 'Edit content / add pages'], regen: ['إعادة إنشاء الاختبارات والملخصات', 'Regenerate quizzes & summaries'],
    regenDone: ['حُذفت النسخ المولّدة، وستُنشأ من جديد عند فتحها.', 'Generated copies cleared. They will be rebuilt when opened.'],
    delAsk: ['حذف «{t}» نهائيًا مع كل نتائجه؟', 'Delete “{t}” and all its results permanently?'],
    emptyLibT: ['مكتبتك تنتظر أول درس', 'Your library is waiting for its first lesson'],
    emptyLibS: ['ارفع صفحات من كتابك وسيظهر درسك هنا مع تقدّمك الحقيقي.', 'Upload pages from your book and the lesson will appear here with your real progress.'],
    noMatch: ['لا توجد دروس مطابقة', 'No matching lessons'],
    // subjects
    subj_physics: ['فيزياء', 'Physics'], subj_math: ['رياضيات', 'Math'], subj_chemistry: ['كيمياء', 'Chemistry'], subj_biology: ['أحياء', 'Biology'], subj_history: ['تاريخ', 'History'], subj_geography: ['جغرافيا', 'Geography'], subj_language: ['لغة', 'Language'], subj_other: ['أخرى', 'Other'],
    // workspace tabs
    tab_overview: ['نظرة عامة', 'Overview'], tab_explain: ['اشرح لي', 'Explain'], tab_assistant: ['المساعد', 'Assistant'], tab_lab: ['المختبر', 'Lab'], tab_quiz: ['الاختبارات', 'Quizzes'], tab_solver: ['حل المسائل', 'Problem solver'], tab_summary: ['الملخص', 'Summary'], tab_map: ['خريطة المفاهيم', 'Concept map'], tab_cards: ['البطاقات', 'Flashcards'], tab_mistakes: ['مراجعة الأخطاء', 'Mistakes'], tab_mastery: ['الإتقان والخطة', 'Mastery & plan'], tab_coach: ['فسّر الظاهرة', 'Explain it'], tab_atlas: ['الأطلس والزمن', 'Atlas & timeline'], tab_board: ['السبورة', 'Whiteboard'], tab_sources: ['صفحات الكتاب', 'Book pages'],
    grp_learn: ['تعلّم', 'Learn'], grp_practice: ['تدرّب', 'Practice'], grp_review: ['راجع', 'Review'],
    fromBook: ['من الكتاب', 'From the book'], extra: ['إضافة توضيحية من خارج الكتاب', 'Extra explanation, not from the book'], page: ['ص', 'p.'],
    needsAI: ['هذه الأداة تحتاج الذكاء الاصطناعي، وهو غير متاح في هذا العرض.', 'This tool needs AI, which is not available in this view.'],
    generating: ['جارٍ الإنشاء…', 'Generating…'], stop: ['إيقاف', 'Stop'],
    aiErr_rate_limited: ['وصلت المنصة لحد الاستخدام المسموح مؤقتًا. انتظر دقيقة ثم أعد المحاولة، وإن تكرر فقد انتهت الحصة اليومية.', 'The platform hit its usage limit for now. Wait a minute and try again; if it repeats, the daily quota is used up.'],
    
    aiErr_invalid_json: ['جاء الرد بصيغة غير مكتملة. أعد المحاولة، وإن تكرر فقلّل حجم الطلب.', 'The reply came back incomplete. Try again; if it repeats, ask for less.'],
    aiErr_prompt_too_large: ['المحتوى أكبر من الحد المسموح. قلّل عدد الصفحات.', 'The content is too large. Use fewer pages.'],
    aiErr_cancelled: ['أُوقف الطلب.', 'Request stopped.'],
    aiErr_generic: ['تعذّر الوصول للذكاء الاصطناعي: {m}', 'Could not reach the AI: {m}'],
    aiWhyT: ['الذكاء الاصطناعي غير متاح الآن', 'AI is not available right now'],
    aiUnreachable: ['تعذّر الوصول إلى خادم المنصة. تأكد من اتصالك بالإنترنت ثم أعد المحاولة.', 'Could not reach the platform’s server. Check your connection and try again.'],
    aiNotConfigured: ['خدمة الذكاء الاصطناعي لم تُفعَّل على الخادم بعد. (للمشرف: أضف المتغير GEMINI_API_KEY في إعدادات الاستضافة.)', 'The AI service is not enabled on the server yet. (Admin: set GEMINI_API_KEY in the hosting settings.)'],
    codeT: ['أدخل رمز الدخول', 'Enter the access code'], codeS: ['هذه المنصة تتطلب رمزًا لاستخدام الذكاء الاصطناعي. اطلبه من المشرف.', 'This platform needs a code to use the AI. Ask the administrator for it.'], codePh: ['رمز الدخول', 'Access code'], codeGo: ['دخول', 'Enter'], codeBad: ['الرمز غير صحيح', 'Wrong code'],
    aiErr_not_configured: ['خدمة الذكاء الاصطناعي غير مفعّلة على الخادم.', 'The AI service is not enabled on the server.'],
    aiErr_access_code: ['رمز الدخول مطلوب أو غير صحيح.', 'Access code missing or wrong.'],
    aiErr_network: ['انقطع الاتصال بالخادم. تحقق من الإنترنت وأعد المحاولة.', 'The connection to the server dropped. Check your internet and try again.'],
    aiErr_refusal: ['اعتذر النموذج عن هذا الطلب. أعد صياغته.', 'The model declined this request. Try rephrasing it.'],
    aiErr_too_large: ['الطلب أكبر من المسموح. قلّل عدد الصفحات أو الصور.', 'The request is too large. Use fewer pages or images.'],
    aiErr_upstream: ['حدث خطأ في خدمة الذكاء الاصطناعي. أعد المحاولة بعد قليل.', 'The AI service had an error. Try again shortly.'],
    backup: ['نسخة احتياطية', 'Backup'], exportB: ['تصدير دروسي', 'Export my lessons'], importB: ['استيراد نسخة', 'Import a backup'],
    exported: ['حُفظ ملف النسخة الاحتياطية', 'Backup file saved'], imported: ['استُورد {n} درس', 'Imported {n} lessons'], importBad: ['هذا الملف ليس نسخة احتياطية من مِسبار', 'This file is not a Misbar backup'],
    reconnect: ['أعد الاتصال', 'Reconnect'], reconnecting: ['جارٍ الاتصال…', 'Connecting…'],
    saved: ['تم الحفظ', 'Saved'], saveErr: ['تعذّر الحفظ: {m}', 'Could not save: {m}'],
  };
  NL.T = T;
  NL.lang = NL.lsGet('lang', 'ar');
  NL.t = (k, vars) => {
    const e = T[k];
    let s = e ? e[NL.lang === 'ar' ? 0 : 1] : k;
    if (vars) for (const v in vars) s = s.split('{' + v + '}').join(vars[v]);
    return s;
  };
  NL.tt = (pair) => (Array.isArray(pair) ? pair[NL.lang === 'ar' ? 0 : 1] : pair && typeof pair === 'object' ? pair[NL.lang] ?? pair.ar ?? pair.en : pair ?? '');
  NL.addT = (obj) => Object.assign(T, obj);
  NL.setLang = (l) => {
    NL.lang = l; NL.lsSet('lang', l);
    document.documentElement.lang = l; document.documentElement.dir = l === 'ar' ? 'rtl' : 'ltr';
  };

  /* ---------- theme ---------- */
  NL.themePref = NL.lsGet('theme', 'system');
  NL.applyTheme = () => {
    const r = document.documentElement;
    if (NL.themePref === 'system') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', NL.themePref);
    NL.emit('theme');
  };
  NL.isDark = () => {
    const a = document.documentElement.getAttribute('data-theme');
    return a ? a === 'dark' : !matchMedia('(prefers-color-scheme: light)').matches;
  };
  NL.css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => NL.emit('theme')); } catch {}

  /* ---------- tiny event bus ---------- */
  const handlers = {};
  NL.on = (ev, fn) => ((handlers[ev] ||= new Set()).add(fn), () => handlers[ev].delete(fn));
  NL.emit = (ev, d) => [...(handlers[ev] || [])].forEach((fn) => { try { fn(d); } catch (e) { console.error(e); } });

  /* ---------- toasts ---------- */
  NL.toast = (msg, kind = 'info') => {
    let host = NL.$('#toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + kind; el.textContent = msg; el.setAttribute('role', 'status');
    host.append(el);
    setTimeout(() => el.classList.add('out'), 3600);
    setTimeout(() => el.remove(), 4200);
  };

  /* ---------- storage: account (db capability) or this browser (IndexedDB) ---------- */
  const idb = {
    db: null,
    async open() {
      if (this.db) return this.db;
      this.db = await new Promise((res, rej) => {
        const r = indexedDB.open(NL.auth?.user ? 'misbar-' + NL.auth.user.toLowerCase() : 'misbar', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('kv');
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
      });
      return this.db;
    },
    async tx(mode, fn) {
      const db = await this.open();
      return new Promise((res, rej) => {
        const t = db.transaction('kv', mode), s = t.objectStore('kv');
        const out = fn(s);
        t.oncomplete = () => res(out?.result); t.onerror = () => rej(t.error);
      });
    },
    get(k) { return this.tx('readonly', (s) => s.get(k)); },
    set(k, v) { return this.tx('readwrite', (s) => s.put(v, k)); },
    del(k) { return this.tx('readwrite', (s) => s.delete(k)); },
    keys(prefix) { return this.tx('readonly', (s) => s.getAllKeys()).then((ks) => ks.filter((k) => k.startsWith(prefix))); },
  };
  const memKV = new Map(); // last resort when IndexedDB is blocked

  const store = (NL.store = {
    mode: 'pending',
    async init() {
      try { await idb.open(); this.mode = 'local'; } catch { this.mode = 'memory'; }
      NL.emit('storage');
    },
    p: {
      lesson: (id) => `lessons/${id}`,
      part: (id, k) => `lessons/${id}/parts/${k}`,
      page: (id, n) => `lessons/${id}/pages/p${n}`,
    },
    async _get(path) {
      if (this.mode === 'cloud') { const s = await this.db.doc(`${this.base}/${path}`).get(); return s.exists ? structuredClone(s.data()) : null; }
      if (this.mode === 'local') return (await idb.get(path)) ?? null;
      return memKV.get(path) ?? null;
    },
    async _set(path, data) {
      data = JSON.parse(JSON.stringify(data));
      if (this.mode === 'cloud') return withRetry(() => this.db.doc(`${this.base}/${path}`).set(data));
      if (this.mode === 'local') return idb.set(path, data);
      memKV.set(path, data);
    },
    async _del(path) {
      if (this.mode === 'cloud') return this.db.doc(`${this.base}/${path}`).delete().catch(() => {});
      if (this.mode === 'local') return idb.del(path);
      memKV.delete(path);
    },
    // built-in lessons ship with the page; only the learner's own progress is stored for them
    builtin(id) { return (NL.BUILTIN || []).find((b) => b.id === id); },
    async _withOverlay(b) {
      const o = (await this._get(this.p.lesson(b.id)).catch(() => null)) || {};
      return { ...b, stats: o.stats || { activity: 0 }, lastActivity: o.lastActivity || null, updatedAt: o.updatedAt || b.createdAt };
    },
    async listLessons() {
      const own = (await this._listOwn()).filter((l) => !this.builtin(l.id));
      const built = await Promise.all((NL.BUILTIN || []).map((b) => this._withOverlay(b)));
      return [...built, ...own];
    },
    async _listOwn() {
      if (this.mode === 'cloud') {
        const q = await this.db.collection(`${this.base}/lessons`).get();
        return q.docs.map((d) => structuredClone(d.data()));
      }
      const keys = this.mode === 'local' ? await idb.keys('lessons/') : [...memKV.keys()].filter((k) => k.startsWith('lessons/'));
      const ids = keys.filter((k) => k.split('/').length === 2);
      const out = [];
      for (const k of ids) { const v = await this._get(k); if (v) out.push(v); }
      return out;
    },
    getLesson(id) { const b = this.builtin(id); return b ? this._withOverlay(b) : this._get(this.p.lesson(id)); },
    putLesson(l) {
      l.updatedAt = Date.now();
      if (l.builtin) return this.queue(this.p.lesson(l.id), { id: l.id, builtinRef: true, stats: l.stats, lastActivity: l.lastActivity, updatedAt: l.updatedAt });
      return this.queue(this.p.lesson(l.id), l);
    },
    async getPart(id, k) {
      const stored = await this._get(this.p.part(id, k)), b = this.builtin(id);
      if (!b || k !== 'gen') return stored;
      // ready-made content first; anything generated later by the AI is layered on top
      const g = structuredClone(b.gen || {});
      for (const [key, val] of Object.entries(stored || {})) {
        if (key === 'explain') for (const [sid, lv] of Object.entries(val || {})) g.explain[sid] = { ...(g.explain[sid] || {}), ...lv };
        else if (val && typeof val === 'object' && !Array.isArray(val) && g[key] && typeof g[key] === 'object' && !Array.isArray(g[key])) g[key] = { ...g[key], ...val };
        else g[key] = val;
      }
      return g;
    },
    putPart(id, k, v) { return this.queue(this.p.part(id, k), v); },
    async getPages(id, count) {
      const b = this.builtin(id); if (b) return b.pages;
      const out = [];
      for (let n = 1; n <= count; n++) out.push(await this._get(this.p.page(id, n)));
      return out.filter(Boolean);
    },
    async putPages(id, pages, oldCount = 0) {
      for (let i = 0; i < pages.length; i++) await this._set(this.p.page(id, i + 1), pages[i]);
      for (let n = pages.length + 1; n <= oldCount; n++) await this._del(this.p.page(id, n));
    },
    async deleteLesson(l) {
      for (let n = 1; n <= (l.pageCount || 0); n++) await this._del(this.p.page(l.id, n));
      for (const k of ['gen', 'state']) await this._del(this.p.part(l.id, k));
      await this._del(this.p.lesson(l.id));
    },
    async exportAll() {
      const keys = this.mode === 'local' ? await idb.keys('lessons/') : [...memKV.keys()].filter((k) => k.startsWith('lessons/'));
      const entries = {}; for (const k of keys) entries[k] = await this._get(k);
      return { app: 'misbar', version: 1, exportedAt: new Date().toISOString(), entries };
    },
    async importAll(data) {
      if (data?.app !== 'misbar' || typeof data.entries !== 'object') throw new Error('bad backup');
      let n = 0;
      for (const [k, v] of Object.entries(data.entries)) { if (!/^lessons\/[\w-]+(\/(parts|pages)\/[\w-]+)?$/.test(k) || !v || typeof v !== 'object') continue; await this._set(k, v); if (k.split('/').length === 2) n++; }
      return n;
    },
    // one write in flight per document; the newest value wins
    _q: new Map(),
    queue(path, data) {
      const snap = JSON.parse(JSON.stringify(data));
      let q = this._q.get(path);
      if (!q) { q = { running: null, next: null }; this._q.set(path, q); }
      q.next = snap;
      if (!q.running) q.running = this._drain(path, q);
      return q.running;
    },
    async _drain(path, q) {
      try {
        while (q.next) { const v = q.next; q.next = null; await this._set(path, v); }
      } catch (e) {
        console.error(e);
        NL.toast(NL.t('saveErr', { m: e.code === 'quota_exceeded' ? (NL.lang === 'ar' ? 'المساحة ممتلئة، احذف دروسًا قديمة' : 'storage is full, delete old lessons') : e.message || e.code }), 'bad');
      } finally { q.running = null; }
    },
  });
  async function withRetry(fn) {
    try { return await fn(); } catch (e) {
      if (e?.code === 'unavailable') { await NL.sleep(400 + Math.random() * 600); return fn(); }
      throw e;
    }
  }

  /* ---------- sign-in (accounts are defined on the server) ---------- */
  NL.auth = {
    required: false, user: null, token: NL.lsGet('token', ''),
    isTeacher() { return this.role === 'teacher'; },
    header() { return this.token ? { Authorization: 'Bearer ' + this.token } : {}; },
    async init() {
      try {
        const j = await (await fetch('api/login', { cache: 'no-store', headers: this.header() })).json();
        this.required = !!j.required; this.user = j.user || null; this.role = j.role || (this.required ? null : 'teacher');
        if (!this.user) { this.token = ''; NL.lsSet('token', ''); }
      } catch { this.required = false; this.user = null; }
    },
    async signIn(username, password) {
      const r = await fetch('api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw j.error || { code: 'bad_login' };
      this.token = j.token; this.user = j.user; this.role = j.role || 'student'; NL.lsSet('token', j.token);
    },
    signOut() { this.token = ''; this.user = null; NL.lsSet('token', ''); location.hash = ''; location.reload(); },
  };

  /* ---------- AI bridge: the platform's own server endpoint (api/ai); the key never reaches the browser ---------- */
  const blobToB64 = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
  // tolerant JSON reading: whole reply, a fenced block, or the first {…} / […] span
  const parseJson = (s) => {
    try { return JSON.parse(s); } catch {}
    const f = s.match(/```(?:json)?\s*([\s\S]*?)```/); if (f) { try { return JSON.parse(f[1]); } catch {} }
    const i = s.search(/[\[{]/), j = Math.max(s.lastIndexOf('}'), s.lastIndexOf(']'));
    if (i >= 0 && j > i) { try { return JSON.parse(s.slice(i, j + 1)); } catch {} }
    throw { code: 'invalid_json', message: 'reply was not valid JSON', text: s };
  };
  const IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ai = (NL.ai = {
    ready: false, checked: false, configured: false, unreachable: false, needCode: false,
    images: { maxCount: 3 }, tools: true,
    async init() {
      this.checked = false; NL.emit('ai');
      try {
        const r = await fetch('api/ai', { cache: 'no-store', headers: { 'X-Access-Code': NL.lsGet('code', '') } });
        const j = await r.json();
        this.unreachable = false; this.configured = !!j.configured;
        this.needCode = !!j.accessCode && !j.codeOk;
        if (this.needCode) NL.lsSet('code', '');
        this.ready = this.configured && !this.needCode;
      } catch (e) { console.warn('AI endpoint unreachable', e); this.unreachable = true; this.ready = false; }
      this.checked = true;
      NL.emit('ai');
    },
    // input: prompt string, or [{role, content}] ending on a user turn. opts: onText, signal, images (Blob[]), tools, modelTier, json
    async sample(input, opts = {}) {
      if (!this.ready) throw { code: this.needCode ? 'access_code' : 'not_configured', message: NL.t('aiOff') };
      const messages = typeof input === 'string' ? [{ role: 'user', content: input }] : input;
      const images = opts.images?.length ? await Promise.all(opts.images.map(async (b) => ({ media_type: IMG_TYPES.includes(b.type) ? b.type : 'image/jpeg', data: await blobToB64(b) }))) : undefined;
      let res;
      try {
        res = await fetch('api/ai', {
          method: 'POST', signal: opts.signal,
          headers: { 'Content-Type': 'application/json', 'X-Access-Code': NL.lsGet('code', ''), ...NL.auth.header() },
          body: JSON.stringify({ messages, images, tier: opts.modelTier || 'default', json: !!opts.json, tools: !!opts.tools?.length }),
        });
      } catch (e) { throw e?.name === 'AbortError' ? { code: 'cancelled' } : { code: 'network', message: e.message }; }
      if (!res.ok) {
        let j = {}; try { j = await res.json(); } catch {}
        const err = j.error || { code: 'upstream', message: 'HTTP ' + res.status };
        if (err.code === 'login') NL.auth.signOut();
        if (err.code === 'access_code') { NL.lsSet('code', ''); this.needCode = true; this.ready = false; NL.emit('ai'); }
        if (err.code === 'not_configured') { this.configured = false; this.ready = false; NL.emit('ai'); }
        throw err;
      }
      const reader = res.body.getReader(), dec = new TextDecoder();
      let buf = '', text = '', done = null;
      try {
        for (;;) {
          const { value, done: end } = await reader.read();
          if (end) break;
          buf += dec.decode(value, { stream: true });
          let k;
          while ((k = buf.indexOf('\n')) >= 0) {
            const ln = buf.slice(0, k); buf = buf.slice(k + 1);
            if (!ln.trim()) continue;
            const ev = JSON.parse(ln);
            if (ev.t === 'text') { text = ev.text; opts.onText?.({ text }); }
            else if (ev.t === 'done') done = ev;
            else if (ev.t === 'error') throw { code: ev.code, message: ev.message, text };
          }
        }
      } catch (e) { if (e?.name === 'AbortError') throw { code: 'cancelled', text }; throw e; }
      if (!done) throw { code: 'network', message: 'connection closed early', text };
      if (done.text !== text) opts.onText?.({ text: done.text });
      return { text: done.text, truncated: done.stop === 'max_tokens' };
    },
    async json(prompt, opts = {}) { const r = await this.sample(prompt, { ...opts, json: true }); return parseJson(r.text); },
    async text(prompt, opts = {}) { return (await this.sample(prompt, opts)).text; },
    // the calculator runs on the server with math.js, so numeric answers come from code, not from the model
    calcTool() { return { name: 'calculate' }; },
    offHtml() {
      const e = NL.esc;
      if (this.needCode) return `<div class="notice warn ai-off"><div><b>${e(NL.t('codeT'))}</b><p>${e(NL.t('codeS'))}</p>
        <form class="row gap wrap" data-code-form><input id="access-code" type="password" autocomplete="off" placeholder="${e(NL.t('codePh'))}" style="max-width:240px"><button class="btn sm" type="submit">${e(NL.t('codeGo'))}</button></form></div></div>`;
      const msg = this.unreachable ? 'aiUnreachable' : 'aiNotConfigured';
      return `<div class="notice warn ai-off"><div><b>${e(NL.t('aiWhyT'))}</b><p>${e(NL.t(msg))}</p><div class="row gap wrap"><button class="btn sm ghost" type="button" data-ai-retry>${e(NL.t('reconnect'))}</button></div></div></div>`;
    },
    errText(e) {
      const c = e?.code;
      if (c && T['aiErr_' + c]) return NL.t('aiErr_' + c);
      return NL.t('aiErr_generic', { m: e?.message || c || e });
    },
  });

  /* ---------- rich text + math ---------- */
  NL.tex = (src, display = false) => {
    try { return katex.renderToString(String(src), { output: 'mathml', throwOnError: false, displayMode: display }); }
    catch { return `<code>${NL.esc(src)}</code>`; }
  };
  // tiny markdown: headings, bold, lists, $math$, $$math$$, ::: extra blocks, [p.N] page refs
  NL.md = (src) => {
    if (!src) return '';
    const stash = [];
    const keep = (html) => `\u0000${stash.push(html) - 1}\u0000`;
    let s = String(src);
    s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => keep(`<div class="mathblock">${NL.tex(m, true)}</div>`));
    s = s.replace(/\\\[([\s\S]+?)\\\]/g, (_, m) => keep(`<div class="mathblock">${NL.tex(m, true)}</div>`));
    s = s.replace(/\$([^$\n]+?)\$/g, (_, m) => keep(`<span class="math">${NL.tex(m)}</span>`));
    s = s.replace(/\\\((.+?)\\\)/g, (_, m) => keep(`<span class="math">${NL.tex(m)}</span>`));
    s = NL.esc(s);
    s = s.replace(/^:::\s*extra\s*\n([\s\S]*?)\n:::\s*$/gm, (_, body) => `\u0001extra\u0001${body}\u0001/extra\u0001`);
    const lines = s.split('\n'); let html = '', list = null;
    const inline = (t) => t
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[(?:p\.|ص)\s?(\d+)\]/g, '<span class="pref">' + NL.t('page') + ' $1</span>');
    for (let raw of lines) {
      const line = raw.trimEnd();
      if (line === '\u0001extra\u0001' || line.startsWith('\u0001extra\u0001')) {
        if (list) { html += `</${list}>`; list = null; }
        html += `<aside class="extra"><span class="extra-tag">${NL.esc(NL.t('extra'))}</span>`;
        const rest = line.replace('\u0001extra\u0001', ''); if (rest) html += `<p>${inline(rest)}</p>`; continue;
      }
      if (line.includes('\u0001/extra\u0001')) {
        const before = line.replace('\u0001/extra\u0001', ''); if (before) html += `<p>${inline(before)}</p>`;
        if (list) { html += `</${list}>`; list = null; }
        html += '</aside>'; continue;
      }
      let m;
      if ((m = line.match(/^\s*[-•*]\s+(.*)/))) { if (list !== 'ul') { if (list) html += `</${list}>`; html += '<ul>'; list = 'ul'; } html += `<li>${inline(m[1])}</li>`; continue; }
      if ((m = line.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== 'ol') { if (list) html += `</${list}>`; html += '<ol>'; list = 'ol'; } html += `<li>${inline(m[1])}</li>`; continue; }
      if (list) { html += `</${list}>`; list = null; }
      if ((m = line.match(/^(#{1,4})\s+(.*)/))) { html += `<h4 class="mdh">${inline(m[2])}</h4>`; continue; }
      if (!line.trim()) continue;
      html += `<p>${inline(line)}</p>`;
    }
    if (list) html += `</${list}>`;
    // a block opened by "::: extra" on its own line but never closed
    const opens = (html.match(/<aside class="extra">/g) || []).length, closes = (html.match(/<\/aside>/g) || []).length;
    for (let i = closes; i < opens; i++) html += '</aside>';
    return html.replace(/\u0000(\d+)\u0000/g, (_, i) => stash[+i]);
  };
  // keep only harmless SVG produced by the model
  NL.safeSvg = (svg) => {
    if (!svg || !/^\s*<svg[\s>]/i.test(svg)) return '';
    try {
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      const root = doc.documentElement;
      if (root.nodeName.toLowerCase() !== 'svg' || doc.querySelector('parsererror')) return '';
      doc.querySelectorAll('script,foreignObject,iframe,image,use,a,style').forEach((n) => n.remove());
      doc.querySelectorAll('*').forEach((n) => [...n.attributes].forEach((a) => {
        if (/^on/i.test(a.name) || /href/i.test(a.name) || /javascript:/i.test(a.value)) n.removeAttribute(a.name);
      }));
      root.removeAttribute('width'); root.removeAttribute('height');
      root.setAttribute('class', 'aisvg'); root.setAttribute('role', 'img');
      return new XMLSerializer().serializeToString(root);
    } catch { return ''; }
  };

  /* ---------- physics-grade equation engine (math.js) ---------- */
  NL.eq = {
    // "F = m * a" -> {lhs, rhs, vars}
    parse(equation) {
      if (!equation || !equation.includes('=')) return null;
      const [l, r] = equation.split('=');
      try {
        const lhs = math.parse(l), rhs = math.parse(r);
        const vars = new Set();
        [lhs, rhs].forEach((n) => n.traverse((node, path, parent) => {
          if (node.isSymbolNode && !(parent && parent.isFunctionNode && parent.fn === node) && !['pi', 'PI', 'i', 'Infinity'].includes(node.name)) vars.add(node.name);
        }));
        return { lhs: lhs.compile(), rhs: rhs.compile(), vars: [...vars], lhsNode: lhs, rhsNode: rhs };
      } catch { return null; }
    },
    // solve for `target` given scope of the others; numeric (secant + bracket scan)
    solve(parsed, target, scope, guess = 1) {
      const f = (x) => { const s = { ...scope, [target]: x }; return parsed.lhs.evaluate(s) - parsed.rhs.evaluate(s); };
      const ok = (x) => { try { const v = f(x); return isFinite(v) ? v : NaN; } catch { return NaN; } };
      // direct: if target alone on one side
      try {
        if (parsed.lhsNode.isSymbolNode && parsed.lhsNode.name === target) { const v = parsed.rhs.evaluate(scope); if (isFinite(v)) return v; }
        if (parsed.rhsNode.isSymbolNode && parsed.rhsNode.name === target) { const v = parsed.lhs.evaluate(scope); if (isFinite(v)) return v; }
      } catch {}
      // scan for a sign change over logarithmic grid, positive first
      const grid = [];
      for (let e = -6; e <= 7; e += 0.25) grid.push(Math.pow(10, e));
      const tryGrid = (pts) => {
        for (let i = 0; i < pts.length - 1; i++) {
          let a = pts[i], b = pts[i + 1], fa = ok(a), fb = ok(b);
          if (isNaN(fa) || isNaN(fb)) continue;
          if (fa === 0) return a;
          if (fa * fb < 0) { for (let k = 0; k < 80; k++) { const m = (a + b) / 2, fm = ok(m); if (isNaN(fm)) break; if (fa * fm <= 0) { b = m; fb = fm; } else { a = m; fa = fm; } } return (a + b) / 2; }
        }
        return null;
      };
      let r = tryGrid(grid);
      if (r == null) r = tryGrid(grid.map((x) => -x).reverse());
      if (r == null) { // secant from guess
        let x0 = guess, x1 = guess * 1.1 + 0.1;
        for (let i = 0; i < 60; i++) { const f0 = ok(x0), f1 = ok(x1); if (isNaN(f0) || isNaN(f1) || f1 === f0) break; const x2 = x1 - f1 * (x1 - x0) / (f1 - f0); x0 = x1; x1 = x2; if (Math.abs(x1 - x0) < 1e-12 * Math.max(1, Math.abs(x1))) break; }
        if (isFinite(x1) && Math.abs(ok(x1)) < 1e-6 * Math.max(1, Math.abs(x1))) r = x1;
      }
      return r;
    },
    // classify how `y` responds to `x` (direct, inverse, square…) by doubling x
    relation(parsed, y, x, scope) {
      const base = { ...scope }; delete base[y];
      const y1 = this.solve(parsed, y, base), y2 = this.solve(parsed, y, { ...base, [x]: base[x] * 2 });
      if (y1 == null || y2 == null || y1 === 0) return null;
      const k = y2 / y1, near = (v) => Math.abs(k - v) < 1e-3 * Math.max(1, v);
      const kinds = [[1, 'none'], [2, 'direct'], [0.5, 'inverse'], [4, 'square'], [0.25, 'invsquare'], [Math.SQRT2, 'sqrt'], [1 / Math.SQRT2, 'invsqrt'], [8, 'cube']];
      for (const [v, name] of kinds) if (near(v)) return { kind: name, factor: k };
      return { kind: 'other', factor: k };
    },
    // convert value+unit to SI number using math.js units when possible
    toSI(value, unit) {
      if (!unit) return { v: +value, unit: '' };
      try { const u = math.unit(+value, unit.replace(/·/g, '*').replace(/²/g, '^2').replace(/³/g, '^3')); const si = u.toSI(); return { v: si.toNumeric(), unit: si.formatUnits() }; }
      catch { return { v: +value, unit }; }
    },
  };

  /* ---------- file reading ---------- */
  const reader = (NL.reader = {
    MAX_PAGES: 40,
    kindOf(file) {
      const n = file.name.toLowerCase();
      if (file.type === 'application/pdf' || n.endsWith('.pdf')) return 'pdf';
      if (n.endsWith('.docx')) return 'docx';
      if (n.endsWith('.pptx')) return 'pptx';
      if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/.test(n)) return 'image';
      if (n.endsWith('.txt') || n.endsWith('.md')) return 'txt';
      if (n.endsWith('.doc') || n.endsWith('.ppt')) return 'legacy';
      return 'unknown';
    },
    async loadPdf(file) {
      if (window.pdfjsLib && !pdfjsLib.GlobalWorkerOptions.workerSrc) pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';
      const buf = await file.arrayBuffer();
      return pdfjsLib.getDocument({ data: buf, isEvalSupported: false }).promise;
    },
    async renderPdfPage(pdf, n, width = 1100) {
      const page = await pdf.getPage(n);
      const vp0 = page.getViewport({ scale: 1 });
      const vp = page.getViewport({ scale: width / vp0.width });
      const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
      const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      const tc = await page.getTextContent();
      const text = tc.items.map((i) => i.str + (i.hasEOL ? '\n' : ' ')).join('').normalize('NFKC').replace(/[ \t]+/g, ' ').trim();
      return { canvas: c, text };
    },
    async imageToCanvas(file, max = 1600) {
      const url = URL.createObjectURL(file);
      try {
        const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('image')); i.src = url; });
        const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        return c;
      } finally { URL.revokeObjectURL(url); }
    },
    jpeg(canvas, maxW, q = 0.6) {
      const s = Math.min(1, maxW / canvas.width);
      const c = document.createElement('canvas'); c.width = Math.round(canvas.width * s); c.height = Math.round(canvas.height * s);
      c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', q);
    },
    blob(canvas, q = 0.8) { return new Promise((r) => canvas.toBlob(r, 'image/jpeg', q)); },
    async docx(file) {
      const r = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      return chunk(r.value);
    },
    async pptx(file) {
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const slides = Object.keys(zip.files).filter((k) => /^ppt\/slides\/slide\d+\.xml$/.test(k))
        .sort((a, b) => +a.match(/(\d+)\.xml/)[1] - +b.match(/(\d+)\.xml/)[1]);
      const out = [];
      for (const k of slides) {
        const xml = await zip.file(k).async('string');
        const doc = new DOMParser().parseFromString(xml, 'application/xml');
        const paras = [...doc.getElementsByTagNameNS('*', 'p')].map((p) => [...p.getElementsByTagNameNS('*', 't')].map((t) => t.textContent).join('')).filter((s) => s.trim());
        out.push(paras.join('\n'));
      }
      return out;
    },
  });
  function chunk(text, size = 3500) {
    const paras = text.split(/\n{2,}/), out = []; let cur = '';
    for (const p of paras) { if ((cur + p).length > size && cur) { out.push(cur.trim()); cur = ''; } cur += p + '\n\n'; }
    if (cur.trim()) out.push(cur.trim());
    return out.length ? out : [''];
  }

  // Vision transcription of page images; returns [{n, text, quality, figures, issue}]
  NL.transcribe = async (blobs, startN, hints) => {
    const prompt = `You are transcribing textbook pages for a study platform. You receive ${blobs.length} page image(s), numbered ${startN}..${startN + blobs.length - 1} in order.
For each page, transcribe ALL readable text faithfully in its original language (do not translate, do not summarize, do not add anything).
Write every equation in LaTeX between $...$ (inline) or $$...$$ (display). Keep units and symbols exactly.
For each figure, diagram, graph or table, add a line: [FIGURE: short factual description of what it shows, including labels and values you can read].
Mark any part you cannot read with [UNREADABLE]. Never guess unreadable words or numbers.
quality: "good" if the page is fully readable, "partial" if some parts are unreadable, "unreadable" if you cannot read most of it (blurry, cut, dark, rotated), "blank" if empty.
${hints ? 'A machine text layer is given below for reference only; it may be scrambled for Arabic. Trust the image.\n' + hints : ''}
Reply with only JSON: {"pages":[{"n":${startN},"quality":"good","text":"...","issue":"why unclear, if not good"}]}`;
    const r = await ai.json(prompt, { images: blobs, modelTier: 'default' });
    return Array.isArray(r?.pages) ? r.pages : [];
  };

  /* ---------- subjects ---------- */
  NL.SUBJECTS = ['physics', 'math', 'chemistry', 'biology', 'history', 'geography', 'language', 'other'];
  NL.subjectName = (s) => NL.t('subj_' + (NL.SUBJECTS.includes(s) ? s : 'other'));
})();
