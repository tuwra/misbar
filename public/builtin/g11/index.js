/* The grade 11 physics book (فيزياء 2، التعليم الثانوي، السنة الثانية، نظام المسارات) as one ready-made folder.
   Each lesson file calls NL.g11({...}) with a compact definition written from the book pages; this expands it into the
   lesson shape the platform uses (analysis, three-level explanations, summaries, question bank, solved problems).
   Page texts and page images are loaded only when a lesson opens (builtin/g11/<id>/pages.json). */
(function () {
  NL.BUILTIN ||= [];
  NL.FOLDERS ||= {};
  const CH = [
    { n: 1, title: 'الجاذبية', unit: 'الفصل 1 · الجاذبية' },
    { n: 2, title: 'الحركة الدورانية', unit: 'الفصل 2 · الحركة الدورانية' },
    { n: 3, title: 'الزخم وحفظه', unit: 'الفصل 3 · الزخم وحفظه' },
    { n: 4, title: 'الشغل والطاقة والآلات البسيطة', unit: 'الفصل 4 · الطاقة والشغل والآلات البسيطة' },
    { n: 5, title: 'الطاقة وحفظها', unit: 'الفصل 5 · الطاقة وحفظها' },
    { n: 6, title: 'الطاقة الحرارية', unit: 'الفصل 6 · الطاقة الحرارية' },
  ];
  NL.FOLDERS.g11 = {
    title: 'فيزياء 2 · الصف الثاني الثانوي', grade: 'نظام المسارات · 1446هـ',
    sub: 'كتاب الفيزياء كاملًا: ستة فصول، وكل درس مشروح بثلاثة مستويات مع أمثلة الكتاب محلولة وأسئلة تدريب.',
    chapters: CH,
  };
  const BASE = 'builtin/g11/';

  const sym = ([v, tex, name, unit, sample]) => ({ var: v, tex, name, unit, sample });
  const pts = (list) => (list || []).map((p) => (Array.isArray(p) ? { title: p[0], body: p[1] } : p));
  const chk = (list) => (list || []).map((c) => (Array.isArray(c) ? { q: c[0], options: c[1], answer: c[2], why: c[3] } : c));
  const exp = (e) => {
    const base = { intro: e.intro, points: pts(e.points), realLife: e.realLife || [], scientific: e.scientific || '', lawIds: e.lawIds || [], workedExample: e.example || null, checks: chk(e.checks) };
    const lv = (o) => (o ? { ...base, ...o, ...(o.points ? { points: pts(o.points) } : {}) } : base);
    return { medium: base, simple: lv(e.simple), advanced: lv(e.advanced) };
  };
  const mini = (list) => (list || []).map(([q, a]) => ({ q, a }));

  // 3D scenes for each lesson of the book
  const SC = { '1-1': ['orbit', 'satellite'], '1-2': ['satellite', 'orbit'], '2-1': ['spin', 'torque'], '2-2': ['torque', 'inertia', 'spin'], '2-3': ['balance', 'torque'], '3-1': ['collide', 'recoil'], '3-2': ['collide', 'recoil'], '4-1': ['work', 'incline'], '5-2': ['coaster', 'pendulum', 'collide'], '6-1': ['particles', 'phase'], '6-2': ['phase', 'engine', 'particles'] };
  NL.g11 = (d) => {
    const ch = CH[d.ch - 1];
    const analysis = {
      title: d.title, subject: 'physics', unit: ch.unit, chapter: d.chapter, summary: d.summary,
      objectives: d.objectives, estimatedMinutes: d.minutes || 60,
      sections: d.sections.map(([id, title, pages, summary, conceptIds, lawIds]) => ({ id, title, pages, summary, conceptIds: conceptIds || [], lawIds: lawIds || [] })),
      concepts: d.concepts.map(([id, name, definition, page]) => ({ id, name, definition, page, source: 'book' })),
      laws: (d.laws || []).map((l) => ({ ...l, symbols: l.symbols.map(sym), source: 'book', valid: true })),
      relations: (d.relations || []).map(([from, to, label]) => ({ from, to, label })),
      skills: d.skills || [], needsExplanation: d.needs || [], unclear: [],
      examples: d.examples || [], bookQuestions: [], figures: (d.figures || []).map(([page, description, why]) => ({ page, description, why })),
      misconceptions: (d.misconceptions || []).map(([wrong, right, concept]) => ({ wrong, right, concept })),
      labs: d.labs || [], places: [], events: [], functions: [], reactions: [],
    };
    const explain = {}; for (const [k, e] of Object.entries(d.explain)) explain[k] = exp(e);
    const S = d.recap || {};
    const summary = {
      brief: { keyIdeas: S.key.slice(0, 4), notes: (S.notes || []).slice(0, 2), miniExamples: mini(S.mini).slice(0, 1) },
      standard: { keyIdeas: S.key, notes: S.notes || [], miniExamples: mini(S.mini).slice(0, 2) },
      detailed: { keyIdeas: S.key.concat(S.more || []), notes: S.notes || [], miniExamples: mini(S.mini) },
    };
    const [p0, p1] = d.pages, id = 'g11-' + d.chapter;
    NL.BUILTIN.push({
      id, builtin: true, folder: 'g11', title: d.title, subject: 'physics', unit: ch.unit, chapter: d.chapter,
      grade: 'فيزياء 2 · ثاني ثانوي', createdAt: Date.UTC(2026, 10, 9), pageCount: p1 - p0 + 1, status: 'ready',
      cover: `${BASE}${d.chapter}/p${d.cover || p0}.jpg`, readNotes: { weak: [], textLayerOnly: false },
      analysis, pagesUrl: `${BASE}${d.chapter}/pages.json`, pageBase: `${BASE}${d.chapter}/`,
      gen: { explain, summary, coach: d.coach || [] }, bank: d.bank || [], solved: d.solved || [],
      scenes3d: d.scenes3d || SC[d.chapter] || [], ...(d.videos ? { videos: d.videos } : {}), ...(d.sortActs ? { sortActs: d.sortActs } : {}),
    });
  };
})();
