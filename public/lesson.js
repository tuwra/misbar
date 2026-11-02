/* Misbar lesson workspace: every tool reads the same saved analysis and writes real activity. */
(function () {
  const { $, $$, esc, t, tt, fmt, uid, store, ai, icon } = NL;
  NL.addT({
    tab_3d: ['شرح ثلاثي الأبعاد', '3D explainer'], s3dLead: ['شاهد كل آلة تعمل أمامك، وغيّر المتغيرات لترى القوى والمسافات والكفاءة تتغير لحظيًا.', 'Watch each machine work, and change the variables to see forces, distances and efficiency update live.'],
    bankSrc: ['مصدر الأسئلة', 'Question source'], src_bank: ['بنك أسئلة الدرس الجاهز', 'The lesson’s ready question bank'], src_ai: ['أسئلة جديدة بالذكاء الاصطناعي', 'New AI-written questions'],
    solvedT: ['مسائل الكتاب محلولة خطوة بخطوة', 'Book problems solved step by step'], problemN: ['مسألة {n}', 'Problem {n}'], selfCheck: ['قارن تفسيرك بالتفسير النموذجي', 'Compare with the model explanation'], selfRate: ['كيف كان تفسيرك؟', 'How did you do?'], rate_full: ['مطابق', 'Matched it'], rate_part: ['جزئي', 'Partly'], rate_miss: ['فاتني الكثير', 'Missed a lot'],
    estTime: ['وقت دراسة مقترح ~{n} دقيقة (تقدير)', 'Suggested study time ~{n} min (estimate)'], pagesCount: ['{n} صفحة من مادتك', '{n} pages of your material'],
    continueLast: ['تابع: {tab}', 'Continue: {tab}'], startHere: ['ابدأ بالشرح', 'Start with the explanation'],
    objectives: ['الأهداف التعليمية', 'Learning objectives'], inferred: ['مستنتج', 'inferred'], keyConcepts: ['المفاهيم الأساسية', 'Key concepts'], lessonMap: ['خريطة الدرس', 'Lesson map'],
    progressHow: ['كيف يُحسب التقدم', 'How progress is calculated'], progressNote: ['من نشاطك المحفوظ فقط: الأجزاء التي أنهيتها، أفضل نتيجة اختبار، البطاقات المتقنة، التجارب التي جربتها، والمسائل والتفسيرات.', 'From your saved activity only: parts finished, best quiz score, mastered cards, labs tried, and problems and explanations.'],
    part_explain: ['أجزاء الشرح المكتملة', 'Explanation parts done'], part_quiz: ['أفضل نتيجة اختبار', 'Best quiz score'], part_cards: ['بطاقات متقنة', 'Cards mastered'], part_labs: ['تجارب المختبر', 'Lab experiments'], part_practice: ['مسائل وتفسيرات', 'Problems and explanations'],
    readWarn: ['صفحات لم تُقرأ بوضوح', 'Pages not read clearly'], readWarnS: ['لم يُستخدم ما تعذرت قراءته. أعد رفع هذه الصفحات من «تعديل المحتوى».', 'Unreadable parts were not used. Re-upload these pages from “Edit content”.'], unclearAI: ['أجزاء غامضة أشار إليها التحليل', 'Ambiguous parts flagged by the analysis'],
    draftT: ['هذا الدرس بلا محتوى بعد', 'This lesson has no content yet'], draftS: ['أضف صفحات الكتاب أو النص، وسيُبنى الشرح والأدوات منها.', 'Add book pages or text and the explanation and tools will be built from them.'], addContent: ['أضف المحتوى', 'Add content'],
    toolsHere: ['أدوات هذا الدرس', 'Tools for this lesson'],
    // explain
    level: ['مستوى الشرح', 'Level'], lv_simple: ['مبسط', 'Simple'], lv_medium: ['متوسط', 'Standard'], lv_advanced: ['متقدم', 'Advanced'],
    sciDeeper: ['شرح علمي أدق', 'More precise explanation'], realLife: ['من الحياة الواقعية', 'In real life'], related: ['القوانين المرتبطة', 'Related laws'], workedEx: ['مثال محلول خطوة بخطوة', 'Worked example, step by step'], nextStep: ['الخطوة التالية', 'Next step'], showAll: ['اعرض الكل', 'Show all'],
    checkU: ['تحقق من فهمك', 'Check your understanding'], markDone: ['فهمت هذا الجزء', 'I understand this part'], doneMark: ['مكتمل', 'Done'], askAbout: ['اسأل عن هذا الجزء', 'Ask about this part'], genExplain: ['اشرح هذا الجزء', 'Explain this part'], regenerate: ['أعد التوليد', 'Regenerate'],
    correct: ['إجابة صحيحة', 'Correct'], wrong: ['إجابة غير صحيحة', 'Not correct'], symbolsT: ['الرموز والوحدات', 'Symbols and units'], answer: ['الإجابة', 'Answer'],
    // assistant
    asstHello: ['أنا مساعدك في هذا الدرس. أجيب من صفحات كتابك، وأوضح متى أضيف شيئًا من خارجه.', 'I am your assistant for this lesson. I answer from your book pages and say when I add something from outside it.'],
    askPh: ['اسأل عن أي شيء في الدرس…', 'Ask anything about the lesson…'], qa_simplify: ['بسّط', 'Simplify'], qa_example: ['مثال مشابه', 'Similar example'], qa_compare: ['قارن بين مفهومين', 'Compare two concepts'], qa_clarify: ['وضّح القانون', 'Explain the law'], qa_quiz: ['اختبر فهمي', 'Test me'], qa_life: ['اربطه بالحياة', 'Link to real life'], qa_figure: ['اشرح رسمًا من الكتاب', 'Explain a figure'], qa_mistake: ['أين أخطأت في حلي؟', 'Where did I go wrong?'],
    qp_simplify: ['اشرح لي آخر فكرة بطريقة أبسط.', 'Explain the last idea more simply.'], qp_example: ['أعطني مثالًا مشابهًا محلولًا.', 'Give me a similar worked example.'], qp_compare: ['ما الفرق بين ', 'What is the difference between '], qp_clarify: ['اشرح لي هذا القانون: ما معنى كل رمز ولماذا نستخدمه؟ ', 'Explain this law: what each symbol means and why we use it: '], qp_quiz: ['اختبر فهمي بسؤال واحد عن هذا الجزء ثم انتظر إجابتي.', 'Test my understanding with one question on this part, then wait for my answer.'], qp_life: ['كيف يرتبط هذا المفهوم بالحياة الواقعية؟', 'How does this concept connect to real life?'], qp_mistake: ['هذا حلي. أين أخطأت؟\n', 'Here is my solution. Where did I go wrong?\n'],
    attach: ['أرفق صورة', 'Attach image'], clearChat: ['محادثة جديدة', 'New chat'], pickPage: ['اختر صفحة فيها رسم', 'Pick a page with a figure'], figureAsk: ['اشرح لي الرسم في الصفحة {n}.', 'Explain the figure on page {n}.'],
    // lab
    recommended: ['تجارب مقترحة لهذا الدرس', 'Suggested for this lesson'], allLabs: ['كل تجارب {s}', 'All {s} labs'], explorerT: ['مستكشف قوانين الدرس', 'Lesson law explorer'],
    // quiz
    qzTopic: ['الموضوع', 'Topic'], qzAll: ['الدرس كاملًا', 'Whole lesson'], qzCount: ['عدد الأسئلة', 'Questions'], qzDiff: ['الصعوبة', 'Difficulty'], d_easy: ['سهل', 'Easy'], d_medium: ['متوسط', 'Medium'], d_hard: ['صعب', 'Hard'],
    qzTypes: ['أنواع الأسئلة', 'Question types'], ty_mcq: ['اختيار من متعدد', 'Multiple choice'], ty_tf: ['صح وخطأ', 'True / false'], ty_numeric: ['مسائل حسابية', 'Calculations'], ty_conceptual: ['مفاهيمية', 'Conceptual'], ty_graph: ['قراءة رسم بياني', 'Graph reading'],
    qzMode: ['الوضع', 'Mode'], m_practice: ['تدريب: تغذية راجعة فورية', 'Practice: instant feedback'], m_exam: ['اختبار: النتائج في النهاية', 'Exam: results at the end'],
    qzStart: ['أنشئ الاختبار', 'Build the quiz'], qzBuilding: ['يكتب مِسبار أسئلة من درسك…', 'Writing questions from your lesson…'], qzOf: ['سؤال {i} من {n}', 'Question {i} of {n}'],
    check: ['تحقق', 'Check'], next: ['التالي', 'Next'], finish: ['أنهِ الاختبار', 'Finish quiz'], yourAnswer: ['إجابتك', 'Your answer'], correctAnswer: ['الإجابة الصحيحة', 'Correct answer'],
    tfTrue: ['صح', 'True'], tfFalse: ['خطأ', 'False'], numPh: ['اكتب الناتج', 'Enter the result'], concPh: ['اكتب إجابتك بأسلوبك…', 'Write your answer in your own words…'],
    verifiedNum: ['الناتج محسوب برمجيًا من قانون الدرس', 'Answer computed by code from the lesson’s law'], grading: ['يُصحّح…', 'Grading…'],
    result: ['النتيجة', 'Result'], mastered: ['مفاهيم أتقنتها', 'Concepts you got right'], toReview: ['مفاهيم تحتاج مراجعة', 'Concepts to review'], remedial: ['اختبار قصير على نقاط الضعف', 'Short quiz on weak spots'], newQuiz: ['اختبار جديد', 'New quiz'], history: ['سجل الاختبارات', 'Quiz history'], noWeak: ['لا توجد نقاط ضعف في هذا الاختبار.', 'No weak spots in this quiz.'],
    skip: ['تخطَّ', 'Skip'], partial: ['جزئيًا', 'Partly'],
    // solver
    svMode: ['نوع المساعدة', 'Help style'], sv_hints: ['تلميحات تدريجية', 'Step-by-step hints'], sv_full: ['حل كامل مشروح', 'Full worked solution'], sv_review: ['راجع حلي', 'Review my solution'],
    svProblem: ['نص المسألة', 'Problem'], svProblemPh: ['اكتب المسألة أو ارفع صورتها…', 'Type the problem or upload a photo…'], svMine: ['حلي', 'My solution'], svMinePh: ['اكتب خطوات حلك…', 'Write your steps…'], svBoard: ['أو اكتبه بخط يدك على السبورة', 'Or write it by hand on the board'],
    svGo: ['حل المسألة', 'Solve'], svGiven: ['المعطيات', 'Given'], svFind: ['المطلوب', 'Find'], svLaw: ['القانون المستخدم', 'Law used'], svSub: ['التعويض', 'Substitution'], svCalc: ['الحسابات', 'Calculations'], svResult: ['النتيجة', 'Result'], svCheck: ['التحقق من المعقولية', 'Sanity check'],
    svVerified: ['تحقق برمجي: أعاد مِسبار حساب الناتج من المعادلة والمعطيات فطابق ({v}).', 'Checked by code: Misbar recomputed the result from the equation and givens and it matches ({v}).'], svMismatch: ['تنبيه: إعادة الحساب برمجيًا أعطت {v}، وهو يختلف عن الناتج المكتوب. اعتمد على القيمة المحسوبة وراجع الخطوات.', 'Warning: recomputing by code gave {v}, which differs from the written result. Trust the computed value and recheck the steps.'], svUnverified: ['لم يمكن التحقق برمجيًا من هذه المسألة (المعادلة غير قابلة للحساب).', 'This result could not be checked by code (the equation is not computable).'],
    hint: ['تلميح {i}', 'Hint {i}'], moreHint: ['تلميح آخر', 'Another hint'], showSolution: ['اعرض الحل', 'Show solution'], notUnderstood: ['لم أفهم المسألة. أعد صياغتها أو أرسل صورة أوضح.', 'I could not understand the problem. Rephrase it or send a clearer photo.'],
    // summary
    detail: ['مستوى التفصيل', 'Detail'], de_brief: ['مختصر', 'Brief'], de_standard: ['متوسط', 'Standard'], de_detailed: ['مفصل', 'Detailed'],
    keyIdeas: ['أهم الأفكار', 'Key ideas'], defs: ['التعريفات', 'Definitions'], lawsT: ['القوانين', 'Laws'], relsT: ['العلاقات بين المتغيرات', 'How variables relate'], relsNote: ['محسوبة رياضيًا من قوانين الدرس.', 'Computed mathematically from the lesson’s laws.'], notesT: ['ملاحظات مهمة', 'Important notes'], mistakesT: ['أخطاء شائعة', 'Common mistakes'], examplesT: ['أمثلة مختصرة', 'Short examples'], copy: ['انسخ الملخص', 'Copy summary'], copied: ['نُسخ', 'Copied'],
    // map
    mapLead: ['اضغط أي مفهوم لعرض تعريفه وما يرتبط به. يمكنك سحب العقد.', 'Tap a concept to see its definition and links. Drag nodes to rearrange.'], explainMore: ['اشرحه أكثر', 'Explain more'], quizMe: ['اختبرني عليه', 'Quiz me on it'], linksT: ['يرتبط بـ', 'Linked to'], noRelations: ['لم تُستخرج علاقات كافية لبناء خريطة.', 'Not enough relations were extracted to draw a map.'],
    // cards
    cardsLead: ['البطاقات مبنية من مفاهيم درسك وقوانينه وأخطائك. اضغط البطاقة لقلبها.', 'Cards are built from your lesson’s concepts, laws and your mistakes. Tap a card to flip it.'], box: ['الصندوق {n}', 'Box {n}'], due: ['مستحقة الآن', 'Due now'], allCards: ['الكل', 'All'], wrongCards: ['التي أخطأت فيها', 'Ones I missed'],
    knewIt: ['عرفتها', 'Knew it'], hard: ['صعبة', 'Hard'], didnt: ['لم أعرفها', 'Didn’t know'], studyDue: ['راجع المستحق ({n})', 'Study due ({n})'], sessionDone: ['انتهت المراجعة. أحسنت!', 'Session complete. Nice work!'], cardsMasteredN: ['{m} من {n} متقنة', '{m} of {n} mastered'],
    ct_concept: ['مفهوم', 'Concept'], ct_law: ['قانون', 'Law'], ct_symbol: ['رمز', 'Symbol'], ct_myth: ['صح أم خطأ؟', 'True or false?'], ct_mistake: ['من أخطائك', 'From your mistakes'], mythFront: ['«{w}»', '“{w}”'], mythBack: ['خطأ شائع. الصحيح: {r}', 'A common mistake. In fact: {r}'],
    // mistakes
    misLead: ['كل خطأ هنا حدث فعلًا في اختباراتك وتدريباتك.', 'Every mistake here really happened in your quizzes and practice.'], misEmpty: ['لا أخطاء محفوظة بعد. عندما تخطئ في سؤال، سيظهر هنا لتراجعه.', 'No mistakes saved yet. When you miss a question it will appear here to review.'],
    whyWrong: ['لماذا أخطأت؟', 'Why did I miss it?'], similar: ['تمرين مشابه', 'Similar exercise'], resolved: ['تمت معالجته', 'Resolved'], unresolved: ['غير معالج', 'Open'], concept: ['المفهوم', 'Concept'], src_quiz: ['اختبار', 'Quiz'], src_explain: ['أسئلة الشرح', 'Explain checks'], src_mistake: ['تمرين مشابه', 'Similar exercise'],
    // mastery
    masteryLead: ['إتقان كل مفهوم محسوب من إجاباتك الفعلية وبطاقاتك. المفاهيم بلا بيانات تبقى رمادية.', 'Each concept’s mastery comes from your actual answers and cards. Concepts without data stay grey.'], evidence: ['{n} دليل', '{n} data points'], noData: ['لا بيانات', 'No data'],
    planT: ['خطة مراجعة شخصية', 'Personal review plan'], examDate: ['موعد الاختبار (اختياري)', 'Exam date (optional)'], perDay: ['دقائق يوميًا', 'Minutes per day'], buildPlan: ['ابنِ الخطة', 'Build plan'], day: ['اليوم {n}', 'Day {n}'],
    tk_explain: ['اقرأ واشرح: {s}', 'Read: {s}'], tk_quiz: ['اختبار قصير على: {s}', 'Short quiz on: {s}'], tk_cards: ['راجع {n} بطاقة مستحقة', 'Review {n} due cards'], tk_mistakes: ['عالج {n} من أخطائك', 'Fix {n} of your mistakes'], tk_lab: ['جرّب: {s}', 'Try: {s}'], tk_final: ['اختبار شامل للدرس', 'Full lesson quiz'], tk_coach: ['فسّر ظاهرة', 'Explain a phenomenon'],
    planNote: ['الخطة مبنية من حالتك الآن، وتتغير كلما تقدمت.', 'The plan reflects where you are now and changes as you progress.'],
    // coach
    coachLead: ['يعرض مِسبار ظاهرة حقيقية مرتبطة بدرسك. فسّرها بكلماتك وسيقيّم تفسيرك بمعيار واضح.', 'Misbar shows a real phenomenon tied to your lesson. Explain it in your words and get a clear rubric score.'],
    newPhen: ['ظاهرة جديدة', 'New phenomenon'], yourExpl: ['تفسيرك', 'Your explanation'], evaluate: ['قيّم تفسيري', 'Evaluate'], strengths: ['نقاط القوة', 'Strengths'], missing: ['ما ينقص', 'What is missing'], misconc: ['تصورات خاطئة', 'Misconceptions'], model: ['تفسير نموذجي', 'Model explanation'], score10: ['{s} / 10', '{s} / 10'],
    // board
    boardLead: ['اكتب معادلاتك وارسم بخط يدك. يمكن لمِسبار قراءة السبورة ومراجعة حلك.', 'Write equations and sketch by hand. Misbar can read the board and review your work.'], boardReview: ['اقرأ السبورة وراجع حلي', 'Read the board and review my work'], boardEmpty: ['السبورة فارغة.', 'The board is empty.'],
    // sources
    srcLead: ['المادة التي قرأها مِسبار من ملفاتك، وهي المصدر الذي تعتمد عليه كل الأدوات.', 'The material Misbar read from your files: the source every tool relies on.'], qualityPartial: ['قراءة جزئية', 'Partly read'],
  });

  const RULES = () => `You are Misbar, a patient expert tutor. The student's LESSON PAGES are the primary source.
- Base explanations, questions and answers on the lesson pages. Cite pages as [p.N] when you use them.
- Never claim the book says something that is not in the pages. Never invent equations, numbers or references and attribute them to the book.
- When you add helpful information that is NOT in the pages, put it inside a block that starts with a line ":::extra" and ends with a line ":::".
- Write math in LaTeX between $...$ or $$...$$. Keep units in SI symbols.
- Answer in ${NL.lang === 'ar' ? 'Arabic (Modern Standard, clear and friendly)' : 'English'}.`;

  const W = (NL.ws = {});
  const TABS = {
    overview: { g: 'learn', i: 'M4 5h16v14H4zM4 10h16' }, '3d': { g: 'learn', i: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12l8-4.5M12 12v9M12 12L4 7.5' }, explain: { g: 'learn', i: 'M4 6h16M4 12h10M4 18h13' }, assistant: { g: 'learn', i: 'M5 5h14v10H9l-4 4z' }, lab: { g: 'learn', i: 'M9 3v6L4 19a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L15 9V3M8 3h8' },
    map: { g: 'learn', i: 'M6 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M18 8m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M12 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M8 7l8 1M7 8l4 8M17 10l-4 6' }, atlas: { g: 'learn', i: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14' },
    quiz: { g: 'practice', i: 'M9 9a3 3 0 1 1 3 3v2M12 18h.01' }, solver: { g: 'practice', i: 'M5 4h14v16H5zM8 8h8M8 12h3M13 12h3M8 16h3M13 16h3' }, coach: { g: 'practice', i: 'M12 3a6 6 0 0 1 4 10.5V17H8v-3.5A6 6 0 0 1 12 3zM9 21h6' }, board: { g: 'practice', i: 'M3 5h18v12H3zM8 21l4-4 4 4M7 13l3-3 2 2 4-4' },
    summary: { g: 'review', i: 'M6 3h9l3 3v15H6zM9 9h6M9 13h6M9 17h4' }, cards: { g: 'review', i: 'M7 4h12v14H7zM4 7v13h12' }, mistakes: { g: 'review', i: 'M12 4l9 16H3zM12 10v4M12 17h.01' }, mastery: { g: 'review', i: 'M4 20V10M10 20V4M16 20v-7M22 20H2' }, sources: { g: 'review', i: 'M6 3h8l4 4v14H6zM14 3v4h4' },
  };
  const tabIcon = (k) => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${TABS[k].i}"/></svg>`;

  function tabsFor(l) {
    const a = l.analysis; if (!a) return ['overview'];
    const s = l.subject, hasLaws = a.laws.some((x) => x.valid), labby = ['physics', 'chemistry', 'math'].includes(s) || hasLaws || a.labs.length || a.functions.length;
    const geo = ['history', 'geography'].includes(s) || a.places.length;
    return ['overview', l.scenes3d?.length && '3d', 'explain', 'assistant', labby && 'lab', 'map', geo && 'atlas', 'quiz', (hasLaws || a.examples.length || ['physics', 'chemistry', 'math'].includes(s)) && 'solver', 'coach', 'board', 'summary', 'cards', 'mistakes', 'mastery', 'sources'].filter(Boolean);
  }

  /* ---------- load + shell ---------- */
  NL.renderLesson = async (v, { id, tab }) => {
    v.innerHTML = `<div class="ws-loading"><div class="orbit-loader"><span></span><span></span><span></span></div></div>`;
    const lesson = NL.app.lessons.find((l) => l.id === id) || (await store.getLesson(id));
    if (!lesson) { NL.toast(NL.lang === 'ar' ? 'لم يُعثر على الدرس' : 'Lesson not found', 'warn'); return NL.go('library'); }
    if (!NL.app.lessons.includes(lesson)) NL.app.lessons.push(lesson);
    const [gen, state] = await Promise.all([store.getPart(id, 'gen'), store.getPart(id, 'state')]);
    Object.assign(W, {
      lesson, gen: gen || {}, state: Object.assign({ quizzes: [], mistakes: [], cards: {}, chat: [], labSettings: {}, coach: [], checks: {} }, state || {}),
      pagesP: null, stop: [],
    });
    lesson.stats ||= { activity: 0 };
    if (Array.isArray(W.gen.bank)) lesson.bank = W.gen.bank;
    W.teacher = NL.auth.isTeacher();
    W.tabs = tabsFor(lesson);
    W.tab = tab && W.tabs.includes(tab) ? tab : 'overview';
    v.innerHTML = `<div class="ws">
      <aside class="ws-nav">
        <div class="ws-id"><p class="lcard-meta"><span class="subj-dot s-${esc(lesson.subject)}"></span>${esc(NL.subjectName(lesson.subject))}${lesson.unit ? ' · ' + esc(lesson.unit) : ''}</p>
          <h1 class="ws-title">${esc(lesson.title)}</h1>
          ${NL.auth.isTeacher() && lesson.analysis ? `<button class="btn sm present-btn" id="ws-present">${tabIcon('3d').replace('class="ic"', 'class="ic"')} ${t('present')}</button>` : ''}
          <div class="ws-prog"><svg viewBox="0 0 40 40" class="ring"><circle cx="20" cy="20" r="16" class="ring-bg"/><circle cx="20" cy="20" r="16" class="ring-fg" pathLength="100" stroke-dasharray="0 100"/></svg><span><b id="ws-pct">0%</b> ${t('progress')}</span></div></div>
        <nav class="ws-tabs" aria-label="tools">${['learn', 'practice', 'review'].map((g) => `<p class="ws-grp">${t('grp_' + g)}</p>${W.tabs.filter((k) => TABS[k].g === g).map((k) => `<button class="ws-tab" data-tab="${k}">${tabIcon(k)}<span>${t('tab_' + k)}</span></button>`).join('')}`).join('')}</nav>
      </aside>
      <section class="ws-main"><div class="ws-body" id="ws-body"></div></section></div>`;
    $$('.ws-tab', v).forEach((b) => (b.onclick = () => W.open(b.dataset.tab)));
    $('#ws-present', v)?.addEventListener('click', () => NL.present(W.lesson, W.gen, { level: W.state.level || 'medium' }));
    W.updateProgress();
    W.open(W.tab, true);
    NL.app.cleanup.push(() => W.stop.forEach((f) => f?.()));
  };

  W.open = (tab, first, opts = {}) => {
    W.stop.forEach((f) => { try { f?.(); } catch {} }); W.stop = [];
    W.tab = tab;
    $$('.ws-tab').forEach((b) => { b.classList.toggle('on', b.dataset.tab === tab); if (b.dataset.tab === tab) b.scrollIntoView?.({ block: 'nearest', inline: 'center' }); });
    const body = $('#ws-body'); body.innerHTML = ''; body.className = 'ws-body t-' + tab;
    if (!first) window.scrollTo({ top: Math.min(window.scrollY, $('.ws')?.offsetTop || 0), behavior: 'smooth' });
    if (W.lesson.status === 'draft') return renderDraft(body);
    if (!first && tab !== 'overview') W.touch(tab, false);
    R[tab](body, opts);
  };
  W.pages = () => (W.pagesP ||= store.getPages(W.lesson.id, W.lesson.pageCount || 0));
  W.saveLesson = NL.debounce(() => store.putLesson(W.lesson), 600);
  W.saveState = NL.debounce(() => store.putPart(W.lesson.id, 'state', W.state), 700);
  W.saveGen = () => store.putPart(W.lesson.id, 'gen', W.gen);
  W.touch = (tab, count = true) => { W.lesson.lastActivity = { at: Date.now(), tab }; if (count) W.lesson.stats.activity = (W.lesson.stats.activity || 0) + 1; W.saveLesson(); };
  W.stat = (fn) => { fn(W.lesson.stats); W.lesson.stats.activity = (W.lesson.stats.activity || 0) + 1; W.lesson.lastActivity = { at: Date.now(), tab: W.tab }; W.saveLesson(); W.updateProgress(); };
  W.updateProgress = () => {
    const p = NL.progress(W.lesson); const fg = $('.ring-fg'); if (fg) fg.setAttribute('stroke-dasharray', `${p.pct} 100`);
    const el = $('#ws-pct'); if (el) el.textContent = p.pct + '%';
  };
  W.ctx = async (max = 60000) => {
    const a = W.lesson.analysis, pages = await W.pages();
    const compact = { title: W.lesson.title, subject: W.lesson.subject, objectives: a.objectives, sections: a.sections.map(({ id, title, summary, pages: pg }) => ({ id, title, summary, pages: pg })), concepts: a.concepts.map(({ id, name, definition, page }) => ({ id, name, definition, page })), laws: a.laws.map(({ id, name, latex, equation, symbols, page, conditions }) => ({ id, name, latex, equation, symbols, page, conditions })) };
    return `LESSON OUTLINE (extracted from the pages):\n${JSON.stringify(compact)}\n\nLESSON PAGES:${NL.sourceText(pages, max)}`;
  };
  const concept = (id) => W.lesson.analysis.concepts.find((c) => c.id === id);
  const law = (id) => W.lesson.analysis.laws.find((l) => l.id === id);
  const needAI = (host) => { if (ai.ready) return false; host.innerHTML = ai.offHtml(); return true; };
  const head = (title, lead, extra = '') => `<header class="tool-head"><div><h2>${title}</h2>${lead ? `<p class="lead-sm">${lead}</p>` : ''}</div>${extra}</header>`;
  const lawCard = (l) => `<div class="law"><div class="law-eq">${NL.tex(l.latex || l.equation || '', true)}</div><div class="law-meta"><b>${esc(l.name)}</b>${l.page ? ` <span class="pref">${t('page')} ${l.page}</span>` : ''}${l.source === 'extra' ? ` <span class="tag extra-tag">${t('extra')}</span>` : ''}${l.conditions ? `<p class="fine">${esc(l.conditions)}</p>` : ''}</div>
    ${l.symbols?.length ? `<table class="sym"><tbody>${l.symbols.map((s) => `<tr><td>${NL.tex(s.tex || s.var)}</td><td>${esc(s.name)}</td><td dir="ltr">${esc(s.unit || '—')}</td></tr>`).join('')}</tbody></table>` : ''}</div>`;
  const spinner = (msg) => `<div class="gen-wait"><div class="orbit-loader"><span></span><span></span><span></span></div><p>${msg || t('generating')}</p><button class="btn sm ghost" data-stop>${t('stop')}</button></div>`;
  async function withSpinner(host, msg, fn) {
    const ctl = new AbortController(); host.innerHTML = spinner(msg); $('[data-stop]', host).onclick = () => ctl.abort();
    W.stop.push(() => ctl.abort());
    try { return await fn(ctl.signal); } catch (e) { if (e.code !== 'cancelled') console.error(e); host.innerHTML = `<div class="notice bad"><p>${esc(ai.errText(e))}</p><button class="btn sm" data-retry>${t('retry')}</button></div>`; $('[data-retry]', host).onclick = () => withSpinner(host, msg, fn); return null; }
  }
  W.addMistake = (m) => { W.state.mistakes.unshift({ id: uid(), at: Date.now(), resolved: false, ...m }); W.state.mistakes = W.state.mistakes.slice(0, 200); W.saveState(); };

  const R = {};

  function renderDraft(body) {
    body.innerHTML = `<div class="empty">${NL.coverSvg(W.lesson)}<h2>${t('draftT')}</h2><p>${t('draftS')}</p><button class="btn" id="add-c">${icon('plus')} ${t('addContent')}</button></div>`;
    $('#add-c').onclick = () => NL.go('new', { edit: W.lesson.id });
  }

  /* ---------- overview ---------- */
  R.overview = (body) => {
    const l = W.lesson, a = l.analysis, p = NL.progress(l), last = l.lastActivity?.tab;
    const done = l.stats.sectionsDone || {};
    body.innerHTML = `
      <section class="ov-hero">
        <div class="ov-copy"><p class="eyebrow">${esc(NL.subjectName(l.subject))}${l.unit ? ' · ' + esc(l.unit) : ''}${l.chapter ? ' · ' + esc(l.chapter) : ''}</p>
          <h2 class="ov-title">${esc(l.title)}</h2><div class="prose">${NL.md(a.summary)}</div>
          <p class="ov-meta"><span>${icon('play')} ${t('estTime', { n: a.estimatedMinutes })}</span><span>${icon('layers')} ${t('pagesCount', { n: l.pageCount })}</span><span>${t('created')} ${NL.date(l.createdAt)}</span></p>
          <div class="row gap wrap">${last && last !== 'overview' && W.tabs.includes(last) ? `<button class="btn" data-goto="${last}">${t('continueLast', { tab: t('tab_' + last) })} ${icon('arrow')}</button>` : `<button class="btn" data-goto="explain">${t('startHere')} ${icon('arrow')}</button>`}</div></div>
        <div class="ov-art">${NL.coverSvg(l)}</div>
      </section>
      ${l.readNotes?.weak?.length || a.unclear.length ? `<section class="notice warn"><div>${l.readNotes?.weak?.length ? `<p><b>${t('readWarn')}:</b> ${l.readNotes.weak.map((w) => `<span class="pref">${t('page')} ${w.page}</span>${w.issue ? ' ' + esc(w.issue) : ''}`).join(' · ')}</p><p>${t('readWarnS')}</p>` : ''}${a.unclear.length ? `<b>${t('unclearAI')}</b><ul>${a.unclear.map((u) => `<li>${u.page ? `<span class="pref">${t('page')} ${u.page}</span> ` : ''}${esc(u.issue)}</li>`).join('')}</ul>` : ''}<button class="btn sm ghost" id="ov-edit">${t('editContent')}</button></div></section>` : ''}
      <section><h3>${t('lessonMap')}</h3><ol class="lmap">${a.sections.map((s, i) => `<li class="${done[s.id] ? 'done' : ''}"><button data-sec="${s.id}"><span class="lmap-n">${done[s.id] ? icon('check') : i + 1}</span><span class="lmap-t">${esc(s.title)}</span><span class="lmap-s">${esc(s.summary || '')}</span></button></li>`).join('')}</ol></section>
      <div class="ov-cols">
        <section><h3>${t('objectives')}</h3><ul class="obj">${a.objectives.map((o) => { const inf = /^\*/.test(o); return `<li>${esc(o.replace(/^\*\s*/, ''))}${inf ? ` <span class="tag">${t('inferred')}</span>` : ''}</li>`; }).join('')}</ul>
          <h3>${t('keyConcepts')}</h3><div class="chips">${a.concepts.map((c) => `<button class="chip" data-concept="${c.id}">${esc(c.name)}</button>`).join('')}</div></section>
        <section class="panel"><h3>${t('progressHow')}</h3><p class="fine">${t('progressNote')}</p>
          <ul class="pbars">${Object.keys(p.parts).map((k) => `<li><span>${t('part_' + k)}</span><div class="meter"><span style="width:${Math.round(p.parts[k] * 100)}%"></span></div><b>${Math.round(p.parts[k] * 100)}%</b><small>×${p.W[k]}%</small></li>`).join('')}</ul>
          <p class="ov-total">${t('progress')}: <b>${p.pct}%</b></p></section>
      </div>
      ${a.laws.length ? `<section><h3>${t('lawsT')}</h3><div class="laws">${a.laws.map(lawCard).join('')}</div></section>` : ''}
      <section><h3>${t('toolsHere')}</h3><div class="tool-grid">${W.tabs.filter((k) => k !== 'overview').map((k) => `<button class="tool-tile" data-goto="${k}">${tabIcon(k)}<span>${t('tab_' + k)}</span>${k === 'lab' && a.labs.length ? `<small>${a.labs.map((x) => esc(tt(NL.LABS[x.id].title))).join(' · ')}</small>` : ''}</button>`).join('')}</div></section>`;
    $$('[data-goto]', body).forEach((b) => (b.onclick = () => W.open(b.dataset.goto)));
    $$('[data-sec]', body).forEach((b) => (b.onclick = () => W.open('explain', false, { sec: b.dataset.sec })));
    $$('[data-concept]', body).forEach((b) => (b.onclick = () => W.open('map', false, { focus: b.dataset.concept })));
    $('#ov-edit', body)?.addEventListener('click', () => NL.go('new', { edit: l.id }));
  };

  /* ---------- 3D explainer ---------- */
  R['3d'] = (body) => {
    body.innerHTML = `${head(t('tab_3d'), t('s3dLead'))}<div id="s3d-host"></div>`;
    let stop = null, alive = true;
    NL.mount3D($('#s3d-host', body), { sceneIds: W.lesson.scenes3d, onInteract: () => { if (!W.lesson.stats.labsUsed?.['3d']) W.stat((st) => { st.labsUsed ||= {}; st.labsUsed['3d'] = Date.now(); }); } }).then((f) => { if (alive) stop = f; else f?.(); });
    W.stop.push(() => { alive = false; stop?.(); });
  };

  /* ---------- explain ---------- */
  R.explain = (body, opts) => {
    const a = W.lesson.analysis; let sec = opts.sec || a.sections.find((s) => !W.lesson.stats.sectionsDone?.[s.id])?.id || a.sections[0].id;
    let level = W.state.level || 'medium';
    body.innerHTML = `${head(t('tab_explain'), '', `<div class="seg" role="radiogroup" aria-label="${t('level')}">${['simple', 'medium', 'advanced'].map((lv) => `<button role="radio" data-lv="${lv}" aria-checked="${lv === level}">${t('lv_' + lv)}</button>`).join('')}</div>`)}
      <div class="ex-layout"><ol class="sec-list"></ol><article class="sec-body" id="sec-body"></article></div>`;
    const list = $('.sec-list', body);
    const drawList = () => (list.innerHTML = a.sections.map((s, i) => `<li><button data-s="${s.id}" class="${s.id === sec ? 'on' : ''} ${W.lesson.stats.sectionsDone?.[s.id] ? 'done' : ''}"><span class="lmap-n">${W.lesson.stats.sectionsDone?.[s.id] ? icon('check') : i + 1}</span>${esc(s.title)}</button></li>`).join(''));
    drawList();
    list.onclick = (e) => { const b = e.target.closest('[data-s]'); if (b) { sec = b.dataset.s; drawList(); show(); } };
    $$('[data-lv]', body).forEach((b) => (b.onclick = () => { level = W.state.level = b.dataset.lv; W.saveState(); $$('[data-lv]', body).forEach((x) => x.setAttribute('aria-checked', x === b)); show(); }));
    const show = async (force) => {
      const host = $('#sec-body', body), s = a.sections.find((x) => x.id === sec);
      const cached = !force && W.gen.explain?.[sec]?.[level];
      if (cached) return paint(host, s, cached);
      if (needAI(host)) return;
      const ctxText = await W.ctx(50000);
      const data = await withSpinner(host, t('generating'), (signal) => ai.json(`${RULES()}\n\n${ctxText}\n\nExplain section "${s.title}" (id ${s.id}, pages ${s.pages.join(', ') || 'see outline'}) for a student at level "${level}" (simple = plain everyday words for a beginner; medium = standard school level; advanced = precise and scientific, with derivations where the subject allows).
Make it interactive and visual, not a wall of text. Return ONLY JSON:
{"intro":"1-2 sentences, markdown","points":[{"title":"short","body":"markdown, 2-4 sentences"}],"scientific":"a more precise explanation in markdown","realLife":["concrete everyday example"],"lawIds":["ids of related lesson laws"],"workedExample":{"problem":"","steps":["markdown step"],"answer":"","source":"book or extra","page":null},"diagram":"a simple inline SVG that illustrates the idea, or empty string","diagramCaption":"","checks":[{"q":"","options":["","","",""],"answer":0,"why":""}]}
points: 3-5 small chunks. workedExample: prefer an example from the pages (source "book" with its page); otherwise create one and mark source "extra"; use null if the section has no calculations or procedures. diagram: viewBox="0 0 400 220", at most 40 elements, use stroke="currentColor", fill="none" or class="a1" (accent fill) / class="a2" (second accent), short text labels with fill="currentColor" font-size="13"; no images, no scripts. checks: 2-3 multiple-choice questions with exactly one correct option.`, { signal, modelTier: 'default' }));
      if (!data) return;
      W.gen.explain ||= {}; W.gen.explain[sec] ||= {}; W.gen.explain[sec][level] = data; W.saveGen();
      paint(host, s, data);
    };
    const paint = (host, s, d) => {
      const done = W.lesson.stats.sectionsDone?.[s.id];
      const ex = d.workedExample && d.workedExample.steps?.length ? d.workedExample : null;
      const laws = (d.lawIds || []).map(law).filter(Boolean).concat((s.lawIds || []).map(law).filter(Boolean)).filter((x, i, arr) => arr.indexOf(x) === i);
      host.innerHTML = `<div class="sec-top"><h3>${esc(s.title)}</h3>${s.pages?.length ? `<span class="pref">${t('page')} ${s.pages.join('، ')}</span>` : ''}${W.teacher ? `<button class="btn sm" data-present>${t('present')}</button><button class="btn sm ghost" data-edit>${t('editPart')}</button>` : ''}<button class="btn sm ghost" data-regen>${t('regenerate')}</button></div>
        <div class="prose intro">${NL.md(d.intro)}</div>
        <div class="points">${(d.points || []).map((p, i) => `<section class="point"><span class="point-n">${i + 1}</span><div><h4>${esc(p.title)}</h4><div class="prose">${NL.md(p.body)}</div></div></section>`).join('')}</div>
        ${NL.safeSvg(d.diagram) ? `<figure class="diagram">${NL.safeSvg(d.diagram)}<figcaption>${esc(d.diagramCaption || '')} <span class="tag extra-tag">${NL.lang === 'ar' ? 'رسم توضيحي مولّد' : 'Generated illustration'}</span></figcaption></figure>` : ''}
        ${laws.length ? `<h4 class="sub">${t('related')}</h4><div class="laws">${laws.map(lawCard).join('')}</div>` : ''}
        ${d.realLife?.length ? `<h4 class="sub">${t('realLife')}</h4><ul class="life">${d.realLife.map((x) => `<li>${NL.md(x)}</li>`).join('')}</ul>` : ''}
        ${ex ? `<section class="worked"><h4 class="sub">${t('workedEx')} ${ex.source === 'book' ? `<span class="tag book">${t('fromBook')}${ex.page ? ' · ' + t('page') + ' ' + ex.page : ''}</span>` : `<span class="tag extra-tag">${t('extra')}</span>`}</h4>
          <div class="prose">${NL.md(ex.problem)}</div><ol class="steps-rev">${ex.steps.map((st, i) => `<li ${i ? 'hidden' : ''}>${NL.md(st)}</li>`).join('')}</ol>
          <p class="ans" hidden><b>${t('answer')}:</b> ${NL.md(ex.answer)}</p>
          <div class="row gap"><button class="btn sm" data-step>${t('nextStep')}</button><button class="btn sm ghost" data-all>${t('showAll')}</button></div></section>` : ''}
        ${d.scientific ? `<details class="deeper"><summary>${t('sciDeeper')}</summary><div class="prose">${NL.md(d.scientific)}</div></details>` : ''}
        <section class="checks"><h4 class="sub">${t('checkU')}</h4>${(d.checks || []).map((c, i) => `<div class="mcq" data-c="${i}"><p>${NL.md(c.q)}</p><div class="opts">${c.options.map((o, j) => `<button data-o="${j}">${NL.md(o).replace(/^<p>|<\/p>$/g, '')}</button>`).join('')}</div><div class="fb" hidden></div></div>`).join('')}</section>
        <div class="sec-actions"><button class="btn ${done ? 'ghost' : ''}" data-done>${done ? icon('check') + ' ' + t('doneMark') : t('markDone')}</button><button class="btn ghost" data-ask>${t('askAbout')}</button></div>`;
      $('[data-regen]', host).onclick = () => show(true);
      $('[data-present]', host)?.addEventListener('click', () => NL.present(W.lesson, W.gen, { level, startSec: s.id }));
      $('[data-edit]', host)?.addEventListener('click', () => {
        const original = NL.store.builtin(W.lesson.id)?.gen?.explain?.[s.id]?.[level];
        NL.editExplain(host, d, {
          canReset: !!original,
          onSave: (nd) => { if (nd) { W.gen.explain ||= {}; W.gen.explain[s.id] ||= {}; W.gen.explain[s.id][level] = nd; W.saveGen(); NL.toast(t('fSaved'), 'ok'); } paint(host, s, nd || d); },
          onReset: () => { W.gen.explain[s.id][level] = structuredClone(original); W.saveGen(); NL.toast(t('fRestored'), 'ok'); paint(host, s, original); },
        });
      });
      const steps = $$('.steps-rev li', host);
      $('[data-step]', host)?.addEventListener('click', (e) => { const nx = steps.find((x) => x.hidden); if (nx) nx.hidden = false; if (!steps.some((x) => x.hidden)) { $('.ans', host).hidden = false; e.target.disabled = true; } });
      $('[data-all]', host)?.addEventListener('click', () => { steps.forEach((x) => (x.hidden = false)); $('.ans', host).hidden = false; });
      $$('.mcq', host).forEach((m) => {
        const c = d.checks[+m.dataset.c];
        $$('[data-o]', m).forEach((b) => (b.onclick = () => {
          if (m.classList.contains('answered')) return; m.classList.add('answered');
          const ok = +b.dataset.o === +c.answer; b.classList.add(ok ? 'right' : 'wrong'); $$('[data-o]', m)[+c.answer]?.classList.add('right');
          const fb = $('.fb', m); fb.hidden = false; fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.innerHTML = `<b>${ok ? t('correct') : t('wrong')}</b> ${NL.md(c.why)}`;
          W.state.checks[s.id] ||= []; W.state.checks[s.id].push({ ok, at: Date.now() });
          if (!ok) W.addMistake({ source: 'explain', q: c.q, given: c.options[+b.dataset.o], correct: c.options[+c.answer], why: c.why, sectionId: s.id, conceptId: s.conceptIds?.[0] });
          W.saveState();
          if ($$('.mcq', host).every((x) => x.classList.contains('answered')) && $$('.mcq .wrong', host).length === 0) markDone();
        }));
      });
      const markDone = () => { if (W.lesson.stats.sectionsDone?.[s.id]) return; W.stat((st) => { st.sectionsDone ||= {}; st.sectionsDone[s.id] = Date.now(); }); drawList(); const b = $('[data-done]', host); b.innerHTML = icon('check') + ' ' + t('doneMark'); b.classList.add('ghost'); };
      $('[data-done]', host).onclick = markDone;
      $('[data-ask]', host).onclick = () => W.open('assistant', false, { prefill: (NL.lang === 'ar' ? `عن جزء «${s.title}»: ` : `About “${s.title}”: `) });
    };
    show();
  };

  /* ---------- assistant ---------- */
  R.assistant = (body, opts) => {
    body.innerHTML = `${head(t('tab_assistant'), t('asstHello'), `<button class="btn sm ghost" id="chat-clear">${t('clearChat')}</button>`)}
      <div class="chat"><div class="chat-log" id="chat-log" aria-live="polite"></div>
        <div class="quick">${['simplify', 'example', 'compare', 'clarify', 'quiz', 'life', 'figure', 'mistake'].map((k) => `<button class="chip" data-q="${k}">${t('qa_' + k)}</button>`).join('')}</div>
        <div class="fig-pick" hidden></div>
        <form class="composer" id="composer"><div class="att" hidden></div>
          <textarea id="chat-in" rows="2" placeholder="${t('askPh')}" dir="auto"></textarea>
          <div class="composer-bar"><label class="icon-btn ${ai.images ? '' : 'hidden'}" title="${t('attach')}">${icon('image')}<input type="file" accept="image/*" id="chat-img" hidden></label>
          <button class="btn" id="chat-send" type="submit">${icon('send')}<span class="sr">${NL.lang === 'ar' ? 'أرسل' : 'Send'}</span></button></div></form></div>`;
    const log = $('#chat-log', body), inp = $('#chat-in', body); let img = null, busy = null;
    const bubble = (m) => `<div class="msg ${m.role}">${m.role === 'assistant' ? `<div class="prose">${NL.md(m.content)}</div>` : `<p>${esc(m.content)}</p>${m.img ? `<span class="tag">${icon('image')}</span>` : ''}`}</div>`;
    const draw = () => { log.innerHTML = W.state.chat.length ? W.state.chat.map(bubble).join('') : `<div class="msg assistant"><div class="prose"><p>${t('asstHello')}</p></div></div>`; log.scrollTop = log.scrollHeight; };
    draw();
    if (opts.prefill) { inp.value = opts.prefill; inp.focus(); }
    $('#chat-clear', body).onclick = () => { W.state.chat = []; W.saveState(); draw(); };
    $('#chat-img', body)?.addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; img = await NL.reader.blob(await NL.reader.imageToCanvas(f)); const at = $('.att', body); at.hidden = false; at.innerHTML = `${icon('image')} ${esc(f.name)} <button type="button" class="icon-btn">${icon('x')}</button>`; $('button', at).onclick = () => { img = null; at.hidden = true; }; });
    $$('[data-q]', body).forEach((b) => (b.onclick = async () => {
      const k = b.dataset.q;
      if (k === 'figure') {
        const pages = await W.pages(), withFig = pages.filter((p) => /\[FIGURE/i.test(p.text || '') || p.image);
        const fp = $('.fig-pick', body); fp.hidden = false;
        fp.innerHTML = `<p class="fine">${t('pickPage')}</p><div class="chips">${(withFig.length ? withFig : pages).map((p) => `<button class="chip" data-pg="${p.n}">${t('page')} ${p.n}</button>`).join('')}</div>`;
        $$('[data-pg]', fp).forEach((c) => (c.onclick = async () => { fp.hidden = true; const pg = pages.find((p) => p.n === +c.dataset.pg); if (pg?.image && ai.images) img = await (await fetch(pg.image)).blob(); send(t('figureAsk', { n: pg.n })); }));
        return;
      }
      if (['simplify', 'example', 'quiz', 'life'].includes(k)) return send(t('qp_' + k));
      inp.value = t('qp_' + k); inp.focus();
    }));
    $('#composer', body).onsubmit = (e) => { e.preventDefault(); const s = inp.value.trim(); if (s) send(s); };
    inp.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#composer', body).requestSubmit(); } };
    async function send(text) {
      if (busy) return; if (!ai.ready) { log.insertAdjacentHTML('beforeend', ai.offHtml()); return; }
      inp.value = '';
      W.state.chat.push({ role: 'user', content: text, at: Date.now(), img: !!img }); draw();
      const holder = document.createElement('div'); holder.className = 'msg assistant pending'; holder.innerHTML = `<div class="dots"><i></i><i></i><i></i></div>`; log.append(holder); log.scrollTop = log.scrollHeight;
      busy = new AbortController(); W.stop.push(() => busy?.abort());
      $('#chat-send', body).disabled = true;
      try {
        const sys = `${RULES()}\nYou are chatting with the student inside this lesson. Keep answers focused and short unless asked for more; use small steps, lists and math. When the student shares a solution, check each step and say exactly where the first error is. When asked to quiz, ask one question and wait. Use the calculate tool for any arithmetic.\n\n${await W.ctx(45000)}`;
        const hist = W.state.chat.slice(-16).map((m) => ({ role: m.role, content: m.content }));
        const imgs = img ? [img] : undefined; img = null; $('.att', body).hidden = true;
        const r = await ai.sample([{ role: 'user', content: sys }, ...hist], { cache: false, signal: busy.signal, images: imgs, tools: ai.tools ? [ai.calcTool()] : undefined, onText: ({ text: tx }) => { holder.classList.remove('pending'); holder.innerHTML = `<div class="prose">${NL.md(tx)}</div>`; log.scrollTop = log.scrollHeight; } });
        W.state.chat.push({ role: 'assistant', content: r.text, at: Date.now() });
        W.state.chat = W.state.chat.slice(-40); W.saveState(); W.touch('assistant');
      } catch (e) {
        holder.className = 'notice bad'; holder.textContent = ai.errText(e);
        if (e.text) W.state.chat.push({ role: 'assistant', content: e.text, at: Date.now() });
      } finally { busy = null; $('#chat-send', body).disabled = false; draw(); }
    }
  };

  /* ---------- lab ---------- */
  R.lab = (body) => {
    const a = W.lesson.analysis, s = W.lesson.subject;
    const rec = a.labs.filter((x) => NL.LABS[x.id]);
    const catalog = Object.values(NL.LABS).filter((l) => l.subject === s && !rec.some((r) => r.id === l.id));
    const extras = [];
    if (a.laws.some((l) => l.valid)) extras.push(['explorer', t('explorerT')]);
    if (s === 'math' || a.functions.length) extras.push(['grapher', t('grTitle')], ['pad', t('padTitle')]);
    body.innerHTML = `${head(t('tab_lab'))}
      <div class="lab-pick">
        ${rec.length ? `<div><p class="ws-grp">${t('recommended')}</p><div class="rec">${rec.map((r) => `<button class="rec-card" data-lab="${r.id}"><b>${esc(tt(NL.LABS[r.id].title))}</b><span>${esc(r.why || '')}</span></button>`).join('')}</div></div>` : ''}
        <div class="chips">${extras.map(([k, n]) => `<button class="chip" data-lab="${k}">${esc(n)}</button>`).join('')}${catalog.map((l) => `<button class="chip" data-lab="${l.id}">${esc(tt(l.title))}</button>`).join('')}</div>
        ${['physics', 'chemistry'].includes(s) ? '' : `<details class="more-labs"><summary>${NL.lang === 'ar' ? 'مختبرات من مواد أخرى' : 'Labs from other subjects'}</summary><div class="chips">${Object.values(NL.LABS).filter((l) => l.subject !== s).map((l) => `<button class="chip" data-lab="${l.id}">${esc(tt(l.title))}</button>`).join('')}</div></details>`}
      </div><div id="lab-stage"></div>`;
    let stop = null;
    const open = (id) => {
      stop?.(); const host = $('#lab-stage', body);
      $$('[data-lab]', body).forEach((b) => b.classList.toggle('on', b.dataset.lab === id));
      const used = () => { if (!W.lesson.stats.labsUsed?.[id]) W.stat((st) => { st.labsUsed ||= {}; st.labsUsed[id] = Date.now(); }); };
      if (id === 'explorer') { host.innerHTML = `<h3 class="lab-title">${t('explorerT')}</h3><p class="lead-sm">${t('exLead')}</p><div></div>`; stop = NL.mountExplorer(host.lastElementChild, a.laws.filter((l) => l.valid), { onInteract: used }); }
      else if (id === 'grapher') { host.innerHTML = `<h3 class="lab-title">${t('grTitle')}</h3><p class="lead-sm">${t('grLead')}</p><div></div>`; stop = NL.mountGrapher(host.lastElementChild, a.functions, { onInteract: used }); }
      else if (id === 'pad') { host.innerHTML = `<h3 class="lab-title">${t('padTitle')}</h3><p class="lead-sm">${t('padLead')}</p><div></div>`; NL.mountPad(host.lastElementChild); used(); stop = null; }
      else {
        const lab = NL.LABS[id], r = rec.find((x) => x.id === id);
        host.innerHTML = `<h3 class="lab-title">${esc(tt(lab.title))}</h3>${r?.why ? `<p class="lead-sm">${esc(r.why)}</p>` : ''}<div></div>`;
        stop = NL.mountLab(host.lastElementChild, lab, { values: W.state.labSettings[id] || r?.params, onChange: (p) => { W.state.labSettings[id] = p; W.saveState(); }, onInteract: used });
      }
      W.stop.push(() => stop?.());
    };
    $$('[data-lab]', body).forEach((b) => (b.onclick = () => open(b.dataset.lab)));
    const first = rec[0]?.id || extras[0]?.[0] || catalog[0]?.id;
    if (first) open(first);
  };

  /* ---------- quiz ---------- */
  R.quiz = (body, opts) => {
    const a = W.lesson.analysis, valid = a.laws.filter((l) => l.valid);
    const cfg = Object.assign({ topic: '', n: 5, diff: 'medium', types: ['mcq', 'tf', valid.length ? 'numeric' : 'conceptual'], mode: 'practice' }, W.state.quizCfg || {}, opts.preset || {});
    if (!valid.length) cfg.types = cfg.types.filter((x) => x !== 'numeric');
    let hasBank = !!W.lesson.bank?.length;
    if (cfg.src == null) cfg.src = hasBank ? 'bank' : 'ai';
    const drawSetup = () => {
      body.innerHTML = `${head(t('tab_quiz'))}
        <form class="quiz-setup panel" id="qz-form">
          ${hasBank ? `<fieldset class="ctl"><legend>${t('bankSrc')}</legend><div class="checks-row">${['bank', 'ai'].map((m) => `<label class="check"><input type="radio" name="qz-src" value="${m}" ${cfg.src === m ? 'checked' : ''}> ${t('src_' + m)}</label>`).join('')}</div></fieldset>` : ''}
          <label class="ctl"><span>${t('qzTopic')}</span><select id="qz-topic"><option value="">${t('qzAll')}</option><optgroup label="${t('lessonMap')}">${a.sections.map((s) => `<option value="s:${s.id}">${esc(s.title)}</option>`).join('')}</optgroup><optgroup label="${t('keyConcepts')}">${a.concepts.map((c) => `<option value="c:${c.id}">${esc(c.name)}</option>`).join('')}</optgroup></select></label>
          <label class="ctl"><span>${t('qzCount')}</span><div class="seg">${[5, 10, 15, 20].map((n) => `<button type="button" role="radio" data-n="${n}" aria-checked="${cfg.n === n}">${n}</button>`).join('')}</div></label>
          <label class="ctl"><span>${t('qzDiff')}</span><div class="seg">${['easy', 'medium', 'hard'].map((d) => `<button type="button" role="radio" data-d="${d}" aria-checked="${cfg.diff === d}">${t('d_' + d)}</button>`).join('')}</div></label>
          <fieldset class="ctl"><legend>${t('qzTypes')}</legend><div class="checks-row">${['mcq', 'tf', 'numeric', 'conceptual', 'graph'].map((ty) => `<label class="check ${ty === 'numeric' && !valid.length ? 'disabled' : ''}"><input type="checkbox" value="${ty}" ${cfg.types.includes(ty) ? 'checked' : ''} ${ty === 'numeric' && !valid.length ? 'disabled' : ''}> ${t('ty_' + ty)}</label>`).join('')}</div></fieldset>
          <fieldset class="ctl"><legend>${t('qzMode')}</legend><div class="checks-row">${['practice', 'exam'].map((m) => `<label class="check"><input type="radio" name="qz-mode" value="${m}" ${cfg.mode === m ? 'checked' : ''}> ${t('m_' + m)}</label>`).join('')}</div></fieldset>
          <button class="btn big" type="submit">${icon('spark')} ${t('qzStart')}</button>
          ${W.teacher ? `<div class="teacher-row"><span class="fine">${t('teacherTools')}</span><button class="btn sm ghost" type="button" id="qz-bank">${t('bankManage')}</button>${hasBank ? `<button class="btn sm ghost" type="button" id="qz-print">${t('wsT')}</button>` : ''}</div>` : ''}
        </form><div id="qz-teacher"></div>
        ${W.state.quizzes.length ? `<section><h3>${t('history')}</h3><ul class="qhist">${W.state.quizzes.slice(0, 8).map((q) => `<li><span class="score s-${q.score >= 80 ? 'hi' : q.score >= 50 ? 'mid' : 'lo'}">${q.score}%</span><span>${q.correct}/${q.total} · ${t('m_' + q.mode).split(':')[0]} · ${t('d_' + q.diff)}</span><span class="fine">${NL.ago(q.at)}</span></li>`).join('')}</ul></section>` : ''}`;
      $('#qz-topic', body).value = cfg.topic;
      $('#qz-bank', body)?.addEventListener('click', () => NL.manageBank($('#qz-teacher', body), W.lesson, {
        onSave: (bank) => { W.lesson.bank = bank; W.gen.bank = bank; W.saveGen(); hasBank = bank.length > 0; },
        onClose: () => drawSetup(),
      }));
      $('#qz-print', body)?.addEventListener('click', () => {
        const c = { ...cfg, topic: $('#qz-topic', body).value, types: $$('.checks-row input[type=checkbox]:checked', body).map((x) => x.value) };
        if (!c.types.length) c.types = ['mcq', 'tf', 'numeric', 'graph'];
        const qs = fromBank({ ...c, print: true }); if (!qs.length) return NL.toast(NL.lang === 'ar' ? 'لا توجد أسئلة بهذه الإعدادات' : 'No questions match', 'warn');
        NL.printWorksheet(W.lesson, qs);
      });
      $$('[data-n]', body).forEach((b) => (b.onclick = () => { cfg.n = +b.dataset.n; $$('[data-n]', body).forEach((x) => x.setAttribute('aria-checked', x === b)); }));
      $$('[data-d]', body).forEach((b) => (b.onclick = () => { cfg.diff = b.dataset.d; $$('[data-d]', body).forEach((x) => x.setAttribute('aria-checked', x === b)); }));
      $('#qz-form', body).onsubmit = (e) => {
        e.preventDefault();
        cfg.topic = $('#qz-topic', body).value; cfg.types = $$('.checks-row input[type=checkbox]:checked', body).map((x) => x.value); cfg.mode = $('input[name=qz-mode]:checked', body).value;
        cfg.src = $('input[name=qz-src]:checked', body)?.value || 'ai';
        if (!cfg.types.length) cfg.types = ['mcq'];
        W.state.quizCfg = { ...cfg, weak: undefined, auto: undefined }; W.saveState(); build(cfg);
      };
    };
    const fromBank = (c) => {
      const rank = { easy: 0, medium: 1, hard: 2 }, want = rank[c.diff] ?? 1;
      let pool = W.lesson.bank.filter((q) => c.types.includes(q.type) && (q.type !== 'conceptual' || ai.ready || c.print));
      if (c.weak?.length) pool = pool.filter((q) => c.weak.includes(q.conceptId));
      else if (c.topic.startsWith('s:')) pool = pool.filter((q) => q.sectionId === c.topic.slice(2));
      else if (c.topic.startsWith('c:')) { const cid = c.topic.slice(2); pool = pool.filter((q) => q.conceptId === cid || W.lesson.analysis.sections.find((x) => x.id === q.sectionId)?.conceptIds.includes(cid)); }
      // closest difficulty first, random within each level
      const sorted = NL.shuffle(pool).sort((a, b) => Math.abs((rank[a.diff] ?? 1) - want) - Math.abs((rank[b.diff] ?? 1) - want));
      return sorted.slice(0, c.n).map((q) => prepQ(structuredClone(q))).filter(Boolean);
    };
    const build = async (c) => {
      body.innerHTML = head(t('tab_quiz')) + '<div id="qz-stage"></div>';
      const host = $('#qz-stage', body);
      if (hasBank && (c.src === 'bank' || !ai.ready)) {
        const qs = fromBank(c);
        if (!qs.length) { host.innerHTML = `<div class="notice warn">${NL.lang === 'ar' ? 'لا توجد أسئلة جاهزة بهذه الإعدادات. وسّع الموضوع أو أنواع الأسئلة.' : 'No ready questions match these settings. Widen the topic or question types.'}</div><button class="btn sm ghost" data-new>${t('newQuiz')}</button>`; $('[data-new]', host).onclick = drawSetup; return; }
        return run(host, qs, c);
      }
      if (needAI(host)) return;
      const topic = c.weak ? `the concepts the student got wrong: ${c.weak.map((id) => concept(id)?.name).filter(Boolean).join(', ')}` : c.topic.startsWith('s:') ? `section "${a.sections.find((s) => s.id === c.topic.slice(2))?.title}"` : c.topic.startsWith('c:') ? `the concept "${concept(c.topic.slice(2))?.name}"` : 'the whole lesson';
      const ctxText = await W.ctx(45000);
      const data = await withSpinner(host, t('qzBuilding'), (signal) => ai.json(`${RULES()}\n\n${ctxText}\n\nWrite ${c.n} quiz questions on ${topic}. Difficulty: ${c.diff}. Allowed types: ${c.types.join(', ')} (mix them). Base every question on the lesson pages; book questions may be adapted.
Return ONLY JSON {"questions":[...]} where each item is one of:
{"type":"mcq","q":"markdown","options":["4 options"],"answer":0,"why":"explanation","conceptId":"cN","page":N}
{"type":"tf","q":"statement","answer":true,"why":"","conceptId":"","page":N}
{"type":"numeric","q":"problem text that states every given value with units","lawId":"id","given":{"var":number},"unknown":"var","unit":"unit of unknown","why":"solution steps in markdown","conceptId":""}
{"type":"conceptual","q":"","modelAnswer":"","keyPoints":["point the answer must include"],"conceptId":""}
{"type":"graph","q":"question about the graph","graph":{"xLabel":"quantity (unit)","yLabel":"quantity (unit)","points":[[x,y],...]},"options":["4 options"],"answer":0,"why":"","conceptId":""}
Numeric rules: use ONLY these computable laws and give a value for every variable except the unknown, in the units listed (do NOT give the answer; it is computed by code): ${JSON.stringify(valid.map((l) => ({ id: l.id, equation: l.equation, vars: l.symbols.map((s) => `${s.var} [${s.unit}]`) })))}
Graph points must be consistent with the lesson's physics/maths (6-12 points). conceptId must be one of: ${a.concepts.map((x) => x.id).join(', ')}.`, { signal, modelTier: 'default' }));
      if (!data) return;
      const qs = (data.questions || []).map((q) => prepQ(q)).filter(Boolean).slice(0, c.n);
      if (!qs.length) { host.innerHTML = `<div class="notice bad">${t('aiErr_invalid_json')}</div>`; return; }
      run(host, qs, c);
    };
    const prepQ = (q) => {
      if (q.type === 'numeric') {
        const l = law(q.lawId); const P = l && NL.eq.parse(l.equation); if (!P || !P.vars.includes(q.unknown)) return null;
        const scope = {}; for (const v of P.vars) if (v !== q.unknown) { if (!isFinite(+q.given?.[v])) return null; scope[v] = +q.given[v]; }
        const ans = NL.eq.solve(P, q.unknown, scope); if (ans == null || !isFinite(ans)) return null;
        q.value = ans; q.lawLatex = l.latex; return q;
      }
      if ((q.type === 'mcq' || q.type === 'graph') && (!Array.isArray(q.options) || q.options.length < 2 || !(+q.answer >= 0 && +q.answer < q.options.length))) return null;
      if (q.type === 'tf') q.answer = q.answer === true || q.answer === 'true';
      return q;
    };
    const run = (host, qs, c) => {
      let i = 0; const ans = qs.map(() => ({}));
      const qHtml = (q) => {
        if (q.type === 'mcq' || q.type === 'graph') return `${q.type === 'graph' ? `<div class="qgraph">${NL.lineChart({ series: [{ pts: q.graph.points }], xLabel: q.graph.xLabel, yLabel: q.graph.yLabel, height: 220 })}</div>` : ''}<div class="opts">${q.options.map((o, j) => `<button data-o="${j}">${NL.md(String(o)).replace(/^<p>|<\/p>$/g, '')}</button>`).join('')}</div>`;
        if (q.type === 'tf') return `<div class="opts two"><button data-o="true">${t('tfTrue')}</button><button data-o="false">${t('tfFalse')}</button></div>`;
        if (q.type === 'numeric') return `<div class="num-in"><input id="qz-num" type="text" inputmode="decimal" dir="ltr" placeholder="${t('numPh')}" autocomplete="off"><span class="unit">${esc(q.unit || '')}</span></div>`;
        return `<textarea id="qz-text" rows="5" dir="auto" placeholder="${t('concPh')}"></textarea>`;
      };
      const correctText = (q) => q.type === 'tf' ? (q.answer ? t('tfTrue') : t('tfFalse')) : q.type === 'numeric' ? `${fmt(q.value, 4)} ${q.unit || ''}` : q.type === 'conceptual' ? q.modelAnswer : String(q.options[+q.answer]);
      const givenText = (q, x) => x.raw == null ? '—' : q.type === 'tf' ? (x.raw ? t('tfTrue') : t('tfFalse')) : q.type === 'mcq' || q.type === 'graph' ? String(q.options[x.raw]) : String(x.raw);
      const feedback = (q, x) => `<div class="fb ${x.ok ? 'ok' : x.partial ? 'mid' : 'bad'}"><b>${x.ok ? t('correct') : x.partial ? t('partial') : t('wrong')}</b>${!x.ok ? `<p>${t('correctAnswer')}: <b>${NL.md(correctText(q)).replace(/^<p>|<\/p>$/g, '')}</b></p>` : ''}${x.feedback ? `<div class="prose">${NL.md(x.feedback)}</div>` : ''}<div class="prose">${NL.md(q.why || '')}</div>${q.type === 'numeric' ? `<p class="fine">${icon('check')} ${t('verifiedNum')}: ${NL.tex(q.lawLatex || '')}</p>` : ''}</div>`;
      const grade = (q, raw) => {
        if (raw == null || raw === '') return { raw: null, ok: false };
        if (q.type === 'numeric') { const v = parseFloat(String(raw).replace(',', '.').replace('٫', '.').replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))); return { raw, ok: isFinite(v) && Math.abs(v - q.value) <= Math.max(Math.abs(q.value) * 0.02, 1e-9) }; }
        if (q.type === 'tf') return { raw, ok: raw === q.answer };
        return { raw, ok: +raw === +q.answer };
      };
      const gradeConceptual = async (items) => {
        const res = await ai.json(`Grade these short answers to lesson questions. Be fair to answers in the student's own words. For each, score 0 (wrong), 1 (partly right) or 2 (fully right) against the key points, and give one or two sentences of feedback in ${NL.lang === 'ar' ? 'Arabic' : 'English'}.\n${JSON.stringify(items.map(({ q, x }) => ({ question: q.q, keyPoints: q.keyPoints, modelAnswer: q.modelAnswer, studentAnswer: x.raw })))}\nReturn ONLY JSON: {"grades":[{"score":2,"feedback":""}]}`, { modelTier: 'quick' });
        items.forEach(({ x }, k) => { const g = res.grades?.[k]; x.score = +g?.score || 0; x.ok = x.score === 2; x.partial = x.score === 1; x.feedback = g?.feedback || ''; });
      };
      const draw = () => {
        const q = qs[i], x = ans[i], exam = c.mode === 'exam';
        host.innerHTML = `<div class="qz"><div class="qz-top"><span>${t('qzOf', { i: i + 1, n: qs.length })}</span><span class="tag">${t('ty_' + q.type)}</span>${q.page ? `<span class="pref">${t('page')} ${q.page}</span>` : ''}</div>
          <div class="meter thin"><span style="width:${i / qs.length * 100}%"></span></div>
          <div class="qz-q prose">${NL.md(q.q)}</div><div class="qz-a">${qHtml(q)}</div><div class="qz-fb"></div>
          <div class="qz-nav"><button class="btn ghost sm" data-skip>${t('skip')}</button><button class="btn" data-check>${exam ? (i === qs.length - 1 ? t('finish') : t('next')) : t('check')}</button></div></div>`;
        let pick = null;
        $$('[data-o]', host).forEach((b) => (b.onclick = () => { if (x.done) return; pick = q.type === 'tf' ? b.dataset.o === 'true' : +b.dataset.o; $$('[data-o]', host).forEach((y) => y.classList.toggle('sel', y === b)); }));
        const btn = $('[data-check]', host);
        $('[data-skip]', host).onclick = () => { Object.assign(x, { raw: null, ok: false, done: true }); advance(); };
        btn.onclick = async () => {
          if (x.done) return advance();
          const raw = q.type === 'numeric' ? $('#qz-num', host).value.trim() : q.type === 'conceptual' ? $('#qz-text', host).value.trim() : pick;
          if (raw == null || raw === '') return;
          Object.assign(x, grade(q, raw), { done: true });
          if (exam) return advance();
          if (q.type === 'conceptual') { btn.disabled = true; btn.textContent = t('grading'); try { await gradeConceptual([{ q, x }]); } catch (e) { x.feedback = ai.errText(e); } btn.disabled = false; }
          $$('[data-o]', host).forEach((y) => { const v = q.type === 'tf' ? y.dataset.o === 'true' : +y.dataset.o; if (v === (q.type === 'tf' ? q.answer : +q.answer)) y.classList.add('right'); else if (v === raw) y.classList.add('wrong'); });
          $('.qz-fb', host).innerHTML = feedback(q, x);
          btn.textContent = i === qs.length - 1 ? t('finish') : t('next');
          $('[data-skip]', host).hidden = true;
        };
      };
      const advance = () => { if (i < qs.length - 1) { i++; draw(); } else finish(); };
      const finish = async () => {
        const conc = qs.map((q, k) => ({ q, x: ans[k] })).filter(({ q, x }) => q.type === 'conceptual' && x.raw != null && x.score == null);
        if (conc.length) { host.innerHTML = spinner(t('grading')); try { await gradeConceptual(conc); } catch (e) { conc.forEach(({ x }) => (x.feedback = ai.errText(e))); } }
        const pts = ans.reduce((n, x) => n + (x.ok ? 1 : x.partial ? 0.5 : 0), 0), score = Math.round(pts / qs.length * 100);
        const byC = {}; qs.forEach((q, k) => { if (!q.conceptId || !concept(q.conceptId)) return; (byC[q.conceptId] ||= { ok: 0, n: 0 }); byC[q.conceptId].n++; if (ans[k].ok) byC[q.conceptId].ok++; });
        const good = Object.keys(byC).filter((k) => byC[k].ok === byC[k].n), weak = Object.keys(byC).filter((k) => byC[k].ok < byC[k].n);
        const rec = { id: uid(), at: Date.now(), mode: c.mode, diff: c.diff, topic: c.topic, total: qs.length, correct: ans.filter((x) => x.ok).length, score, items: qs.map((q, k) => ({ type: q.type, q: q.q, conceptId: q.conceptId || null, ok: !!ans[k].ok })) };
        W.state.quizzes.unshift(rec); W.state.quizzes = W.state.quizzes.slice(0, 30);
        qs.forEach((q, k) => { if (!ans[k].ok) W.addMistake({ source: 'quiz', type: q.type, q: q.q, options: q.options, given: givenText(q, ans[k]), correct: correctText(q), why: q.why || ans[k].feedback || '', conceptId: q.conceptId || null }); });
        W.saveState();
        W.stat((st) => { st.bestQuiz = Math.max(st.bestQuiz || 0, score); st.quizCount = (st.quizCount || 0) + 1; });
        host.innerHTML = `<div class="qz-result"><div class="score-ring s-${score >= 80 ? 'hi' : score >= 50 ? 'mid' : 'lo'}"><b>${score}%</b><span>${rec.correct} / ${qs.length}</span></div>
          <div class="qz-cols"><div><h4>${t('mastered')}</h4><div class="chips">${good.map((k) => `<span class="chip ok">${esc(concept(k).name)}</span>`).join('') || '<span class="fine">—</span>'}</div></div>
          <div><h4>${t('toReview')}</h4><div class="chips">${weak.map((k) => `<span class="chip bad">${esc(concept(k).name)}</span>`).join('') || `<span class="fine">${t('noWeak')}</span>`}</div></div></div>
          <div class="row gap wrap center">${weak.length ? `<button class="btn" data-rem>${t('remedial')}</button>` : ''}<button class="btn ghost" data-new>${t('newQuiz')}</button></div>
          <ol class="qz-review">${qs.map((q, k) => `<li class="${ans[k].ok ? 'ok' : ans[k].partial ? 'mid' : 'bad'}"><div class="prose">${NL.md(q.q)}</div><p><span class="fine">${t('yourAnswer')}:</span> ${esc(givenText(q, ans[k]))}</p>${feedback(q, ans[k])}</li>`).join('')}</ol></div>`;
        $('[data-new]', host).onclick = drawSetup;
        $('[data-rem]', host)?.addEventListener('click', () => build({ ...c, n: 5, weak, mode: 'practice' }));
      };
      draw();
    };
    drawSetup();
    if (opts.preset?.auto) $('#qz-form', body).requestSubmit();
  };

  /* ---------- problem solver ---------- */
  R.solver = (body) => {
    let mode = W.state.solverMode || 'full', img = null, board = null;
    body.innerHTML = `${head(t('tab_solver'), '', `<div class="seg">${['hints', 'full', 'review'].map((m) => `<button role="radio" data-m="${m}" aria-checked="${m === mode}">${t('sv_' + m)}</button>`).join('')}</div>`)}
      <form class="panel sv-form" id="sv-form">
        <label class="ctl"><span>${t('svProblem')}</span><textarea id="sv-p" rows="4" dir="auto" placeholder="${t('svProblemPh')}"></textarea></label>
        <div class="row gap wrap"><label class="btn sm ghost ${ai.images ? '' : 'hidden'}">${icon('camera')} ${t('attach')}<input type="file" accept="image/*" id="sv-img" hidden></label><span class="att-name fine"></span></div>
        <div class="sv-mine" hidden><label class="ctl"><span>${t('svMine')}</span><textarea id="sv-mine" rows="5" dir="auto" placeholder="${t('svMinePh')}"></textarea></label>
          ${ai.images ? `<details><summary>${t('svBoard')}</summary><div id="sv-board"></div></details>` : ''}</div>
        <button class="btn big" type="submit">${icon('spark')} ${t('svGo')}</button></form>
      ${W.lesson.analysis.examples.length ? `<div class="chips ex-pick"><span class="fine">${t('examplesT')}:</span>${W.lesson.analysis.examples.map((e, i) => `<button class="chip" type="button" data-ex="${i}">${esc(e.title || (t('page') + ' ' + (e.page || '')))}</button>`).join('')}</div>` : ''}
      <div id="sv-out"></div>
      ${W.lesson.solved?.length ? `<section class="solved"><h3>${t('solvedT')}</h3>${W.lesson.solved.map((pr) => `<details class="solved-item"><summary><span class="tag">${t('problemN', { n: pr.n })}</span> ${NL.md(pr.q).replace(/^<p>|<\/p>$/g, '')} <span class="pref">${t('page')} ${pr.page}</span></summary><ol class="prose">${pr.steps.map((x) => `<li>${NL.md(x)}</li>`).join('')}</ol><p class="ans"><b>${t('answer')}:</b> ${NL.md(pr.answer).replace(/^<p>|<\/p>$/g, '')}</p></details>`).join('')}</section>` : ''}`;
    $$('.solved-item', body).forEach((d) => d.addEventListener('toggle', () => { if (d.open) W.touch('solver'); }));
    const setMode = (m) => { mode = W.state.solverMode = m; $$('[data-m]', body).forEach((x) => x.setAttribute('aria-checked', x.dataset.m === m)); $('.sv-mine', body).hidden = m !== 'review'; if (m === 'review' && ai.images && !board && $('#sv-board', body)) { board = NL.mountBoard($('#sv-board', body), { height: 300 }); W.stop.push(board.destroy); } };
    $$('[data-m]', body).forEach((b) => (b.onclick = () => setMode(b.dataset.m))); setMode(mode);
    $$('[data-ex]', body).forEach((b) => (b.onclick = () => { $('#sv-p', body).value = W.lesson.analysis.examples[+b.dataset.ex].problem; }));
    $('#sv-img', body)?.addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; img = await NL.reader.blob(await NL.reader.imageToCanvas(f)); $('.att-name', body).textContent = f.name; });
    $('#sv-form', body).onsubmit = async (e) => {
      e.preventDefault();
      const problem = $('#sv-p', body).value.trim(), mine = $('#sv-mine', body)?.value.trim() || '';
      if (!problem && !img) { $('#sv-p', body).focus(); return; }
      const out = $('#sv-out', body); if (needAI(out)) return;
      const images = []; if (img) images.push(img); if (mode === 'review' && board && !board.isEmpty()) images.push(await board.toBlob());
      const valid = W.lesson.analysis.laws.filter((l) => l.valid);
      const ctxText = await W.ctx(30000);
      const data = await withSpinner(out, t('generating'), (signal) => ai.json(`${RULES()}\n\n${ctxText}\n\nThe student needs help with a problem.${problem ? `\nPROBLEM:\n${problem}` : '\nThe problem is in the first attached image.'}${mode === 'review' ? `\nSTUDENT'S SOLUTION:\n${mine || '(see the attached handwriting image)'}` : ''}
Mode: ${mode} (hints = progressive hints only, do not reveal the final answer in hints; full = complete worked solution; review = check the student's steps one by one and say where the first error is).
Use the calculate tool for every numeric step. Prefer laws from the lesson: ${JSON.stringify(valid.map((l) => ({ id: l.id, name: l.name, equation: l.equation })))}.
Return ONLY JSON:
{"understood":true,"given":[{"var":"ascii id","sym":"latex","desc":"","value":number,"unit":""}],"find":{"var":"ascii id","sym":"latex","desc":"","unit":""},"lawId":"lesson law id or empty","equation":"math.js equation using the given vars and the find var, in consistent units (convert first)","equationLatex":"","conversions":"markdown or empty","substitution":"latex with numbers substituted","steps":["markdown calculation step"],"answer":{"value":number,"unit":""},"check":"markdown: is the result reasonable (size, sign, units)?","hints":["hint 1","hint 2","hint 3"],"review":[{"step":"student step","ok":true,"comment":""}],"verdict":"markdown overall feedback for review mode"}
Set "understood": false if the problem cannot be read or is not a solvable problem. given values must be in the units used by "equation".`, { signal, images: images.length ? images : undefined, tools: ai.tools ? [ai.calcTool()] : undefined, modelTier: 'default' }));
      if (!data) return;
      paintSolution(out, data, mode);
      W.stat((st) => { st.solverCount = (st.solverCount || 0) + 1; });
    };
    const paintSolution = (out, d, m) => {
      if (d.understood === false) { out.innerHTML = `<div class="notice warn">${t('notUnderstood')}</div>`; return; }
      // independent check: recompute the unknown from the equation and the givens
      let verify = '';
      const P = NL.eq.parse(d.equation || law(d.lawId)?.equation);
      if (P && d.find?.var && P.vars.includes(d.find.var)) {
        const scope = {}; (d.given || []).forEach((g) => { if (P.vars.includes(g.var)) scope[g.var] = +g.value; });
        const ok = P.vars.every((v) => v === d.find.var || isFinite(scope[v]));
        const v = ok ? NL.eq.solve(P, d.find.var, scope, +d.answer?.value || 1) : null;
        if (v != null) { const match = isFinite(+d.answer?.value) && Math.abs(v - d.answer.value) <= Math.max(Math.abs(v) * 0.01, 1e-9); verify = `<div class="notice ${match ? 'ok' : 'bad'}">${icon(match ? 'check' : 'x')} ${t(match ? 'svVerified' : 'svMismatch', { v: `${fmt(v, 5)} ${esc(d.answer?.unit || d.find.unit || '')}` })}</div>`; }
      }
      if (!verify) verify = `<p class="fine">${t('svUnverified')}</p>`;
      const block = (title, html) => html ? `<section class="sv-step"><h4>${title}</h4>${html}</section>` : '';
      const full = `<div class="sv-sol">
        ${block(t('svGiven'), `<table class="sym"><tbody>${(d.given || []).map((g) => `<tr><td>${NL.tex(g.sym || g.var)}</td><td>${esc(g.desc || '')}</td><td dir="ltr"><b>${fmt(+g.value, 5)}</b> ${esc(g.unit || '')}</td></tr>`).join('')}</tbody></table>`)}
        ${block(t('svFind'), `<p>${NL.tex(d.find?.sym || d.find?.var || '?')} ${esc(d.find?.desc || '')} <span dir="ltr">(${esc(d.find?.unit || '')})</span></p>`)}
        ${block(t('svLaw'), `${d.lawId && law(d.lawId) ? `<span class="tag book">${t('fromBook')}${law(d.lawId).page ? ' · ' + t('page') + ' ' + law(d.lawId).page : ''}</span>` : ''}<div class="mathblock">${NL.tex(d.equationLatex || d.equation || '', true)}</div>${d.conversions ? `<div class="prose">${NL.md(d.conversions)}</div>` : ''}`)}
        ${block(t('svSub'), `<div class="mathblock">${NL.tex(d.substitution || '', true)}</div>`)}
        ${block(t('svCalc'), `<ol class="prose">${(d.steps || []).map((s) => `<li>${NL.md(s)}</li>`).join('')}</ol>`)}
        ${block(t('svResult'), `<p class="big-num">${NL.tex(`${d.find?.sym || d.find?.var || 'x'} = ${fmt(+d.answer?.value, 5)}\\ \\text{${String(d.answer?.unit || '').replace(/[{}\\]/g, '')}}`)}</p>${verify}`)}
        ${block(t('svCheck'), `<div class="prose">${NL.md(d.check || '')}</div>`)}</div>`;
      if (m === 'hints') {
        let shown = 1;
        const drawH = () => { out.innerHTML = `<ol class="hints">${(d.hints || []).slice(0, shown).map((h, i) => `<li><b>${t('hint', { i: i + 1 })}</b><div class="prose">${NL.md(h)}</div></li>`).join('')}</ol><div class="row gap">${shown < (d.hints || []).length ? `<button class="btn sm" data-more>${t('moreHint')}</button>` : ''}<button class="btn sm ghost" data-sol>${t('showSolution')}</button></div><div class="sv-hidden"></div>`; $('[data-more]', out)?.addEventListener('click', () => { shown++; drawH(); }); $('[data-sol]', out).onclick = () => { $('.sv-hidden', out).innerHTML = full; }; };
        drawH();
      } else if (m === 'review') {
        out.innerHTML = `<ol class="review-steps">${(d.review || []).map((r) => `<li class="${r.ok ? 'ok' : 'bad'}">${icon(r.ok ? 'check' : 'x')}<div><div class="prose">${NL.md(r.step)}</div>${r.comment ? `<p class="fine">${NL.md(r.comment)}</p>` : ''}</div></li>`).join('')}</ol><div class="prose verdict">${NL.md(d.verdict || '')}</div><details><summary>${t('showSolution')}</summary>${full}</details>`;
        if ((d.review || []).some((r) => !r.ok)) W.addMistake({ source: 'quiz', type: 'numeric', q: $('#sv-p', body).value || '(image)', given: (d.review || []).find((r) => !r.ok)?.step || '', correct: `${fmt(+d.answer?.value, 5)} ${d.answer?.unit || ''}`, why: d.verdict || '' });
      } else out.innerHTML = full;
    };
  };

  /* ---------- summary ---------- */
  R.summary = (body) => {
    const a = W.lesson.analysis; let detail = W.state.detail || 'standard';
    body.innerHTML = `${head(t('tab_summary'), '', `<div class="row gap"><div class="seg">${['brief', 'standard', 'detailed'].map((d) => `<button role="radio" data-d="${d}" aria-checked="${d === detail}">${t('de_' + d)}</button>`).join('')}</div><button class="btn sm ghost" id="sum-copy">${t('copy')}</button></div>`)}<div id="sum"></div>`;
    // relations between variables computed from the laws themselves
    const rels = []; a.laws.filter((l) => l.valid).forEach((l) => {
      const P = NL.eq.parse(l.equation), y = P.lhsNode.isSymbolNode ? P.lhsNode.name : P.vars[0], sym = (v) => l.symbols.find((s) => s.var === v) || { name: v, tex: v };
      const scope = {}; P.vars.forEach((v) => (scope[v] = +(sym(v).sample) || 2));
      P.vars.filter((v) => v !== y).forEach((v) => { const r = NL.eq.relation(P, y, v, scope); if (r && r.kind !== 'other') rels.push(`${NL.tex(sym(y).tex || y)} <b>${esc(sym(y).name)}</b> ${t('rel_' + r.kind, { f: '' })} <b>${esc(sym(v).name)}</b> ${NL.tex(sym(v).tex || v)} <span class="fine">(${esc(l.name)})</span>`); });
    });
    const paint = (ai_) => {
      const lim = { brief: 4, standard: 8, detailed: 99 }[detail];
      $('#sum', body).innerHTML = `<div class="sum">
        ${ai_?.keyIdeas?.length ? `<section class="sum-ideas"><h3>${t('keyIdeas')}</h3><ol>${ai_.keyIdeas.map((x) => `<li>${NL.md(x)}</li>`).join('')}</ol></section>` : ''}
        ${a.concepts.length ? `<section><h3>${t('defs')}</h3><dl class="defs">${a.concepts.slice(0, detail === 'brief' ? 8 : 99).map((c) => `<div><dt>${esc(c.name)}${c.page ? ` <span class="pref">${t('page')} ${c.page}</span>` : ''}</dt><dd>${NL.md(c.definition)}</dd></div>`).join('')}</dl></section>` : ''}
        ${a.laws.length ? `<section><h3>${t('lawsT')}</h3><div class="laws">${a.laws.map(lawCard).join('')}</div></section>` : ''}
        ${rels.length ? `<section><h3>${t('relsT')}</h3><p class="fine">${t('relsNote')}</p><ul class="rels">${rels.slice(0, lim * 2).map((r) => `<li>${r}</li>`).join('')}</ul></section>` : ''}
        ${ai_?.notes?.length ? `<section><h3>${t('notesT')}</h3><ul>${ai_.notes.map((x) => `<li>${NL.md(x)}</li>`).join('')}</ul></section>` : ''}
        ${a.misconceptions.length ? `<section><h3>${t('mistakesT')}</h3><ul class="myths">${a.misconceptions.slice(0, lim).map((m) => `<li><s>${esc(m.wrong)}</s><span>${esc(m.right)}</span></li>`).join('')}</ul></section>` : ''}
        ${ai_?.miniExamples?.length ? `<section><h3>${t('examplesT')}</h3><div class="minis">${ai_.miniExamples.map((x) => `<div class="mini"><div class="prose">${NL.md(x.q)}</div><div class="prose ans">${NL.md(x.a)}</div></div>`).join('')}</div></section>` : ''}
      </div>`;
    };
    const load = async () => {
      const cached = W.gen.summary?.[detail];
      paint(cached);
      if (cached || !ai.ready) return;
      const slot = document.createElement('div'); $('#sum', body).prepend(slot);
      const ctxText = await W.ctx(50000);
      const d = await withSpinner(slot, t('generating'), (signal) => ai.json(`${RULES()}\n\n${ctxText}\n\nWrite the ${detail} summary content for this lesson. Return ONLY JSON {"keyIdeas":["markdown"],"notes":["important note from the pages, markdown"],"miniExamples":[{"q":"short problem","a":"short solution with result"}]}. Sizes: brief = 4 ideas, 2 notes, 1 example; standard = 7 ideas, 4 notes, 2 examples; detailed = 10-12 ideas, 6 notes, 3 examples.`, { signal, modelTier: 'default' }));
      if (!d) return; W.gen.summary ||= {}; W.gen.summary[detail] = d; W.saveGen(); paint(d);
    };
    $$('[data-d]', body).forEach((b) => (b.onclick = () => { detail = W.state.detail = b.dataset.d; W.saveState(); $$('[data-d]', body).forEach((x) => x.setAttribute('aria-checked', x === b)); load(); }));
    $('#sum-copy', body).onclick = async () => { const tx = $('#sum', body).innerText; try { await navigator.clipboard.writeText(tx); NL.toast(t('copied'), 'ok'); } catch { const r = document.createRange(); r.selectNodeContents($('#sum', body)); getSelection().removeAllRanges(); getSelection().addRange(r); } };
    load();
  };

  /* ---------- concept map ---------- */
  R.map = (body, opts) => {
    const a = W.lesson.analysis;
    body.innerHTML = `${head(t('tab_map'), t('mapLead'))}<div class="cmap"><svg id="cmap-svg" role="img" aria-label="${t('tab_map')}"></svg><aside class="cmap-panel" id="cmap-panel"></aside></div>`;
    if (a.concepts.length < 2) { $('.cmap', body).innerHTML = `<div class="empty-mini">${t('noRelations')}</div>`; return; }
    const Wd = 900, H = 560, svg = d3.select('#cmap-svg').attr('viewBox', `0 0 ${Wd} ${H}`);
    const nodes = a.concepts.map((c) => ({ id: c.id, c, deg: 0 })), byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const links = a.relations.map((r) => ({ source: r.from, target: r.to, label: r.label }));
    links.forEach((l) => { byId[l.source].deg++; byId[l.target].deg++; });
    // concepts that share a section get a faint link, so isolated nodes still sit near their part of the lesson
    a.sections.forEach((s) => { const ids = s.conceptIds.filter((id) => byId[id]); for (let i = 1; i < ids.length; i++) if (!links.some((l) => (l.source === ids[i - 1] && l.target === ids[i]) || (l.source === ids[i] && l.target === ids[i - 1]))) links.push({ source: ids[i - 1], target: ids[i], weak: true }); });
    svg.append('defs').html(`<marker id="arrowhead" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0L10,5L0,10z" class="cm-arrow"/></marker>`);
    const sim = d3.forceSimulation(nodes).force('link', d3.forceLink(links).id((d) => d.id).distance((l) => (l.weak ? 140 : 120)).strength((l) => (l.weak ? 0.15 : 0.6)))
      .force('charge', d3.forceManyBody().strength(-520)).force('center', d3.forceCenter(Wd / 2, H / 2)).force('collide', d3.forceCollide(58)).force('x', d3.forceX(Wd / 2).strength(0.04)).force('y', d3.forceY(H / 2).strength(0.07)).stop();
    for (let i = 0; i < 320; i++) sim.tick();
    nodes.forEach((n) => { n.x = NL.clamp(n.x, 70, Wd - 70); n.y = NL.clamp(n.y, 30, H - 30); });
    const gL = svg.append('g'), gN = svg.append('g');
    const link = gL.selectAll('g').data(links).join('g').attr('class', (d) => 'cm-link' + (d.weak ? ' weak' : ''));
    link.append('line').attr('marker-end', (d) => (d.weak ? null : 'url(#arrowhead)'));
    link.append('text').attr('class', 'cm-label').attr('text-anchor', 'middle').text((d) => d.label || '');
    const node = gN.selectAll('g').data(nodes).join('g').attr('class', 'cm-node').attr('tabindex', 0).attr('role', 'button');
    node.append('rect').attr('rx', 14);
    node.append('text').attr('text-anchor', 'middle').attr('dy', 5).text((d) => d.c.name);
    node.each(function (d) { const tw = this.querySelector('text').getComputedTextLength?.() || d.c.name.length * 8; d.w = Math.max(70, tw + 28); d3.select(this).select('rect').attr('x', -d.w / 2).attr('y', -18).attr('width', d.w).attr('height', 36); });
    const place = () => {
      link.select('line').each(function (d) { const dx = d.target.x - d.source.x, dy = d.target.y - d.source.y, len = Math.hypot(dx, dy) || 1, ex = dx / len, ey = dy / len; const cut = (n) => Math.min(Math.abs(n.w / 2 / (ex || 1e-9)), Math.abs(18 / (ey || 1e-9))); d3.select(this).attr('x1', d.source.x + ex * cut(d.source)).attr('y1', d.source.y + ey * cut(d.source)).attr('x2', d.target.x - ex * (cut(d.target) + 4)).attr('y2', d.target.y - ey * (cut(d.target) + 4)); });
      link.select('text').attr('x', (d) => (d.source.x + d.target.x) / 2).attr('y', (d) => (d.source.y + d.target.y) / 2 - 6);
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    };
    place();
    // zoom the drawing to the laid-out graph so small maps stay readable
    const x0 = d3.min(nodes, (n) => n.x - n.w / 2) - 40, x1 = d3.max(nodes, (n) => n.x + n.w / 2) + 40, y0 = d3.min(nodes, (n) => n.y) - 50, y1 = d3.max(nodes, (n) => n.y) + 50;
    const vw = Math.max(x1 - x0, 420), vh = Math.max(y1 - y0, 260);
    svg.attr('viewBox', `${(x0 + x1) / 2 - vw / 2} ${(y0 + y1) / 2 - vh / 2} ${vw} ${vh}`);
    node.call(d3.drag().on('drag', (e, d) => { d.x = NL.clamp(e.x, 40, Wd - 40); d.y = NL.clamp(e.y, 20, H - 20); place(); }));
    const panel = $('#cmap-panel', body);
    const focus = (id) => {
      const c = concept(id); if (!c) return;
      node.classed('on', (d) => d.id === id).classed('dim', (d) => d.id !== id && !links.some((l) => !l.weak && ((l.source.id === id && l.target.id === d.id) || (l.target.id === id && l.source.id === d.id))));
      link.classed('on', (l) => l.source.id === id || l.target.id === id);
      const rel = a.relations.filter((r) => r.from === id || r.to === id);
      const lawsHere = a.laws.filter((l) => a.sections.some((s) => s.conceptIds.includes(id) && s.lawIds.includes(l.id)));
      const exs = a.examples.filter((e) => (e.title + e.problem).includes(c.name)).slice(0, 2);
      panel.innerHTML = `<h3>${esc(c.name)}</h3>${c.page ? `<span class="pref">${t('page')} ${c.page}</span>` : ''}${c.source === 'extra' ? `<span class="tag extra-tag">${t('extra')}</span>` : ''}<div class="prose">${NL.md(c.definition)}</div>
        ${rel.length ? `<h4>${t('linksT')}</h4><ul>${rel.map((r) => `<li>${r.from === id ? `${esc(r.label)} → <button class="link" data-f="${r.to}">${esc(concept(r.to)?.name)}</button>` : `<button class="link" data-f="${r.from}">${esc(concept(r.from)?.name)}</button> → ${esc(r.label)}`}</li>`).join('')}</ul>` : ''}
        ${lawsHere.length ? `<h4>${t('lawsT')}</h4>${lawsHere.map((l) => `<div class="mathblock">${NL.tex(l.latex || l.equation, true)}</div>`).join('')}` : ''}
        ${exs.length ? `<h4>${t('examplesT')}</h4>${exs.map((e) => `<p class="fine">${esc(e.title || e.problem.slice(0, 120))}</p>`).join('')}` : ''}
        <div class="row gap wrap"><button class="btn sm" data-more>${t('explainMore')}</button><button class="btn sm ghost" data-quiz>${t('quizMe')}</button></div>`;
      $$('[data-f]', panel).forEach((b) => (b.onclick = () => focus(b.dataset.f)));
      $('[data-more]', panel).onclick = () => W.open('assistant', false, { prefill: (NL.lang === 'ar' ? `اشرح لي مفهوم «${c.name}» أكثر، وكيف يرتبط ببقية الدرس.` : `Explain “${c.name}” in more depth and how it connects to the rest of the lesson.`) });
      $('[data-quiz]', panel).onclick = () => W.open('quiz', false, { preset: { topic: 'c:' + id, n: 5, mode: 'practice', auto: true } });
    };
    node.on('click', (e, d) => focus(d.id)).on('keydown', (e, d) => { if (e.key === 'Enter') focus(d.id); });
    focus(opts.focus || nodes.slice().sort((x, y) => y.deg - x.deg)[0].id);
  };

  /* ---------- flashcards (Leitner boxes) ---------- */
  const INTERVAL = [0, 0, 1, 3, 7, 16]; // days for boxes 1..5
  W.deck = () => {
    const a = W.lesson.analysis, cards = [];
    a.concepts.forEach((c) => cards.push({ id: 'c:' + c.id, kind: 'concept', front: c.name, back: c.definition, page: c.page, conceptId: c.id }));
    a.laws.forEach((l) => { cards.push({ id: 'l:' + l.id, kind: 'law', front: l.name, backTex: l.latex || l.equation, back: l.conditions || '', page: l.page }); (l.symbols || []).forEach((s) => cards.push({ id: `s:${l.id}:${s.var}`, kind: 'symbol', frontTex: s.tex || s.var, front: '', back: `${s.name}${s.unit ? ` — ${s.unit}` : ''}`, page: l.page })); });
    a.misconceptions.forEach((m, i) => cards.push({ id: 'm:' + i, kind: 'myth', front: t('mythFront', { w: m.wrong }), back: t('mythBack', { r: m.right }) }));
    W.state.mistakes.filter((m) => !m.resolved).slice(0, 30).forEach((m) => cards.push({ id: 'x:' + m.id, kind: 'mistake', front: m.q, back: `${m.correct}${m.why ? '\n\n' + m.why : ''}`, conceptId: m.conceptId }));
    return cards;
  };
  R.cards = (body) => {
    let filter = 'due';
    const deck = W.deck(), st = W.state.cards, now = Date.now();
    const boxOf = (c) => st[c.id]?.box || 1, isDue = (c) => !st[c.id] || st[c.id].due <= now;
    const draw = () => {
      const mastered = deck.filter((c) => boxOf(c) >= 3 && !c.id.startsWith('x:')).length, total = deck.filter((c) => !c.id.startsWith('x:')).length;
      const counts = [1, 2, 3, 4, 5].map((b) => deck.filter((c) => boxOf(c) === b).length);
      body.innerHTML = `${head(t('tab_cards'), t('cardsLead'))}
        <div class="boxes">${counts.map((n, i) => `<div class="boxc b${i + 1}"><b>${n}</b><span>${t('box', { n: i + 1 })}</span></div>`).join('')}<div class="boxc mast"><b>${t('cardsMasteredN', { m: mastered, n: total })}</b></div></div>
        <div class="row gap wrap"><div class="seg">${[['due', t('due')], ['all', t('allCards')], ['wrong', t('wrongCards')]].map(([k, l]) => `<button role="radio" data-f="${k}" aria-checked="${filter === k}">${l}</button>`).join('')}</div>
        <button class="btn" data-study>${icon('play')} ${t('studyDue', { n: pick().length })}</button></div>
        <div class="card-grid">${pick().map((c) => `<button class="mini-card k-${c.kind}" data-card="${esc(c.id)}"><span class="tag">${t('ct_' + c.kind)}</span><span>${c.frontTex ? NL.tex(c.frontTex) : esc(c.front)}</span><small>${t('box', { n: boxOf(c) })}</small></button>`).join('')}</div>`;
      $$('[data-f]', body).forEach((b) => (b.onclick = () => { filter = b.dataset.f; draw(); }));
      $('[data-study]', body).onclick = () => study(pick());
      $$('[data-card]', body).forEach((b) => (b.onclick = () => study([deck.find((c) => c.id === b.dataset.card)])));
    };
    const pick = () => deck.filter((c) => (filter === 'due' ? isDue(c) : filter === 'wrong' ? (st[c.id]?.wrong > 0 && boxOf(c) <= 2) || c.kind === 'mistake' : true));
    const study = (queue) => {
      queue = NL.shuffle(queue); let i = 0;
      const show = () => {
        if (i >= queue.length) { body.innerHTML = `${head(t('tab_cards'))}<div class="empty"><h2>${t('sessionDone')}</h2><button class="btn" data-back>${t('back')}</button></div>`; $('[data-back]', body).onclick = draw; return; }
        const c = queue[i];
        body.innerHTML = `${head(t('tab_cards'), `${i + 1} / ${queue.length}`)}
          <div class="flip-wrap"><button class="flip" aria-label="flip"><div class="face front"><span class="tag">${t('ct_' + c.kind)}</span><div class="face-c">${c.frontTex ? NL.tex(c.frontTex, true) : `<p>${esc(c.front)}</p>`}</div><small>${icon('flip')}</small></div>
            <div class="face back"><div class="face-c">${c.backTex ? NL.tex(c.backTex, true) : ''}<div class="prose">${NL.md(c.back)}</div></div>${c.page ? `<span class="pref">${t('page')} ${c.page}</span>` : ''}</div></button></div>
          <div class="grade-row" hidden><button class="btn bad" data-g="0">${t('didnt')}</button><button class="btn ghost" data-g="1">${t('hard')}</button><button class="btn okb" data-g="2">${t('knewIt')}</button></div>
          <div class="row center"><button class="btn sm ghost" data-quit>${t('back')}</button></div>`;
        const flip = $('.flip', body); flip.onclick = () => { flip.classList.toggle('turned'); $('.grade-row', body).hidden = false; };
        $('[data-quit]', body).onclick = draw;
        $$('[data-g]', body).forEach((b) => (b.onclick = () => {
          const g = +b.dataset.g, s = (st[c.id] ||= { box: 1, wrong: 0, seen: 0 });
          s.seen++; if (g === 0) { s.box = 1; s.wrong++; } else if (g === 2) s.box = Math.min(5, s.box + 1);
          s.due = Date.now() + INTERVAL[s.box] * 86400000 + (g === 0 ? 0 : 1);
          if (c.kind === 'mistake' && g === 2 && s.box >= 3) { const m = W.state.mistakes.find((x) => 'x:' + x.id === c.id); if (m) m.resolved = true; }
          W.saveState();
          W.stat((x) => { x.cardsMastered = deck.filter((d) => !d.id.startsWith('x:') && (st[d.id]?.box || 1) >= 3).length; });
          i++; show();
        }));
      };
      show();
    };
    draw();
  };

  /* ---------- mistakes ---------- */
  R.mistakes = (body) => {
    const draw = () => {
      const list = W.state.mistakes.slice().sort((x, y) => (x.resolved - y.resolved) || (y.at - x.at));
      body.innerHTML = `${head(t('tab_mistakes'), t('misLead'))}${list.length ? `<ol class="mis-list">${list.map((m) => `<li class="mis ${m.resolved ? 'resolved' : ''}" data-m="${m.id}">
        <div class="mis-top"><span class="tag">${t('src_' + (m.source || 'quiz'))}</span>${m.conceptId && concept(m.conceptId) ? `<span class="tag">${t('concept')}: ${esc(concept(m.conceptId).name)}</span>` : ''}<span class="badge ${m.resolved ? 'st-done' : 'st-prog'}">${m.resolved ? t('resolved') : t('unresolved')}</span><span class="fine">${NL.ago(m.at)}</span></div>
        <div class="prose">${NL.md(m.q)}</div>
        <div class="mis-ans"><p><span class="fine">${t('yourAnswer')}</span><b class="bad">${esc(m.given || '—')}</b></p><p><span class="fine">${t('correctAnswer')}</span><b class="ok">${NL.md(String(m.correct || '')).replace(/^<p>|<\/p>$/g, '')}</b></p></div>
        ${m.why ? `<details><summary>${NL.lang === 'ar' ? 'التفسير' : 'Explanation'}</summary><div class="prose">${NL.md(m.why)}</div></details>` : ''}
        ${m.diagnosis ? `<div class="notice"><b>${t('whyWrong')}</b><div class="prose">${NL.md(m.diagnosis)}</div></div>` : ''}
        <div class="mis-sim"></div>
        <div class="row gap wrap">${m.diagnosis ? '' : `<button class="btn sm ghost" data-why>${t('whyWrong')}</button>`}<button class="btn sm" data-sim>${t('similar')}</button></div></li>`).join('')}</ol>` : `<div class="empty"><h2>${t('misEmpty')}</h2></div>`}`;
      $$('.mis', body).forEach((el) => {
        const m = W.state.mistakes.find((x) => x.id === el.dataset.m);
        $('[data-why]', el)?.addEventListener('click', async (e) => {
          if (!ai.ready) return NL.toast(t('needsAI'), 'warn');
          e.target.disabled = true; e.target.textContent = t('generating');
          try { m.diagnosis = await ai.text(`${RULES()}\nA student answered a question incorrectly. In 2-4 sentences, explain the most likely reason for this specific wrong answer (the misconception or slip behind it) and how to avoid it. Do not just restate the correct answer.\nQuestion: ${m.q}\n${m.options ? 'Options: ' + m.options.join(' | ') + '\n' : ''}Student answer: ${m.given}\nCorrect answer: ${m.correct}\nExplanation: ${m.why || ''}`, { modelTier: 'quick' }); W.saveState(); draw(); }
          catch (err) { NL.toast(ai.errText(err), 'bad'); e.target.disabled = false; }
        });
        $('[data-sim]', el).onclick = async (e) => {
          const host = $('.mis-sim', el); if (needAI(host)) return;
          const q = await withSpinner(host, t('generating'), (signal) => ai.json(`${RULES()}\nCreate ONE new multiple-choice question that tests exactly the same idea as this one but with different wording/numbers, so the student can prove they understand it now.\nOriginal: ${m.q}\nCorrect answer: ${m.correct}\nReturn ONLY JSON {"q":"markdown","options":["4 options"],"answer":0,"why":"explanation"}`, { signal, modelTier: 'quick' }));
          if (!q || !Array.isArray(q.options)) return;
          host.innerHTML = `<div class="mcq"><p>${NL.md(q.q)}</p><div class="opts">${q.options.map((o, j) => `<button data-o="${j}">${NL.md(String(o)).replace(/^<p>|<\/p>$/g, '')}</button>`).join('')}</div><div class="fb" hidden></div></div>`;
          $$('[data-o]', host).forEach((b) => (b.onclick = () => {
            if (host.querySelector('.answered')) return; $('.mcq', host).classList.add('answered');
            const ok = +b.dataset.o === +q.answer; b.classList.add(ok ? 'right' : 'wrong'); $$('[data-o]', host)[+q.answer]?.classList.add('right');
            const fb = $('.fb', host); fb.hidden = false; fb.className = 'fb ' + (ok ? 'ok' : 'bad'); fb.innerHTML = `<b>${ok ? t('correct') : t('wrong')}</b> ${NL.md(q.why)}`;
            if (ok) { m.resolved = true; m.resolvedAt = Date.now(); el.classList.add('resolved'); $('.badge', el).className = 'badge st-done'; $('.badge', el).textContent = t('resolved'); }
            else W.addMistake({ source: 'mistake', q: q.q, options: q.options, given: q.options[+b.dataset.o], correct: q.options[+q.answer], why: q.why, conceptId: m.conceptId });
            W.saveState(); W.touch('mistakes');
          }));
        };
      });
    };
    draw();
  };

  /* ---------- mastery and plan ---------- */
  W.mastery = () => {
    const a = W.lesson.analysis, out = {};
    a.concepts.forEach((c) => (out[c.id] = { ok: 0, n: 0 }));
    W.state.quizzes.forEach((q, qi) => q.items.forEach((it) => { if (out[it.conceptId]) { const w = qi < 3 ? 1 : 0.5; out[it.conceptId].n += w; if (it.ok) out[it.conceptId].ok += w; } }));
    a.concepts.forEach((c) => { const s = W.state.cards['c:' + c.id]; if (s?.seen) { out[c.id].n += 1; out[c.id].ok += (s.box - 1) / 4; } });
    W.state.mistakes.filter((m) => !m.resolved && out[m.conceptId]).forEach((m) => { out[m.conceptId].n += 0.5; });
    return a.concepts.map((c) => ({ c, n: out[c.id].n, score: out[c.id].n ? out[c.id].ok / out[c.id].n : null }));
  };
  R.mastery = (body) => {
    const a = W.lesson.analysis, m = W.mastery(), plan = W.state.plan || { date: '', minutes: 30 };
    body.innerHTML = `${head(t('tab_mastery'), t('masteryLead'))}
      <div class="mastery">${m.map(({ c, n, score }) => `<button class="mcell ${score == null ? 'none' : score >= 0.8 ? 'hi' : score >= 0.5 ? 'mid' : 'lo'}" data-c="${c.id}" style="--m:${score == null ? 0 : score}"><b>${esc(c.name)}</b><span>${score == null ? t('noData') : Math.round(score * 100) + '%'}</span><small>${n ? t('evidence', { n: Math.round(n) }) : ''}</small></button>`).join('')}</div>
      <section class="panel plan"><h3>${t('planT')}</h3><form class="row gap wrap" id="plan-f"><label class="ctl inline"><span>${t('examDate')}</span><input type="date" id="plan-date" value="${esc(plan.date)}"></label><label class="ctl inline"><span>${t('perDay')}</span><input type="number" id="plan-min" min="10" max="240" step="5" value="${plan.minutes}"></label><button class="btn sm" type="submit">${t('buildPlan')}</button></form><div id="plan-out"></div><p class="fine">${t('planNote')}</p></section>`;
    $$('[data-c]', body).forEach((b) => (b.onclick = () => W.open('map', false, { focus: b.dataset.c })));
    const build = () => {
      const days = plan.date ? Math.max(1, Math.ceil((new Date(plan.date) - new Date(new Date().toDateString())) / 86400000)) : 5;
      const tasks = [];
      const done = W.lesson.stats.sectionsDone || {};
      a.sections.filter((s) => !done[s.id]).forEach((s) => tasks.push({ min: 15, tab: 'explain', opts: { sec: s.id }, label: t('tk_explain', { s: s.title }) }));
      const deck = W.deck(), due = deck.filter((c) => !W.state.cards[c.id] || W.state.cards[c.id].due <= Date.now()).length;
      m.filter((x) => x.score != null && x.score < 0.7).sort((x, y) => x.score - y.score).forEach((x) => tasks.push({ min: 10, tab: 'quiz', opts: { preset: { topic: 'c:' + x.c.id, n: 5, mode: 'practice', auto: true } }, label: t('tk_quiz', { s: x.c.name }) }));
      const open = W.state.mistakes.filter((x) => !x.resolved).length; if (open) tasks.push({ min: Math.min(20, open * 3), tab: 'mistakes', label: t('tk_mistakes', { n: open }) });
      a.labs.filter((l) => !W.lesson.stats.labsUsed?.[l.id]).slice(0, 2).forEach((l) => tasks.push({ min: 10, tab: 'lab', label: t('tk_lab', { s: tt(NL.LABS[l.id].title) }) }));
      m.filter((x) => x.score == null).slice(0, 4).forEach((x) => tasks.push({ min: 8, tab: 'quiz', opts: { preset: { topic: 'c:' + x.c.id, n: 5, mode: 'practice', auto: true } }, label: t('tk_quiz', { s: x.c.name }) }));
      if (!(W.lesson.stats.coachCount > 0)) tasks.push({ min: 10, tab: 'coach', label: t('tk_coach') });
      tasks.push({ min: 20, tab: 'quiz', opts: { preset: { n: 10, mode: 'exam' } }, label: t('tk_final') });
      const out = []; let d = 0, used = 0;
      for (const tk of tasks) { if (used + tk.min > plan.minutes && used > 0) { d++; used = 0; } if (d >= days) d = days - 1; (out[d] ||= []).push(tk); used += tk.min; }
      for (let k = 0; k < out.length; k++) if (out[k] && due) out[k].unshift({ min: 5, tab: 'cards', label: t('tk_cards', { n: Math.max(1, Math.round(due / out.length)) }) });
      $('#plan-out', body).innerHTML = `<ol class="plan-days">${out.map((ts, k) => ts ? `<li><h4>${t('day', { n: k + 1 })}${plan.date ? ` <span class="fine">${NL.date(Date.now() + k * 86400000)}</span>` : ''}</h4><ul>${ts.map((tk, j) => `<li><button class="link" data-k="${k}:${j}">${esc(tk.label)}</button><span class="fine">${tk.min} ${NL.lang === 'ar' ? 'د' : 'min'}</span></li>`).join('')}</ul></li>` : '').join('')}</ol>`;
      $$('[data-k]', body).forEach((b) => (b.onclick = () => { const [k, j] = b.dataset.k.split(':').map(Number); const tk = out[k][j]; W.open(tk.tab, false, tk.opts || {}); }));
    };
    $('#plan-f', body).onsubmit = (e) => { e.preventDefault(); plan.date = $('#plan-date', body).value; plan.minutes = +$('#plan-min', body).value || 30; W.state.plan = plan; W.saveState(); build(); };
    build();
  };

  /* ---------- explain the phenomenon (coach) ---------- */
  R.coach = (body) => {
    body.innerHTML = `${head(t('tab_coach'), t('coachLead'), `<button class="btn sm ghost" id="ph-new">${t('newPhen')}</button>`)}<div id="ph"></div>
      ${W.state.coach.length ? `<section><h3>${t('history')}</h3><ul class="qhist">${W.state.coach.slice(0, 6).map((c) => `<li><span class="score s-${c.score >= 8 ? 'hi' : c.score >= 5 ? 'mid' : 'lo'}">${c.score}/10</span><span>${esc(c.title)}</span><span class="fine">${NL.ago(c.at)}</span></li>`).join('')}</ul></section>` : ''}`;
    const host = $('#ph', body);
    const next = async (fresh) => {
      let list = W.gen.coach || [];
      if (!ai.ready && !list.length) { needAI(host); return; }
      if (!ai.ready) fresh = false;
      const seen = new Set(W.state.coach.map((c) => c.title));
      let item = !fresh && list.find((x) => !seen.has(x.title));
      if (!item && !ai.ready) item = list[Math.floor(Math.random() * list.length)];
      if (!item) {
        const ctxText = await W.ctx(30000);
        const d = await withSpinner(host, t('generating'), (signal) => ai.json(`${RULES()}\n\n${ctxText}\n\nPropose 4 real, observable everyday phenomena that this lesson's concepts explain (not textbook exercises). Avoid: ${[...seen].join('; ') || 'none'}. Return ONLY JSON {"items":[{"title":"short name","scene":"vivid 2-3 sentence description of what one observes","question":"Why does this happen?","conceptIds":["ids"]}]}`, { signal, modelTier: 'default' }));
        if (!d?.items?.length) return; list = W.gen.coach = d.items; W.saveGen(); item = list[0];
      }
      host.innerHTML = `<article class="phen"><h3>${esc(item.title)}</h3><div class="prose">${NL.md(item.scene)}</div><p class="q"><b>${esc(item.question)}</b></p>
        <div class="chips">${(item.conceptIds || []).map((id) => concept(id)).filter(Boolean).map((c) => `<span class="chip">${esc(c.name)}</span>`).join('')}</div>
        <label class="ctl"><span>${t('yourExpl')}</span><textarea id="ph-in" rows="6" dir="auto"></textarea></label><button class="btn" id="ph-go">${t('evaluate')}</button><div id="ph-res"></div></article>`;
      if (!ai.ready && item.modelAnswer) $('#ph-go', host).textContent = t('selfCheck');
      $('#ph-go', host).onclick = async () => {
        const ans = $('#ph-in', host).value.trim(); if (ans.length < 10) return $('#ph-in', host).focus();
        const res = $('#ph-res', host);
        if (!ai.ready && item.modelAnswer) {
          res.innerHTML = `<div class="coach-res"><h4>${t('model')}</h4><div class="prose panel">${NL.md(item.modelAnswer)}</div><p><b>${t('selfRate')}</b></p><div class="row gap wrap">${[['full', 9], ['part', 6], ['miss', 3]].map(([k, sc]) => `<button class="btn sm ${k === 'full' ? 'okb' : k === 'miss' ? 'bad' : 'ghost'}" data-sc="${sc}">${t('rate_' + k)}</button>`).join('')}</div></div>`;
          $$('[data-sc]', res).forEach((b) => (b.onclick = () => {
            const sc = +b.dataset.sc; W.state.coach.unshift({ at: Date.now(), title: item.title, score: sc, self: true }); W.state.coach = W.state.coach.slice(0, 30); W.saveState();
            W.stat((st) => { st.coachCount = (st.coachCount || 0) + 1; });
            res.insertAdjacentHTML('beforeend', `<button class="btn sm ghost" id="ph-next">${t('newPhen')}</button>`); $('#ph-next', res).onclick = () => next(false); $$('[data-sc]', res).forEach((x) => (x.disabled = true));
          }));
          return;
        }
        const g = await withSpinner(res, t('grading'), (signal) => ai.json(`${RULES()}\nEvaluate a student's explanation of a phenomenon using the lesson concepts.\nPhenomenon: ${item.scene}\nQuestion: ${item.question}\nRelevant concepts: ${(item.conceptIds || []).map((id) => concept(id)?.name + ': ' + concept(id)?.definition).join(' | ')}\nStudent's explanation: ${ans}\nRubric (10 points): correct physical/scientific principle (4), causal chain from cause to effect (3), correct use of terms (2), clarity (1).\nReturn ONLY JSON {"score":0-10,"strengths":["..."],"missing":["..."],"misconceptions":["..."],"feedback":"markdown","modelAnswer":"markdown"}`, { signal, modelTier: 'default' }));
        if (!g) return;
        const sc = NL.clamp(Math.round(+g.score || 0), 0, 10);
        res.innerHTML = `<div class="coach-res"><div class="score-ring s-${sc >= 8 ? 'hi' : sc >= 5 ? 'mid' : 'lo'}"><b>${t('score10', { s: sc })}</b></div><div class="prose">${NL.md(g.feedback)}</div>
          <div class="qz-cols">${[['strengths', g.strengths, 'ok'], ['missing', g.missing, 'mid'], ['misconc', g.misconceptions, 'bad']].map(([k, arr, cl]) => arr?.length ? `<div><h4>${t(k)}</h4><ul class="${cl}">${arr.map((x) => `<li>${NL.md(x)}</li>`).join('')}</ul></div>` : '').join('')}</div>
          <details><summary>${t('model')}</summary><div class="prose">${NL.md(g.modelAnswer)}</div></details><button class="btn sm ghost" id="ph-next">${t('newPhen')}</button></div>`;
        $('#ph-next', res).onclick = () => next(false);
        W.state.coach.unshift({ at: Date.now(), title: item.title, score: sc }); W.state.coach = W.state.coach.slice(0, 30); W.saveState();
        W.stat((st) => { st.coachCount = (st.coachCount || 0) + 1; });
      };
    };
    $('#ph-new', body).onclick = () => next(true);
    next(false);
  };

  /* ---------- whiteboard ---------- */
  R.board = (body) => {
    const math = W.lesson.subject === 'math';
    body.innerHTML = `${head(t('tab_board'), t('boardLead'))}<div id="bd"></div>
      <div class="row gap wrap">${ai.images ? `<button class="btn" id="bd-rev">${icon('eye')} ${t('boardReview')}</button>` : `<p class="fine">${t('imagesOff')}</p>`}</div><div id="bd-out"></div>
      ${math ? `<section><h3>${t('padTitle')}</h3><p class="lead-sm">${t('padLead')}</p><div id="bd-pad"></div></section>` : ''}`;
    const b = NL.mountBoard($('#bd', body), { height: 440 }); W.stop.push(b.destroy);
    if (math) NL.mountPad($('#bd-pad', body));
    $('#bd-rev', body)?.addEventListener('click', async () => {
      const out = $('#bd-out', body); if (b.isEmpty()) return NL.toast(t('boardEmpty'), 'warn');
      const img = await b.toBlob(); const ctxText = await W.ctx(20000);
      const text = await withSpinner(out, t('generating'), (signal) => ai.text(`${RULES()}\n\n${ctxText}\n\nThe attached image is the student's handwritten whiteboard. 1) Transcribe what is written, using LaTeX for maths. 2) Check it step by step against the lesson; say clearly which steps are right and where the first mistake is. 3) Give one tip. Be concise. Use the calculate tool to check arithmetic.`, { signal, images: [img], tools: ai.tools ? [ai.calcTool()] : undefined }));
      if (text) { out.innerHTML = `<div class="panel prose">${NL.md(text)}</div>`; W.touch('board'); }
    });
  };

  /* ---------- atlas ---------- */
  R.atlas = (body) => {
    body.innerHTML = `${head(t('tab_atlas'), t('atlasLead'))}<div id="atl"></div>`;
    NL.mountAtlas($('#atl', body), W.lesson.analysis, { onScore: ({ score }) => { W.state.atlas = { tries: (W.state.atlas?.tries || 0) + 1, total: (W.state.atlas?.total || 0) + score }; W.saveState(); W.touch('atlas'); } });
  };

  /* ---------- sources ---------- */
  R.sources = async (body) => {
    body.innerHTML = `${head(t('tab_sources'), t('srcLead'), W.lesson.builtin ? '' : `<button class="btn sm ghost" id="src-edit">${t('editContent')}</button>`)}<div class="src-list"><div class="spinner"></div></div>`;
    $('#src-edit', body)?.addEventListener('click', () => NL.go('new', { edit: W.lesson.id }));
    const pages = await W.pages();
    $('.src-list', body).innerHTML = pages.map((p) => `<article class="src-page" id="src-${p.n}"><div class="src-thumb">${p.image || p.thumb ? `<img src="${p.image || p.thumb}" alt="${t('page')} ${p.n}" loading="lazy">` : ''}</div>
      <div class="src-text"><h4>${t('page')} ${p.n} <span class="fine">${esc(p.label || '')}</span>${p.quality !== 'good' ? ` <span class="badge st-weak">${t('qualityPartial')}</span>` : ''}</h4>${p.issue ? `<p class="warn-text">${esc(p.issue)}</p>` : ''}<div class="prose src-body">${NL.md((p.text || '').replace(/\[FIGURE:\s*([^\]]+)\]/g, '**[$1]**'))}</div></div></article>`).join('');
  };
})();
