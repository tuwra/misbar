/* Misbar labs: every simulation computes its results from the stated model; nothing is canned. */
(function () {
  const { esc, t, tt, fmt, clamp } = NL;
  const G = 9.8;
  NL.addT({
    labGoal: ['هدف التجربة', 'Goal'], labHow: ['طريقة الاستخدام', 'How to use'], labAssume: ['افتراضات النموذج وحدوده', 'Model assumptions and limits'],
    labResults: ['النتائج المحسوبة', 'Computed results'], labExplain: ['ماذا تعني النتائج؟', 'What the results mean'], labQs: ['أسئلة استكشافية', 'Exploration questions'],
    replay: ['أعد التجربة', 'Run again'], resetDefaults: ['الإعدادات الأصلية', 'Reset defaults'], play: ['تشغيل', 'Play'], pause: ['إيقاف مؤقت', 'Pause'],
    idealNote: ['قيم مثالية محسوبة من النموذج. في الواقع تختلف بسبب عوامل لم تُضمَّن.', 'Ideal values computed from the model. Real measurements differ because of factors left out.'],
    graph: ['الرسم البياني', 'Graph'],
  });

  /* ---------- palette from theme tokens ---------- */
  let pal = null;
  NL.pal = () => pal || (pal = {
    fg: NL.css('--fg'), mute: NL.css('--mute'), line: NL.css('--line'), bg: NL.css('--bg'), surf: NL.css('--surface'), surf2: NL.css('--surface-2'),
    acc: NL.css('--accent'), sig: NL.css('--signal'), ok: NL.css('--ok'), bad: NL.css('--bad'), warn: NL.css('--warn'), vio: NL.css('--violet'),
  });
  NL.on('theme', () => { pal = null; });

  /* ---------- small drawing helpers ---------- */
  function arrow(ctx, x1, y1, x2, y2, color, w = 2.5, label) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 2) return;
    const a = Math.atan2(y2 - y1, x2 - x1), hs = Math.min(10, len * 0.4);
    ctx.strokeStyle = ctx.fillStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * hs * 0.6, y2 - Math.sin(a) * hs * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - hs * Math.cos(a - 0.45), y2 - hs * Math.sin(a - 0.45)); ctx.lineTo(x2 - hs * Math.cos(a + 0.45), y2 - hs * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
    if (label) { ctx.font = '600 12px var(--f-mono), monospace'; ctx.textAlign = 'center'; ctx.fillText(label, x2 + Math.cos(a) * 14, y2 + Math.sin(a) * 14 + 4); }
  }
  function txt(ctx, s, x, y, color, size = 12, align = 'center', weight = 500) {
    ctx.fillStyle = color; ctx.font = `${weight} ${size}px "IBM Plex Sans Arabic", system-ui, sans-serif`; ctx.textAlign = align; ctx.direction = 'ltr'; ctx.fillText(s, x, y);
  }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function mix(c1, c2, k) { // hex mix
    const p = (c) => { c = c.replace('#', ''); if (c.length === 3) c = [...c].map((x) => x + x).join(''); return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16)); };
    try { const a = p(c1), b = p(c2); return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`; } catch { return c1; }
  }
  NL.draw = { arrow, txt, rrect, mix };

  /* ---------- SVG line chart, drawn to scale ---------- */
  NL.lineChart = ({ series, mark, xLabel, yLabel, xMin, xMax, yMin, yMax, height = 220, markLabel }) => {
    const W = 560, H = height, L = 56, R = 16, Tp = 14, B = 40;
    const pts = series.flatMap((s) => s.pts).filter((p) => isFinite(p[0]) && isFinite(p[1]));
    if (mark && isFinite(mark[0]) && isFinite(mark[1])) pts.push(mark);
    if (!pts.length) return '';
    let x0 = xMin ?? Math.min(...pts.map((p) => p[0])), x1 = xMax ?? Math.max(...pts.map((p) => p[0]));
    let y0 = yMin ?? Math.min(0, ...pts.map((p) => p[1])), y1 = yMax ?? Math.max(...pts.map((p) => p[1]));
    if (x1 === x0) x1 = x0 + 1; if (y1 === y0) y1 = y0 + 1;
    const nice = (lo, hi, n = 5) => { const span = hi - lo, step0 = Math.pow(10, Math.floor(Math.log10(span / n))); const step = [1, 2, 2.5, 5, 10].map((m) => m * step0).find((s) => span / s <= n) || step0 * 10; const a = Math.floor(lo / step) * step, b = Math.ceil(hi / step) * step; const ticks = []; for (let v = a; v <= b + step / 2; v += step) ticks.push(+v.toFixed(10)); return { a, b, ticks }; };
    const nx = nice(x0, x1), ny = nice(y0, y1);
    const X = (v) => L + (v - nx.a) / (nx.b - nx.a) * (W - L - R), Y = (v) => H - B - (v - ny.a) / (ny.b - ny.a) * (H - B - Tp);
    let g = '';
    ny.ticks.forEach((v) => { g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="c-grid"/><text x="${L - 8}" y="${Y(v) + 4}" class="c-tick" text-anchor="end">${fmt(v, 2)}</text>`; });
    nx.ticks.forEach((v) => { g += `<line y1="${Tp}" y2="${H - B}" x1="${X(v)}" x2="${X(v)}" class="c-grid"/><text x="${X(v)}" y="${H - B + 16}" class="c-tick" text-anchor="middle">${fmt(v, 2)}</text>`; });
    if (ny.a < 0 && ny.b > 0) g += `<line x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}" class="c-axis"/>`;
    const lines = series.map((s, i) => {
      const d = s.pts.filter((p) => isFinite(p[1])).map((p, j) => `${j ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(clamp(p[1], ny.a, ny.b)).toFixed(1)}`).join('');
      const area = s.area && s.pts.length ? `<path d="${d}L${X(s.pts.at(-1)[0])},${Y(Math.max(ny.a, 0))}L${X(s.pts[0][0])},${Y(Math.max(ny.a, 0))}Z" class="c-area s${s.cls ?? i}"/>` : '';
      return area + `<path d="${d}" class="c-line s${s.cls ?? i}${s.dash ? ' dash' : ''}"/>`;
    }).join('');
    const legend = series.length > 1 ? `<g class="c-legend">${series.map((s, i) => `<g transform="translate(${L + 8 + i * 120},${Tp + 6})"><rect width="14" height="3" y="-4" class="c-key s${s.cls ?? i}"/><text x="20" y="0">${esc(s.name || '')}</text></g>`).join('')}</g>` : '';
    const mk = mark && isFinite(mark[1]) ? `<line x1="${X(mark[0])}" x2="${X(mark[0])}" y1="${Tp}" y2="${H - B}" class="c-guide"/><circle cx="${X(mark[0])}" cy="${Y(clamp(mark[1], ny.a, ny.b))}" r="5.5" class="c-mark"/>${markLabel ? `<text x="${X(mark[0]) + 8}" y="${Y(clamp(mark[1], ny.a, ny.b)) - 8}" class="c-mlabel">${esc(markLabel)}</text>` : ''}` : '';
    return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="${esc(yLabel + ' / ' + xLabel)}">${g}${lines}${mk}${legend}
      <text x="${(L + W - R) / 2}" y="${H - 6}" class="c-label" text-anchor="middle">${esc(xLabel)}</text>
      <text transform="translate(14,${(H - B + Tp) / 2}) rotate(-90)" class="c-label" text-anchor="middle">${esc(yLabel)}</text></svg>`;
  };

  /* ---------- lab catalog ---------- */
  const L = (NL.LABS = {});
  const def = (lab) => (L[lab.id] = lab);

  def({
    id: 'motion', subject: 'physics', title: ['الحركة في خط مستقيم', 'Motion in a straight line'],
    goal: ['اكتشف كيف تحدد السرعة الابتدائية والتسارع والزمن موقع الجسم وسرعته.', 'See how initial velocity, acceleration and time set an object’s position and velocity.'],
    how: ['غيّر المتغيرات ثم شغّل التجربة. النقاط على الطريق تُرسم كل ثانية مثل شريط المؤقت.', 'Change the variables, then run. Dots on the road are stamped every second, like ticker tape.'],
    assume: ['تسارع ثابت، جسم نقطي، لا احتكاك ولا مقاومة هواء.', 'Constant acceleration, point object, no friction or air resistance.'],
    params: [
      { k: 'x0', label: ['الموقع الابتدائي x₀', 'Initial position x₀'], min: 0, max: 50, step: 1, def: 0, unit: 'm' },
      { k: 'v0', label: ['السرعة الابتدائية v₀', 'Initial velocity v₀'], min: -10, max: 30, step: 0.5, def: 5, unit: 'm/s' },
      { k: 'a', label: ['التسارع a', 'Acceleration a'], min: -5, max: 5, step: 0.1, def: 1.5, unit: 'm/s²' },
      { k: 'T', label: ['الزمن t', 'Time t'], min: 1, max: 20, step: 0.5, def: 8, unit: 's' },
      { k: 'graph', label: ['الرسم', 'Graph'], type: 'select', def: 'x', options: [['x', ['الموقع–الزمن', 'Position–time']], ['v', ['السرعة–الزمن', 'Velocity–time']]] },
    ],
    compute(p) {
      const x = (tm) => p.x0 + p.v0 * tm + 0.5 * p.a * tm * tm, v = (tm) => p.v0 + p.a * tm;
      const ts = p.a !== 0 ? -p.v0 / p.a : -1;
      const dist = ts > 0 && ts < p.T ? Math.abs(x(ts) - p.x0) + Math.abs(x(p.T) - x(ts)) : Math.abs(x(p.T) - p.x0);
      return { x, v, xT: x(p.T), vT: v(p.T), disp: x(p.T) - p.x0, dist, avg: (x(p.T) - p.x0) / p.T, avgSpeed: dist / p.T, ts };
    },
    outputs: [['xT', ['الموقع النهائي x', 'Final position x'], 'm'], ['vT', ['السرعة النهائية v', 'Final velocity v'], 'm/s'], ['disp', ['الإزاحة Δx', 'Displacement Δx'], 'm'], ['dist', ['المسافة المقطوعة', 'Distance travelled'], 'm'], ['avg', ['متوسط السرعة المتجهة', 'Average velocity'], 'm/s'], ['avgSpeed', ['متوسط السرعة القياسية', 'Average speed'], 'm/s']],
    duration: (p) => clamp(p.T / 2, 2.5, 7),
    draw(ctx, W, H, p, r, k, c) {
      const tm = k * p.T, N = 80; let lo = Infinity, hi = -Infinity;
      for (let i = 0; i <= N; i++) { const v = r.x(p.T * i / N); lo = Math.min(lo, v); hi = Math.max(hi, v); }
      if (hi - lo < 10) { hi = lo + 10; }
      const pad = 50, X = (v) => pad + (v - lo) / (hi - lo) * (W - 2 * pad), road = H * 0.62;
      ctx.fillStyle = c.surf2; ctx.fillRect(0, road, W, 26);
      ctx.strokeStyle = c.line; ctx.setLineDash([12, 10]); ctx.beginPath(); ctx.moveTo(0, road + 13); ctx.lineTo(W, road + 13); ctx.stroke(); ctx.setLineDash([]);
      const step = Math.pow(10, Math.floor(Math.log10((hi - lo) / 4)));
      for (let m = Math.ceil(lo / step) * step; m <= hi; m += step) { ctx.fillStyle = c.mute; ctx.fillRect(X(m), road + 26, 1, 8); txt(ctx, fmt(m, 2) + ' m', X(m), road + 48, c.mute, 11); }
      for (let s = 0; s <= tm + 1e-9; s += 1) { ctx.fillStyle = c.sig; ctx.beginPath(); ctx.arc(X(r.x(s)), road - 8, 3.5, 0, 7); ctx.fill(); }
      const cx = X(r.x(tm)), dir = r.v(tm) >= 0 ? 1 : -1;
      ctx.fillStyle = c.acc; rrect(ctx, cx - 26, road - 44, 52, 26, 8); ctx.fill();
      ctx.fillStyle = c.bg; rrect(ctx, cx + (dir > 0 ? 4 : -20), road - 40, 16, 10, 3); ctx.fill();
      ctx.fillStyle = c.fg; [cx - 15, cx + 15].forEach((wx) => { ctx.beginPath(); ctx.arc(wx, road - 16, 7, 0, 7); ctx.fill(); });
      const vv = r.v(tm); arrow(ctx, cx, road - 62, cx + clamp(vv * 6, -160, 160), road - 62, c.sig, 3, `v = ${fmt(vv, 2)} m/s`);
      txt(ctx, `t = ${fmt(tm, 2)} s   x = ${fmt(r.x(tm), 2)} m`, W / 2, 24, c.fg, 14, 'center', 600);
    },
    chart(p, r, k) {
      const N = 60, f = p.graph === 'v' ? r.v : r.x, pts = [];
      for (let i = 0; i <= N; i++) { const s = p.T * i / N; pts.push([s, f(s)]); }
      return { series: [{ pts, area: p.graph === 'v' }], mark: [k * p.T, f(k * p.T)], xLabel: 't (s)', yLabel: p.graph === 'v' ? 'v (m/s)' : 'x (m)' };
    },
    explain(p, r) {
      const ar = NL.lang === 'ar';
      let s = ar ? `استُخدمت المعادلة $x = x_0 + v_0 t + \\tfrac12 a t^2$، فكان الموقع بعد ${fmt(p.T)} s هو ${fmt(r.xT)} m، والسرعة $v = v_0 + a t$ = ${fmt(r.vT)} m/s.` : `Using $x = x_0 + v_0 t + \\tfrac12 a t^2$, the position after ${fmt(p.T)} s is ${fmt(r.xT)} m and the velocity $v = v_0 + a t$ is ${fmt(r.vT)} m/s.`;
      if (p.graph === 'v') s += ar ? ' المساحة تحت منحنى السرعة–الزمن تساوي الإزاحة.' : ' The area under the velocity–time graph equals the displacement.';
      else s += ar ? ' ميل منحنى الموقع–الزمن عند أي لحظة هو السرعة اللحظية.' : ' The slope of the position–time graph at any instant is the instantaneous velocity.';
      if (r.ts > 0 && r.ts < p.T) s += ar ? ` انعكس اتجاه الحركة عند t = ${fmt(r.ts)} s، لذلك صارت المسافة (${fmt(r.dist)} m) أكبر من مقدار الإزاحة (${fmt(Math.abs(r.disp))} m).` : ` The object reversed at t = ${fmt(r.ts)} s, so the distance (${fmt(r.dist)} m) exceeds the size of the displacement (${fmt(Math.abs(r.disp))} m).`;
      if (p.a === 0) s += ar ? ' التسارع صفر، فالحركة منتظمة والنقاط متساوية التباعد.' : ' Acceleration is zero, so motion is uniform and the dots are evenly spaced.';
      return s;
    },
    questions: [['اجعل التسارع صفرًا. ماذا تلاحظ على المسافات بين النقاط؟', 'Set acceleration to zero. What happens to the gaps between dots?'], ['اجعل v₀ موجبة والتسارع سالبًا. متى يتوقف الجسم؟ تحقق بالحساب.', 'Make v₀ positive and a negative. When does the object stop? Check by calculation.'], ['ما الفرق بين الإزاحة والمسافة؟ جد إعدادًا يختلفان فيه.', 'How do displacement and distance differ? Find settings where they differ.']],
  });

  def({
    id: 'projectile', subject: 'physics', title: ['حركة المقذوفات', 'Projectile motion'],
    goal: ['ادرس كيف تؤثر السرعة وزاوية الإطلاق والجاذبية في المدى وأقصى ارتفاع.', 'Study how speed, launch angle and gravity set the range and maximum height.'],
    how: ['اضبط السرعة والزاوية والارتفاع والكوكب، ثم أطلق المقذوف.', 'Set speed, angle, height and planet, then launch.'],
    assume: ['لا مقاومة هواء، جاذبية منتظمة، أرض مستوية.', 'No air resistance, uniform gravity, flat ground.'],
    params: [
      { k: 'v0', label: ['سرعة الإطلاق v₀', 'Launch speed v₀'], min: 5, max: 50, step: 0.5, def: 20, unit: 'm/s' },
      { k: 'ang', label: ['زاوية الإطلاق θ', 'Launch angle θ'], min: 5, max: 85, step: 1, def: 45, unit: '°' },
      { k: 'h0', label: ['ارتفاع الإطلاق h₀', 'Launch height h₀'], min: 0, max: 30, step: 0.5, def: 0, unit: 'm' },
      { k: 'g', label: ['الجاذبية g', 'Gravity g'], type: 'select', def: '9.8', options: [['9.8', ['الأرض 9.8', 'Earth 9.8']], ['1.62', ['القمر 1.62', 'Moon 1.62']], ['3.71', ['المريخ 3.71', 'Mars 3.71']], ['24.8', ['المشتري 24.8', 'Jupiter 24.8']]] },
    ],
    compute(p) {
      const g = +p.g, th = p.ang * Math.PI / 180, vx = p.v0 * Math.cos(th), vy = p.v0 * Math.sin(th);
      const tf = (vy + Math.sqrt(vy * vy + 2 * g * p.h0)) / g;
      return { g, vx, vy, tf, R: vx * tf, Hm: p.h0 + vy * vy / (2 * g), tH: vy / g, pos: (s) => [vx * s, p.h0 + vy * s - 0.5 * g * s * s] };
    },
    outputs: [['R', ['المدى الأفقي', 'Range'], 'm'], ['Hm', ['أقصى ارتفاع', 'Max height'], 'm'], ['tf', ['زمن التحليق', 'Flight time'], 's'], ['vx', ['المركبة الأفقية vₓ', 'Horizontal vₓ'], 'm/s'], ['vy', ['المركبة الرأسية الابتدائية', 'Initial vertical v_y'], 'm/s']],
    duration: (p, r) => clamp(r.tf, 1.5, 6),
    draw(ctx, W, H, p, r, k, c) {
      const pad = 44, span = Math.max(r.R, r.Hm * 1.4, 10), sx = (W - 2 * pad) / span, sy = (H - 2 * pad) / Math.max(r.Hm * 1.15, 5), s = Math.min(sx, sy);
      const X = (x) => pad + x * s, Y = (y) => H - pad - y * s;
      ctx.strokeStyle = c.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.stroke();
      if (p.h0 > 0) { ctx.fillStyle = c.surf2; ctx.fillRect(X(0) - 18, Y(p.h0), 18, p.h0 * s); }
      ctx.setLineDash([5, 6]); ctx.strokeStyle = c.mute; ctx.beginPath();
      for (let i = 0; i <= 80; i++) { const [x, y] = r.pos(r.tf * i / 80); i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); } ctx.stroke(); ctx.setLineDash([]);
      const tm = k * r.tf, [bx, by] = r.pos(tm);
      ctx.strokeStyle = c.sig; ctx.lineWidth = 2.5; ctx.beginPath();
      for (let i = 0; i <= 60; i++) { const [x, y] = r.pos(tm * i / 60); i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y)); } ctx.stroke();
      ctx.fillStyle = c.acc; ctx.beginPath(); ctx.arc(X(bx), Y(by), 8, 0, 7); ctx.fill();
      const vyt = r.vy - r.g * tm;
      arrow(ctx, X(bx), Y(by), X(bx) + r.vx * 2.2, Y(by), c.ok, 2, 'vₓ');
      arrow(ctx, X(bx), Y(by), X(bx), Y(by) - vyt * 2.2, c.vio, 2, 'v_y');
      ctx.strokeStyle = c.acc; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(X(r.vx * r.tH), Y(r.Hm)); ctx.lineTo(X(r.vx * r.tH), Y(0)); ctx.stroke(); ctx.setLineDash([]);
      txt(ctx, `H = ${fmt(r.Hm, 2)} m`, X(r.vx * r.tH), Y(r.Hm) - 10, c.acc, 12);
      txt(ctx, `R = ${fmt(r.R, 2)} m`, X(r.R), Y(0) + 20, c.fg, 12);
      txt(ctx, `t = ${fmt(tm, 2)} s`, 70, 24, c.fg, 13, 'center', 600);
    },
    chart(p, r, k) {
      const pts = [], best = [];
      for (let a = 5; a <= 85; a += 1) { const th = a * Math.PI / 180, vx = p.v0 * Math.cos(th), vy = p.v0 * Math.sin(th); pts.push([a, vx * (vy + Math.sqrt(vy * vy + 2 * r.g * p.h0)) / r.g]); }
      return { series: [{ pts, area: true }], mark: [p.ang, r.R], xLabel: NL.lang === 'ar' ? 'زاوية الإطلاق (°)' : 'launch angle (°)', yLabel: NL.lang === 'ar' ? 'المدى (m)' : 'range (m)' };
    },
    explain(p, r) {
      const ar = NL.lang === 'ar', best = p.h0 === 0;
      return (ar ? `تتحلل السرعة إلى $v_x = v_0\\cos\\theta$ = ${fmt(r.vx)} m/s تبقى ثابتة، و$v_y = v_0\\sin\\theta$ = ${fmt(r.vy)} m/s تتناقص بمعدل g = ${r.g} m/s². المدى $R = v_x t$ = ${fmt(r.R)} m. ` : `Velocity splits into $v_x = v_0\\cos\\theta$ = ${fmt(r.vx)} m/s, which stays constant, and $v_y = v_0\\sin\\theta$ = ${fmt(r.vy)} m/s, which falls at g = ${r.g} m/s². Range $R = v_x t$ = ${fmt(r.R)} m. `)
        + (best ? (ar ? 'الرسم البياني يبين المدى لكل زاوية بنفس السرعة: أكبره عند 45° عندما يكون الإطلاق من الأرض.' : 'The graph shows the range for every angle at this speed: it peaks at 45° when launched from the ground.') : (ar ? 'مع الإطلاق من ارتفاع تصبح أفضل زاوية أقل من 45°؛ لاحظ موضع القمة في الرسم.' : 'Launching from a height moves the best angle below 45°; note where the graph peaks.'));
    },
    questions: [['جرّب 30° و60°. لماذا يتساوى المدى تقريبًا؟', 'Try 30° and 60°. Why are the ranges equal?'], ['انقل التجربة إلى القمر. كم مرة يزداد المدى؟', 'Move to the Moon. By what factor does the range grow?'], ['ما الذي يحدث لـ vₓ أثناء الطيران؟ ولماذا؟', 'What happens to vₓ during flight, and why?']],
  });

  def({
    id: 'newton', subject: 'physics', title: ['القوة والكتلة والتسارع', 'Force, mass and acceleration'],
    goal: ['تحقق من قانون نيوتن الثاني ΣF = m a مع وجود الاحتكاك.', 'Test Newton’s second law ΣF = m a with friction.'],
    how: ['غيّر القوة المؤثرة والكتلة ومعامل الاحتكاك، وراقب أسهم القوى والتسارع.', 'Change the applied force, mass and friction coefficient, and watch the force arrows and acceleration.'],
    assume: ['معامل احتكاك واحد للسكون والحركة، سطح أفقي، g = 9.8 m/s².', 'One friction coefficient for static and kinetic, level surface, g = 9.8 m/s².'],
    params: [
      { k: 'F', label: ['القوة المؤثرة F', 'Applied force F'], min: 0, max: 200, step: 1, def: 60, unit: 'N' },
      { k: 'm', label: ['الكتلة m', 'Mass m'], min: 1, max: 50, step: 0.5, def: 10, unit: 'kg' },
      { k: 'mu', label: ['معامل الاحتكاك μ', 'Friction coefficient μ'], min: 0, max: 0.8, step: 0.01, def: 0.2, unit: '' },
    ],
    compute(p) {
      const Wt = p.m * G, fmax = p.mu * Wt, moving = p.F > fmax, f = moving ? fmax : p.F, net = p.F - f, a = net / p.m;
      return { Wt, N: Wt, f, net, a, moving, x: (s) => 0.5 * a * s * s };
    },
    outputs: [['a', ['التسارع a', 'Acceleration a'], 'm/s²'], ['net', ['القوة المحصلة ΣF', 'Net force ΣF'], 'N'], ['f', ['قوة الاحتكاك f', 'Friction f'], 'N'], ['Wt', ['الوزن W = mg', 'Weight W = mg'], 'N'], ['N', ['القوة العمودية N', 'Normal force N'], 'N']],
    duration: () => 4,
    draw(ctx, W, H, p, r, k, c) {
      const floor = H * 0.72, tm = k * 4, x = r.x(tm), scale = 22;
      ctx.fillStyle = c.surf2; ctx.fillRect(0, floor, W, H - floor);
      const off = (x * scale) % 60;
      ctx.strokeStyle = c.line; for (let gx = -off; gx < W; gx += 60) { ctx.beginPath(); ctx.moveTo(gx, floor + 6); ctx.lineTo(gx - 10, floor + 18); ctx.stroke(); }
      const bw = 40 + p.m * 2.2, bh = 30 + p.m * 1.2, bx = W / 2 - bw / 2, by = floor - bh;
      ctx.fillStyle = c.acc; rrect(ctx, bx, by, bw, bh, 6); ctx.fill();
      txt(ctx, `${p.m} kg`, W / 2, by + bh / 2 + 5, c.bg, 13, 'center', 700);
      const S = 1.1;
      arrow(ctx, W / 2 + bw / 2, by + bh / 2, W / 2 + bw / 2 + Math.min(p.F * S, 230), by + bh / 2, c.sig, 3, 'F');
      if (r.f > 0) arrow(ctx, W / 2 - bw / 2, floor - 6, W / 2 - bw / 2 - Math.min(r.f * S, 230), floor - 6, c.bad, 3, 'f');
      arrow(ctx, W / 2, by, W / 2, by - Math.min(r.N * 0.25, 90), c.ok, 2, 'N');
      arrow(ctx, W / 2, floor, W / 2, floor + Math.min(r.Wt * 0.25, 60), c.vio, 2, 'W');
      txt(ctx, r.moving ? `a = ${fmt(r.a, 2)} m/s²   x = ${fmt(x, 2)} m` : (NL.lang === 'ar' ? 'الجسم ساكن: F لا تتغلب على الاحتكاك' : 'At rest: F does not overcome friction'), W / 2, 26, r.moving ? c.fg : c.bad, 14, 'center', 600);
    },
    chart(p, r) {
      const pts = []; for (let F = 0; F <= 200; F += 2) { const fm = p.mu * p.m * G; pts.push([F, F > fm ? (F - fm) / p.m : 0]); }
      return { series: [{ pts }], mark: [p.F, r.a], xLabel: 'F (N)', yLabel: 'a (m/s²)' };
    },
    explain(p, r) {
      const ar = NL.lang === 'ar';
      if (!r.moving) return ar ? `أقصى احتكاك سكوني $f = \\mu N$ = ${fmt(p.mu)} × ${fmt(r.N)} = ${fmt(p.mu * r.N)} N، وهو أكبر من القوة المؤثرة ${p.F} N، لذلك يبقى الجسم ساكنًا والمحصلة صفر.` : `Maximum friction $f = \\mu N$ = ${fmt(p.mu)} × ${fmt(r.N)} = ${fmt(p.mu * r.N)} N exceeds the applied ${p.F} N, so the block stays at rest and the net force is zero.`;
      return ar ? `المحصلة $\\Sigma F = F - f$ = ${p.F} − ${fmt(r.f)} = ${fmt(r.net)} N، والتسارع $a = \\Sigma F / m$ = ${fmt(r.a)} m/s². في الرسم: بعد تجاوز الاحتكاك يزيد التسارع خطيًا مع القوة، وميل الخط $1/m$.` : `Net force $\\Sigma F = F - f$ = ${p.F} − ${fmt(r.f)} = ${fmt(r.net)} N, so $a = \\Sigma F / m$ = ${fmt(r.a)} m/s². On the graph, once friction is overcome, a grows linearly with F with slope $1/m$.`;
    },
    questions: [['ضاعف الكتلة مع ثبات القوة. ماذا يحدث للتسارع؟', 'Double the mass at fixed force. What happens to a?'], ['ما أقل قوة تحرك جسمًا كتلته 20 kg عندما μ = 0.3؟', 'What is the smallest force that moves 20 kg when μ = 0.3?'], ['لماذا لا يبدأ الخط في الرسم من الصفر؟', 'Why does the graph line not start at zero?']],
  });

  def({
    id: 'lever', subject: 'physics', title: ['الرافعة وعزم القوة', 'Lever and torque'],
    goal: ['اكتشف كيف يغيّر موضع نقطة الارتكاز القوة اللازمة لرفع الحمل.', 'Discover how the fulcrum position changes the force needed to lift a load.'],
    how: ['حرّك نقطة الارتكاز وغيّر الحمل والقوة. تميل الرافعة نحو العزم الأكبر.', 'Move the fulcrum and change the load and effort. The lever tips toward the larger torque.'],
    assume: ['رافعة من النوع الأول طولها 4 m، مهملة الكتلة، والقوى عمودية عليها.', 'First-class lever, 4 m long, massless, forces perpendicular to it.'],
    params: [
      { k: 'mL', label: ['كتلة الحمل', 'Load mass'], min: 1, max: 100, step: 1, def: 40, unit: 'kg' },
      { k: 'p', label: ['موضع الارتكاز من طرف الحمل', 'Fulcrum distance from load end'], min: 0.4, max: 3.6, step: 0.05, def: 1, unit: 'm' },
      { k: 'Fe', label: ['القوة المبذولة', 'Effort force'], min: 0, max: 1000, step: 5, def: 150, unit: 'N' },
    ],
    compute(p) {
      const dL = p.p, dE = 4 - p.p, WL = p.mL * G, tL = WL * dL, tE = p.Fe * dE, Freq = tL / dE;
      return { dL, dE, WL, tL, tE, Freq, MA: dE / dL, net: tE - tL, ang: clamp((tE - tL) / Math.max(tL, 1) * 10, -12, 12) };
    },
    outputs: [['Freq', ['القوة اللازمة للاتزان', 'Effort for balance'], 'N'], ['MA', ['الفائدة الآلية', 'Mechanical advantage'], ''], ['tL', ['عزم الحمل', 'Load torque'], 'N·m'], ['tE', ['عزم القوة', 'Effort torque'], 'N·m'], ['WL', ['وزن الحمل', 'Load weight'], 'N']],
    duration: () => 1.2,
    draw(ctx, W, H, p, r, k, c) {
      const cx0 = 60, len = W - 120, s = len / 4, fx = cx0 + p.p * s, fy = H * 0.62;
      const ang = -r.ang * Math.PI / 180 * Math.min(1, k * 1.5);
      ctx.fillStyle = c.surf2; ctx.fillRect(0, fy + 44, W, H);
      ctx.fillStyle = c.mute; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx - 26, fy + 44); ctx.lineTo(fx + 26, fy + 44); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.translate(fx, fy); ctx.rotate(ang);
      ctx.fillStyle = c.fg; rrect(ctx, -p.p * s, -8, len, 10, 4); ctx.fill();
      for (let m = 0; m <= 4; m += 0.5) { ctx.fillStyle = c.bg; ctx.fillRect((m - p.p) * s - 0.5, -6, 1, 6); }
      const bs = 22 + p.mL * 0.35; ctx.fillStyle = c.acc; rrect(ctx, -p.p * s, -8 - bs, bs, bs, 4); ctx.fill();
      txt(ctx, `${p.mL} kg`, -p.p * s + bs / 2, -8 - bs / 2 + 4, c.bg, 11, 'center', 700);
      arrow(ctx, (4 - p.p) * s - 6, -70 - Math.min(p.Fe / 8, 60), (4 - p.p) * s - 6, -12, c.sig, 3);
      txt(ctx, `${p.Fe} N`, (4 - p.p) * s - 6, -78 - Math.min(p.Fe / 8, 60), c.sig, 12, 'center', 600);
      ctx.restore();
      txt(ctx, `d₁ = ${fmt(r.dL, 2)} m`, (cx0 + fx) / 2, fy + 34, c.mute, 12); txt(ctx, `d₂ = ${fmt(r.dE, 2)} m`, (fx + cx0 + len) / 2, fy + 34, c.mute, 12);
      const st = Math.abs(r.net) < r.tL * 0.02 ? (NL.lang === 'ar' ? 'متزنة تقريبًا' : 'about balanced') : r.net > 0 ? (NL.lang === 'ar' ? 'يرتفع الحمل' : 'load rises') : (NL.lang === 'ar' ? 'القوة غير كافية' : 'effort too small');
      txt(ctx, st, W / 2, 26, Math.abs(r.net) < r.tL * 0.02 ? c.ok : r.net > 0 ? c.sig : c.bad, 14, 'center', 600);
    },
    chart(p) {
      const pts = []; for (let x = 0.4; x <= 3.6; x += 0.05) pts.push([x, p.mL * G * x / (4 - x)]);
      return { series: [{ pts }], mark: [p.p, p.mL * G * p.p / (4 - p.p)], xLabel: NL.lang === 'ar' ? 'بعد الارتكاز عن الحمل (m)' : 'fulcrum distance from load (m)', yLabel: NL.lang === 'ar' ? 'القوة اللازمة (N)' : 'effort needed (N)', yMax: p.mL * G * 3 };
    },
    explain(p, r) {
      const ar = NL.lang === 'ar';
      return ar ? `الاتزان يحدث عندما يتساوى العزمان: $F_1 d_1 = F_2 d_2$. عزم الحمل ${fmt(r.WL)} × ${fmt(r.dL)} = ${fmt(r.tL)} N·m، لذلك القوة اللازمة ${fmt(r.Freq)} N. كلما اقتربت نقطة الارتكاز من الحمل زادت الفائدة الآلية (${fmt(r.MA)}) وقلّت القوة، لكن طرف القوة يتحرك مسافة أكبر.` : `Balance needs equal torques: $F_1 d_1 = F_2 d_2$. Load torque ${fmt(r.WL)} × ${fmt(r.dL)} = ${fmt(r.tL)} N·m, so the effort needed is ${fmt(r.Freq)} N. Moving the fulcrum toward the load raises the mechanical advantage (${fmt(r.MA)}) and lowers the force, but the effort end travels farther.`;
    },
    questions: [['أين تضع الارتكاز لتكون القوة نصف وزن الحمل؟', 'Where must the fulcrum be for the effort to be half the load weight?'], ['هل تحصل على شغل مجاني بالرافعة؟ لماذا؟', 'Does the lever give you free work? Why?'], ['ماذا يحدث للقوة عندما يكون الارتكاز في المنتصف؟', 'What is the effort when the fulcrum is in the middle?']],
  });

  def({
    id: 'incline', subject: 'physics', title: ['المستوى المائل', 'Inclined plane'],
    goal: ['قارن القوة اللازمة لدفع جسم على مستوى مائل بقوة رفعه رأسيًا.', 'Compare the force to push a block up a ramp with lifting it straight up.'],
    how: ['غيّر زاوية الميل والكتلة والاحتكاك. القوة المحسوبة هي التي تحرك الجسم للأعلى بسرعة ثابتة.', 'Change the angle, mass and friction. The computed force moves the block up at constant speed.'],
    assume: ['القوة موازية للمستوى، الجسم يتحرك بسرعة ثابتة، g = 9.8 m/s².', 'Force parallel to the ramp, block moves at constant speed, g = 9.8 m/s².'],
    params: [
      { k: 'th', label: ['زاوية الميل θ', 'Ramp angle θ'], min: 2, max: 60, step: 1, def: 25, unit: '°' },
      { k: 'm', label: ['الكتلة m', 'Mass m'], min: 1, max: 50, step: 0.5, def: 10, unit: 'kg' },
      { k: 'mu', label: ['معامل الاحتكاك μ', 'Friction μ'], min: 0, max: 0.6, step: 0.01, def: 0.1, unit: '' },
    ],
    compute(p) {
      const th = p.th * Math.PI / 180, Wt = p.m * G, par = Wt * Math.sin(th), N = Wt * Math.cos(th), f = p.mu * N, Fup = par + f;
      return { Wt, par, N, f, Fup, IMA: 1 / Math.sin(th), AMA: Wt / Fup, eff: par / Fup * 100, slides: Math.tan(th) > p.mu, aDown: Math.max(0, G * (Math.sin(th) - p.mu * Math.cos(th))) };
    },
    outputs: [['Fup', ['القوة اللازمة للدفع', 'Force to push up'], 'N'], ['Wt', ['قوة الرفع الرأسي mg', 'Lifting force mg'], 'N'], ['par', ['مركبة الوزن الموازية', 'Weight along ramp'], 'N'], ['N', ['القوة العمودية', 'Normal force'], 'N'], ['IMA', ['الفائدة الآلية المثالية', 'Ideal MA'], ''], ['eff', ['الكفاءة', 'Efficiency'], '%']],
    duration: () => 3,
    draw(ctx, W, H, p, r, k, c) {
      const th = p.th * Math.PI / 180, base = W - 120, x0 = 60, y0 = H - 40, hgt = Math.min(base * Math.tan(th), H - 90), bl = hgt / Math.tan(th);
      ctx.fillStyle = c.surf2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + bl, y0); ctx.lineTo(x0 + bl, y0 - hgt); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = c.line; ctx.stroke();
      const L = Math.hypot(bl, hgt), d = (0.15 + 0.6 * k) * L, bx = x0 + d * Math.cos(th), by = y0 - d * Math.sin(th);
      ctx.save(); ctx.translate(bx, by); ctx.rotate(-th);
      ctx.fillStyle = c.acc; rrect(ctx, -22, -34, 44, 34, 5); ctx.fill(); txt(ctx, `${p.m}kg`, 0, -13, c.bg, 11, 'center', 700);
      arrow(ctx, 22, -17, 22 + Math.min(r.Fup * 0.9, 160), -17, c.sig, 3, 'F');
      if (r.f > 0) arrow(ctx, -22, -4, -22 - Math.min(r.f * 0.9, 120), -4, c.bad, 2, 'f');
      arrow(ctx, 0, -34, 0, -34 - Math.min(r.N * 0.5, 80), c.ok, 2, 'N');
      ctx.restore();
      arrow(ctx, bx - 17 * Math.sin(th), by - 17 * Math.cos(th), bx - 17 * Math.sin(th), by - 17 * Math.cos(th) + Math.min(r.Wt * 0.5, 90), c.vio, 2, 'mg');
      ctx.strokeStyle = c.mute; ctx.beginPath(); ctx.arc(x0, y0, 34, -th, 0); ctx.stroke(); txt(ctx, `${p.th}°`, x0 + 48, y0 - 8, c.mute, 12);
      txt(ctx, `F = ${fmt(r.Fup, 3)} N  <  mg = ${fmt(r.Wt, 3)} N`, W / 2, 24, c.fg, 14, 'center', 600);
    },
    chart(p) {
      const a = [], b = []; for (let d = 2; d <= 60; d++) { const th = d * Math.PI / 180; a.push([d, p.m * G * (Math.sin(th) + p.mu * Math.cos(th))]); b.push([d, p.m * G]); }
      return { series: [{ pts: a, name: 'F' }, { pts: b, name: 'mg', dash: true, cls: 2 }], mark: [p.th, p.m * G * (Math.sin(p.th * Math.PI / 180) + p.mu * Math.cos(p.th * Math.PI / 180))], xLabel: 'θ (°)', yLabel: 'F (N)', yMin: 0 };
    },
    explain(p, r) {
      const ar = NL.lang === 'ar';
      return (ar ? `القوة اللازمة $F = mg\\sin\\theta + \\mu mg\\cos\\theta$ = ${fmt(r.par)} + ${fmt(r.f)} = ${fmt(r.Fup)} N، أقل من الوزن ${fmt(r.Wt)} N. الفائدة الآلية المثالية $1/\\sin\\theta$ = ${fmt(r.IMA)}، والكفاءة ${fmt(r.eff)}% لأن الاحتكاك يستهلك جزءًا من الشغل.` : `Required force $F = mg\\sin\\theta + \\mu mg\\cos\\theta$ = ${fmt(r.par)} + ${fmt(r.f)} = ${fmt(r.Fup)} N, less than the weight ${fmt(r.Wt)} N. Ideal MA $1/\\sin\\theta$ = ${fmt(r.IMA)}; efficiency is ${fmt(r.eff)}% because friction uses part of the work.`)
        + (r.slides ? (ar ? ` بدون قوة دفع، ينزلق الجسم للأسفل بتسارع ${fmt(r.aDown)} m/s².` : ` Without a push the block slides down at ${fmt(r.aDown)} m/s².`) : (ar ? ' بدون قوة، يبقى الجسم ساكنًا لأن $\\tan\\theta < \\mu$.' : ' Left alone, the block stays put because $\\tan\\theta < \\mu$.'));
    },
    questions: [['عند أي زاوية تبدأ الكتلة بالانزلاق وحدها إذا كان μ = 0.3؟', 'At what angle does the block start sliding by itself when μ = 0.3?'], ['لماذا تُبنى الطرق الجبلية متعرجة؟', 'Why are mountain roads built as switchbacks?'], ['اجعل μ = 0. هل تصبح الكفاءة 100%؟', 'Set μ = 0. Does efficiency reach 100%?']],
  });

  def({
    id: 'circuit', subject: 'physics', title: ['الدائرة الكهربائية', 'Electric circuit'],
    goal: ['قارن التوصيل على التوالي والتوازي، وطبّق قانون أوم V = IR.', 'Compare series and parallel connections and apply Ohm’s law V = IR.'],
    how: ['غيّر جهد البطارية والمقاومات ونوع التوصيل. سطوع المصباح يتناسب مع القدرة، وسرعة الشحنات مع التيار.', 'Change the battery voltage, resistors and connection. Bulb glow follows power; charge speed follows current.'],
    assume: ['أسلاك بلا مقاومة، بطارية مثالية بلا مقاومة داخلية، مقاومات ثابتة لا تتغير مع الحرارة.', 'Resistance-free wires, ideal battery with no internal resistance, resistors fixed with temperature.'],
    params: [
      { k: 'V', label: ['جهد البطارية V', 'Battery voltage V'], min: 1, max: 24, step: 0.5, def: 12, unit: 'V' },
      { k: 'R1', label: ['المقاومة R₁', 'Resistor R₁'], min: 1, max: 100, step: 1, def: 10, unit: 'Ω' },
      { k: 'R2', label: ['المقاومة R₂', 'Resistor R₂'], min: 1, max: 100, step: 1, def: 20, unit: 'Ω' },
      { k: 'R3', label: ['المقاومة R₃', 'Resistor R₃'], min: 1, max: 100, step: 1, def: 30, unit: 'Ω' },
      { k: 'mode', label: ['التوصيل', 'Connection'], type: 'select', def: 'series', options: [['series', ['توالي', 'Series']], ['parallel', ['توازي', 'Parallel']]] },
    ],
    compute(p) {
      const R = [p.R1, p.R2, p.R3];
      if (p.mode === 'series') { const Req = R[0] + R[1] + R[2], I = p.V / Req; return { Req, I, Is: R.map(() => I), Vs: R.map((r) => I * r), Ps: R.map((r) => I * I * r), P: p.V * I }; }
      const Req = 1 / (1 / R[0] + 1 / R[1] + 1 / R[2]), Is = R.map((r) => p.V / r), I = Is[0] + Is[1] + Is[2];
      return { Req, I, Is, Vs: R.map(() => p.V), Ps: Is.map((i) => i * p.V), P: p.V * I };
    },
    outputs: [['Req', ['المقاومة المكافئة', 'Equivalent resistance'], 'Ω'], ['I', ['التيار الكلي I', 'Total current I'], 'A'], ['P', ['القدرة الكلية', 'Total power'], 'W'], ['b1', ['R₁: تيار / جهد', 'R₁: current / voltage'], ''], ['b2', ['R₂: تيار / جهد', 'R₂: current / voltage'], ''], ['b3', ['R₃: تيار / جهد', 'R₃: current / voltage'], '']],
    format(r, k) { if (/^b\d$/.test(k)) { const i = +k[1] - 1; return `${fmt(r.Is[i], 3)} A · ${fmt(r.Vs[i], 3)} V`; } },
    duration: () => 0,
    draw(ctx, W, H, p, r, k, c, time) {
      const x0 = 70, x1 = W - 60, y0 = 60, y1 = H - 46, maxP = 30;
      ctx.lineWidth = 3; ctx.strokeStyle = c.mute; ctx.lineJoin = 'round';
      const bulb = (x, y, P, label, I) => {
        const glow = clamp(P / maxP, 0, 1);
        const g = ctx.createRadialGradient(x, y, 2, x, y, 18 + glow * 40); g.addColorStop(0, `rgba(255,200,87,${0.25 + glow * 0.7})`); g.addColorStop(1, 'rgba(255,200,87,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 18 + glow * 40, 0, 7); ctx.fill();
        ctx.fillStyle = mix(c.surf2, '#ffc857', glow); ctx.strokeStyle = c.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 15, 0, 7); ctx.fill(); ctx.stroke();
        txt(ctx, label, x, y + 34, c.fg, 12, 'center', 600); txt(ctx, `${fmt(I, 2)} A`, x, y + 49, c.mute, 11);
      };
      const dots = (pts, speed) => { // moving charges along polyline
        let total = 0; const segs = []; for (let i = 0; i < pts.length - 1; i++) { const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); segs.push(l); total += l; }
        ctx.fillStyle = c.sig; const gap = 26, off = (time * speed * 60) % gap;
        for (let s = off; s < total; s += gap) { let d = s, i = 0; while (d > segs[i]) { d -= segs[i]; i++; } const a = pts[i], b = pts[i + 1], f = d / segs[i]; ctx.beginPath(); ctx.arc(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, 2.6, 0, 7); ctx.fill(); }
      };
      const line = (pts) => { ctx.strokeStyle = c.mute; ctx.lineWidth = 3; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q))); ctx.stroke(); };
      // battery on the left side
      const by = (y0 + y1) / 2;
      if (p.mode === 'series') {
        const path = [[x0, by - 14], [x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, by + 14]];
        line(path); dots(path, r.I * 1.2);
        [0, 1, 2].forEach((i) => bulb(x0 + (x1 - x0) * (i + 1) / 4, y0, r.Ps[i], `R${i + 1}=${p['R' + (i + 1)]}Ω`, r.Is[i]));
      } else {
        line([[x0, by - 14], [x0, y0], [x1, y0]]); line([[x0, by + 14], [x0, y1], [x1, y1]]);
        dots([[x0, by - 14], [x0, y0], [x0 + (x1 - x0) / 4, y0]], r.I * 0.6);
        [0, 1, 2].forEach((i) => {
          const bx = x0 + (x1 - x0) * (i + 1) / 4 + 20, br = [[bx, y0], [bx, y1]];
          line(br); dots(br, r.Is[i] * 1.6); bulb(bx, (y0 + y1) / 2 - 12, r.Ps[i], `R${i + 1}=${p['R' + (i + 1)]}Ω`, r.Is[i]);
        });
      }
      ctx.fillStyle = c.bg; ctx.fillRect(x0 - 20, by - 14, 40, 28);
      ctx.fillStyle = c.fg; ctx.fillRect(x0 - 18, by - 10, 36, 4); ctx.fillRect(x0 - 10, by + 6, 20, 4);
      txt(ctx, `${p.V} V`, x0 - 34, by + 4, c.acc, 13, 'end', 700);
      txt(ctx, `I = ${fmt(r.I, 3)} A   R_eq = ${fmt(r.Req, 3)} Ω`, W / 2, 26, c.fg, 14, 'center', 600);
    },
    chart(p, r) {
      const pts = []; for (let v = 0; v <= 24; v += 1) pts.push([v, v / r.Req]);
      return { series: [{ pts }], mark: [p.V, r.I], xLabel: 'V (V)', yLabel: 'I (A)', yMin: 0 };
    },
    explain(p, r) {
      const ar = NL.lang === 'ar';
      if (p.mode === 'series') return ar ? `على التوالي: $R_{eq} = R_1 + R_2 + R_3$ = ${fmt(r.Req)} Ω، والتيار واحد في كل العناصر $I = V/R_{eq}$ = ${fmt(r.I)} A. يتوزع الجهد بنسبة المقاومات، فالمقاومة الأكبر تأخذ جهدًا وقدرة أكبر وتضيء أكثر.` : `In series: $R_{eq} = R_1 + R_2 + R_3$ = ${fmt(r.Req)} Ω and the same current flows everywhere, $I = V/R_{eq}$ = ${fmt(r.I)} A. Voltage splits in proportion to resistance, so the largest resistor gets the most voltage and power and glows brightest.`;
      return ar ? `على التوازي: $\\frac{1}{R_{eq}} = \\frac{1}{R_1}+\\frac{1}{R_2}+\\frac{1}{R_3}$ فتكون ${fmt(r.Req)} Ω، أصغر من أصغر مقاومة. كل فرع يأخذ جهد البطارية كاملًا، فالمقاومة الأصغر تسحب تيارًا أكبر وتضيء أكثر. التيار الكلي ${fmt(r.I)} A هو مجموع تيارات الفروع.` : `In parallel: $\\frac{1}{R_{eq}} = \\frac{1}{R_1}+\\frac{1}{R_2}+\\frac{1}{R_3}$ gives ${fmt(r.Req)} Ω, smaller than the smallest resistor. Every branch gets the full battery voltage, so the smallest resistor draws the most current and glows brightest. Total current ${fmt(r.I)} A is the sum of the branch currents.`;
    },
    questions: [['في التوالي، أي مصباح يضيء أكثر؟ وفي التوازي؟ لماذا ينعكس الترتيب؟', 'In series, which bulb is brightest? In parallel? Why does the order flip?'], ['ماذا يحدث للتيار الكلي إذا أضفنا مقاومة على التوازي؟', 'What happens to total current when a parallel resistor is added?'], ['ما ميل خط I–V في الرسم؟', 'What is the slope of the I–V line?']],
  });

  def({
    id: 'wave', subject: 'physics', title: ['الموجات', 'Waves'],
    goal: ['اكتشف العلاقة بين السرعة والتردد والطول الموجي v = fλ.', 'Explore the relation between speed, frequency and wavelength, v = fλ.'],
    how: ['غيّر التردد وسرعة الموجة في الوسط والسعة. تابع الجسيم الملوّن: يتحرك لأعلى وأسفل فقط.', 'Change the frequency, the wave speed in the medium and the amplitude. Follow the coloured particle: it only moves up and down.'],
    assume: ['موجة مستعرضة جيبية في وسط منتظم بلا تخامد.', 'Sinusoidal transverse wave in a uniform medium with no damping.'],
    params: [
      { k: 'A', label: ['السعة A', 'Amplitude A'], min: 0.5, max: 5, step: 0.1, def: 2.5, unit: 'cm' },
      { k: 'f', label: ['التردد f', 'Frequency f'], min: 0.2, max: 3, step: 0.05, def: 1, unit: 'Hz' },
      { k: 'v', label: ['سرعة الموجة في الوسط v', 'Wave speed in medium v'], min: 0.5, max: 6, step: 0.1, def: 2, unit: 'm/s' },
    ],
    compute(p) { return { lam: p.v / p.f, T: 1 / p.f, w: 2 * Math.PI * p.f }; },
    outputs: [['lam', ['الطول الموجي λ', 'Wavelength λ'], 'm'], ['T', ['الزمن الدوري T', 'Period T'], 's']],
    duration: () => 0,
    draw(ctx, W, H, p, r, k, c, time) {
      const span = 6, pad = 30, X = (x) => pad + x / span * (W - 2 * pad), mid = H / 2 + 10, sA = 14;
      const y = (x) => p.A * Math.sin(2 * Math.PI * (x / r.lam - p.f * time));
      ctx.strokeStyle = c.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(pad, mid); ctx.lineTo(W - pad, mid); ctx.stroke();
      ctx.strokeStyle = c.sig; ctx.lineWidth = 3; ctx.beginPath();
      for (let i = 0; i <= 300; i++) { const x = span * i / 300; i ? ctx.lineTo(X(x), mid - y(x) * sA) : ctx.moveTo(X(x), mid - y(x) * sA); } ctx.stroke();
      for (let x = 0; x <= span; x += 0.25) { ctx.fillStyle = c.mute; ctx.beginPath(); ctx.arc(X(x), mid - y(x) * sA, 2, 0, 7); ctx.fill(); }
      const px = 1.5; ctx.fillStyle = c.acc; ctx.beginPath(); ctx.arc(X(px), mid - y(px) * sA, 7, 0, 7); ctx.fill();
      ctx.strokeStyle = c.acc; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(X(px), mid - p.A * sA); ctx.lineTo(X(px), mid + p.A * sA); ctx.stroke(); ctx.setLineDash([]);
      if (r.lam < span) { const by = mid + p.A * sA + 26; ctx.strokeStyle = c.fg; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X(0.5), by); ctx.lineTo(X(0.5 + r.lam), by); ctx.stroke(); txt(ctx, `λ = ${fmt(r.lam, 2)} m`, X(0.5 + r.lam / 2), by + 16, c.fg, 12); }
      txt(ctx, `v = f·λ = ${fmt(p.f, 2)} × ${fmt(r.lam, 2)} = ${fmt(p.v, 2)} m/s`, W / 2, 24, c.fg, 14, 'center', 600);
    },
    chart(p, r) {
      const pts = []; for (let f = 0.2; f <= 3.001; f += 0.05) pts.push([f, p.v / f]);
      return { series: [{ pts }], mark: [p.f, r.lam], xLabel: 'f (Hz)', yLabel: 'λ (m)', yMin: 0 };
    },
    explain(p, r) {
      return NL.lang === 'ar' ? `سرعة الموجة يحددها الوسط. عند ثبات السرعة ${fmt(p.v)} m/s، زيادة التردد تقصّر الطول الموجي: $\\lambda = v/f$ = ${fmt(r.lam)} m. الرسم يبين أن λ تتناسب عكسيًا مع f. السعة لا تغيّر السرعة ولا الطول الموجي، بل الطاقة التي تنقلها الموجة.` : `The medium sets the wave speed. At a fixed ${fmt(p.v)} m/s, raising the frequency shortens the wavelength: $\\lambda = v/f$ = ${fmt(r.lam)} m. The graph shows λ is inversely proportional to f. Amplitude changes neither speed nor wavelength, only the energy carried.`;
    },
    questions: [['ضاعف التردد. ماذا يحدث للطول الموجي؟', 'Double the frequency. What happens to the wavelength?'], ['هل يتحرك الجسيم الملوّن مع الموجة إلى اليمين؟', 'Does the coloured particle travel right with the wave?'], ['ما الذي يغيّر سرعة الموجة فعلًا؟', 'What actually changes a wave’s speed?']],
  });

  def({
    id: 'energy', subject: 'physics', title: ['حفظ الطاقة الميكانيكية', 'Conservation of mechanical energy'],
    goal: ['تتبّع تحوّل طاقة الوضع إلى طاقة حركة، وأثر الاحتكاك.', 'Track potential energy turning into kinetic energy, and what friction does.'],
    how: ['اختر الكتلة وارتفاع البداية ونسبة الفقد بالاحتكاك، ثم أطلق الكرة.', 'Choose the mass, starting height and friction loss, then release the ball.'],
    assume: ['مسار على شكل قطع مكافئ، الفقد بالاحتكاك يتناسب مع المسافة المقطوعة، g = 9.8 m/s².', 'Parabolic track, friction loss proportional to distance travelled, g = 9.8 m/s².'],
    params: [
      { k: 'm', label: ['الكتلة m', 'Mass m'], min: 1, max: 80, step: 1, def: 20, unit: 'kg' },
      { k: 'h', label: ['ارتفاع البداية h', 'Start height h'], min: 1, max: 40, step: 0.5, def: 15, unit: 'm' },
      { k: 'loss', label: ['الفقد بالاحتكاك لكل عبور', 'Friction loss per pass'], min: 0, max: 60, step: 1, def: 15, unit: '%' },
    ],
    compute(p) {
      const Wd = 40, y = (x) => p.h * Math.pow(1 - 2 * x / Wd, 2), E0 = p.m * G * p.h, N = 400;
      const xs = [], len = [0]; for (let i = 0; i <= N; i++) xs.push(Wd * i / N);
      for (let i = 1; i <= N; i++) len.push(len[i - 1] + Math.hypot(xs[i] - xs[i - 1], y(xs[i]) - y(xs[i - 1])));
      const Ltot = len[N], heat = (i) => p.loss / 100 * E0 * len[i] / Ltot;
      const st = xs.map((x, i) => { const PE = p.m * G * y(x), H = heat(i), KE = E0 - PE - H; return { x, PE, KE, H }; });
      let stop = st.findIndex((s, i) => i > 5 && s.KE < 0); if (stop < 0) stop = N; else stop -= 1;
      // integrate time along arc length so the ball really speeds up and slows down
      const times = [0]; for (let i = 1; i <= stop; i++) { const v = Math.sqrt(Math.max(2 * st[i].KE / p.m, 0.04)); times.push(times[i - 1] + (len[i] - len[i - 1]) / v); }
      const bottom = st[N / 2];
      return { y, st, stop, times, E0, vMax: Math.sqrt(Math.max(0, 2 * bottom.KE / p.m)), hEnd: y(xs[stop]), Wd, tTot: times[stop] };
    },
    outputs: [['E0', ['الطاقة الكلية الابتدائية', 'Initial total energy'], 'J'], ['vMax', ['أقصى سرعة (في القاع)', 'Top speed (at the bottom)'], 'm/s'], ['hEnd', ['أقصى ارتفاع في الجهة الأخرى', 'Height reached on the far side'], 'm']],
    duration: (p, r) => clamp(r.tTot * 0.6, 2, 7),
    draw(ctx, W, H, p, r, k, c) {
      const pad = 40, sx = (W - 2 * pad - 120) / r.Wd, sy = (H - 90) / 40, X = (x) => pad + x * sx, Y = (v) => H - 30 - v * sy;
      ctx.strokeStyle = c.fg; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i <= 100; i++) { const x = r.Wd * i / 100; i ? ctx.lineTo(X(x), Y(r.y(x))) : ctx.moveTo(X(x), Y(r.y(x))); } ctx.stroke();
      const tt = k * r.tTot; let i = r.times.findIndex((v) => v >= tt); if (i < 0) i = r.stop;
      const s = r.st[i]; ctx.fillStyle = c.acc; ctx.beginPath(); ctx.arc(X(s.x), Y(r.y(s.x)) - 10, 10, 0, 7); ctx.fill();
      const bx = W - 130, bw = 26, bh = H - 80, sc = bh / r.E0;
      [['PE', s.PE, c.vio], ['KE', Math.max(0, s.KE), c.sig], [NL.lang === 'ar' ? 'حرارة' : 'heat', s.H, c.bad]].forEach(([n, v, col], j) => {
        const x = bx + j * 38; ctx.fillStyle = c.surf2; ctx.fillRect(x, 40, bw, bh); ctx.fillStyle = col; ctx.fillRect(x, 40 + bh - v * sc, bw, v * sc);
        txt(ctx, n, x + bw / 2, 34, c.fg, 11, 'center', 600);
      });
      txt(ctx, `PE ${fmt(s.PE, 3)} J · KE ${fmt(Math.max(0, s.KE), 3)} J · ${NL.lang === 'ar' ? 'حرارة' : 'heat'} ${fmt(s.H, 3)} J`, (W - 130) / 2, 24, c.fg, 13, 'center', 600);
    },
    chart(p, r, k) {
      const S = r.st.filter((_, i) => i % 8 === 0 && i <= r.stop);
      return { series: [{ pts: S.map((s) => [s.x, s.PE]), name: 'PE', cls: 3 }, { pts: S.map((s) => [s.x, Math.max(0, s.KE)]), name: 'KE', cls: 0 }, { pts: S.map((s) => [s.x, s.H]), name: NL.lang === 'ar' ? 'حرارة' : 'heat', cls: 4 }, { pts: S.map((s) => [s.x, s.PE + Math.max(0, s.KE) + s.H]), name: NL.lang === 'ar' ? 'المجموع' : 'total', cls: 2, dash: true }], xLabel: 'x (m)', yLabel: 'E (J)', yMin: 0 };
    },
    explain(p, r) {
      const ar = NL.lang === 'ar';
      return (ar ? `في البداية كل الطاقة طاقة وضع: $PE = mgh$ = ${fmt(r.E0)} J. أثناء النزول تتحول إلى طاقة حركة $KE = \\tfrac12 m v^2$، وأقصى سرعة في القاع ${fmt(r.vMax)} m/s. ` : `At the start all energy is potential: $PE = mgh$ = ${fmt(r.E0)} J. On the way down it becomes kinetic energy $KE = \\tfrac12 m v^2$, peaking at the bottom at ${fmt(r.vMax)} m/s. `)
        + (p.loss ? (ar ? `الاحتكاك حوّل جزءًا إلى حرارة، فوصلت الكرة إلى ${fmt(r.hEnd)} m فقط. المجموع (الخط المتقطع) ثابت دائمًا: الطاقة لم تُفنَ.` : `Friction turned part of it into heat, so the ball only reached ${fmt(r.hEnd)} m. The total (dashed line) stays constant: no energy was destroyed.`) : (ar ? 'بلا احتكاك تعود الكرة لنفس الارتفاع، ومجموع الطاقتين ثابت.' : 'Without friction the ball returns to the same height and the sum stays constant.'))
        + (ar ? ' لاحظ أن السرعة في القاع لا تعتمد على الكتلة.' : ' Note that the speed at the bottom does not depend on mass.');
    },
    questions: [['غيّر الكتلة فقط. هل تتغير السرعة القصوى؟ لماذا؟', 'Change only the mass. Does the top speed change? Why?'], ['ضاعف الارتفاع. بأي معامل تزيد السرعة القصوى؟', 'Double the height. By what factor does the top speed grow?'], ['أين ذهبت الطاقة «المفقودة»؟', 'Where did the “lost” energy go?']],
  });

  def({
    id: 'pulley', subject: 'physics', title: ['البكرات ونظام البكرات', 'Pulleys and block and tackle'],
    goal: ['قارن البكرة الثابتة بنظام بكرات فيه بكرة متحركة، واحسب الفائدة الميكانيكية والكفاءة.', 'Compare a fixed pulley with a block and tackle, and compute mechanical advantage and efficiency.'],
    how: ['اختر عدد الحبال التي تحمل البكرة المتحركة، وغيّر الكتلة والكفاءة، ثم شغّل الرفع.', 'Choose how many rope segments hold the moving block, change the mass and efficiency, then lift.'],
    assume: ['حبل لا يتمدد، بكرات مهملة الكتلة، الاحتكاك ممثَّل بالكفاءة فقط، g = 9.8 m/s².', 'Inextensible rope, massless pulleys, friction represented only by the efficiency, g = 9.8 m/s².'],
    params: [
      { k: 'm', label: ['كتلة الحمل', 'Load mass'], min: 1, max: 100, step: 0.5, def: 24, unit: 'kg' },
      { k: 'N', label: ['عدد الحبال الحاملة', 'Supporting rope segments'], type: 'select', def: '2', options: [['1', ['1 (بكرة ثابتة)', '1 (fixed pulley)']], ['2', ['2', '2']], ['3', ['3', '3']], ['4', ['4', '4']], ['6', ['6', '6']]] },
      { k: 'eff', label: ['الكفاءة e', 'Efficiency e'], min: 40, max: 100, step: 1, def: 91, unit: '%' },
      { k: 'dr', label: ['ارتفاع الرفع dᵣ', 'Lift height dᵣ'], min: 0.5, max: 20, step: 0.5, def: 16.5, unit: 'm' },
    ],
    compute(p) {
      const N = +p.N, Fr = p.m * G, IMA = N, MA = IMA * p.eff / 100, Fe = Fr / MA, de = IMA * p.dr;
      return { Fr, IMA, MA, Fe, de, Wo: Fr * p.dr, Wi: Fe * de };
    },
    outputs: [['Fe', ['القوة المسلطة Fₑ', 'Effort Fₑ'], 'N'], ['Fr', ['المقاومة Fᵣ (وزن الحمل)', 'Resistance Fᵣ (load weight)'], 'N'], ['MA', ['الفائدة الميكانيكية MA', 'Mechanical advantage MA'], ''], ['IMA', ['الفائدة الميكانيكية المثالية IMA', 'Ideal MA'], ''], ['de', ['إزاحة القوة dₑ (سحب الحبل)', 'Effort distance dₑ (rope pulled)'], 'm'], ['Wo', ['الشغل الناتج Wₒ', 'Output work Wₒ'], 'J'], ['Wi', ['الشغل المبذول Wᵢ', 'Input work Wᵢ'], 'J']],
    duration: () => 3,
    draw(ctx, W, H, p, r, k, c) {
      const N = +p.N, top = 30, cx = W * 0.45, R = 26, lift = k * 70, fixedY = top + 40, movY = H - 150 - lift;
      ctx.fillStyle = c.mute; ctx.fillRect(cx - 120, top, 240, 8);
      const nTop = N === 1 ? 1 : Math.ceil(N / 2), nBot = N === 1 ? 0 : Math.floor(N / 2);
      const wheel = (x, y, rad) => { ctx.strokeStyle = c.fg; ctx.lineWidth = 2; ctx.fillStyle = c.surf2; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = c.fg; ctx.beginPath(); ctx.arc(x, y, 3, 0, 7); ctx.fill(); };
      ctx.strokeStyle = c.acc; ctx.lineWidth = 2.5;
      if (N === 1) {
        ctx.beginPath(); ctx.moveTo(cx, top + 8); ctx.lineTo(cx, fixedY); ctx.stroke();
        const loadY = H - 110 - lift;
        ctx.beginPath(); ctx.moveTo(cx - R, fixedY); ctx.lineTo(cx - R, loadY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + R, fixedY); ctx.lineTo(cx + R, H - 120 + lift); ctx.stroke();
        wheel(cx, fixedY, R);
        ctx.fillStyle = c.acc; rrect(ctx, cx - R - 26, loadY, 52, 40, 5); ctx.fill(); txt(ctx, `${p.m} kg`, cx - R, loadY + 25, c.bg, 11, 'center', 700);
        arrow(ctx, cx + R, H - 120 + lift, cx + R, H - 60 + lift, c.sig, 3, `Fₑ=${fmt(r.Fe, 3)} N`);
      } else {
        const span = 22;
        for (let i = 0; i < N; i++) { const x = cx - (N - 1) * span / 2 + i * span; ctx.beginPath(); ctx.moveTo(x, fixedY); ctx.lineTo(x, movY); ctx.stroke(); }
        const xEnd = cx + (N - 1) * span / 2 + 34;
        ctx.beginPath(); ctx.moveTo(cx + (N - 1) * span / 2, fixedY); ctx.lineTo(xEnd, fixedY); ctx.lineTo(xEnd, H - 70 + lift * N * 0.4); ctx.stroke();
        ctx.fillStyle = c.surf2; ctx.strokeStyle = c.fg; ctx.lineWidth = 2;
        rrect(ctx, cx - (N - 1) * span / 2 - 14, fixedY - 16, (N - 1) * span + 28, 32, 14); ctx.fill(); ctx.stroke();
        rrect(ctx, cx - (N - 1) * span / 2 - 14, movY - 16, (N - 1) * span + 28, 32, 14); ctx.fill(); ctx.stroke();
        txt(ctx, `${nTop}+${nBot}`, cx, fixedY + 5, c.mute, 11);
        ctx.strokeStyle = c.fg; ctx.beginPath(); ctx.moveTo(cx, movY + 16); ctx.lineTo(cx, movY + 34); ctx.stroke();
        ctx.fillStyle = c.acc; rrect(ctx, cx - 30, movY + 34, 60, 44, 5); ctx.fill(); txt(ctx, `${p.m} kg`, cx, movY + 61, c.bg, 12, 'center', 700);
        arrow(ctx, xEnd, H - 70 + lift * N * 0.4, xEnd, H - 20 + lift * N * 0.4, c.sig, 3, `Fₑ=${fmt(r.Fe, 3)} N`);
        txt(ctx, `${N} ${NL.lang === 'ar' ? 'حبال تحمل الحمل' : 'segments hold the load'}`, cx - (N - 1) * span / 2 - 70, (fixedY + movY) / 2, c.fg, 12);
      }
      txt(ctx, `MA = ${fmt(r.MA, 3)}   IMA = ${r.IMA}   e = ${p.eff}%`, W / 2, H - 8, c.fg, 13, 'center', 600);
    },
    chart(p) { const pts = []; for (const N of [1, 2, 3, 4, 5, 6]) pts.push([N, p.m * G / (N * p.eff / 100)]); return { series: [{ pts }], mark: [+p.N, p.m * G / (+p.N * p.eff / 100)], xLabel: NL.lang === 'ar' ? 'عدد الحبال الحاملة' : 'supporting segments', yLabel: 'Fₑ (N)', yMin: 0 }; },
    explain(p, r) {
      const ar = NL.lang === 'ar';
      if (+p.N === 1) return ar ? `البكرة الثابتة فائدتها المثالية 1: القوة تساوي المقاومة تقريبًا (${fmt(r.Fe)} N مقابل ${fmt(r.Fr)} N بسبب الكفاءة). فائدتها أنها **تغيّر اتجاه القوة** فتسحب للأسفل لترفع للأعلى، ولا تقلل القوة.` : `A fixed pulley has IMA 1: the effort roughly equals the load (${fmt(r.Fe)} N vs ${fmt(r.Fr)} N because of efficiency). It is useful because it **changes the direction** of the force, not its size.`;
      return ar ? `${p.N} حبال تحمل البكرة المتحركة، لذلك $IMA = d_e/d_r$ = ${p.N}: لرفع الحمل ${fmt(p.dr)} m تسحب الحبل ${fmt(r.de)} m. الفائدة الفعلية $MA = (e/100)\\times IMA$ = ${fmt(r.MA)}، فالقوة $F_e = F_r/MA$ = ${fmt(r.Fe)} N. لاحظ أن الشغل المبذول ${fmt(r.Wi)} J أكبر من الناتج ${fmt(r.Wo)} J: الآلة تقلل القوة ولا توفّر شغلًا.` : `${p.N} segments hold the moving block, so $IMA = d_e/d_r$ = ${p.N}: to raise the load ${fmt(p.dr)} m you pull ${fmt(r.de)} m of rope. The real $MA = (e/100)\\times IMA$ = ${fmt(r.MA)}, so $F_e = F_r/MA$ = ${fmt(r.Fe)} N. Input work ${fmt(r.Wi)} J exceeds output ${fmt(r.Wo)} J: the machine trades force for distance and saves no work.`;
    },
    questions: [['اضبط 24 kg وحبلين و16.5 m. قارن النتائج بالمسألة 26 في الكتاب.', 'Set 24 kg, 2 segments and 16.5 m. Compare with problem 26 in the book.'], ['لماذا تُستخدم البكرة الثابتة رغم أن فائدتها 1؟', 'Why use a fixed pulley if its IMA is 1?'], ['ماذا يحدث للمسافة التي تسحبها كلما زاد عدد الحبال؟', 'What happens to the rope you pull as segments increase?']],
  });

  def({
    id: 'wheelaxle', subject: 'physics', title: ['العجلة والمحور', 'Wheel and axle'],
    goal: ['اكتشف لماذا تكون الفائدة المثالية للعجلة والمحور نسبة نصف القطرين rₑ/rᵣ.', 'See why the ideal MA of a wheel and axle is the radius ratio rₑ/rᵣ.'],
    how: ['غيّر نصف قطر العجلة (حيث تؤثر القوة) ونصف قطر المحور (حيث يُلف حبل الحمل).', 'Change the wheel radius (where you push) and the axle radius (where the load rope winds).'],
    assume: ['القوة مماسية لحافة العجلة، الحبل يُلف على المحور دون انزلاق، الاحتكاك ممثَّل بالكفاءة.', 'Force tangent to the wheel rim, rope winds on the axle without slipping, friction represented by efficiency.'],
    params: [
      { k: 're', label: ['نصف قطر العجلة rₑ', 'Wheel radius rₑ'], min: 5, max: 60, step: 0.5, def: 45, unit: 'cm' },
      { k: 'rr', label: ['نصف قطر المحور rᵣ', 'Axle radius rᵣ'], min: 1, max: 20, step: 0.5, def: 7.5, unit: 'cm' },
      { k: 'Fr', label: ['المقاومة (قوة الحبل) Fᵣ', 'Resistance (rope force) Fᵣ'], min: 50, max: 2000, step: 10, def: 750, unit: 'N' },
      { k: 'eff', label: ['الكفاءة e', 'Efficiency e'], min: 40, max: 100, step: 1, def: 75, unit: '%' },
    ],
    compute(p) { const IMA = p.re / p.rr, MA = IMA * p.eff / 100; return { IMA, MA, Fe: p.Fr / MA, dePerTurn: 2 * Math.PI * p.re, drPerTurn: 2 * Math.PI * p.rr }; },
    outputs: [['Fe', ['القوة اللازمة على العجلة Fₑ', 'Effort on the wheel Fₑ'], 'N'], ['IMA', ['IMA = rₑ/rᵣ', 'IMA = rₑ/rᵣ'], ''], ['MA', ['MA', 'MA'], ''], ['dePerTurn', ['مسافة يدك في الدورة الواحدة', 'Hand travel per turn'], 'cm'], ['drPerTurn', ['ارتفاع الحمل في الدورة الواحدة', 'Load rise per turn'], 'cm']],
    duration: () => 4,
    draw(ctx, W, H, p, r, k, c) {
      const cx = W * 0.42, cy = H * 0.38, s = Math.min(2.4, (H * 0.34) / p.re), Re = p.re * s, Rr = Math.max(4, p.rr * s), ang = k * Math.PI * 4;
      ctx.strokeStyle = c.fg; ctx.lineWidth = 3; ctx.fillStyle = c.surf2; ctx.beginPath(); ctx.arc(cx, cy, Re, 0, 7); ctx.fill(); ctx.stroke();
      for (let i = 0; i < 6; i++) { const a = ang + i * Math.PI / 3; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * Rr, cy + Math.sin(a) * Rr); ctx.lineTo(cx + Math.cos(a) * Re, cy + Math.sin(a) * Re); ctx.stroke(); }
      ctx.fillStyle = c.acc; ctx.beginPath(); ctx.arc(cx, cy, Rr, 0, 7); ctx.fill();
      const drop = H - 70 - k * 4 * 2 * Math.PI * Rr * 0.12;
      ctx.strokeStyle = c.acc; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - Rr, cy); ctx.lineTo(cx - Rr, Math.max(cy + Re + 10, drop)); ctx.stroke();
      ctx.fillStyle = c.acc; rrect(ctx, cx - Rr - 24, Math.max(cy + Re + 10, drop), 48, 36, 5); ctx.fill();
      txt(ctx, `Fᵣ=${p.Fr} N`, cx - Rr, Math.max(cy + Re + 10, drop) + 23, c.bg, 11, 'center', 700);
      arrow(ctx, cx + Re, cy, cx + Re, cy + Math.min(140, 30 + r.Fe / 6), c.sig, 3, `Fₑ=${fmt(r.Fe, 3)} N`);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = c.mute; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Re, cy); ctx.moveTo(cx, cy); ctx.lineTo(cx - Rr, cy); ctx.stroke(); ctx.setLineDash([]);
      txt(ctx, `rₑ=${p.re} cm`, cx + Re / 2, cy - 8, c.fg, 12); txt(ctx, `rᵣ=${p.rr}`, cx - Rr - 18, cy - 8, c.fg, 11);
      txt(ctx, `IMA = ${fmt(p.re, 3)} / ${fmt(p.rr, 3)} = ${fmt(r.IMA, 3)}`, W / 2, 22, c.fg, 14, 'center', 600);
    },
    chart(p) { const pts = []; for (let re = 5; re <= 60; re += 1) pts.push([re, p.Fr / (re / p.rr * p.eff / 100)]); return { series: [{ pts }], mark: [p.re, p.Fr / (p.re / p.rr * p.eff / 100)], xLabel: 'rₑ (cm)', yLabel: 'Fₑ (N)', yMin: 0 }; },
    explain(p, r) {
      const ar = NL.lang === 'ar';
      return ar ? `في دورة واحدة تقطع يدك محيط العجلة $2\\pi r_e$ = ${fmt(r.dePerTurn)} cm، ويرتفع الحمل محيط المحور $2\\pi r_r$ = ${fmt(r.drPerTurn)} cm، فتكون $IMA = d_e/d_r = r_e/r_r$ = ${fmt(r.IMA)}. مع كفاءة ${p.eff}% تصبح MA = ${fmt(r.MA)} والقوة اللازمة ${fmt(r.Fe)} N. هذا ما يحدث في عجلة القيادة والونش ومفك البراغي.` : `In one turn your hand travels the wheel's circumference $2\\pi r_e$ = ${fmt(r.dePerTurn)} cm while the load rises the axle's $2\\pi r_r$ = ${fmt(r.drPerTurn)} cm, so $IMA = d_e/d_r = r_e/r_r$ = ${fmt(r.IMA)}. At ${p.eff}% efficiency MA = ${fmt(r.MA)} and the effort is ${fmt(r.Fe)} N. Steering wheels, winches and screwdrivers work this way.`;
    },
    questions: [['اضبط 45 cm و7.5 cm و75% و750 N، وقارن بالمسألة 28 في الكتاب.', 'Set 45 cm, 7.5 cm, 75% and 750 N, and compare with problem 28 in the book.'], ['لماذا تُصمَّم عجلات قيادة الشاحنات القديمة كبيرة؟', 'Why were old truck steering wheels so large?'], ['ماذا لو أثّرت القوة على المحور بدل العجلة؟', 'What if the effort acted on the axle instead of the wheel?']],
  });

  def({
    id: 'bike', subject: 'physics', title: ['الدراجة الهوائية: آلة مركبة', 'The bicycle: a compound machine'],
    goal: ['احسب الفائدة الميكانيكية لآلة مركبة من حاصل ضرب فوائد الآلات البسيطة المكونة لها.', 'Compute the mechanical advantage of a compound machine as the product of its simple machines.'],
    how: ['غيّر عدد أسنان ناقل الحركة الأمامي والخلفي وطول ذراع الدواسة، وراقب القوة على الطريق والمسافة لكل دورة دواسة.', 'Change the front and rear sprocket teeth and the crank length; watch the road force and the distance per pedal turn.'],
    assume: ['القوة على الدواسة عمودية على ذراعها (أكبر عزم)، السلسلة لا تنزلق، الاحتكاك ممثَّل بالكفاءة.', 'Pedal force perpendicular to the crank (largest torque), chain does not slip, friction represented by efficiency.'],
    params: [
      { k: 'Fe', label: ['قوة القدم على الدواسة', 'Foot force on the pedal'], min: 50, max: 800, step: 10, def: 300, unit: 'N' },
      { k: 'L', label: ['طول ذراع الدواسة', 'Crank length'], min: 12, max: 20, step: 0.5, def: 17, unit: 'cm' },
      { k: 'nf', label: ['أسنان ناقل الحركة الأمامي', 'Front sprocket teeth'], min: 22, max: 52, step: 1, def: 42, unit: '' },
      { k: 'nr', label: ['أسنان ناقل الحركة الخلفي', 'Rear sprocket teeth'], min: 11, max: 34, step: 1, def: 21, unit: '' },
      { k: 'R', label: ['نصف قطر الإطار', 'Tire radius'], min: 25, max: 40, step: 0.1, def: 35.6, unit: 'cm' },
      { k: 'eff', label: ['الكفاءة e', 'Efficiency e'], min: 70, max: 100, step: 1, def: 95, unit: '%' },
    ],
    compute(p) {
      const IMA = (p.nr / p.nf) * (p.L / p.R), MA = IMA * p.eff / 100, Froad = MA * p.Fe;
      return { IMA, MA, Froad, perTurn: 2 * Math.PI * p.R * p.nf / p.nr / 100, ratio: p.nf / p.nr };
    },
    outputs: [['Froad', ['قوة الإطار على الطريق', 'Tire force on the road'], 'N'], ['IMA', ['IMA للدراجة', 'Bicycle IMA'], ''], ['MA', ['MA للدراجة', 'Bicycle MA'], ''], ['perTurn', ['المسافة لكل دورة دواسة', 'Distance per pedal turn'], 'm'], ['ratio', ['دورات الإطار لكل دورة دواسة', 'Wheel turns per pedal turn'], '']],
    duration: () => 0,
    draw(ctx, W, H, p, r, k, c, time) {
      const gy = H - 40, R = Math.min(90, H * 0.26), rx = W * 0.28, fx = W * 0.62, wy = gy - R;
      const fr = 14 + p.nf * 0.75, rr = 6 + p.nr * 0.75, crank = p.L * 3.2, pedalAng = time * 1.6, wheelAng = pedalAng * p.nf / p.nr;
      ctx.fillStyle = c.surf2; ctx.fillRect(0, gy, W, 3);
      const wheel = (x) => { ctx.strokeStyle = c.fg; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, wy, R, 0, 7); ctx.stroke(); ctx.lineWidth = 1; for (let i = 0; i < 12; i++) { const a = wheelAng + i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(x, wy); ctx.lineTo(x + Math.cos(a) * R, wy + Math.sin(a) * R); ctx.stroke(); } };
      wheel(rx); wheel(W * 0.86);
      const cyy = wy + 6;
      ctx.strokeStyle = c.mute; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(rx, wy); ctx.lineTo(fx, cyy); ctx.lineTo(W * 0.86, wy); ctx.stroke();
      ctx.strokeStyle = c.acc; ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.lineDashOffset = -time * 40;
      ctx.beginPath(); ctx.moveTo(rx, wy - rr); ctx.lineTo(fx, cyy - fr); ctx.moveTo(rx, wy + rr); ctx.lineTo(fx, cyy + fr); ctx.stroke(); ctx.setLineDash([]);
      const gear = (x, y, rad, n, a) => { ctx.fillStyle = c.surf2; ctx.strokeStyle = c.acc; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < n; i++) { const t0 = a + i * 2 * Math.PI / n; ctx.lineTo(x + Math.cos(t0) * rad, y + Math.sin(t0) * rad); ctx.lineTo(x + Math.cos(t0 + Math.PI / n) * (rad + 4), y + Math.sin(t0 + Math.PI / n) * (rad + 4)); } ctx.closePath(); ctx.fill(); ctx.stroke(); };
      gear(rx, wy, rr, p.nr, wheelAng); gear(fx, cyy, fr, p.nf, pedalAng);
      const px = fx + Math.cos(pedalAng) * crank, py = cyy + Math.sin(pedalAng) * crank;
      ctx.strokeStyle = c.fg; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(fx, cyy); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = c.sig; rrect(ctx, px - 12, py - 4, 24, 8, 3); ctx.fill();
      arrow(ctx, px, py, px - Math.sin(pedalAng) * 50, py + Math.cos(pedalAng) * 50, c.sig, 3, 'Fₑ');
      arrow(ctx, rx, gy, rx - Math.min(120, 20 + r.Froad), gy, c.bad, 3, `${fmt(r.Froad, 3)} N`);
      txt(ctx, `${p.nf}/${p.nr} → ${fmt(r.ratio, 3)} ${NL.lang === 'ar' ? 'دورة للإطار' : 'wheel turns'}`, W / 2, 22, c.fg, 14, 'center', 600);
    },
    chart(p) { const pts = []; for (let n = 11; n <= 34; n++) pts.push([n, (n / p.nf) * (p.L / p.R) * p.eff / 100 * p.Fe]); return { series: [{ pts }], mark: [p.nr, (p.nr / p.nf) * (p.L / p.R) * p.eff / 100 * p.Fe], xLabel: NL.lang === 'ar' ? 'أسنان الناقل الخلفي' : 'rear teeth', yLabel: NL.lang === 'ar' ? 'القوة على الطريق (N)' : 'road force (N)', yMin: 0 }; },
    explain(p, r) {
      const ar = NL.lang === 'ar';
      return ar ? `الدراجة آلتان من نوع العجلة والمحور: الدواسة مع الناقل الأمامي، والناقل الخلفي مع الإطار. لذلك $IMA = \\left(\\frac{\\text{أسنان الخلفي}}{\\text{أسنان الأمامي}}\\right)\\left(\\frac{\\text{ذراع الدواسة}}{\\text{نصف قطر الإطار}}\\right)$ = (${p.nr}/${p.nf})(${p.L}/${p.R}) = ${fmt(r.IMA)}. الفائدة أقل من 1، فالإطار يدفع الطريق بقوة ${fmt(r.Froad)} N فقط، لكنه يقطع ${fmt(r.perTurn)} m لكل دورة دواسة. ناقل خلفي أكبر يزيد القوة (للانطلاق والصعود)، وأصغر يزيد المسافة (للسرعة).` : `A bicycle is two wheel-and-axle machines: pedal with the front sprocket, and rear sprocket with the tire. So $IMA = (\\text{rear teeth}/\\text{front teeth})(\\text{crank}/\\text{tire radius})$ = (${p.nr}/${p.nf})(${p.L}/${p.R}) = ${fmt(r.IMA)}. It is below 1, so the tire pushes the road with only ${fmt(r.Froad)} N but covers ${fmt(r.perTurn)} m per pedal turn. A bigger rear sprocket gives more force (starting, climbing); a smaller one gives more distance (speed).`;
    },
    questions: [['أنت تصعد تلًا. هل تختار ناقلًا خلفيًا أكبر أم أصغر؟ جرّب.', 'Climbing a hill: bigger or smaller rear sprocket? Try it.'], ['لماذا تكون IMA للدراجة أقل من 1؟ ما الذي نكسبه؟', 'Why is a bicycle’s IMA below 1? What do we gain?'], ['ضاعف أسنان الناقل الأمامي. ماذا يحدث للقوة والمسافة؟', 'Double the front teeth. What happens to force and distance?']],
  });

  /* ---------- chemistry ---------- */
  def({
    id: 'gas', subject: 'chemistry', title: ['قوانين الغازات', 'Gas laws'],
    goal: ['اربط الضغط بالحجم ودرجة الحرارة وعدد المولات PV = nRT.', 'Link pressure to volume, temperature and amount: PV = nRT.'],
    how: ['حرّك المكبس بتغيير الحجم، وسخّن الغاز بتغيير درجة الحرارة. سرعة الجسيمات تتناسب مع √T.', 'Move the piston by changing volume and heat the gas by changing temperature. Particle speed follows √T.'],
    assume: ['غاز مثالي: جسيمات بلا حجم ولا تجاذب، تصادمات مرنة. R = 8.314 J/(mol·K).', 'Ideal gas: point particles, no attraction, elastic collisions. R = 8.314 J/(mol·K).'],
    params: [
      { k: 'n', label: ['عدد المولات n', 'Amount n'], min: 0.5, max: 5, step: 0.1, def: 1, unit: 'mol' },
      { k: 'T', label: ['درجة الحرارة T', 'Temperature T'], min: 100, max: 800, step: 5, def: 300, unit: 'K' },
      { k: 'V', label: ['الحجم V', 'Volume V'], min: 5, max: 50, step: 0.5, def: 24.5, unit: 'L' },
    ],
    compute(p) { const P = p.n * 8.314 * p.T / (p.V / 1000) / 1000; return { P, atm: P / 101.325, vrms: Math.sqrt(3 * 8.314 * p.T / 0.029) }; },
    outputs: [['P', ['الضغط P', 'Pressure P'], 'kPa'], ['atm', ['الضغط بالـ atm', 'Pressure in atm'], 'atm'], ['vrms', ['متوسط سرعة الجسيمات (هواء)', 'RMS particle speed (air)'], 'm/s']],
    duration: () => 0,
    init() { return { parts: Array.from({ length: 60 }, () => ({ x: Math.random(), y: Math.random(), a: Math.random() * 6.28 })) }; },
    draw(ctx, W, H, p, r, k, c, time, st) {
      const boxH = H - 70, maxW = W - 160, bw = maxW * p.V / 50, x0 = 40, y0 = 40;
      ctx.strokeStyle = c.fg; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0 + bw, y0); ctx.lineTo(x0, y0); ctx.lineTo(x0, y0 + boxH); ctx.lineTo(x0 + bw, y0 + boxH); ctx.stroke();
      ctx.fillStyle = c.mute; ctx.fillRect(x0 + bw, y0 - 4, 10, boxH + 8); ctx.fillRect(x0 + bw + 10, y0 + boxH / 2 - 4, maxW - bw + 30, 8);
      const count = Math.round(p.n * 12), sp = Math.sqrt(p.T / 300) * 0.006, dt = Math.min(0.05, time - (st.last || time)); st.last = time;
      const heat = clamp((p.T - 100) / 700, 0, 1);
      for (let i = 0; i < Math.min(count, st.parts.length); i++) {
        const q = st.parts[i]; q.x += Math.cos(q.a) * sp * dt * 60 / (p.V / 25); q.y += Math.sin(q.a) * sp * dt * 60;
        if (q.x < 0 || q.x > 1) { q.a = Math.PI - q.a; q.x = clamp(q.x, 0, 1); } if (q.y < 0 || q.y > 1) { q.a = -q.a; q.y = clamp(q.y, 0, 1); }
        ctx.fillStyle = mix(c.sig, c.bad, heat); ctx.beginPath(); ctx.arc(x0 + 6 + q.x * (bw - 12), y0 + 6 + q.y * (boxH - 12), 4, 0, 7); ctx.fill();
      }
      const gx = W - 70, gy = 70; ctx.strokeStyle = c.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(gx, gy, 30, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
      const ga = Math.PI * 0.75 + clamp(r.P / 1000, 0, 1) * Math.PI * 1.5; arrow(ctx, gx, gy, gx + Math.cos(ga) * 24, gy + Math.sin(ga) * 24, c.acc, 2);
      txt(ctx, `${fmt(r.P, 3)} kPa`, gx, gy + 48, c.fg, 12, 'center', 600);
      txt(ctx, `P = nRT / V`, (x0 + maxW) / 2, 24, c.fg, 14, 'center', 600);
    },
    chart(p, r) { const pts = []; for (let v = 5; v <= 50; v += 0.5) pts.push([v, p.n * 8.314 * p.T / (v / 1000) / 1000]); return { series: [{ pts }], mark: [p.V, r.P], xLabel: 'V (L)', yLabel: 'P (kPa)', yMin: 0 }; },
    explain(p, r) {
      return NL.lang === 'ar' ? `من $P = nRT/V$: الضغط ${fmt(r.P)} kPa (${fmt(r.atm)} atm). المنحنى في الرسم يمثل قانون بويل عند ثبات T: مضاعفة الحجم تنصّف الضغط. رفع درجة الحرارة يزيد سرعة الجسيمات فتصطدم بالجدران أكثر وبقوة أكبر، فيرتفع الضغط (قانون جاي-لوساك).` : `From $P = nRT/V$: pressure is ${fmt(r.P)} kPa (${fmt(r.atm)} atm). The curve is Boyle’s law at fixed T: doubling volume halves pressure. Raising T speeds the particles up so they hit the walls more often and harder, raising pressure (Gay-Lussac’s law).`;
    },
    questions: [['عند 273 K و1 mol، ما الحجم الذي يعطي 101.3 kPa؟', 'At 273 K and 1 mol, which volume gives 101.3 kPa?'], ['لماذا ينفجر إطار السيارة إذا سخن كثيرًا؟', 'Why can a tyre burst when it gets very hot?'], ['متى يبتعد الغاز الحقيقي عن هذا النموذج؟', 'When does a real gas depart from this model?']],
  });

  def({
    id: 'titration', subject: 'chemistry', title: ['المعايرة الحمضية القاعدية', 'Acid–base titration'],
    goal: ['ارسم منحنى معايرة حمض قوي بقاعدة قوية وحدد نقطة التكافؤ.', 'Build the titration curve of a strong acid with a strong base and find the equivalence point.'],
    how: ['أضف القاعدة من السحاحة بتحريك حجم القاعدة المضاف، وراقب الـ pH ولون الكاشف.', 'Add base from the burette by moving the added volume, and watch the pH and indicator colour.'],
    assume: ['HCl مع NaOH عند 25°C، تفكك تام، Kw = 1.0×10⁻¹⁴، الحجوم تجمع.', 'HCl with NaOH at 25°C, complete dissociation, Kw = 1.0×10⁻¹⁴, volumes add.'],
    params: [
      { k: 'Ca', label: ['تركيز الحمض HCl', 'HCl concentration'], min: 0.05, max: 1, step: 0.01, def: 0.1, unit: 'M' },
      { k: 'Va', label: ['حجم الحمض', 'Acid volume'], min: 10, max: 50, step: 1, def: 25, unit: 'mL' },
      { k: 'Cb', label: ['تركيز القاعدة NaOH', 'NaOH concentration'], min: 0.05, max: 1, step: 0.01, def: 0.1, unit: 'M' },
      { k: 'Vb', label: ['حجم القاعدة المضاف', 'Base added'], min: 0, max: 80, step: 0.1, def: 10, unit: 'mL' },
      { k: 'ind', label: ['الكاشف', 'Indicator'], type: 'select', def: 'php', options: [['php', ['فينولفثالين', 'Phenolphthalein']], ['btb', ['أزرق بروموثيمول', 'Bromothymol blue']], ['mo', ['ميثيل البرتقالي', 'Methyl orange']]] },
    ],
    compute(p) {
      const pH = (Vb) => { const na = p.Ca * p.Va / 1000, nb = p.Cb * Vb / 1000, Vt = (p.Va + Vb) / 1000, x = (na - nb) / Vt, Kw = 1e-14; const h = x >= 0 ? (x + Math.sqrt(x * x + 4 * Kw)) / 2 : Kw / ((-x + Math.sqrt(x * x + 4 * Kw)) / 2); return -Math.log10(h); };
      return { pH, now: pH(p.Vb), Veq: p.Ca * p.Va / p.Cb, molA: p.Ca * p.Va, molB: p.Cb * p.Vb };
    },
    outputs: [['now', ['pH الحالي', 'Current pH'], ''], ['Veq', ['حجم القاعدة عند التكافؤ', 'Base volume at equivalence'], 'mL'], ['molA', ['مليمولات الحمض', 'Acid millimoles'], 'mmol'], ['molB', ['مليمولات القاعدة المضافة', 'Base millimoles added'], 'mmol']],
    duration: () => 0,
    color(ind, pH) {
      const lerp = (a, b, k) => mix(a, b, clamp(k, 0, 1));
      if (ind === 'php') return pH < 8.2 ? 'rgba(230,236,245,0.35)' : lerp('#f3c6dc', '#d63384', (pH - 8.2) / 1.8);
      if (ind === 'btb') return pH < 6 ? '#e8c936' : pH > 7.6 ? '#2f6fd6' : lerp('#e8c936', '#2f9e6a', (pH - 6) / 1.6);
      return pH < 3.1 ? '#d9422b' : pH > 4.4 ? '#f0c331' : lerp('#d9422b', '#f08a24', (pH - 3.1) / 1.3);
    },
    draw(ctx, W, H, p, r, k, c, time) {
      const fx = W * 0.42, fy = H - 40, col = this.color(p.ind, r.now);
      ctx.fillStyle = c.surf2; ctx.fillRect(fx - 8, 30, 16, 120); const lvl = 120 * (1 - p.Vb / 80); ctx.fillStyle = 'rgba(120,170,255,0.5)'; ctx.fillRect(fx - 6, 150 - lvl, 12, lvl);
      ctx.strokeStyle = c.fg; ctx.lineWidth = 1.5; ctx.strokeRect(fx - 8, 30, 16, 120); ctx.beginPath(); ctx.moveTo(fx, 150); ctx.lineTo(fx, 168); ctx.stroke();
      if ((time * 2) % 1 < 0.5 && p.Vb < 80) { ctx.fillStyle = 'rgba(120,170,255,0.8)'; ctx.beginPath(); ctx.arc(fx, 176 + ((time * 2) % 1) * 30, 3, 0, 7); ctx.fill(); }
      ctx.beginPath(); ctx.moveTo(fx - 18, 200); ctx.lineTo(fx - 18, 230); ctx.lineTo(fx - 70, fy); ctx.lineTo(fx + 70, fy); ctx.lineTo(fx + 18, 230); ctx.lineTo(fx + 18, 200); ctx.strokeStyle = c.fg; ctx.lineWidth = 2; ctx.stroke();
      const fill = 30 + (p.Va + p.Vb) / 130 * 50; ctx.save(); ctx.clip(); ctx.fillStyle = col; ctx.fillRect(fx - 80, fy - fill, 160, fill); ctx.restore();
      const mx = W * 0.78; ctx.fillStyle = c.surf2; rrect(ctx, mx - 60, 60, 120, 70, 10); ctx.fill(); ctx.strokeStyle = c.line; ctx.stroke();
      txt(ctx, 'pH', mx, 82, c.mute, 12); txt(ctx, r.now.toFixed(2), mx, 116, r.now < 7 ? c.bad : r.now > 7 ? c.sig : c.ok, 26, 'center', 700);
      const near = Math.abs(p.Vb - r.Veq) < r.Veq * 0.02;
      txt(ctx, near ? (NL.lang === 'ar' ? 'نقطة التكافؤ' : 'Equivalence point') : `V_eq = ${fmt(r.Veq, 3)} mL`, mx, 160, near ? c.ok : c.fg, 13, 'center', 600);
    },
    chart(p, r) { const pts = []; for (let v = 0; v <= 80; v += 0.25) pts.push([v, r.pH(v)]); return { series: [{ pts }], mark: [p.Vb, r.now], xLabel: NL.lang === 'ar' ? 'حجم القاعدة (mL)' : 'base volume (mL)', yLabel: 'pH', yMin: 0, yMax: 14 }; },
    explain(p, r) {
      const ar = NL.lang === 'ar';
      return ar ? `مولات الحمض $C_aV_a$ = ${fmt(r.molA)} mmol، فالتكافؤ يحدث عند $V_b = C_aV_a/C_b$ = ${fmt(r.Veq)} mL حيث pH = 7 تمامًا لحمض وقاعدة قويين. قرب التكافؤ يقفز الـ pH بعدة وحدات بقطرات قليلة، لذلك يصلح أي كاشف يتغير لونه داخل القفزة. الـ pH الآن ${r.now.toFixed(2)}.` : `Acid moles $C_aV_a$ = ${fmt(r.molA)} mmol, so equivalence is at $V_b = C_aV_a/C_b$ = ${fmt(r.Veq)} mL, where pH is exactly 7 for a strong acid and strong base. Near equivalence the pH jumps several units within a few drops, so any indicator that changes inside the jump works. pH is now ${r.now.toFixed(2)}.`;
    },
    questions: [['لماذا يُفضّل الفينولفثالين رغم أنه يتغير عند pH ≈ 8.2 لا 7؟', 'Why is phenolphthalein fine even though it changes near pH 8.2, not 7?'], ['ضاعف تركيز الحمض. أين تنتقل نقطة التكافؤ؟', 'Double the acid concentration. Where does equivalence move?'], ['ما الـ pH بعد إضافة نصف حجم التكافؤ؟ احسبه ثم تحقق.', 'What is the pH at half the equivalence volume? Calculate, then check.']],
  });

  def({
    id: 'dilution', subject: 'chemistry', title: ['التخفيف والتركيز', 'Dilution and concentration'],
    goal: ['تحقق من أن عدد المولات ثابت عند التخفيف: C₁V₁ = C₂V₂.', 'Check that moles stay fixed on dilution: C₁V₁ = C₂V₂.'],
    how: ['اختر تركيز المحلول وحجمه، ثم أضف ماءً وراقب اللون والتركيز.', 'Choose the stock concentration and volume, then add water and watch the colour and concentration.'],
    assume: ['حجوم تجمع، المذاب لا يتفاعل مع الماء، شدة اللون تتناسب مع التركيز (تقريب).', 'Volumes add, solute does not react with water, colour intensity roughly follows concentration.'],
    params: [
      { k: 'C1', label: ['التركيز الابتدائي C₁', 'Stock concentration C₁'], min: 0.1, max: 2, step: 0.05, def: 1, unit: 'M' },
      { k: 'V1', label: ['حجم المحلول V₁', 'Stock volume V₁'], min: 10, max: 200, step: 5, def: 50, unit: 'mL' },
      { k: 'Vw', label: ['الماء المضاف', 'Water added'], min: 0, max: 450, step: 5, def: 150, unit: 'mL' },
    ],
    compute(p) { const V2 = p.V1 + p.Vw; return { V2, C2: p.C1 * p.V1 / V2, mol: p.C1 * p.V1 / 1000, factor: V2 / p.V1 }; },
    outputs: [['C2', ['التركيز النهائي C₂', 'Final concentration C₂'], 'M'], ['V2', ['الحجم النهائي V₂', 'Final volume V₂'], 'mL'], ['mol', ['المولات (ثابتة)', 'Moles (constant)'], 'mol'], ['factor', ['معامل التخفيف', 'Dilution factor'], '×']],
    duration: () => 1.5,
    draw(ctx, W, H, p, r, k, c) {
      const beaker = (x, vol, conc, label) => {
        const bw = 120, bh = 170, y = H - 30; ctx.strokeStyle = c.fg; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y - bh); ctx.lineTo(x, y); ctx.lineTo(x + bw, y); ctx.lineTo(x + bw, y - bh); ctx.stroke();
        const lh = bh * vol / 500; ctx.fillStyle = `rgba(80,140,255,${0.08 + 0.8 * clamp(conc / 2, 0, 1)})`; ctx.fillRect(x + 2, y - lh, bw - 4, lh - 2);
        txt(ctx, label, x + bw / 2, y - bh - 12, c.fg, 13, 'center', 600);
      };
      beaker(W * 0.18, p.V1, p.C1, `C₁ = ${fmt(p.C1, 2)} M`);
      beaker(W * 0.58, p.V1 + p.Vw * Math.min(1, k), p.C1 * p.V1 / (p.V1 + p.Vw * Math.min(1, k)), `C₂ = ${fmt(r.C2, 3)} M`);
      arrow(ctx, W * 0.18 + 140, H / 2, W * 0.58 - 20, H / 2, c.sig, 2, `+${p.Vw} mL`);
    },
    chart(p, r) { const pts = []; for (let w = 0; w <= 450; w += 5) pts.push([w, p.C1 * p.V1 / (p.V1 + w)]); return { series: [{ pts }], mark: [p.Vw, r.C2], xLabel: NL.lang === 'ar' ? 'الماء المضاف (mL)' : 'water added (mL)', yLabel: 'C (M)', yMin: 0 }; },
    explain(p, r) { return NL.lang === 'ar' ? `عدد المولات لا يتغير: ${fmt(r.mol)} mol. لذلك $C_2 = C_1V_1/V_2$ = ${fmt(r.C2)} M. التركيز يتناسب عكسيًا مع الحجم الكلي، ولهذا يتباطأ انخفاضه كلما أضفت ماء أكثر.` : `Moles do not change: ${fmt(r.mol)} mol. So $C_2 = C_1V_1/V_2$ = ${fmt(r.C2)} M. Concentration is inversely proportional to total volume, which is why it falls more slowly as you add more water.`; },
    questions: [['كم ماءً تضيف لتصبح C₂ ربع C₁؟', 'How much water makes C₂ a quarter of C₁?'], ['لماذا لا يصل التركيز إلى الصفر مهما أضفت؟', 'Why does concentration never reach zero?']],
  });

  /* ---------- lab runner ---------- */
  NL.mountLab = (host, lab, { values, onChange, onInteract } = {}) => {
    const p = {}; lab.params.forEach((q) => (p[q.k] = values?.[q.k] ?? q.def));
    let st = lab.init ? lab.init() : {}, start = performance.now(), paused = false, raf = 0, pausedAt = 0, interacted = false;
    host.innerHTML = `
      <div class="lab">
        <div class="lab-main">
          <div class="lab-stage"><canvas aria-label="${esc(tt(lab.title))}"></canvas>
            <div class="lab-stage-bar">
              <button class="btn sm ghost" data-a="play">${t('pause')}</button>
              <button class="btn sm ghost" data-a="replay">${t('replay')}</button>
              <button class="btn sm ghost" data-a="reset">${t('resetDefaults')}</button>
            </div>
          </div>
          <div class="lab-controls">${lab.params.map((q) => q.type === 'select'
            ? `<label class="ctl"><span>${esc(tt(q.label))}</span><select id="lab-${lab.id}-${q.k}" data-k="${q.k}">${q.options.map(([v, l]) => `<option value="${v}" ${String(p[q.k]) === v ? 'selected' : ''}>${esc(tt(l))}</option>`).join('')}</select></label>`
            : `<label class="ctl"><span>${esc(tt(q.label))}<output data-o="${q.k}"></output></span><input id="lab-${lab.id}-${q.k}" type="range" data-k="${q.k}" min="${q.min}" max="${q.max}" step="${q.step}" value="${p[q.k]}"></label>`).join('')}</div>
        </div>
        <div class="lab-side">
          <section class="lab-card"><h4>${t('labResults')}</h4><dl class="lab-out"></dl><p class="fine">${t('idealNote')}</p></section>
          <section class="lab-card"><h4>${t('graph')}</h4><div class="lab-chart"></div></section>
        </div>
        <div class="lab-info">
          <section><h4>${t('labGoal')}</h4><p>${esc(tt(lab.goal))}</p><h4>${t('labHow')}</h4><p>${esc(tt(lab.how))}</p></section>
          <section><h4>${t('labExplain')}</h4><div class="lab-explain prose"></div></section>
          <section><h4>${t('labAssume')}</h4><p>${esc(tt(lab.assume))}</p><h4>${t('labQs')}</h4><ol class="qs">${lab.questions.map((q) => `<li>${esc(tt(q))}</li>`).join('')}</ol></section>
        </div>
      </div>`;
    const cv = host.querySelector('canvas'), ctx = cv.getContext('2d');
    let r = lab.compute(p);
    const fit = () => { const b = cv.getBoundingClientRect(), d = devicePixelRatio || 1; cv.width = b.width * d; cv.height = b.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    const ro = new ResizeObserver(fit); ro.observe(cv); fit();
    const writeOut = () => {
      host.querySelectorAll('[data-o]').forEach((o) => { const q = lab.params.find((x) => x.k === o.dataset.o); o.textContent = `${fmt(+p[q.k], 3)} ${q.unit}`; });
      host.querySelector('.lab-out').innerHTML = lab.outputs.map(([k, l, u]) => `<div><dt>${esc(tt(l))}</dt><dd>${lab.format?.(r, k) ?? fmt(r[k], 3)} <small>${u}</small></dd></div>`).join('');
      host.querySelector('.lab-explain').innerHTML = NL.md(lab.explain(p, r));
    };
    const dur = () => (typeof lab.duration === 'function' ? lab.duration(p, r) : lab.duration) || 0;
    let lastChart = 0;
    const frame = (now) => {
      const el = ((paused ? pausedAt : now) - start) / 1000, D = dur(), k = D ? Math.min(1, el / D) : 1;
      const b = cv.getBoundingClientRect();
      ctx.clearRect(0, 0, b.width, b.height);
      try { lab.draw(ctx, b.width, b.height, p, r, k, NL.pal(), el, st); } catch (e) { console.error(e); }
      if (now - lastChart > 120) { lastChart = now; const ch = lab.chart(p, r, k); host.querySelector('.lab-chart').innerHTML = NL.lineChart(ch); }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const update = () => { lab.params.forEach((q) => { if (q.type !== 'select') p[q.k] = +p[q.k]; }); r = lab.compute(p); writeOut(); lastChart = 0; onChange?.({ ...p }); if (!interacted) { interacted = true; onInteract?.(); } };
    host.querySelectorAll('[data-k]').forEach((inp) => inp.addEventListener('input', () => { p[inp.dataset.k] = inp.value; if (dur()) start = performance.now() - (dur() * 1000); update(); }));
    host.querySelector('[data-a="replay"]').onclick = () => { start = performance.now(); paused = false; host.querySelector('[data-a="play"]').textContent = t('pause'); if (lab.init) st = lab.init(); if (!interacted) { interacted = true; onInteract?.(); } };
    host.querySelector('[data-a="play"]').onclick = (e) => { if (paused) { start += performance.now() - pausedAt; paused = false; } else { paused = true; pausedAt = performance.now(); } e.target.textContent = paused ? t('play') : t('pause'); };
    host.querySelector('[data-a="reset"]').onclick = () => { lab.params.forEach((q) => { p[q.k] = q.def; const el = host.querySelector(`[data-k="${q.k}"]`); el.value = q.def; }); start = performance.now(); update(); };
    writeOut();
    const off = NL.on('theme', () => { lastChart = 0; });
    return () => { cancelAnimationFrame(raf); ro.disconnect(); off(); };
  };

  /* ---------- equation explorer: any law from the lesson becomes a live model ---------- */
  NL.addT({
    exTitle: ['مستكشف القوانين', 'Law explorer'], exLead: ['كل قانون في درسك يصبح نموذجًا حيًا: اختر المجهول، وحرّك بقية المتغيرات، وشاهد العلاقة.', 'Every law in your lesson becomes a live model: pick the unknown, move the other variables, see the relation.'],
    exSolveFor: ['احسب', 'Solve for'], exAgainst: ['ارسمه مقابل', 'Plot against'], exNoLaws: ['لم يُستخرج من الدرس قانون قابل للحساب.', 'No computable law was extracted from this lesson.'],
    rel_direct: ['يتناسب طرديًا مع', 'is directly proportional to'], rel_inverse: ['يتناسب عكسيًا مع', 'is inversely proportional to'], rel_square: ['يتناسب مع مربع', 'grows with the square of'], rel_invsquare: ['يتناسب عكسيًا مع مربع', 'is inversely proportional to the square of'], rel_sqrt: ['يتناسب مع الجذر التربيعي لـ', 'grows with the square root of'], rel_invsqrt: ['يتناسب عكسيًا مع جذر', 'is inversely proportional to the root of'], rel_cube: ['يتناسب مع مكعب', 'grows with the cube of'], rel_none: ['لا يتأثر بـ', 'does not depend on'], rel_other: ['يتغير بمعامل {f} عند مضاعفة', 'changes by ×{f} when you double'],
    exNoSolution: ['لا يوجد حل حقيقي بهذه القيم', 'No real solution for these values'],
  });
  NL.mountExplorer = (host, laws, { onInteract } = {}) => {
    const usable = laws.map((l) => ({ l, P: NL.eq.parse(l.equation) })).filter((x) => x.P && x.P.vars.length >= 2);
    if (!usable.length) { host.innerHTML = `<div class="empty-mini">${t('exNoLaws')}</div>`; return () => {}; }
    let cur = 0, target = null, xVar = null; const vals = {};
    const sym = (law, v) => law.symbols?.find((s) => s.var === v) || { var: v, tex: v, name: v, unit: '' };
    const render = () => {
      const { l, P } = usable[cur];
      if (!target || !P.vars.includes(target)) target = P.lhsNode.isSymbolNode ? P.lhsNode.name : P.vars[0];
      const others = P.vars.filter((v) => v !== target);
      if (!xVar || !others.includes(xVar)) xVar = others[0];
      others.forEach((v) => { if (vals[l.id + v] == null) vals[l.id + v] = +(sym(l, v).sample ?? 2); });
      host.innerHTML = `<div class="explorer">
        <div class="ex-laws" role="tablist">${usable.map((u, i) => `<button class="chip ${i === cur ? 'on' : ''}" data-law="${i}">${esc(u.l.name)}</button>`).join('')}</div>
        <div class="ex-eq">${NL.tex(l.latex || l.equation, true)}</div>
        <div class="ex-grid">
          <div class="ex-controls">
            <label class="ctl"><span>${t('exSolveFor')}</span><select id="ex-target">${P.vars.map((v) => `<option value="${v}" ${v === target ? 'selected' : ''}>${esc(sym(l, v).name)} (${esc(v)})</option>`).join('')}</select></label>
            ${others.map((v) => { const s = sym(l, v), val = vals[l.id + v], mx = Math.max(10, Math.abs(val) * 4); return `<label class="ctl"><span>${NL.tex(s.tex || v)} ${esc(s.name)}<output>${fmt(val, 3)} ${esc(s.unit || '')}</output></span><input type="range" id="ex-${v}" data-v="${v}" min="${val < 0 ? -mx : 0}" max="${mx}" step="${mx / 400}" value="${val}"></label>`; }).join('')}
            <label class="ctl"><span>${t('exAgainst')}</span><select id="ex-x">${others.map((v) => `<option value="${v}" ${v === xVar ? 'selected' : ''}>${esc(sym(l, v).name)} (${esc(v)})</option>`).join('')}</select></label>
          </div>
          <div class="ex-result"><div class="ex-big"></div><div class="ex-chart"></div><ul class="ex-rel"></ul></div>
        </div></div>`;
      const compute = () => {
        const scope = {}; others.forEach((v) => (scope[v] = vals[l.id + v]));
        const y = NL.eq.solve(P, target, scope), ts = sym(l, target);
        host.querySelector('.ex-big').innerHTML = y == null ? `<span class="bad">${t('exNoSolution')}</span>` : `${NL.tex(ts.tex || target)} = <b>${fmt(y, 4)}</b> <small>${esc(ts.unit || '')}</small>`;
        const xv = scope[xVar], lo = 0, hi = Math.max(Math.abs(xv) * 2, 1), pts = [];
        for (let i = 1; i <= 60; i++) { const xx = lo + (hi - lo) * i / 60; const yy = NL.eq.solve(P, target, { ...scope, [xVar]: xx }); if (yy != null) pts.push([xx, yy]); }
        host.querySelector('.ex-chart').innerHTML = NL.lineChart({ series: [{ pts, area: true }], mark: y != null ? [xv, y] : null, xLabel: `${xVar} (${sym(l, xVar).unit || ''})`, yLabel: `${target} (${ts.unit || ''})`, height: 200 });
        host.querySelector('.ex-rel').innerHTML = others.map((v) => { const rel = NL.eq.relation(P, target, v, scope); if (!rel) return ''; return `<li><b>${esc(ts.name)}</b> ${t('rel_' + rel.kind, { f: fmt(rel.factor, 3) })} <b>${esc(sym(l, v).name)}</b></li>`; }).join('');
      };
      compute();
      host.querySelectorAll('[data-law]').forEach((b) => (b.onclick = () => { cur = +b.dataset.law; target = xVar = null; render(); }));
      host.querySelector('#ex-target').onchange = (e) => { target = e.target.value; render(); onInteract?.(); };
      host.querySelector('#ex-x').onchange = (e) => { xVar = e.target.value; compute(); };
      host.querySelectorAll('[data-v]').forEach((inp) => (inp.oninput = () => { vals[l.id + inp.dataset.v] = +inp.value; inp.previousElementSibling.querySelector('output').textContent = `${fmt(+inp.value, 3)} ${sym(l, inp.dataset.v).unit || ''}`; compute(); onInteract?.(); }));
    };
    render();
    return () => {};
  };

  /* ---------- math: function grapher + equation pad ---------- */
  NL.addT({
    grTitle: ['راسم الدوال', 'Function grapher'], grLead: ['اكتب دالة بالمتغير x. أي حرف آخر (a, b, c…) يصبح منزلقًا تتحكم به.', 'Type a function of x. Any other letter (a, b, c…) becomes a slider.'],
    grAdd: ['أضف دالة', 'Add function'], grDeriv: ['اعرض المشتقة', 'Show derivative'], grRoots: ['الأصفار', 'Roots'], grExt: ['قيم عظمى/صغرى', 'Turning points'], grInter: ['نقاط التقاطع', 'Intersections'], grFit: ['ملاءمة العرض', 'Fit view'],
    padTitle: ['لوح المعادلات', 'Equation pad'], padLead: ['اكتب تعبيرًا أو معادلة، وشاهدها مكتوبة رياضيًا، ثم بسّطها أو اشتقها أو حلها.', 'Type an expression or equation, see it typeset, then simplify, differentiate or solve it.'],
    padSimplify: ['بسّط', 'Simplify'], padDerive: ['اشتق d/dx', 'Differentiate d/dx'], padSolve: ['حل لـ x', 'Solve for x'], padEval: ['احسب', 'Evaluate'], padErr: ['تعذّر فهم التعبير: {m}', 'Could not read the expression: {m}'],
    padNoRoots: ['لم أجد حلولًا حقيقية بين −100 و100.', 'No real solutions found between −100 and 100.'], padRootsNote: ['حلول عددية مقربة بطريقة التنصيف.', 'Numerical solutions found by bisection.'],
  });
  NL.mountGrapher = (host, initial = [], { onInteract } = {}) => {
    const COLORS = ['--signal', '--accent', '--violet', '--ok', '--bad'];
    let fns = (initial.length ? initial : [{ expr: 'a*x^2 + b*x + c' }, { expr: 'sin(x)' }]).slice(0, 5).map((f) => ({ expr: f.expr, desc: f.desc || '' }));
    let params = {}, view = { x0: -10, x1: 10, y0: -7, y1: 7 }, showD = false, hover = null;
    host.innerHTML = `<div class="grapher">
      <div class="gr-side">
        <div class="gr-fns"></div>
        <div class="row gap"><button class="btn sm ghost" data-a="add">+ ${t('grAdd')}</button><label class="check"><input type="checkbox" id="gr-d"> ${t('grDeriv')}</label></div>
        <div class="gr-params"></div>
        <div class="gr-feat"></div>
      </div>
      <div class="gr-stage"><canvas></canvas><div class="gr-zoom"><button class="btn sm ghost" data-z="0.8">+</button><button class="btn sm ghost" data-z="1.25">−</button><button class="btn sm ghost" data-z="fit">${t('grFit')}</button></div><div class="gr-hover"></div></div>
    </div>`;
    const cv = host.querySelector('canvas'), ctx = cv.getContext('2d');
    const compile = () => fns.forEach((f) => {
      try {
        const node = math.parse(f.expr); f.err = null; f.code = node.compile(); f.tex = node.toTex();
        const syms = new Set(); node.traverse((n, pth, par) => { if (n.isSymbolNode && !(par?.isFunctionNode && par.fn === n) && !['x', 'pi', 'e', 'i'].includes(n.name)) syms.add(n.name); });
        f.syms = [...syms]; f.syms.forEach((s) => (params[s] ??= 1));
        try { f.dcode = math.derivative(node, 'x').compile(); } catch { f.dcode = null; }
      } catch (e) { f.err = e.message; f.code = null; }
    });
    const ev = (code, x) => { try { const v = code.evaluate({ ...params, x }); return typeof v === 'number' ? v : NaN; } catch { return NaN; } };
    const renderSide = () => {
      host.querySelector('.gr-fns').innerHTML = fns.map((f, i) => `<div class="gr-fn"><span class="dot" style="background:var(${COLORS[i]})"></span><span class="gr-fx">y =</span><input id="gr-f${i}" data-f="${i}" value="${esc(f.expr)}" dir="ltr" spellcheck="false"><button class="icon-btn" data-del="${i}" aria-label="${t('remove')}">×</button><div class="gr-tex">${f.err ? `<span class="bad">${esc(f.err)}</span>` : NL.tex(f.tex)}</div></div>`).join('');
      const used = [...new Set(fns.flatMap((f) => f.syms || []))];
      host.querySelector('.gr-params').innerHTML = used.map((s) => `<label class="ctl"><span>${esc(s)}<output>${fmt(params[s], 3)}</output></span><input type="range" id="gr-p-${s}" data-p="${s}" min="-10" max="10" step="0.1" value="${params[s]}"></label>`).join('');
      host.querySelectorAll('[data-f]').forEach((inp) => (inp.onchange = () => { fns[+inp.dataset.f].expr = inp.value; compile(); renderSide(); onInteract?.(); }));
      host.querySelectorAll('[data-del]').forEach((b) => (b.onclick = () => { fns.splice(+b.dataset.del, 1); renderSide(); }));
      host.querySelectorAll('[data-p]').forEach((inp) => (inp.oninput = () => { params[inp.dataset.p] = +inp.value; inp.previousElementSibling.querySelector('output').textContent = fmt(+inp.value, 3); features(); onInteract?.(); }));
      features();
    };
    const features = () => { // numeric roots, turning points, intersections inside the view
      const out = []; const N = 800, dx = (view.x1 - view.x0) / N;
      const scan = (g) => { const r = []; let px = view.x0, pv = g(px); for (let i = 1; i <= N; i++) { const x = view.x0 + i * dx, v = g(x); if (isFinite(pv) && isFinite(v) && pv * v < 0 && Math.abs(pv - v) < 50) { let a = px, b = x, fa = pv; for (let k = 0; k < 50; k++) { const m = (a + b) / 2, fm = g(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } r.push((a + b) / 2); } else if (v === 0) r.push(x); px = x; pv = v; } return r; };
      fns.forEach((f, i) => { if (!f.code) return; const roots = scan((x) => ev(f.code, x)); const tp = f.dcode ? scan((x) => ev(f.dcode, x)) : []; if (roots.length) out.push(`<li><span class="dot" style="background:var(${COLORS[i]})"></span>${t('grRoots')}: ${roots.slice(0, 6).map((x) => `x ≈ ${fmt(x, 4)}`).join(' · ')}</li>`); if (tp.length) out.push(`<li><span class="dot" style="background:var(${COLORS[i]})"></span>${t('grExt')}: ${tp.slice(0, 5).map((x) => `(${fmt(x, 3)}, ${fmt(ev(f.code, x), 3)})`).join(' · ')}</li>`); });
      if (fns[0]?.code && fns[1]?.code) { const xs = scan((x) => ev(fns[0].code, x) - ev(fns[1].code, x)); if (xs.length) out.push(`<li>${t('grInter')}: ${xs.slice(0, 5).map((x) => `(${fmt(x, 3)}, ${fmt(ev(fns[0].code, x), 3)})`).join(' · ')}</li>`); }
      host.querySelector('.gr-feat').innerHTML = out.length ? `<ul>${out.join('')}</ul>` : '';
    };
    const fit = () => { const b = cv.getBoundingClientRect(), d = devicePixelRatio || 1; cv.width = b.width * d; cv.height = b.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
    const ro = new ResizeObserver(fit); ro.observe(cv); fit();
    let raf;
    const draw = () => {
      const c = NL.pal(), b = cv.getBoundingClientRect(), W = b.width, H = b.height;
      const ar = W / H, cy = (view.y0 + view.y1) / 2, hh = (view.x1 - view.x0) / ar / 2; view.y0 = cy - hh; view.y1 = cy + hh;
      const X = (x) => (x - view.x0) / (view.x1 - view.x0) * W, Y = (y) => H - (y - view.y0) / (view.y1 - view.y0) * H;
      ctx.clearRect(0, 0, W, H);
      const step = Math.pow(10, Math.floor(Math.log10((view.x1 - view.x0) / 8))) * ((view.x1 - view.x0) / Math.pow(10, Math.floor(Math.log10((view.x1 - view.x0) / 8))) > 40 ? 5 : 1);
      ctx.lineWidth = 1; ctx.strokeStyle = c.line; ctx.font = '11px "JetBrains Mono", monospace'; ctx.fillStyle = c.mute; ctx.textAlign = 'center'; ctx.direction = 'ltr';
      for (let x = Math.ceil(view.x0 / step) * step; x <= view.x1; x += step) { ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(X(x), 0); ctx.lineTo(X(x), H); ctx.stroke(); ctx.globalAlpha = 1; if (Math.abs(x) > 1e-9) ctx.fillText(+x.toFixed(6), X(x), clamp(Y(0) + 14, 12, H - 4)); }
      for (let y = Math.ceil(view.y0 / step) * step; y <= view.y1; y += step) { ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(0, Y(y)); ctx.lineTo(W, Y(y)); ctx.stroke(); ctx.globalAlpha = 1; if (Math.abs(y) > 1e-9) { ctx.textAlign = 'start'; ctx.fillText(+y.toFixed(6), clamp(X(0) + 4, 2, W - 30), Y(y) - 3); ctx.textAlign = 'center'; } }
      ctx.strokeStyle = c.fg; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); ctx.stroke();
      const plot = (code, col, dash) => { ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.setLineDash(dash ? [6, 6] : []); ctx.beginPath(); let pen = false; for (let i = 0; i <= W; i += 1) { const x = view.x0 + i / W * (view.x1 - view.x0), y = ev(code, x); if (!isFinite(y) || Math.abs(Y(y)) > H * 4) { pen = false; continue; } pen ? ctx.lineTo(i, Y(y)) : ctx.moveTo(i, Y(y)); pen = true; } ctx.stroke(); ctx.setLineDash([]); };
      fns.forEach((f, i) => { const col = NL.css(COLORS[i]); if (f.code) plot(f.code, col); if (showD && f.dcode) plot(f.dcode, col, true); });
      if (hover != null) { const hx = view.x0 + hover / W * (view.x1 - view.x0); ctx.strokeStyle = c.mute; ctx.beginPath(); ctx.moveTo(hover, 0); ctx.lineTo(hover, H); ctx.stroke(); const labels = fns.map((f, i) => { if (!f.code) return ''; const y = ev(f.code, hx); if (!isFinite(y)) return ''; ctx.fillStyle = NL.css(COLORS[i]); ctx.beginPath(); ctx.arc(hover, Y(y), 4.5, 0, 7); ctx.fill(); return `<span style="color:var(${COLORS[i]})">(${fmt(hx, 3)}, ${fmt(y, 3)})</span>`; }).join(' '); host.querySelector('.gr-hover').innerHTML = labels; }
      raf = requestAnimationFrame(draw);
    };
    let drag = null;
    cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, v: { ...view } }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener('pointermove', (e) => { const b = cv.getBoundingClientRect(); hover = e.clientX - b.left; if (!drag) return; const sx = (view.x1 - view.x0) / b.width, sy = (view.y1 - view.y0) / b.height; const dx = (e.clientX - drag.x) * sx, dy = (e.clientY - drag.y) * sy; view = { x0: drag.v.x0 - dx, x1: drag.v.x1 - dx, y0: drag.v.y0 + dy, y1: drag.v.y1 + dy }; });
    cv.addEventListener('pointerup', () => { drag = null; features(); });
    cv.addEventListener('pointerleave', () => { hover = null; host.querySelector('.gr-hover').innerHTML = ''; });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); zoom(e.deltaY > 0 ? 1.12 : 0.89); }, { passive: false });
    const zoom = (k) => { const cx = (view.x0 + view.x1) / 2, cy = (view.y0 + view.y1) / 2; view = { x0: cx - (cx - view.x0) * k, x1: cx + (view.x1 - cx) * k, y0: cy - (cy - view.y0) * k, y1: cy + (view.y1 - cy) * k }; features(); };
    host.querySelectorAll('[data-z]').forEach((b) => (b.onclick = () => { if (b.dataset.z === 'fit') { view = { x0: -10, x1: 10, y0: -7, y1: 7 }; features(); } else zoom(+b.dataset.z); }));
    host.querySelector('[data-a="add"]').onclick = () => { if (fns.length < 5) { fns.push({ expr: 'x' }); compile(); renderSide(); } };
    host.querySelector('#gr-d').onchange = (e) => { showD = e.target.checked; };
    compile(); renderSide(); raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  };

  NL.mountPad = (host) => {
    host.innerHTML = `<div class="pad"><input id="pad-in" dir="ltr" spellcheck="false" value="x^2 - 5x + 6 = 0" aria-label="${t('padTitle')}">
      <div class="pad-tex"></div>
      <div class="row gap wrap"><button class="btn sm" data-op="simplify">${t('padSimplify')}</button><button class="btn sm" data-op="derive">${t('padDerive')}</button><button class="btn sm" data-op="solve">${t('padSolve')}</button><button class="btn sm" data-op="eval">${t('padEval')}</button></div>
      <div class="pad-out prose"></div></div>`;
    const inp = host.querySelector('#pad-in'), texEl = host.querySelector('.pad-tex'), out = host.querySelector('.pad-out');
    const norm = (s) => s.replace(/(\d)([a-z(])/gi, '$1*$2');
    const preview = () => { try { const s = norm(inp.value); texEl.innerHTML = s.includes('=') ? NL.tex(s.split('=').map((p) => math.parse(p).toTex()).join(' = '), true) : NL.tex(math.parse(s).toTex(), true); } catch (e) { texEl.innerHTML = `<span class="fine">${esc(t('padErr', { m: e.message }))}</span>`; } };
    inp.oninput = preview; preview();
    host.querySelectorAll('[data-op]').forEach((b) => (b.onclick = () => {
      const s = norm(inp.value);
      try {
        const expr = s.includes('=') ? `(${s.split('=')[0]}) - (${s.split('=')[1]})` : s;
        if (b.dataset.op === 'simplify') { const r = math.simplify(expr); out.innerHTML = NL.tex(r.toTex(), true); }
        if (b.dataset.op === 'derive') { const r = math.derivative(expr, 'x'); out.innerHTML = `${NL.tex('\\frac{d}{dx}', false)} ${NL.tex(r.toTex(), true)}`; }
        if (b.dataset.op === 'eval') { const r = math.evaluate(s.includes('=') ? expr : s); out.innerHTML = `<p class="big-num">${esc(math.format(r, { precision: 10 }))}</p>`; }
        if (b.dataset.op === 'solve') {
          const code = math.parse(expr).compile(), f = (x) => { try { return code.evaluate({ x }); } catch { return NaN; } };
          const roots = []; let px = -100, pv = f(px);
          for (let i = 1; i <= 20000; i++) { const x = -100 + i * 0.01, v = f(x); if (isFinite(pv) && isFinite(v) && (pv * v < 0 || v === 0) && Math.abs(v - pv) < 10) { let a = px, bb = x, fa = pv; for (let k = 0; k < 60; k++) { const m = (a + bb) / 2, fm = f(m); if (fa * fm <= 0) bb = m; else { a = m; fa = fm; } } const r0 = +((a + bb) / 2).toFixed(8); if (!roots.some((q) => Math.abs(q - r0) < 1e-5)) roots.push(r0); } px = x; pv = v; }
          out.innerHTML = roots.length ? `<p>${roots.map((r0) => NL.tex(`x \\approx ${+r0.toFixed(6)}`)).join(' , ')}</p><p class="fine">${t('padRootsNote')}</p>` : `<p>${t('padNoRoots')}</p>`;
        }
      } catch (e) { out.innerHTML = `<p class="bad">${esc(t('padErr', { m: e.message }))}</p>`; }
    }));
  };

  /* ---------- whiteboard (write equations and draw by hand) ---------- */
  NL.addT({ pen: ['قلم', 'Pen'], eraser: ['ممحاة', 'Eraser'], undo: ['تراجع', 'Undo'], clear: ['امسح السبورة', 'Clear board'], grid: ['شبكة', 'Grid'] });
  NL.mountBoard = (host, { height = 420 } = {}) => {
    const COLS = ['--fg', '--signal', '--accent', '--bad', '--ok'];
    host.innerHTML = `<div class="board"><div class="board-tools row gap wrap">
      ${COLS.map((c, i) => `<button class="swatch ${i ? '' : 'on'}" data-c="${c}" style="background:var(${c})" aria-label="${c}"></button>`).join('')}
      <button class="btn sm ghost" data-t="pen">${t('pen')}</button><button class="btn sm ghost" data-t="eraser">${t('eraser')}</button>
      <select id="board-w" aria-label="width"><option value="2">2</option><option value="4" selected>4</option><option value="8">8</option></select>
      <label class="check"><input type="checkbox" id="board-grid" checked> ${t('grid')}</label>
      <button class="btn sm ghost" data-t="undo">${t('undo')}</button><button class="btn sm ghost" data-t="clear">${t('clear')}</button></div>
      <canvas style="height:${height}px"></canvas></div>`;
    const cv = host.querySelector('canvas'), ctx = cv.getContext('2d');
    let strokes = [], cur = null, color = '--fg', tool = 'pen', grid = true;
    const fit = () => { const b = cv.getBoundingClientRect(), d = devicePixelRatio || 1; cv.width = b.width * d; cv.height = b.height * d; ctx.setTransform(d, 0, 0, d, 0, 0); redraw(); };
    const redraw = (forExport) => {
      const b = cv.getBoundingClientRect(), c = NL.pal();
      ctx.fillStyle = forExport ? '#ffffff' : c.surf; ctx.fillRect(0, 0, b.width, b.height);
      if (grid) { ctx.strokeStyle = forExport ? '#e6e6e6' : c.line; ctx.lineWidth = 1; for (let x = 24; x < b.width; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, b.height); ctx.stroke(); } for (let y = 24; y < b.height; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(b.width, y); ctx.stroke(); } }
      for (const s of strokes) { ctx.strokeStyle = s.erase ? (forExport ? '#ffffff' : c.surf) : (forExport && s.color === '--fg' ? '#111111' : NL.css(s.color)); ctx.lineWidth = s.erase ? s.w * 5 : s.w; ctx.lineCap = ctx.lineJoin = 'round'; ctx.beginPath(); s.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke(); }
    };
    const pos = (e) => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); cur = { color, w: +host.querySelector('#board-w').value, erase: tool === 'eraser', pts: [pos(e)] }; strokes.push(cur); });
    cv.addEventListener('pointermove', (e) => { if (!cur) return; cur.pts.push(pos(e)); redraw(); });
    cv.addEventListener('pointerup', () => (cur = null));
    host.querySelectorAll('[data-c]').forEach((b) => (b.onclick = () => { color = b.dataset.c; tool = 'pen'; host.querySelectorAll('[data-c]').forEach((x) => x.classList.toggle('on', x === b)); }));
    host.querySelector('[data-t="pen"]').onclick = () => (tool = 'pen');
    host.querySelector('[data-t="eraser"]').onclick = () => (tool = 'eraser');
    host.querySelector('[data-t="undo"]').onclick = () => { strokes.pop(); redraw(); };
    host.querySelector('[data-t="clear"]').onclick = () => { strokes = []; redraw(); };
    host.querySelector('#board-grid').onchange = (e) => { grid = e.target.checked; redraw(); };
    const ro = new ResizeObserver(fit); ro.observe(cv);
    const off = NL.on('theme', () => { pal = null; redraw(); });
    return {
      isEmpty: () => !strokes.length,
      toBlob: async () => { redraw(true); const blob = await new Promise((r) => cv.toBlob(r, 'image/png')); redraw(); return blob; },
      destroy: () => { ro.disconnect(); off(); },
    };
  };

  /* ---------- atlas: places and timeline extracted from the lesson ---------- */
  NL.addT({
    atlasLead: ['الأماكن والأحداث المستخرجة من درسك على الخريطة والخط الزمني. اضغط أي حدث أو موقع.', 'Places and events from your lesson on a map and timeline. Tap any event or place.'],
    atlasCoords: ['مواقع الخريطة تقريبية حددها الذكاء الاصطناعي، وليست من الكتاب. أسماء الأماكن والأحداث من درسك.', 'Map positions are approximate and set by the AI, not taken from the book. Place and event names come from your lesson.'],
    atlasQuiz: ['تحدّي: أين حدث؟', 'Challenge: where did it happen?'], atlasQuizQ: ['اضغط على الخريطة حيث وقع: {e}', 'Tap the map where this happened: {e}'],
    atlasKm: ['ابتعدت {km} كم عن الموقع. النتيجة {s}/100', 'You were {km} km away. Score {s}/100'], atlasNext: ['التالي', 'Next'], atlasEmpty: ['لم يُستخرج من الدرس أماكن أو أحداث.', 'No places or events were extracted from this lesson.'],
    atlasTotal: ['مجموعك: {s} من {n} محاولات', 'Your total: {s} over {n} tries'],
  });
  NL.mountAtlas = async (host, { places = [], events = [] }, { onScore } = {}) => {
    places = places.filter((p) => isFinite(p.lat) && isFinite(p.lon));
    if (!places.length && !events.length) { host.innerHTML = `<div class="empty-mini">${t('atlasEmpty')}</div>`; return; }
    host.innerHTML = `<div class="atlas"><div class="atlas-map"><svg></svg><div class="atlas-pop" hidden></div></div>
      <div class="atlas-bar row gap wrap"><button class="btn sm" data-a="quiz">${t('atlasQuiz')}</button><span class="atlas-q"></span></div>
      <p class="fine">${t('atlasCoords')}</p>
      <ol class="timeline">${events.slice().sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0)).map((e, i) => `<li><button data-ev="${i}"><span class="tl-year">${esc(e.year || '')}</span><span class="tl-title">${esc(e.title)}</span></button></li>`).join('')}</ol></div>`;
    const evs = events.slice().sort((a, b) => (a.sortKey ?? 0) - (b.sortKey ?? 0));
    const svg = d3.select(host.querySelector('svg')), pop = host.querySelector('.atlas-pop');
    let world; try { world = NL._world || (NL._world = await fetch('world-110m.json').then((r) => r.json())); } catch { world = null; }
    const W = 800, H = 460; svg.attr('viewBox', `0 0 ${W} ${H}`);
    const feat = world ? topojson.feature(world, world.objects.countries) : { type: 'FeatureCollection', features: [] };
    const pts = { type: 'MultiPoint', coordinates: places.map((p) => [p.lon, p.lat]) };
    const proj = d3.geoMercator();
    if (places.length > 1) proj.fitExtent([[60, 50], [W - 60, H - 50]], pts); else { proj.center([places[0]?.lon ?? 45, places[0]?.lat ?? 24]).scale(900).translate([W / 2, H / 2]); }
    if (proj.scale() > 6000) proj.scale(6000);
    const path = d3.geoPath(proj), g = svg.append('g');
    g.append('rect').attr('width', W).attr('height', H).attr('class', 'sea');
    g.selectAll('path').data(feat.features).join('path').attr('d', path).attr('class', 'land');
    const pins = g.selectAll('g.pin').data(places).join('g').attr('class', 'pin').attr('transform', (p) => `translate(${proj([p.lon, p.lat])})`).attr('tabindex', 0);
    pins.append('circle').attr('r', 7); pins.append('text').attr('y', -12).attr('text-anchor', 'middle').text((p) => p.name);
    const show = (p, extra = '') => { const [x, y] = proj([p.lon, p.lat]); pop.hidden = false; pop.style.left = `${x / W * 100}%`; pop.style.top = `${y / H * 100}%`; pop.innerHTML = `<b>${esc(p.name)}</b>${p.year ? ` · ${esc(p.year)}` : ''}<p>${esc(p.desc || '')}</p>${p.page ? `<span class="pref">${t('page')} ${p.page}</span>` : ''}${extra}`; pins.classed('on', (q) => q === p); };
    pins.on('click', (e, p) => show(p));
    const zoom = d3.zoom().scaleExtent([0.5, 12]).on('zoom', (e) => { g.attr('transform', e.transform); g.selectAll('.pin circle').attr('r', 7 / e.transform.k); g.selectAll('.pin text').attr('font-size', 12 / e.transform.k).attr('y', -12 / e.transform.k); });
    svg.call(zoom);
    host.querySelectorAll('[data-ev]').forEach((b) => (b.onclick = () => {
      const e = evs[+b.dataset.ev]; host.querySelectorAll('[data-ev]').forEach((x) => x.classList.toggle('on', x === b));
      const p = places.find((q) => q.name === e.place) || places.find((q) => e.place && (q.name.includes(e.place) || e.place.includes(q.name)));
      if (p) show(p, `<p class="ev">${esc(e.title)}: ${esc(e.desc || '')}</p>`); else { pop.hidden = false; pop.style.left = '50%'; pop.style.top = '12%'; pop.innerHTML = `<b>${esc(e.year || '')} · ${esc(e.title)}</b><p>${esc(e.desc || '')}</p>`; }
    }));
    // locate challenge: real distance-based scoring
    const quizable = evs.map((e) => ({ e, p: places.find((q) => q.name === e.place) })).filter((x) => x.p).concat(places.map((p) => ({ e: { title: p.name }, p })));
    let q = null, total = 0, tries = 0;
    const hav = (a, b) => { const R = 6371, r = Math.PI / 180, dLat = (b[1] - a[1]) * r, dLon = (b[0] - a[0]) * r, s = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(s)); };
    const ask = () => { q = quizable[Math.floor(Math.random() * quizable.length)]; pop.hidden = true; pins.style('display', 'none'); g.selectAll('.guess').remove(); host.querySelector('.atlas-q').textContent = t('atlasQuizQ', { e: q.e.title }); };
    host.querySelector('[data-a="quiz"]').onclick = () => { if (quizable.length) ask(); };
    svg.on('click', (ev) => {
      if (!q) return;
      const tr = d3.zoomTransform(svg.node()), [mx, my] = d3.pointer(ev, svg.node()), ll = proj.invert(tr.invert([mx, my]));
      const km = Math.round(hav(ll, [q.p.lon, q.p.lat])), score = Math.max(0, Math.round(100 - km / 15));
      total += score; tries++;
      g.append('circle').attr('class', 'guess').attr('cx', proj(ll)[0]).attr('cy', proj(ll)[1]).attr('r', 6 / tr.k);
      pins.style('display', null); show(q.p, `<p class="score">${t('atlasKm', { km, s: score })}</p><button class="btn sm" data-a="next">${t('atlasNext')}</button>`);
      host.querySelector('.atlas-q').textContent = t('atlasTotal', { s: total, n: tries });
      pop.querySelector('[data-a="next"]').onclick = (e2) => { e2.stopPropagation(); ask(); };
      onScore?.({ score, km, title: q.e.title });
      q = null;
    });
  };
})();
