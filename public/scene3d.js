/* Misbar 3D explainer: guided 3D scenes with live data panels. Every number on screen comes from the scene's physics. */
(function () {
  const { esc, t, tt, fmt, clamp } = NL;
  const G = 9.8;
  NL.addT({
    s3dLoading: ['جارٍ تحميل المشهد ثلاثي الأبعاد…', 'Loading the 3D scene…'], s3dFail: ['تعذّر تحميل مكتبة الرسوم ثلاثية الأبعاد. تحقق من الإنترنت ثم أعد فتح الصفحة.', 'Could not load the 3D library. Check your connection and reopen the page.'],
    s3dStep: ['الخطوة {i} من {n}', 'Step {i} of {n}'], s3dPrev: ['السابق', 'Previous'], s3dNext: ['التالي', 'Next'], s3dPlay: ['تشغيل الجولة', 'Play tour'], s3dPause: ['إيقاف الجولة', 'Pause tour'],
    s3dControls: ['التحكم بالمتغيرات', 'Variables'], s3dReset: ['القيم الأصلية', 'Reset'], s3dHint: ['اسحب لتدوير المشهد، وكبّر بعجلة الفأرة أو بإصبعين.', 'Drag to orbit, scroll or pinch to zoom.'],
    s3dLive: ['قراءة حيّة', 'Live reading'], s3dModel: ['نموذج مثالي مبسّط: الكفاءة تمثل كل أشكال الفقد. القيم محسوبة لحظيًا من القوانين.', 'Simplified model: efficiency stands for all losses. Values are computed live from the laws.'],
  });

  const C = { bg: 0x0a0f1c, floor: 0x121a2c, metal: 0x9aa7b8, dark: 0x2a3550, wood: 0xc58b4a, acc: 0xf2b544, sig: 0x5cc8ff, red: 0xff6b6b, green: 0x4ade9a, rope: 0xe9dcb8, violet: 0xa78bfa };

  let THREE, OrbitControls, CSS2DRenderer, CSS2DObject, loading;
  async function load3D() {
    if (THREE) return;
    loading ||= Promise.all([import('three'), import('three/addons/controls/OrbitControls.js'), import('three/addons/renderers/CSS2DRenderer.js')]).then(([a, b, c]) => {
      THREE = a; OrbitControls = b.OrbitControls; CSS2DRenderer = c.CSS2DRenderer; CSS2DObject = c.CSS2DObject;
    });
    return loading;
  }

  /* ---------- helpers ---------- */
  const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, metalness: o.m ?? 0.25, roughness: o.r ?? 0.55, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 0.6, transparent: o.op != null, opacity: o.op ?? 1 });
  const mesh = (geo, m, shadow = true) => { const x = new THREE.Mesh(geo, m); x.castShadow = shadow; x.receiveShadow = true; return x; };
  const box = (w, h, d, m) => mesh(new THREE.BoxGeometry(w, h, d), m);
  const cyl = (r1, r2, h, m, seg = 40) => mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m);
  function arrow(color) {
    const a = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(), 1, color, 0.22, 0.14);
    a.line.material.linewidth = 2; a.cone.material = new THREE.MeshBasicMaterial({ color });
    // thicker shaft than the default 1px line
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1, 10), new THREE.MeshBasicMaterial({ color }));
    a.add(shaft); a.line.visible = false;
    a.set = (from, dir, len) => { a.position.copy(from); a.setDirection(dir.clone().normalize()); a.setLength(Math.max(len, 0.3), 0.22, 0.14); const sl = Math.max(len - 0.22, 0.05); shaft.scale.set(1, sl, 1); shaft.position.set(0, sl / 2, 0); };
    return a;
  }
  function label(text, cls = '') {
    const el = document.createElement('div'); el.className = 'l3d ' + cls; el.textContent = text;
    const o = new CSS2DObject(el); o.set = (s) => { if (el.textContent !== s) el.textContent = s; }; return o;
  }
  // a pulley/gear wheel facing the camera (axis along z)
  function wheel(r, thick, m, teeth = 0) {
    const g = new THREE.Group();
    const disc = cyl(r, r, thick, m, 48); disc.rotation.x = Math.PI / 2; g.add(disc);
    const hub = cyl(r * 0.2, r * 0.2, thick * 1.6, mat(C.dark, { m: 0.6, r: 0.3 })); hub.rotation.x = Math.PI / 2; g.add(hub);
    if (teeth) for (let i = 0; i < teeth; i++) { const a = i / teeth * Math.PI * 2, tt = box(0.045, 0.06, thick, m); tt.position.set(Math.cos(a) * (r + 0.02), Math.sin(a) * (r + 0.02), 0); tt.rotation.z = a; g.add(tt); }
    else { const groove = mesh(new THREE.TorusGeometry(r, thick * 0.18, 8, 48), mat(C.dark)); g.add(groove); }
    return g;
  }
  // a straight segment between two points (rope, chain run, frame tube)
  function rod(radius, m) {
    const x = mesh(new THREE.CylinderGeometry(radius, radius, 1, 10), m);
    x.between = (a, b) => { const d = b.clone().sub(a), len = d.length(); x.position.copy(a).add(b).multiplyScalar(0.5); x.scale.set(1, Math.max(len, 1e-3), 1); x.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); };
    return x;
  }
  const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
  const ping = (k) => (k < 0.5 ? k * 2 : 2 - k * 2); // 0→1→0
  const ease = (k) => k * k * (3 - 2 * k);

  /* ---------- scenes ---------- */
  const SCENES = [];

  SCENES.push({
    id: 'lever', title: ['الرافعة', 'The lever'], sub: ['آلة بسيطة · الشكل 11a-4', 'Simple machine · Figure 4-11a'],
    params: [
      { k: 'xf', label: ['موضع نقطة الارتكاز', 'Fulcrum position'], min: -1.2, max: 1.4, step: 0.05, def: -0.6, unit: 'm' },
      { k: 'm', label: ['كتلة الحمل', 'Load mass'], min: 5, max: 120, step: 1, def: 60, unit: 'kg' },
      { k: 'eff', label: ['الكفاءة e', 'Efficiency e'], min: 50, max: 100, step: 1, def: 90, unit: '%' },
    ],
    compute(p) {
      const armR = p.xf + 1.7, armE = 1.9 - p.xf, dth = 2 * 10 * Math.PI / 180, Fr = p.m * G, IMA = armE / armR, MA = IMA * p.eff / 100, Fe = Fr / MA, dr = armR * dth, de = armE * dth;
      return { armR, armE, Fr, IMA, MA, Fe, dr, de, Wo: Fr * dr, Wi: Fe * de };
    },
    big: (r) => ({ k: 'MA', v: fmt(r.MA, 3) }),
    cards: (r, p) => [['r', ['المقاومة Fᵣ', 'Resistance Fᵣ'], fmt(r.Fr, 3), 'N'], ['e', ['القوة Fₑ', 'Effort Fₑ'], fmt(r.Fe, 3), 'N'], ['r', ['dᵣ إزاحة المقاومة', 'dᵣ load distance'], fmt(r.dr * 100, 3), 'cm'], ['e', ['dₑ إزاحة القوة', 'dₑ effort distance'], fmt(r.de * 100, 3), 'cm'], ['k', ['IMA = dₑ/dᵣ', 'IMA = dₑ/dᵣ'], fmt(r.IMA, 3), ''], ['k', ['الكفاءة e', 'Efficiency e'], p.eff, '%']],
    chart: (p) => { const pts = []; for (let x = -1.2; x <= 1.401; x += 0.05) pts.push([x, p.m * G / ((1.9 - x) / (x + 1.7) * p.eff / 100)]); return { series: [{ pts }], mark: [p.xf, p.m * G / ((1.9 - p.xf) / (p.xf + 1.7) * p.eff / 100)], xLabel: NL.lang === 'ar' ? 'موضع الارتكاز (m)' : 'fulcrum (m)', yLabel: 'Fₑ (N)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); S.root.add(g);
      const fulcrum = mesh(new THREE.ConeGeometry(0.32, 0.6, 3), mat(C.metal, { m: 0.5, r: 0.3 })); fulcrum.rotation.y = Math.PI / 6; g.add(fulcrum);
      const pivot = new THREE.Group(); g.add(pivot);
      const beam = box(4, 0.09, 0.32, mat(0x8a5a2b, { r: 0.7 })); pivot.add(beam);
      const load = box(0.55, 0.5, 0.55, mat(C.wood, { r: 0.8 })); pivot.add(load);
      const hand = mesh(new THREE.SphereGeometry(0.11, 20, 16), mat(C.sig, { e: C.sig, ei: 0.4 })); pivot.add(hand);
      const aR = arrow(C.red), aE = arrow(C.sig), aRu = arrow(C.red); g.add(aR, aE);
      const lR = label('', 'r'), lE = label('', 'e'), lF = label(NL.lang === 'ar' ? 'نقطة الارتكاز' : 'Fulcrum', 'k'), lDr = label('', 'r sm'), lDe = label('', 'e sm');
      g.add(lR, lE, lF, lDr, lDe);
      const trailR = rod(0.012, mat(C.red, { op: 0.6 })), trailE = rod(0.012, mat(C.sig, { op: 0.6 })); g.add(trailR, trailE);
      return {
        update(p, r, k) {
          fulcrum.position.set(p.xf, 0.3, 0); pivot.position.set(p.xf, 0.64, 0); beam.position.set(-p.xf, 0, 0);
          const th = (ease(ping(k)) * 2 - 1) * 10 * Math.PI / 180; // −10° → +10°
          pivot.rotation.z = -th;
          load.position.set(-1.7 - p.xf, 0.3, 0); load.scale.setScalar(0.7 + p.m / 200);
          hand.position.set(1.9 - p.xf, 0.12, 0);
          pivot.updateMatrixWorld();
          const lp = load.getWorldPosition(V(0, 0, 0)), hp = hand.getWorldPosition(V(0, 0, 0));
          aR.set(lp.clone().add(V(0, 0.35, 0)), V(0, -1, 0), 0.4 + r.Fr / 900);
          aE.set(hp.clone().add(V(0, 0.2 + 0.4 + r.Fe / 900, 0)), V(0, -1, 0), 0.4 + r.Fe / 900);
          lR.position.copy(lp).add(V(-0.1, 1.05 + r.Fr / 900, 0)); lR.set(`Fᵣ = ${fmt(r.Fr, 3)} N`);
          lE.position.copy(hp).add(V(0.1, 1.0 + r.Fe / 900, 0)); lE.set(`Fₑ = ${fmt(r.Fe, 3)} N`);
          lF.position.set(p.xf, -0.15, 0.5);
          const yL0 = 0.64 + 0.09 / 2 - Math.sin(-10 * Math.PI / 180) * -(r.armR), yE0 = 0.64 - Math.sin(10 * Math.PI / 180) * r.armE;
          trailR.between(V(-1.7, 0.64 - r.armR * Math.sin(10 * Math.PI / 180), 0.45), V(-1.7, 0.64 + r.armR * Math.sin(10 * Math.PI / 180), 0.45));
          trailE.between(V(1.9, 0.64 - r.armE * Math.sin(10 * Math.PI / 180), 0.45), V(1.9, 0.64 + r.armE * Math.sin(10 * Math.PI / 180), 0.45));
          lDr.position.set(-1.95, 0.64, 0.5); lDr.set(`dᵣ ${fmt(r.dr * 100, 3)} cm`);
          lDe.position.set(2.2, 0.64, 0.5); lDe.set(`dₑ ${fmt(r.de * 100, 3)} cm`);
          void yL0; void yE0;
        },
      };
    },
    steps: [
      { cam: [0.2, 2.2, 6.2], at: [0, 0.6, 0], text: (p, r) => NL.lang === 'ar' ? 'الرافعة قضيب صلب يدور حول **نقطة ارتكاز**. نؤثر بقوة صغيرة في طرف، فترفع حملًا ثقيلًا في الطرف الآخر.' : 'A lever is a rigid bar turning about a **fulcrum**. A small effort at one end lifts a heavy load at the other.' },
      { cam: [-2.6, 1.8, 3.6], at: [-1.6, 0.8, 0], text: (p, r) => NL.lang === 'ar' ? `**المقاومة** $F_r$ هي القوة التي تؤثر بها الآلة: هنا وزن الصندوق $mg$ = ${fmt(r.Fr)} N.` : `The **resistance** $F_r$ is the force the machine exerts: here the box’s weight $mg$ = ${fmt(r.Fr)} N.` },
      { cam: [2.8, 1.8, 3.6], at: [1.6, 0.6, 0], text: (p, r) => NL.lang === 'ar' ? `**القوة المسلطة** $F_e$ هي قوة يدك. لأن ذراعها أطول، تحتاج فقط ${fmt(r.Fe)} N، فتكون $MA = F_r/F_e$ = ${fmt(r.MA)}.` : `The **effort** $F_e$ is your hand’s force. Its arm is longer, so you need only ${fmt(r.Fe)} N, giving $MA = F_r/F_e$ = ${fmt(r.MA)}.` },
      { cam: [0, 1.2, 5.2], at: [0, 0.7, 0], text: (p, r) => NL.lang === 'ar' ? `لاحظ المسارين: يدك تتحرك $d_e$ = ${fmt(r.de * 100)} cm بينما يرتفع الحمل $d_r$ = ${fmt(r.dr * 100)} cm فقط. **القوة الأقل تُدفع ثمنها مسافةً أكبر.** $IMA = d_e/d_r$ = ${fmt(r.IMA)}.` : `Watch both paths: your hand moves $d_e$ = ${fmt(r.de * 100)} cm while the load rises only $d_r$ = ${fmt(r.dr * 100)} cm. **Less force costs more distance.** $IMA = d_e/d_r$ = ${fmt(r.IMA)}.` },
      { cam: [1.5, 3.2, 5.5], at: [0, 0.6, 0], text: (p, r) => NL.lang === 'ar' ? `الشغل المبذول $W_i$ = ${fmt(r.Wi)} J أكبر من الناتج $W_o$ = ${fmt(r.Wo)} J، والكفاءة $e = MA/IMA \\times 100$ = ${p.eff}%. **حرّك نقطة الارتكاز نحو الحمل** وشاهد القوة تقل.` : `Input work $W_i$ = ${fmt(r.Wi)} J exceeds output $W_o$ = ${fmt(r.Wo)} J; efficiency $e = MA/IMA \\times 100$ = ${p.eff}%. **Move the fulcrum toward the load** and watch the effort drop.` },
    ],
  });

  SCENES.push({
    id: 'pulley', title: ['البكرات', 'Pulleys'], sub: ['البكرة الثابتة ونظام البكرات · الشكل 10-4', 'Fixed pulley and block and tackle · Figure 4-10'],
    params: [
      { k: 'N', label: ['عدد الحبال الحاملة', 'Supporting segments'], min: 1, max: 4, step: 1, def: 2, unit: '' },
      { k: 'm', label: ['كتلة الحمل', 'Load mass'], min: 5, max: 80, step: 0.5, def: 24, unit: 'kg' },
      { k: 'eff', label: ['الكفاءة e', 'Efficiency e'], min: 50, max: 100, step: 1, def: 91, unit: '%' },
    ],
    compute(p) { const N = Math.round(p.N), Fr = p.m * G, MA = N * p.eff / 100, Fe = Fr / MA, dr = 1.0; return { N, Fr, IMA: N, MA, Fe, dr, de: N * dr, Wo: Fr * dr, Wi: Fe * N * dr }; },
    big: (r) => ({ k: 'Fₑ', v: fmt(r.Fe, 3) + ' N' }),
    cards: (r, p) => [['r', ['المقاومة Fᵣ', 'Resistance Fᵣ'], fmt(r.Fr, 3), 'N'], ['e', ['القوة Fₑ', 'Effort Fₑ'], fmt(r.Fe, 3), 'N'], ['k', ['IMA = عدد الحبال', 'IMA = segments'], r.IMA, ''], ['k', ['MA', 'MA'], fmt(r.MA, 3), ''], ['r', ['رفع الحمل dᵣ', 'Load rise dᵣ'], '1.00', 'm'], ['e', ['سحب الحبل dₑ', 'Rope pulled dₑ'], fmt(r.de, 3), 'm']],
    chart: (p) => { const pts = [1, 2, 3, 4].map((N) => [N, p.m * G / (N * p.eff / 100)]); return { series: [{ pts }], mark: [Math.round(p.N), p.m * G / (Math.round(p.N) * p.eff / 100)], xLabel: NL.lang === 'ar' ? 'عدد الحبال' : 'segments', yLabel: 'Fₑ (N)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); S.root.add(g);
      const beam = box(3.2, 0.18, 0.5, mat(C.dark, { m: 0.5 })); beam.position.set(0, 4.1, 0); g.add(beam);
      const wm = mat(0x6d7fa3, { m: 0.6, r: 0.35 });
      const wheels = Array.from({ length: 4 }, () => { const w = wheel(0.28, 0.12, wm); g.add(w); return w; });
      const plate = box(1, 0.08, 0.3, mat(C.dark, { m: 0.5 })); g.add(plate);
      const hook = rod(0.03, mat(C.metal)); g.add(hook);
      const load = box(0.7, 0.55, 0.6, mat(C.wood, { r: 0.8 })); g.add(load);
      const ropes = Array.from({ length: 6 }, () => rod(0.022, mat(C.rope, { r: 0.9 }))); ropes.forEach((x) => g.add(x));
      const handle = mesh(new THREE.SphereGeometry(0.1, 16, 12), mat(C.sig, { e: C.sig, ei: 0.4 })); g.add(handle);
      const aE = arrow(C.sig), aR = arrow(C.red); g.add(aE, aR);
      const lE = label('', 'e'), lR = label('', 'r'), lN = label('', 'k'); g.add(lE, lR, lN);
      return {
        update(p, r, k) {
          // the rope zigzags: N vertical segments hold the moving block, wheels sit between neighbouring segments,
          // alternating top (fixed) and bottom (moving); the last wheel is always fixed so the free end comes down to the hand
          const N = r.N, lift = ease(ping(k)) * 0.5, top = 3.75, D = 0.56, x0 = -(N * D) / 2;
          // the hand moves exactly N times as far as the load (IMA = dₑ/dᵣ = N)
          const movY = 2.0 + lift, handY = 3.3 - lift * N, firstTop = N % 2 === 1;
          const xs = Array.from({ length: N + 1 }, (_, i) => x0 + i * D);
          ropes.forEach((x) => (x.visible = false)); wheels.forEach((w) => (w.visible = false));
          const bottoms = [];
          for (let i = 0; i < N; i++) {
            const isTop = (i % 2 === 0) === firstTop, w = wheels[i], cx = (xs[i] + xs[i + 1]) / 2;
            w.visible = true; w.position.set(cx, isTop ? top : movY, 0); w.rotation.z = (isTop ? -1 : 1) * lift * N * 3;
            if (!isTop) bottoms.push(cx);
          }
          for (let i = 0; i < N; i++) { ropes[i].visible = true; ropes[i].between(V(xs[i], top, 0), V(xs[i], movY, 0)); }
          ropes[N].visible = true; ropes[N].between(V(xs[N], top, 0), V(xs[N], handY, 0));
          const lx = N === 1 ? xs[0] : (xs[0] + xs[N - 1]) / 2;
          plate.visible = N > 1; plate.scale.set(Math.max(0.3, xs[N - 1] - xs[0] + 0.2), 1, 1); plate.position.set(lx, movY - (N > 1 ? 0.32 : 0), 0);
          const loadY = N === 1 ? movY - 0.3 : movY - 0.95;
          load.position.set(lx, loadY, 0); load.scale.setScalar(0.75 + p.m / 160);
          hook.visible = N > 1; if (N > 1) hook.between(V(lx, movY - 0.36, 0), V(lx, loadY + 0.28, 0));
          handle.position.set(xs[N], handY, 0);
          aE.set(handle.position.clone().add(V(0, -0.15, 0)), V(0, -1, 0), 0.4 + r.Fe / 500);
          aR.set(load.position.clone().add(V(0, -0.35, 0)), V(0, -1, 0), 0.4 + r.Fr / 500);
          lE.position.copy(handle.position).add(V(0.6, -0.4, 0)); lE.set(`Fₑ = ${fmt(r.Fe, 3)} N`);
          lR.position.copy(load.position).add(V(-1.0, -0.2, 0)); lR.set(`Fᵣ = ${fmt(r.Fr, 3)} N`);
          lN.position.set(x0 - 0.9, 3.0, 0); lN.set(N === 1 ? (NL.lang === 'ar' ? 'بكرة ثابتة: IMA = 1' : 'Fixed pulley: IMA = 1') : (NL.lang === 'ar' ? `${N} حبال تحمل البكرة المتحركة` : `${N} segments hold the moving block`));
          void bottoms;
        },
      };
    },
    steps: [
      { cam: [0, 2.6, 6.4], at: [0, 2.4, 0], text: (p, r) => NL.lang === 'ar' ? 'البكرة عجلة يمر عليها حبل. تبدأ هنا ببكرة ثابتة إذا جعلت عدد الحبال 1، أو بنظام بكرات فيه بكرة متحركة.' : 'A pulley is a wheel with a rope over it. Set segments to 1 for a fixed pulley, or more for a block and tackle with a moving pulley.' },
      { cam: [-1.8, 2.2, 4.4], at: [-0.2, 2.0, 0], text: (p, r) => NL.lang === 'ar' ? 'في البكرة الثابتة $F_e = F_r$ تقريبًا و $MA = 1$. فائدتها **تغيير اتجاه القوة**: تسحب للأسفل فيرتفع الحمل.' : 'With a fixed pulley $F_e \\approx F_r$ and $MA = 1$. It helps by **changing the direction**: pull down, the load goes up.' },
      { cam: [1.8, 2.6, 4.6], at: [0, 2.6, 0], text: (p, r) => NL.lang === 'ar' ? `الآن ${r.N} حبال تتقاسم الحمل، فكل حبل يحمل تقريبًا ${fmt(r.Fr / r.N)} N. لذلك $IMA$ = ${r.N}.` : `Now ${r.N} segments share the load, each carrying about ${fmt(r.Fr / r.N)} N. So $IMA$ = ${r.N}.` },
      { cam: [2.6, 1.6, 4.2], at: [0.4, 1.4, 0], text: (p, r) => NL.lang === 'ar' ? `الثمن: لرفع الحمل 1 m تسحب الحبل ${fmt(r.de)} m. $IMA = d_e/d_r$. ومع الاحتكاك تصبح $MA$ = ${fmt(r.MA)} وتحتاج ${fmt(r.Fe)} N.` : `The price: to raise the load 1 m you pull ${fmt(r.de)} m of rope. $IMA = d_e/d_r$. With friction $MA$ = ${fmt(r.MA)} and you need ${fmt(r.Fe)} N.` },
      { cam: [0, 3.4, 6.8], at: [0, 2.2, 0], text: (p, r) => NL.lang === 'ar' ? 'جرّب: 24 kg وحبلين وكفاءة 91% تعطي نحو 129 N، وهي أرقام المسألة 26 في كتابك.' : 'Try 24 kg, 2 segments and 91% efficiency: about 129 N, the numbers of problem 26 in your book.' },
    ],
  });

  SCENES.push({
    id: 'wheel', title: ['العجلة والمحور', 'Wheel and axle'], sub: ['عجلة القيادة والونش · الشكل 12-4', 'Steering wheel and winch · Figure 4-12'],
    params: [
      { k: 're', label: ['نصف قطر العجلة rₑ', 'Wheel radius rₑ'], min: 15, max: 60, step: 1, def: 45, unit: 'cm' },
      { k: 'rr', label: ['نصف قطر المحور rᵣ', 'Axle radius rᵣ'], min: 3, max: 15, step: 0.5, def: 7.5, unit: 'cm' },
      { k: 'Fr', label: ['المقاومة Fᵣ', 'Resistance Fᵣ'], min: 100, max: 1500, step: 10, def: 750, unit: 'N' },
      { k: 'eff', label: ['الكفاءة e', 'Efficiency e'], min: 50, max: 100, step: 1, def: 75, unit: '%' },
    ],
    compute(p) { const IMA = p.re / p.rr, MA = IMA * p.eff / 100; return { IMA, MA, Fe: p.Fr / MA, de: 2 * Math.PI * p.re, dr: 2 * Math.PI * p.rr }; },
    big: (r) => ({ k: 'IMA', v: fmt(r.IMA, 3) }),
    cards: (r, p) => [['r', ['المقاومة Fᵣ', 'Resistance Fᵣ'], fmt(p.Fr, 3), 'N'], ['e', ['القوة Fₑ', 'Effort Fₑ'], fmt(r.Fe, 3), 'N'], ['e', ['مسار اليد/دورة', 'Hand path/turn'], fmt(r.de, 3), 'cm'], ['r', ['ارتفاع الحمل/دورة', 'Load rise/turn'], fmt(r.dr, 3), 'cm'], ['k', ['IMA = rₑ/rᵣ', 'IMA = rₑ/rᵣ'], fmt(r.IMA, 3), ''], ['k', ['MA', 'MA'], fmt(r.MA, 3), '']],
    chart: (p) => { const pts = []; for (let re = 15; re <= 60; re++) pts.push([re, p.Fr / (re / p.rr * p.eff / 100)]); return { series: [{ pts }], mark: [p.re, p.Fr / (p.re / p.rr * p.eff / 100)], xLabel: 'rₑ (cm)', yLabel: 'Fₑ (N)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); S.root.add(g);
      const postM = mat(C.dark, { m: 0.5 });
      [-0.45, 0.45].forEach((z) => { const post = box(0.16, 2.6, 0.16, postM); post.position.set(0, 1.3, z); g.add(post); });
      const rot = new THREE.Group(); rot.position.set(0, 2.5, 0); g.add(rot);
      const rim = mesh(new THREE.TorusGeometry(1, 0.06, 16, 80), mat(0x39465f, { m: 0.4, r: 0.4 })); rim.position.z = 0.32; rot.add(rim);
      const spokes = Array.from({ length: 3 }, (_, i) => { const s = box(1, 0.07, 0.07, mat(C.metal, { m: 0.6 })); s.position.z = 0.32; rot.add(s); return s; });
      const axle = cyl(0.2, 0.2, 0.62, mat(C.acc, { m: 0.5, r: 0.35 })); axle.rotation.x = Math.PI / 2; rot.add(axle);
      const stripe = box(0.05, 0.05, 0.63, mat(C.dark)); rot.add(stripe);
      const rope = rod(0.02, mat(C.rope, { r: 0.9 })); g.add(rope);
      const load = box(0.55, 0.45, 0.5, mat(C.wood, { r: 0.8 })); g.add(load);
      const hand = mesh(new THREE.SphereGeometry(0.1, 16, 12), mat(C.sig, { e: C.sig, ei: 0.4 })); rot.add(hand);
      const aE = arrow(C.sig), aR = arrow(C.red); g.add(aE, aR);
      const lE = label('', 'e'), lR = label('', 'r'), lre = label('', 'k sm'), lrr = label('', 'k sm'); g.add(lE, lR, lre, lrr);
      const radE = rod(0.008, mat(C.sig)), radR = rod(0.008, mat(C.acc)); g.add(radE, radR);
      return {
        update(p, r, k) {
          const s = 1 / 45, Re = p.re * s, Rr = p.rr * s, phi = ease(ping(k)) * Math.PI * 2;
          rim.geometry.dispose(); rim.geometry = new THREE.TorusGeometry(Re, 0.06, 16, 80);
          spokes.forEach((sp, i) => { sp.scale.set(Re * 2, 1, 1); sp.rotation.z = i * Math.PI / 3; });
          axle.scale.set(Rr / 0.2, 1, Rr / 0.2);
          rot.rotation.z = phi;
          hand.position.set(Re * Math.cos(-0.0), Re * Math.sin(0), 0.32);
          const loadY = 0.55 + phi * Rr * 0.9;
          rope.between(V(-Rr, 2.5, 0), V(-Rr, loadY + 0.22, 0)); load.position.set(-Rr, loadY, 0);
          const hp = hand.getWorldPosition(V(0, 0, 0));
          aE.set(hp.clone().add(V(0.14, 0, 0)), V(Math.sin(phi), -Math.cos(phi), 0), 0.4 + r.Fe / 400);
          aR.set(V(-Rr, loadY - 0.25, 0), V(0, -1, 0), 0.4 + p.Fr / 900);
          lE.position.copy(hp).add(V(0.7, -0.5, 0)); lE.set(`Fₑ = ${fmt(r.Fe, 3)} N`);
          lR.position.set(-Rr - 0.9, loadY - 0.2, 0); lR.set(`Fᵣ = ${fmt(p.Fr, 3)} N`);
          radE.between(V(0, 2.5, 0.45), V(Re, 2.5, 0.45)); radR.between(V(0, 2.5, 0.45), V(-Rr, 2.5, 0.45));
          lre.position.set(Re / 2, 2.62, 0.45); lre.set(`rₑ = ${p.re} cm`); lrr.position.set(-Rr - 0.15, 2.75, 0.45); lrr.set(`rᵣ = ${p.rr} cm`);
        },
      };
    },
    steps: [
      { cam: [0.4, 2.8, 5.4], at: [0, 2.1, 0], text: () => NL.lang === 'ar' ? 'العجلة والمحور: عجلة كبيرة مثبتة على محور صغير، يدوران معًا. تؤثر القوة على حافة العجلة، والمقاومة على المحور.' : 'Wheel and axle: a large wheel fixed to a small axle; they turn together. The effort acts on the rim, the resistance on the axle.' },
      { cam: [1.6, 3, 3.2], at: [0.2, 2.5, 0], text: (p, r) => NL.lang === 'ar' ? `في دورة كاملة تقطع يدك $2\\pi r_e$ = ${fmt(r.de)} cm، ويرتفع الحمل $2\\pi r_r$ = ${fmt(r.dr)} cm فقط.` : `In one full turn your hand travels $2\\pi r_e$ = ${fmt(r.de)} cm while the load rises only $2\\pi r_r$ = ${fmt(r.dr)} cm.` },
      { cam: [-1.2, 2.4, 3.8], at: [-0.2, 1.6, 0], text: (p, r) => NL.lang === 'ar' ? `لذلك $IMA = d_e/d_r = r_e/r_r$ = ${fmt(r.IMA)}. هذه هي الفائدة المثالية لعجلة القيادة في كتابك.` : `So $IMA = d_e/d_r = r_e/r_r$ = ${fmt(r.IMA)}. That is the steering wheel’s ideal advantage in your book.` },
      { cam: [0, 2.2, 5.8], at: [0, 1.8, 0], text: (p, r) => NL.lang === 'ar' ? `بكفاءة ${p.eff}% تصبح $MA$ = ${fmt(r.MA)}، فتحتاج ${fmt(r.Fe)} N لتؤثر بـ ${p.Fr} N في الحبل. جرّب أرقام المسألة 28: 45 cm و7.5 cm و75%.` : `At ${p.eff}% efficiency $MA$ = ${fmt(r.MA)}, so ${fmt(r.Fe)} N gives ${p.Fr} N on the rope. Try problem 28’s numbers: 45 cm, 7.5 cm, 75%.` },
    ],
  });

  SCENES.push({
    id: 'incline', title: ['المستوى المائل', 'Inclined plane'], sub: ['آلة بسيطة · الشكل 11d-4', 'Simple machine · Figure 4-11d'],
    params: [
      { k: 'th', label: ['زاوية الميل', 'Ramp angle'], min: 8, max: 50, step: 1, def: 20, unit: '°' },
      { k: 'm', label: ['كتلة الصندوق', 'Box mass'], min: 5, max: 120, step: 1, def: 50, unit: 'kg' },
      { k: 'eff', label: ['الكفاءة e', 'Efficiency e'], min: 40, max: 100, step: 1, def: 80, unit: '%' },
    ],
    compute(p) { const s = Math.sin(p.th * Math.PI / 180), L = 4, h = L * s, Fr = p.m * G, IMA = 1 / s, MA = IMA * p.eff / 100; return { L, h, Fr, IMA, MA, Fe: Fr / MA, Wo: Fr * h, Wi: Fr / MA * L }; },
    big: (r) => ({ k: 'Fₑ', v: fmt(r.Fe, 3) + ' N' }),
    cards: (r, p) => [['r', ['المقاومة Fᵣ = mg', 'Resistance Fᵣ = mg'], fmt(r.Fr, 3), 'N'], ['e', ['القوة على المنحدر Fₑ', 'Effort along ramp Fₑ'], fmt(r.Fe, 3), 'N'], ['e', ['طول المنحدر dₑ', 'Ramp length dₑ'], '4.00', 'm'], ['r', ['الارتفاع dᵣ', 'Height dᵣ'], fmt(r.h, 3), 'm'], ['k', ['IMA = dₑ/dᵣ', 'IMA = dₑ/dᵣ'], fmt(r.IMA, 3), ''], ['k', ['MA', 'MA'], fmt(r.MA, 3), '']],
    chart: (p) => { const pts = []; for (let a = 8; a <= 50; a++) pts.push([a, p.m * G * Math.sin(a * Math.PI / 180) / (p.eff / 100)]); return { series: [{ pts }], mark: [p.th, p.m * G * Math.sin(p.th * Math.PI / 180) / (p.eff / 100)], xLabel: NL.lang === 'ar' ? 'الزاوية (°)' : 'angle (°)', yLabel: 'Fₑ (N)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); S.root.add(g);
      let ramp = null; const rampM = mat(0x4a5878, { r: 0.6 });
      const crate = box(0.5, 0.42, 0.5, mat(C.wood, { r: 0.8 })); g.add(crate);
      const aE = arrow(C.sig), aW = arrow(C.red); g.add(aE, aW);
      const lE = label('', 'e'), lW = label('', 'r'), lh = label('', 'r sm'), lL = label('', 'e sm'); g.add(lE, lW, lh, lL);
      const hLine = rod(0.01, mat(C.red, { op: 0.7 })); g.add(hLine);
      let lastTh = null;
      return {
        update(p, r, k) {
          const th = p.th * Math.PI / 180, base = r.L * Math.cos(th), x0 = -base / 2;
          if (lastTh !== p.th) {
            if (ramp) { g.remove(ramp); ramp.geometry.dispose(); }
            const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(base, 0); sh.lineTo(base, r.h); sh.closePath();
            ramp = mesh(new THREE.ExtrudeGeometry(sh, { depth: 1.2, bevelEnabled: false }), rampM); ramp.position.set(x0, 0, -0.6); g.add(ramp); lastTh = p.th;
          }
          const s = 0.35 + ease(ping(k)) * (r.L - 0.8), cx = x0 + s * Math.cos(th), cy = s * Math.sin(th);
          const nrm = V(-Math.sin(th), Math.cos(th), 0), along = V(Math.cos(th), Math.sin(th), 0);
          crate.position.set(cx, cy, 0).add(nrm.clone().multiplyScalar(0.22)); crate.rotation.z = th;
          aE.set(crate.position.clone().add(along.clone().multiplyScalar(0.3)), along, 0.4 + r.Fe / 400);
          aW.set(crate.position.clone(), V(0, -1, 0), 0.4 + r.Fr / 900);
          lE.position.copy(crate.position).add(along.clone().multiplyScalar(1.1)).add(V(0, 0.35, 0)); lE.set(`Fₑ = ${fmt(r.Fe, 3)} N`);
          lW.position.copy(crate.position).add(V(-0.5, -0.9, 0)); lW.set(`Fᵣ = ${fmt(r.Fr, 3)} N`);
          hLine.between(V(x0 + base + 0.15, 0, 0.62), V(x0 + base + 0.15, r.h, 0.62)); lh.position.set(x0 + base + 0.5, r.h / 2, 0.62); lh.set(`dᵣ = ${fmt(r.h, 3)} m`);
          lL.position.set(0, r.h / 2 + 0.5, 0.62); lL.set('dₑ = 4.00 m');
        },
      };
    },
    steps: [
      { cam: [0.5, 2.0, 6.2], at: [0, 0.8, 0], text: () => NL.lang === 'ar' ? 'المستوى المائل سطح منحدر. بدل رفع الصندوق رأسيًا، ندفعه على مسافة أطول بقوة أصغر.' : 'An inclined plane is a sloped surface. Instead of lifting the box straight up, we push it a longer distance with less force.' },
      { cam: [3.2, 1.6, 3.4], at: [1.4, 0.8, 0], text: (p, r) => NL.lang === 'ar' ? `المسافة التي تؤثر عليها القوة هي طول المنحدر 4 m، والإزاحة الرأسية للحمل هي الارتفاع ${fmt(r.h)} m، لذلك $IMA = d_e/d_r$ = ${fmt(r.IMA)}.` : `The effort acts over the ramp’s 4 m length, while the load rises the height ${fmt(r.h)} m, so $IMA = d_e/d_r$ = ${fmt(r.IMA)}.` },
      { cam: [-2.4, 1.8, 4.2], at: [-0.4, 0.6, 0], text: (p, r) => NL.lang === 'ar' ? `بكفاءة ${p.eff}% تحتاج ${fmt(r.Fe)} N بدل ${fmt(r.Fr)} N. **اخفض الزاوية** وشاهد القوة تقل والمسار يصبح أطول نسبةً للارتفاع.` : `At ${p.eff}% efficiency you need ${fmt(r.Fe)} N instead of ${fmt(r.Fr)} N. **Lower the angle** and the effort drops while the path grows relative to the height.` },
    ],
  });

  SCENES.push({
    id: 'bike', title: ['الدراجة: آلة مركبة', 'Bicycle: compound machine'], sub: ['MA = MA₁ × MA₂ · الشكل 13-4 · مثال 4', 'MA = MA₁ × MA₂ · Figure 4-13 · Example 4'],
    params: [
      { k: 'nf', label: ['أسنان الناقل الأمامي', 'Front teeth'], min: 22, max: 52, step: 1, def: 42, unit: '' },
      { k: 'nr', label: ['أسنان الناقل الخلفي', 'Rear teeth'], min: 11, max: 34, step: 1, def: 21, unit: '' },
      { k: 'L', label: ['ذراع الدواسة', 'Crank length'], min: 12, max: 20, step: 0.5, def: 17, unit: 'cm' },
      { k: 'Fe', label: ['قوة القدم', 'Foot force'], min: 100, max: 800, step: 10, def: 300, unit: 'N' },
    ],
    compute(p) { const R = 35.6, eff = 95, IMA1 = p.L / (p.nf * 0.2), IMA = (p.nr / p.nf) * (p.L / R), MA = IMA * eff / 100; return { R, eff, IMA, MA, Froad: MA * p.Fe, perTurn: 2 * Math.PI * R * p.nf / p.nr / 100, ratio: p.nf / p.nr, IMA1 }; },
    big: (r) => ({ k: 'MA', v: fmt(r.MA, 3) }),
    cards: (r, p) => [['e', ['قوة القدم Fₑ', 'Foot force Fₑ'], p.Fe, 'N'], ['r', ['الإطار على الطريق', 'Tire on road'], fmt(r.Froad, 3), 'N'], ['k', ['IMA', 'IMA'], fmt(r.IMA, 3), ''], ['k', ['MA (e = 95%)', 'MA (e = 95%)'], fmt(r.MA, 3), ''], ['e', ['دورات الإطار/دورة دواسة', 'Wheel turns/pedal turn'], fmt(r.ratio, 3), ''], ['r', ['مسافة لكل دورة دواسة', 'Distance per pedal turn'], fmt(r.perTurn, 3), 'm']],
    chart: (p) => { const pts = []; for (let n = 11; n <= 34; n++) pts.push([n, (n / p.nf) * (p.L / 35.6) * 0.95 * p.Fe]); return { series: [{ pts }], mark: [p.nr, (p.nr / p.nf) * (p.L / 35.6) * 0.95 * p.Fe], xLabel: NL.lang === 'ar' ? 'أسنان الخلفي' : 'rear teeth', yLabel: NL.lang === 'ar' ? 'قوة الإطار (N)' : 'tire force (N)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); S.root.add(g);
      const tireM = mat(0x1d2433, { r: 0.9 }), frameM = mat(0x3f6ad8, { m: 0.5, r: 0.3 }), steel = mat(C.metal, { m: 0.7, r: 0.3 });
      const mkWheel = (x) => { const w = new THREE.Group(); w.position.set(x, 1, 0); const tire = mesh(new THREE.TorusGeometry(0.95, 0.07, 14, 72), tireM); w.add(tire); for (let i = 0; i < 16; i++) { const s = rod(0.007, steel); const a = i / 16 * Math.PI * 2; s.between(V(0, 0, 0), V(Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0)); w.add(s); } g.add(w); return w; };
      const rear = mkWheel(-1.55), front = mkWheel(1.55);
      const bb = V(0.15, 0.78, 0);
      const tubes = [[V(-1.55, 1, 0), bb], [bb, V(0.75, 2.0, 0)], [V(-1.55, 1, 0), V(-0.25, 2.0, 0)], [V(-0.25, 2.0, 0), bb], [V(-0.25, 2.0, 0), V(0.75, 2.0, 0)], [V(0.75, 2.0, 0), V(1.55, 1, 0)]];
      tubes.forEach(([a, b]) => { const r0 = rod(0.04, frameM); r0.between(a, b); g.add(r0); });
      const seat = box(0.42, 0.08, 0.18, mat(0x222a3a)); seat.position.set(-0.3, 2.12, 0); g.add(seat);
      const groundM = mat(0x1a2236, { r: 0.95 }); const road = box(7, 0.04, 2, groundM); road.position.set(0, 0.0, 0); road.receiveShadow = true; g.add(road);
      let fg = null, rg = null, lastF = 0, lastR = 0;
      const crank = new THREE.Group(); crank.position.copy(bb); crank.position.z = 0.12; g.add(crank);
      const arm = box(1, 0.07, 0.05, steel); crank.add(arm); const pedal = box(0.12, 0.05, 0.26, mat(0x222a3a)); crank.add(pedal);
      const links = Array.from({ length: 70 }, () => { const l = box(0.05, 0.022, 0.04, mat(0xc8ccd6, { m: 0.8, r: 0.25 })); l.castShadow = false; g.add(l); return l; });
      const aE = arrow(C.sig), aR = arrow(C.red); g.add(aE, aR);
      const lE = label('', 'e'), lR = label('', 'r'), lG = label('', 'k sm'); g.add(lE, lR, lG);
      let spin = 0;
      return {
        update(p, r, k, dt, playing) {
          const rf = p.nf * 0.0072, rr = p.nr * 0.0072, L = p.L * 0.022;
          if (lastF !== p.nf) { if (fg) g.remove(fg); fg = wheel(rf, 0.03, mat(C.acc, { m: 0.6, r: 0.3 }), p.nf); fg.position.set(bb.x, bb.y, 0.06); g.add(fg); lastF = p.nf; }
          if (lastR !== p.nr) { if (rg) g.remove(rg); rg = wheel(rr, 0.03, mat(C.acc, { m: 0.6, r: 0.3 }), p.nr); rg.position.set(-1.55, 1, 0.06); g.add(rg); lastR = p.nr; }
          spin += (playing ? 1 : 0.35) * dt * 1.6;
          const ph = -spin, wh = ph * p.nf / p.nr;
          fg.rotation.z = ph; rg.rotation.z = wh; rear.rotation.z = wh; front.rotation.z = wh;
          crank.rotation.z = ph; arm.scale.set(L, 1, 1); arm.position.set(L / 2, 0, 0); pedal.position.set(L, 0, 0.12);
          // chain loop: top run, around the front ring, bottom run, around the rear cog
          const A = V(-1.55, 1, 0.06), B = V(bb.x, bb.y, 0.06), path = [];
          const dirAB = B.clone().sub(A).normalize(), n = V(-dirAB.y, dirAB.x, 0);
          const t1 = A.clone().add(n.clone().multiplyScalar(rr)), t2 = B.clone().add(n.clone().multiplyScalar(rf));
          const b1 = B.clone().add(n.clone().multiplyScalar(-rf)), b2 = A.clone().add(n.clone().multiplyScalar(-rr));
          const ang = Math.atan2(n.y, n.x);
          const seg = (p0, p1, steps) => { for (let i = 0; i < steps; i++) path.push(p0.clone().lerp(p1, i / steps)); };
          const arc = (c, rad, a0, a1, steps) => { for (let i = 0; i < steps; i++) { const a = a0 + (a1 - a0) * i / steps; path.push(V(c.x + Math.cos(a) * rad, c.y + Math.sin(a) * rad, 0.06)); } };
          seg(t1, t2, 30); arc(B, rf, ang, ang - Math.PI, 20); seg(b1, b2, 30); arc(A, rr, ang + Math.PI, ang, 14);
          const lens = [0]; for (let i = 1; i <= path.length; i++) lens.push(lens[i - 1] + path[i % path.length].distanceTo(path[i - 1]));
          const total = lens[path.length], off = ((-ph * rf) % total + total) % total;
          links.forEach((lk, i) => {
            let d = (off + i * total / links.length) % total, j = 0; while (lens[j + 1] < d) j++;
            const p0 = path[j], p1 = path[(j + 1) % path.length], f = (d - lens[j]) / Math.max(1e-6, lens[j + 1] - lens[j]);
            lk.position.copy(p0).lerp(p1, f); lk.rotation.z = Math.atan2(p1.y - p0.y, p1.x - p0.x);
          });
          const pp = pedal.getWorldPosition(V(0, 0, 0)), tang = V(Math.sin(-ph), -Math.cos(-ph), 0);
          aE.set(pp.clone().add(V(0, 0, 0.2)), V(-Math.sin(ph) * -1, -Math.cos(ph), 0).normalize(), 0.4 + p.Fe / 600);
          aR.set(V(-1.55, 0.05, 0.4), V(-1, 0, 0), 0.4 + r.Froad / 120);
          lE.position.copy(pp).add(V(0.4, 0.5, 0.2)); lE.set(`Fₑ = ${p.Fe} N`);
          lR.position.set(-2.4, 0.35, 0.4); lR.set(`${fmt(r.Froad, 3)} N`);
          lG.position.set(-0.7, 1.55, 0.4); lG.set(`${p.nf} ⟵ ${p.nr}`);
          void tang;
        },
      };
    },
    steps: [
      { cam: [0, 1.9, 6.6], at: [0, 1.1, 0], text: () => NL.lang === 'ar' ? 'الدراجة **آلة مركبة**: آلتان من نوع العجلة والمحور متصلتان بسلسلة. مقاومة الأولى هي القوة المسلطة على الثانية.' : 'A bicycle is a **compound machine**: two wheel-and-axle machines joined by a chain. The first one’s resistance is the second one’s effort.' },
      { cam: [1.6, 1.4, 2.6], at: [0.15, 0.8, 0], text: (p, r) => NL.lang === 'ar' ? `الآلة 1: الدواسة (ذراع ${p.L} cm) مع الناقل الأمامي (${p.nf} سنًا). قدمك تؤثر بـ ${p.Fe} N، والسلسلة تُسحب بقوة أكبر.` : `Machine 1: the pedal crank (${p.L} cm) with the front sprocket (${p.nf} teeth). Your foot pushes ${p.Fe} N and the chain is pulled harder.` },
      { cam: [-2.6, 1.5, 2.8], at: [-1.5, 1, 0], text: (p, r) => NL.lang === 'ar' ? `الآلة 2: الناقل الخلفي (${p.nr} سنًا) مع الإطار (35.6 cm). هنا تُضرب الفوائد: $MA = MA_1 \\times MA_2$ = ${fmt(r.MA)}.` : `Machine 2: the rear sprocket (${p.nr} teeth) with the tire (35.6 cm). The advantages multiply: $MA = MA_1 \\times MA_2$ = ${fmt(r.MA)}.` },
      { cam: [-1.4, 0.7, 3.6], at: [-1.4, 0.3, 0], text: (p, r) => NL.lang === 'ar' ? `الإطار يدفع الطريق للخلف بـ ${fmt(r.Froad)} N، والطريق يدفعه للأمام بالقوة نفسها (القانون الثالث لنيوتن). IMA أقل من 1، لكنك تقطع ${fmt(r.perTurn)} m في كل دورة دواسة.` : `The tire pushes the road back with ${fmt(r.Froad)} N and the road pushes it forward equally (Newton’s third law). IMA is below 1, but you cover ${fmt(r.perTurn)} m per pedal turn.` },
      { cam: [0.6, 2.6, 5.6], at: [0, 1, 0], text: () => NL.lang === 'ar' ? '**لصعود تل** كبّر الناقل الخلفي أو صغّر الأمامي: تزيد IMA والقوة. **للسرعة** صغّر الخلفي: تقل القوة وتزيد المسافة لكل دورة.' : '**To climb**, use a bigger rear or smaller front sprocket: IMA and force rise. **For speed**, use a smaller rear one: less force, more distance per turn.' },
    ],
  });

  /* ---------- energy scenes (lesson 5-1: forms of energy) ---------- */
  // live energy bars standing beside the scene: each bar grows up (or down, for negative values) from a base line
  function energyBars(g, x, base, defs) {
    const grp = new THREE.Group(); grp.position.set(x, base, 0); g.add(grp);
    const line = box(defs.length * 0.55 + 0.3, 0.02, 0.5, mat(0x8b97b0)); line.position.set((defs.length - 1) * 0.275, 0, 0); grp.add(line);
    const bars = defs.map(([name, color, cls], i) => {
      const b = box(0.36, 1, 0.36, mat(color, { e: color, ei: 0.35 })); b.position.x = i * 0.55; grp.add(b);
      const lb = label('', cls + ' sm'); grp.add(lb);
      const nm = label(name, cls + ' sm'); nm.position.set(i * 0.55, -0.22, 0.3); grp.add(nm);
      return { b, lb };
    });
    grp.set = (vals, scale) => vals.forEach((v, i) => {
      const h = Math.max(0.004, Math.abs(v) * scale), { b, lb } = bars[i];
      b.scale.y = h; b.position.y = v >= 0 ? h / 2 : -h / 2;
      lb.position.set(i * 0.55, v >= 0 ? h + 0.18 : -h - 0.42, 0.3); lb.set(`${fmt(v, 3)} J`);
    });
    return grp;
  }

  SCENES.push({
    id: 'throw', title: ['كرة تُقذف إلى أعلى', 'A ball thrown up'], sub: ['الطاقة الحركية وطاقة الوضع الجاذبية · الشكل 6-5', 'Kinetic and gravitational potential energy · Figure 5-6'],
    params: [
      { k: 'v0', label: ['سرعة القذف', 'Launch speed'], min: 3, max: 9, step: 0.1, def: 7, unit: 'm/s' },
      { k: 'm', label: ['كتلة الكرة', 'Ball mass'], min: 0.2, max: 3, step: 0.1, def: 0.6, unit: 'kg' },
      { k: 'ref', label: ['ارتفاع مستوى الإسناد فوق اليد', 'Reference level above the hand'], min: -1.2, max: 4, step: 0.05, def: 0, unit: 'm' },
    ],
    compute(p) { const hmax = p.v0 * p.v0 / (2 * G), KE0 = 0.5 * p.m * p.v0 * p.v0, PE0 = -p.m * G * p.ref, PEtop = p.m * G * (hmax - p.ref); return { hmax, KE0, PE0, PEtop, E: KE0 + PE0, T: 2 * p.v0 / G }; },
    big: (r) => ({ k: 'h', v: fmt(r.hmax, 3) + ' m' }),
    cards: (r, p) => [['k', ['KE عند القذف', 'KE at launch'], fmt(r.KE0, 3), 'J'], ['e', ['PE عند القذف', 'PE at launch'], fmt(r.PE0, 3), 'J'], ['e', ['PE عند القمة', 'PE at the top'], fmt(r.PEtop, 3), 'J'], ['g', ['المجموع KE + PE', 'Total KE + PE'], fmt(r.E, 3), 'J']],
    chart: (p) => { const hmax = p.v0 * p.v0 / (2 * G), pts = [], pts2 = []; for (let h = 0; h <= hmax + 1e-9; h += hmax / 30) { pts.push([h, 0.5 * p.m * p.v0 * p.v0 - p.m * G * h]); pts2.push([h, p.m * G * (h - p.ref)]); } return { series: [{ pts }, { pts: pts2 }], xLabel: NL.lang === 'ar' ? 'الارتفاع فوق اليد (m)' : 'height above hand (m)', yLabel: 'J' }; },
    build(S) {
      const g = new THREE.Group(); S.root.add(g); g.position.x = -0.9;
      const H0 = 1.1;
      const body = cyl(0.22, 0.26, 1.0, mat(0x31405f)); body.position.set(-0.55, 0.5, 0); g.add(body);
      const head = mesh(new THREE.SphereGeometry(0.2, 20, 16), mat(0xc9a27a)); head.position.set(-0.55, 1.22, 0); g.add(head);
      const arm = rod(0.06, mat(0x31405f)); g.add(arm);
      const hand = mesh(new THREE.SphereGeometry(0.08, 14, 10), mat(0xc9a27a)); hand.position.set(0, H0 - 0.12, 0); g.add(hand);
      arm.between(V(-0.4, 0.95, 0), hand.position);
      const ball = mesh(new THREE.SphereGeometry(0.13, 28, 20), mat(C.acc, { e: C.acc, ei: 0.25 })); g.add(ball);
      const plane = mesh(new THREE.BoxGeometry(2.4, 0.01, 1.4), mat(C.sig, { op: 0.18, e: C.sig, ei: 0.4 }), false); g.add(plane);
      const lRef = label(NL.lang === 'ar' ? 'مستوى الإسناد PE = 0' : 'Reference level PE = 0', 'e sm'); g.add(lRef);
      const topMark = rod(0.008, mat(C.acc, { op: 0.6 })); g.add(topMark);
      const lTop = label('', 'k sm'); g.add(lTop);
      const lBall = label('', 'k sm'); g.add(lBall);
      const bars = energyBars(g, 1.5, 0.9, [['KE', C.acc, 'k'], ['PE', C.sig, 'e'], [NL.lang === 'ar' ? 'المجموع' : 'Total', C.green, 'g']]);
      return {
        update(p, r, k) {
          const t = ease(k) * r.T * 0.999, y = p.v0 * t - 0.5 * G * t * t, v = p.v0 - G * t;
          ball.position.set(0, H0 + y, 0);
          const KE = 0.5 * p.m * v * v, PE = p.m * G * (y - p.ref);
          plane.position.set(0, H0 + p.ref, 0); lRef.position.set(-1.25, H0 + p.ref + 0.12, 0.6);
          topMark.between(V(-0.5, H0 + r.hmax, 0), V(0.5, H0 + r.hmax, 0)); lTop.position.set(0.75, H0 + r.hmax, 0); lTop.set(`h = ${fmt(r.hmax, 3)} m`);
          lBall.position.set(-0.45, H0 + y + 0.05, 0.2); lBall.set(`v = ${fmt(Math.abs(v), 2)} m/s`);
          const scale = 1.8 / Math.max(r.KE0, Math.abs(r.PE0), Math.abs(r.PEtop), Math.abs(r.E), 1e-6);
          bars.set([KE, PE, r.E], scale);
        },
      };
    },
    steps: [
      { cam: [0.2, 2.6, 9.0], at: [0, 2.1, 0], text: (p, r) => NL.lang === 'ar' ? `النظام: **الكرة والأرض**. عند القذف تكون الطاقة حركية: $KE = \\frac{1}{2}mv^2$ = ${fmt(r.KE0)} J.` : `The system: **ball and Earth**. At launch the energy is kinetic: $KE = \\frac{1}{2}mv^2$ = ${fmt(r.KE0)} J.` },
      { cam: [-2.0, 2.8, 7.6], at: [-0.5, 2.3, 0], text: () => NL.lang === 'ar' ? 'في أثناء الصعود تبذل الجاذبية شغلًا **سالبًا** $W_g = -mgh$، فتقل الطاقة الحركية وتزداد **طاقة الوضع الجاذبية** $PE = mgh$.' : 'Rising, gravity does **negative** work $W_g = -mgh$: kinetic energy falls and **gravitational potential energy** $PE = mgh$ grows.' },
      { cam: [0.4, 3.6, 8.2], at: [0, 2.8, 0], text: (p, r) => NL.lang === 'ar' ? `عند أقصى ارتفاع (${fmt(r.hmax)} m) تتوقف الكرة لحظيًا: الطاقة كلها **طاقة وضع**. ثم تسقط فتعود حركية. **المجموع الأخضر ثابت.**` : `At the top (${fmt(r.hmax)} m) the ball stops for an instant: all of it is **potential energy**. Falling, it turns back into kinetic. **The green total stays constant.**` },
      { cam: [2.4, 2.0, 7.6], at: [0, 1.7, 0], text: () => NL.lang === 'ar' ? '**مستوى الإسناد** هو حيث $PE = 0$، ونختاره بحرية. حرّك مستوى الإسناد إلى القمة: تصبح PE **سالبة** تحته ويتغير المجموع، لكن **التغيرات** في الطاقة لا تتغير.' : 'The **reference level** is where $PE = 0$, and we choose it freely. Move it to the top: PE becomes **negative** below it and the total shifts, but the **changes** in energy stay the same.' },
    ],
  });

  SCENES.push({
    id: 'bow', title: ['القوس والسهم', 'Bow and arrow'], sub: ['طاقة الوضع المرونية · الشكل 7-5', 'Elastic potential energy · Figure 5-7'],
    params: [
      { k: 'F', label: ['قوة الشد القصوى', 'Full draw force'], min: 60, max: 300, step: 5, def: 200, unit: 'N' },
      { k: 'd', label: ['مسافة سحب الوتر', 'Draw distance'], min: 0.2, max: 0.7, step: 0.01, def: 0.5, unit: 'm' },
      { k: 'm', label: ['كتلة السهم', 'Arrow mass'], min: 15, max: 60, step: 1, def: 30, unit: 'g' },
    ],
    // simplified model: the force grows evenly while drawing, so the stored energy is the work ½·F·d
    compute(p) { const E = 0.5 * p.F * p.d, v = Math.sqrt(2 * E / (p.m / 1000)); return { E, v }; },
    big: (r) => ({ k: 'v', v: fmt(r.v, 3) + ' m/s' }),
    cards: (r, p) => [['v', ['الطاقة المرونية المختزنة', 'Stored elastic energy'], fmt(r.E, 3), 'J'], ['k', ['KE للسهم بعد الإفلات', 'Arrow KE after release'], fmt(r.E, 3), 'J'], ['e', ['سرعة السهم', 'Arrow speed'], fmt(r.v, 3), 'm/s']],
    chart: (p) => { const pts = []; for (let x = 0; x <= p.d + 1e-9; x += p.d / 20) pts.push([x * 100, p.F * x / p.d]); return { series: [{ pts }], xLabel: NL.lang === 'ar' ? 'سحب الوتر (cm)' : 'draw (cm)', yLabel: 'F (N)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); S.root.add(g);
      const Y = 1.5, limbM = mat(0x2a3550, { m: 0.4, r: 0.4 });
      const limb = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(V(0, -0.8, 0), V(0.42, 0, 0), V(0, 0.8, 0)), 40, 0.035, 10), limbM); limb.position.set(0, Y, 0); limb.castShadow = true; g.add(limb);
      const grip = box(0.09, 0.22, 0.09, mat(C.wood)); grip.position.set(0.21, Y, 0); g.add(grip);
      const s1 = rod(0.008, mat(C.rope)), s2 = rod(0.008, mat(C.rope)); g.add(s1, s2);
      const arrowG = new THREE.Group(); g.add(arrowG);
      const shaft = rod(0.012, mat(0xd8dde6)); shaft.between(V(0, 0, 0), V(0.8, 0, 0)); arrowG.add(shaft);
      const tip = mesh(new THREE.ConeGeometry(0.03, 0.1, 12), mat(C.metal, { m: 0.8 })); tip.rotation.z = -Math.PI / 2; tip.position.x = 0.85; arrowG.add(tip);
      const fl = box(0.12, 0.06, 0.005, mat(C.red)); fl.position.x = 0.07; arrowG.add(fl);
      const target = cyl(0.5, 0.5, 0.12, mat(0xe9e2d0), 40); target.rotation.z = Math.PI / 2; target.position.set(6.2, Y, 0); g.add(target);
      const ring = mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 40), mat(C.red)); ring.rotation.y = Math.PI / 2; ring.position.set(6.13, Y, 0); g.add(ring);
      const lD = label('', 'v sm'); g.add(lD);
      const bars = energyBars(g, -1.9, 0.7, [[NL.lang === 'ar' ? 'مرونية' : 'Elastic', C.violet, 'v'], ['KE', C.acc, 'k']]);
      return {
        update(p, r, k) {
          let pull, ax;
          if (k < 0.45) { pull = ease(k / 0.45); ax = null; } else if (k < 0.5) { pull = 1 - (k - 0.45) / 0.05; ax = null; } else { pull = 0; ax = (k - 0.5) / 0.5; }
          const back = 0.1 + pull * p.d * 0.9, nock = V(-back + 0.02, Y, 0);
          s1.between(V(0, Y + 0.8, 0), nock); s2.between(V(0, Y - 0.8, 0), nock);
          if (ax == null) arrowG.position.set(-back + 0.02, Y, 0); else arrowG.position.set(-0.08 + ease(Math.min(1, ax * 1.4)) * 5.4, Y, 0);
          lD.position.set(-back - 0.25, Y + 0.25, 0.2); lD.set(ax == null ? `d = ${fmt(pull * p.d * 100, 3)} cm` : `v = ${fmt(r.v, 3)} m/s`);
          const Ee = ax == null ? r.E * pull * pull : 0, KE = ax == null ? (k >= 0.45 ? r.E - Ee : 0) : r.E;
          bars.set([Ee, KE], 2.0 / Math.max(r.E, 1e-6));
        },
      };
    },
    steps: [
      { cam: [0.6, 2.2, 5.6], at: [0.2, 1.4, 0], text: () => NL.lang === 'ar' ? 'عند سحب الوتر تبذل **شغلًا** على القوس، فتزداد طاقة النظام المكوّن من القوس والسهم والأرض.' : 'Drawing the string, you do **work** on the bow, so the energy of the bow–arrow–Earth system grows.' },
      { cam: [-1.8, 1.9, 4.2], at: [-0.6, 1.4, 0], text: (p, r) => NL.lang === 'ar' ? `تُختزن هذه الطاقة في الوتر المشدود على شكل **طاقة وضع مرونية**: نحو ${fmt(r.E)} J في هذا النموذج.` : `It is stored in the stretched string as **elastic potential energy**: about ${fmt(r.E)} J in this model.` },
      { cam: [2.4, 2.0, 6.4], at: [2.6, 1.4, 0], text: (p, r) => NL.lang === 'ar' ? `عند الإفلات تنتقل الطاقة إلى السهم على شكل **طاقة حركية**، فينطلق بسرعة ${fmt(r.v)} m/s تقريبًا.` : `On release the energy passes to the arrow as **kinetic energy**, flying off at about ${fmt(r.v)} m/s.` },
      { cam: [0.4, 3.0, 6.8], at: [0.8, 1.2, 0], text: () => NL.lang === 'ar' ? 'شد الوتر أكثر أو استخدم قوسًا أقوى: يزداد الشغل فتزداد الطاقة المختزنة. **سهم أخف** يأخذ الطاقة نفسها بسرعة أكبر.' : 'Draw further or use a stronger bow: more work, more stored energy. A **lighter arrow** takes the same energy at a higher speed.' },
    ],
  });

  SCENES.push({
    id: 'vault', title: ['القفز بالزانة', 'Pole vault'], sub: ['من الحركية إلى المرونية إلى الجاذبية · الشكل 8-5', 'Kinetic → elastic → gravitational · Figure 5-8'],
    params: [
      { k: 'v', label: ['سرعة الركض', 'Run-up speed'], min: 6, max: 10, step: 0.1, def: 9, unit: 'm/s' },
      { k: 'm', label: ['كتلة اللاعب', 'Athlete mass'], min: 55, max: 90, step: 1, def: 75, unit: 'kg' },
    ],
    // ideal model: all of the run-up kinetic energy ends as height of the centre of mass (which starts about 1 m up)
    compute(p) { const KE = 0.5 * p.m * p.v * p.v, dh = p.v * p.v / (2 * G); return { KE, dh, top: 1 + dh }; },
    big: (r) => ({ k: 'h', v: fmt(r.top, 3) + ' m' }),
    cards: (r, p) => [['k', ['KE عند الركض', 'Run-up KE'], fmt(r.KE, 3), 'J'], ['e', ['PE الأقصى = mgΔh', 'Max PE = mgΔh'], fmt(r.KE, 3), 'J'], ['k', ['ارتفاع مركز الكتلة', 'Centre of mass height'], fmt(r.top, 3), 'm']],
    chart: (p) => { const pts = []; for (let v = 6; v <= 10.001; v += 0.25) pts.push([v, 1 + v * v / (2 * G)]); return { series: [{ pts }], mark: [p.v, 1 + p.v * p.v / (2 * G)], xLabel: NL.lang === 'ar' ? 'سرعة الركض (m/s)' : 'run-up speed (m/s)', yLabel: 'h (m)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); S.root.add(g);
      const track = box(14, 0.02, 1.4, mat(0xa64b2a, { r: 0.9 })); track.position.set(-2, 0.01, 0); g.add(track);
      const boxPit = box(0.4, 0.05, 0.4, mat(C.dark)); boxPit.position.set(0, 0.03, 0); g.add(boxPit);
      const mat2 = box(3, 0.5, 3, mat(0x2f5fa8, { r: 0.9 })); mat2.position.set(2.2, 0.25, 0); g.add(mat2);
      const postM = mat(C.metal, { m: 0.6 });
      [-1.4, 1.4].forEach((z) => { const post = cyl(0.04, 0.04, 6.4, postM, 12); post.position.set(0.6, 3.2, z); g.add(post); });
      const bar = cyl(0.025, 0.025, 2.8, mat(C.acc, { e: C.acc, ei: 0.3 }), 12); bar.rotation.x = Math.PI / 2; g.add(bar);
      const athlete = new THREE.Group(); g.add(athlete);
      const torso = mesh(new THREE.CapsuleGeometry(0.17, 0.6, 6, 12), mat(C.red)); athlete.add(torso);
      const head = mesh(new THREE.SphereGeometry(0.13, 16, 12), mat(0xc9a27a)); head.position.y = 0.55; athlete.add(head);
      const legs = mesh(new THREE.CapsuleGeometry(0.11, 0.7, 6, 10), mat(0x1d2740)); legs.position.y = -0.62; athlete.add(legs);
      const pole = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(V(0, 0, 0), V(0, 1, 0)), 1, 0.03, 8), mat(0xf0f3f8)); g.add(pole);
      const lH = label('', 'k sm'); g.add(lH);
      const bars = energyBars(g, -6.2, 0.6, [['KE', C.acc, 'k'], [NL.lang === 'ar' ? 'مرونية' : 'Elastic', C.violet, 'v'], ['PE', C.sig, 'e']]);
      const L = 4.6;
      return {
        update(p, r, k) {
          bar.position.set(0.6, r.top + 0.15, 0);
          let x, y, rot = 0, bend = 0, KE, Ee, PE;
          const tot = r.KE;
          if (k < 0.3) { const u = k / 0.3; x = -7 + u * 6.2; y = 1; KE = tot; Ee = 0; PE = 0; }
          else if (k < 0.55) { const u = ease((k - 0.3) / 0.25); x = -0.8 + u * 0.3; y = 1 + u * 0.6; bend = u; rot = u * 0.5; Ee = tot * 0.75 * u; PE = tot * (0.6 / r.dh) * u; KE = Math.max(0, tot - Ee - PE); }
          else if (k < 0.85) { const u = ease((k - 0.55) / 0.3); x = -0.5 + u * 1.1; y = 1.6 + u * (r.top - 1.6); bend = 1 - u; rot = 0.5 + u * 2.4; const pe = tot * (y - 1) / r.dh; Ee = tot * 0.75 * (1 - u); PE = pe; KE = Math.max(0, tot - Ee - PE); }
          else { const u = (k - 0.85) / 0.15; x = 0.6 + u * 1.4; y = r.top - u * u * (r.top - 0.9); rot = 2.9 + u; PE = tot * (y - 1) / r.dh; Ee = 0; KE = Math.max(0, tot - PE); }
          athlete.position.set(x, y, 0); athlete.rotation.z = -rot;
          // the pole: from the box to the hands, bowed while bent
          const hands = k < 0.3 ? V(x + 0.3, 1.2, 0) : k < 0.85 ? athlete.localToWorld(V(0, 0.35, 0)) : null;
          if (hands) {
            const base = k < 0.3 ? V(x + 0.3 + L * 0.9, 1.2 + 0.3, 0) : V(0, 0.05, 0);
            const mid = base.clone().lerp(hands, 0.5).add(V(-0.9 * bend, 0.6 * bend, 0));
            pole.geometry.dispose(); pole.geometry = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(base, mid, hands), 24, 0.03, 8); pole.visible = true;
          } else pole.visible = false;
          lH.position.set(x - 0.6, y + 0.4, 0.3); lH.set(`h = ${fmt(y, 3)} m`);
          bars.set([KE, Ee, PE], 2.6 / Math.max(tot, 1e-6));
        },
      };
    },
    steps: [
      { cam: [-3.5, 2.4, 9.5], at: [-3, 1.5, 0], text: (p, r) => NL.lang === 'ar' ? `يركض اللاعب حاملًا الزانة، فيكتسب **طاقة حركية** نحو ${fmt(r.KE)} J.` : `The athlete runs with the pole, gaining about ${fmt(r.KE)} J of **kinetic energy**.` },
      { cam: [-1.2, 2.2, 7.0], at: [-0.4, 1.6, 0], text: () => NL.lang === 'ar' ? 'يغرز طرف الزانة ويثنيها: يتحول جزء من الطاقة الحركية إلى **طاقة وضع مرونية** في الزانة المنحنية.' : 'He plants the pole and bends it: part of the kinetic energy becomes **elastic potential energy** in the bent pole.' },
      { cam: [0.4, 3.6, 8.4], at: [0.2, 3.0, 0], text: (p, r) => NL.lang === 'ar' ? `تستقيم الزانة فتتحول الطاقة المرونية إلى **طاقة وضع جاذبية** وطاقة حركية، فيرتفع حتى نحو ${fmt(r.top)} m.` : `The pole straightens; elastic energy becomes **gravitational potential energy** and kinetic energy, lifting him to about ${fmt(r.top)} m.` },
      { cam: [3.2, 3.0, 8.0], at: [0.8, 2.6, 0], text: () => NL.lang === 'ar' ? 'لهذا غيّرت **زانات الألياف الزجاجية** هذه الرياضة: تنثني أكثر وتختزن طاقة مرونية أكبر من الخيزران والمعادن. جرّب سرعة ركض أكبر.' : 'That is why **fibreglass poles** changed the sport: they bend more and store more elastic energy than bamboo or metal. Try a faster run-up.' },
    ],
  });

  /* ---------- gravitation and rotation scenes (chapters 1 and 2) ---------- */
  const ar = () => NL.lang === 'ar';
  const lineOf = (pts, color, op = 1) => new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color, transparent: op < 1, opacity: op }));

  SCENES.push({
    id: 'orbit', keys: ['كبلر', 'كوكب', 'الكواكب', 'إهليلج', 'الشمس', 'kepler', 'planet', 'ellipse'],
    title: ['قوانين كبلر', 'Kepler’s laws'], sub: ['مدار إهليلجي ومساحات متساوية · الشكل 1-1', 'Elliptical orbit, equal areas · Figure 1-1'],
    params: [
      { k: 'e', label: ['تفلطح المدار e', 'Eccentricity e'], min: 0, max: 0.75, step: 0.01, def: 0.5, unit: '' },
      { k: 'a', label: ['متوسط البعد عن الشمس', 'Mean distance from the Sun'], min: 0.4, max: 5.2, step: 0.1, def: 1, unit: 'AU' },
    ],
    compute(p) { const T = Math.pow(p.a, 1.5); return { T, rmin: p.a * (1 - p.e), rmax: p.a * (1 + p.e), ratio: (1 + p.e) / (1 - p.e) }; },
    big: (r) => ({ k: 'T', v: fmt(r.T, 3) + (ar() ? ' سنة' : ' yr') }),
    cards: (r, p) => [['k', ['أقرب بعد', 'Perihelion'], fmt(r.rmin, 3), 'AU'], ['e', ['أبعد بعد', 'Aphelion'], fmt(r.rmax, 3), 'AU'], ['r', ['السرعة القصوى ÷ الدنيا', 'Max ÷ min speed'], fmt(r.ratio, 3), ''], ['g', ['T² ÷ r³', 'T² ÷ r³'], '1.00', 'yr²/AU³']],
    chart: (p) => { const pts = []; for (let a = 0.4; a <= 5.21; a += 0.2) pts.push([a, Math.pow(a, 1.5)]); return { series: [{ pts }], mark: [p.a, Math.pow(p.a, 1.5)], xLabel: 'r (AU)', yLabel: ar() ? 'T (سنة)' : 'T (yr)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); g.position.y = 1.2; S.root.add(g);
      const A = 2.6;
      const sun = mesh(new THREE.SphereGeometry(0.32, 32, 24), mat(C.acc, { e: C.acc, ei: 1.2 }), false); g.add(sun);
      const planet = mesh(new THREE.SphereGeometry(0.14, 24, 18), mat(C.sig, { e: C.sig, ei: 0.3 })); g.add(planet);
      let path = lineOf([V(0, 0, 0), V(1, 0, 0)], 0x8b97b0, 0.8); g.add(path);
      const fanM = new THREE.MeshBasicMaterial({ color: C.sig, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
      const fans = [new THREE.Mesh(new THREE.BufferGeometry(), fanM), new THREE.Mesh(new THREE.BufferGeometry(), fanM.clone())]; fans[1].material.color.set(C.acc); fans.forEach((f) => g.add(f));
      const lS = label(ar() ? 'الشمس في البؤرة' : 'Sun at a focus', 'k sm'); g.add(lS);
      const lP = label('', 'e sm'); g.add(lP);
      let lastE = -1;
      const pos = (p, M) => { let E = M; for (let i = 0; i < 8; i++) E -= (E - p.e * Math.sin(E) - M) / (1 - p.e * Math.cos(E)); const b = A * Math.sqrt(1 - p.e * p.e); return V(A * (Math.cos(E) - p.e), 0, b * Math.sin(E)); };
      const fan = (m, p, M0, dM) => { const v = [0, 0, 0]; for (let i = 0; i <= 24; i++) { const q = pos(p, M0 + dM * i / 24); v.push(q.x, q.y, q.z); } const idx = []; for (let i = 1; i <= 24; i++) idx.push(0, i, i + 1); m.geometry.dispose(); m.geometry = new THREE.BufferGeometry(); m.geometry.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); m.geometry.setIndex(idx); };
      return {
        update(p, r, k) {
          if (p.e !== lastE) {
            lastE = p.e; const pts = []; for (let i = 0; i <= 120; i++) pts.push(pos(p, i / 120 * Math.PI * 2));
            g.remove(path); path.geometry.dispose(); path = lineOf(pts, 0x8b97b0, 0.8); g.add(path);
            fan(fans[0], p, -0.35, 0.7); fan(fans[1], p, Math.PI - 0.35, 0.7);
          }
          g.position.x = A * p.e; const q = pos(p, k * Math.PI * 2); planet.position.copy(q);
          lS.position.set(0, 0.6, 0); lP.position.copy(q).add(V(0, 0.4, 0));
          const rr = q.length() / A * p.a; lP.set(`r = ${fmt(rr, 3)} AU`);
        },
      };
    },
    steps: [
      { cam: [0, 8.5, 5.5], at: [0, 1.2, 0], text: () => ar() ? '**القانون الأول لكبلر:** مدارات الكواكب **إهليلجية**، والشمس في إحدى البؤرتين وليست في المركز.' : '**Kepler’s first law:** orbits are **ellipses** with the Sun at one focus, not at the centre.' },
      { cam: [1.5, 8, 5], at: [0, 1.2, 0], text: () => ar() ? '**القانون الثاني:** الخط من الشمس إلى الكوكب يمسح **مساحات متساوية في أزمنة متساوية**. المساحتان الملونتان مُسحتا في الزمن نفسه.' : '**Second law:** the Sun–planet line sweeps **equal areas in equal times**. Both shaded areas take the same time.' },
      { cam: [4.5, 4.5, 5], at: [1, 1.2, 0], text: (p, r) => ar() ? `لذلك يكون الكوكب **أسرع قرب الشمس**: هنا السرعة القصوى تساوي ${fmt(r.ratio)} ضعف الدنيا.` : `So the planet is **fastest near the Sun**: here its top speed is ${fmt(r.ratio)} times its lowest.` },
      { cam: [0, 9.5, 2.5], at: [0, 1.2, 0], text: (p, r) => ar() ? `**القانون الثالث:** $T^2 \\propto r^3$. غيّر البعد: عند ${fmt(p.a)} AU يكون الزمن الدوري ${fmt(r.T)} سنة.` : `**Third law:** $T^2 \\propto r^3$. Change the distance: at ${fmt(p.a)} AU the period is ${fmt(r.T)} years.` },
    ],
  });

  SCENES.push({
    id: 'satellite', keys: ['قمر اصطناعي', 'أقمار', 'الجذب الكوني', 'جاذبية', 'مدار', 'سرعة مدارية', 'satellite', 'gravitation', 'orbit'],
    title: ['قمر اصطناعي في مداره', 'A satellite in orbit'], sub: ['السرعة المدارية والزمن الدوري', 'Orbital speed and period'],
    params: [{ k: 'h', label: ['الارتفاع عن سطح الأرض', 'Altitude'], min: 150, max: 36000, step: 50, def: 400, unit: 'km' }],
    compute(p) { const GM = 6.67e-11 * 5.97e24, r = 6.38e6 + p.h * 1e3, v = Math.sqrt(GM / r), T = 2 * Math.PI * r / v; return { r, v, T, g: GM / (r * r) }; },
    big: (r) => ({ k: 'v', v: fmt(r.v / 1000, 3) + ' km/s' }),
    cards: (r) => [['e', ['السرعة المدارية v', 'Orbital speed v'], fmt(r.v, 3), 'm/s'], ['k', ['الزمن الدوري T', 'Period T'], fmt(r.T / 60, 3), 'min'], ['r', ['تسارع الجاذبية هناك', 'Gravity there'], fmt(r.g, 3), 'm/s²'], ['g', ['نصف قطر المدار', 'Orbit radius'], fmt(r.r / 1000, 4), 'km']],
    chart: (p) => { const pts = []; for (let h = 150; h <= 36000; h += 900) pts.push([h, Math.sqrt(6.67e-11 * 5.97e24 / (6.38e6 + h * 1e3)) / 1000]); return { series: [{ pts }], mark: [p.h, Math.sqrt(6.67e-11 * 5.97e24 / (6.38e6 + p.h * 1e3)) / 1000], xLabel: 'h (km)', yLabel: 'v (km/s)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); g.position.y = 1.4; S.root.add(g);
      const earth = mesh(new THREE.SphereGeometry(1, 48, 32), mat(0x2f6fb5, { r: 0.7 }), false); g.add(earth);
      const land = mesh(new THREE.SphereGeometry(1.005, 24, 16), new THREE.MeshStandardMaterial({ color: 0x3f9b5a, wireframe: true, transparent: true, opacity: 0.35 }), false); g.add(land);
      const sat = new THREE.Group(); g.add(sat);
      sat.add(box(0.14, 0.14, 0.14, mat(C.metal, { m: 0.7 })));
      const panel = box(0.5, 0.02, 0.14, mat(0x3a4fa0, { e: 0x1a2a6a })); sat.add(panel);
      let ring = null; let lastH = -1, ang = 0;
      const aV = arrow(C.sig), aF = arrow(C.red); g.add(aV, aF);
      const lV = label('', 'e sm'), lF = label('', 'r sm'); g.add(lV, lF);
      const R = (p) => 1.15 + 2.3 * Math.sqrt(p.h / 36000);
      return {
        update(p, r, k, dt) {
          if (p.h !== lastH) { lastH = p.h; if (ring) { g.remove(ring); ring.geometry.dispose(); } const pts = []; for (let i = 0; i <= 96; i++) pts.push(V(Math.cos(i / 96 * 6.283) * R(p), 0, Math.sin(i / 96 * 6.283) * R(p))); ring = lineOf(pts, 0x8b97b0, 0.7); g.add(ring); }
          ang += dt * 2 * Math.PI / (3 + r.T / 3600);
          const rr = R(p), q = V(Math.cos(ang) * rr, 0, -Math.sin(ang) * rr); sat.position.copy(q); sat.rotation.y = ang;
          earth.rotation.y += dt * 0.1;
          const tan = V(-Math.sin(ang), 0, -Math.cos(ang));
          aV.set(q, tan, 0.4 + r.v / 12000); aF.set(q, q.clone().multiplyScalar(-1), 0.3 + r.g / 25);
          lV.position.copy(q).add(tan.clone().multiplyScalar(0.9)).add(V(0, 0.2, 0)); lV.set(`v = ${fmt(r.v / 1000, 3)} km/s`);
          lF.position.copy(q).multiplyScalar(0.7).add(V(0, -0.25, 0)); lF.set(ar() ? 'قوة الجاذبية' : 'gravity');
        },
      };
    },
    steps: [
      { cam: [0.0, 4.6, 9.9], at: [0, 1.4, 0], text: () => ar() ? 'تخيّل نيوتن مدفعًا على جبل: كلما زادت سرعة القذيفة الأفقية سقطت أبعد، وعند **السرعة المدارية** ينحني مسار سقوطها مع انحناء الأرض فلا تلمسها.' : 'Newton imagined a cannon on a mountain: the faster the shot, the farther it lands. At **orbital speed** its fall curves with the Earth and never reaches it.' },
      { cam: [4.2, 2.7, 7.0], at: [0, 1.4, 0], text: () => ar() ? 'القمر الاصطناعي **يسقط باستمرار**: قوة الجاذبية (الأحمر) نحو مركز الأرض هي القوة المركزية، والسرعة (الأزرق) مماسية للمدار.' : 'A satellite is **always falling**: gravity (red) toward Earth’s centre is the centripetal force, and its velocity (blue) is tangent to the orbit.' },
      { cam: [0.0, 8.0, 5.6], at: [0, 1.4, 0], text: (p, r) => ar() ? `$v = \\sqrt{\\frac{Gm_E}{r}}$: على ارتفاع ${fmt(p.h)} km تكون السرعة ${fmt(r.v / 1000)} km/s والزمن الدوري ${fmt(r.T / 60)} دقيقة.` : `$v = \\sqrt{\\frac{Gm_E}{r}}$: at ${fmt(p.h)} km the speed is ${fmt(r.v / 1000)} km/s and the period ${fmt(r.T / 60)} min.` },
      { cam: [6.4, 4.0, 6.4], at: [0, 1.4, 0], text: () => ar() ? 'كلما ارتفع المدار **قلّت السرعة وطال الزمن الدوري**. عند نحو 36000 km يصبح الزمن الدوري يومًا كاملًا: المدار الثابت لأقمار البث.' : 'Higher orbits are **slower with longer periods**. Near 36 000 km the period is a full day: the geostationary orbit of TV satellites.' },
    ],
  });

  SCENES.push({
    id: 'spin', keys: ['الحركة الدورانية', 'دوران', 'راديان', 'سرعة زاوية', 'السرعة الزاوية', 'إزاحة زاوية', 'angular', 'rotation', 'radian'],
    title: ['وصف الحركة الدورانية', 'Describing rotation'], sub: ['الإزاحة والسرعة الزاوية · v = ωr', 'Angular displacement and velocity · v = ωr'],
    params: [
      { k: 'w', label: ['السرعة الزاوية ω', 'Angular velocity ω'], min: 0.3, max: 6, step: 0.1, def: 1.5, unit: 'rad/s' },
      { k: 'r', label: ['بعد النقطة الحمراء عن المحور', 'Red point’s distance from the axis'], min: 0.3, max: 1.6, step: 0.05, def: 1.5, unit: 'm' },
    ],
    compute(p) { return { v: p.w * p.r, v2: p.w * p.r / 2, T: 2 * Math.PI / p.w, ac: p.w * p.w * p.r }; },
    big: (r) => ({ k: 'v = ωr', v: fmt(r.v, 3) + ' m/s' }),
    cards: (r, p) => [['k', ['ω (لكل النقاط)', 'ω (every point)'], fmt(p.w, 3), 'rad/s'], ['r', ['v للنقطة الحمراء', 'v of red point'], fmt(r.v, 3), 'm/s'], ['e', ['v للنقطة الزرقاء (r/2)', 'v of blue point (r/2)'], fmt(r.v2, 3), 'm/s'], ['g', ['الزمن الدوري', 'Period'], fmt(r.T, 3), 's']],
    chart: (p) => ({ series: [{ pts: [[0, 0], [1.6, p.w * 1.6]] }], mark: [p.r, p.w * p.r], xLabel: 'r (m)', yLabel: 'v (m/s)', yMin: 0 }),
    build(S) {
      const g = new THREE.Group(); g.position.y = 0.5; S.root.add(g);
      const disc = cyl(1.8, 1.8, 0.08, mat(0x2a3550, { r: 0.6 }), 64); g.add(disc);
      const rot = new THREE.Group(); g.add(rot);
      for (let i = 0; i < 12; i++) { const s = box(1.75, 0.01, 0.015, mat(0x4a5a80)); s.position.y = 0.045; s.rotation.y = i * Math.PI / 12; rot.add(s); }
      const ref = rod(0.02, mat(C.acc)); g.add(ref); ref.between(V(0, 0.06, 0), V(1.9, 0.06, 0));
      const red = mesh(new THREE.SphereGeometry(0.09, 16, 12), mat(C.red, { e: C.red })); rot.add(red);
      const blue = mesh(new THREE.SphereGeometry(0.08, 16, 12), mat(C.sig, { e: C.sig })); rot.add(blue);
      const radius = rod(0.015, mat(0xffffff)); rot.add(radius);
      const aR = arrow(C.red), aB = arrow(C.sig); g.add(aR, aB);
      const lT = label('', 'k'); g.add(lT); const lR = label('', 'r sm'); g.add(lR);
      let th = 0;
      return {
        update(p, r, k, dt) {
          th = (th + p.w * dt) % (Math.PI * 2); rot.rotation.y = th;
          const rr = Math.min(p.r, 1.7); red.position.set(rr, 0.12, 0); blue.position.set(rr / 2, 0.12, 0); radius.between(V(0, 0.08, 0), V(rr, 0.08, 0));
          const wp = (x) => V(Math.cos(th) * x, 0.12, -Math.sin(th) * x), tan = V(-Math.sin(th), 0, -Math.cos(th));
          aR.set(wp(rr), tan, 0.3 + r.v / 3); aB.set(wp(rr / 2), tan, 0.3 + r.v2 / 3);
          lT.position.set(0, 1.1, 0); lT.set(`θ = ${fmt(th, 3)} rad = ${Math.round(th * 180 / Math.PI)}°`);
          lR.position.copy(wp(rr)).add(V(0, 0.35, 0)); lR.set(`v = ${fmt(r.v, 3)} m/s`);
        },
      };
    },
    steps: [
      { cam: [0, 4.2, 3.6], at: [0, 0.4, 0], text: () => ar() ? 'قرص يدور حول محوره. نقيس دورانه بـ**الإزاحة الزاوية** θ بالراديان: الدورة الكاملة $2\\pi$ rad.' : 'A disc turns about its axis. We measure the turn by **angular displacement** θ in radians: one revolution is $2\\pi$ rad.' },
      { cam: [2.4, 3.4, 3.2], at: [0, 0.4, 0], text: (p) => ar() ? `**السرعة الزاوية** $\\omega = \\Delta\\theta/\\Delta t$ = ${fmt(p.w)} rad/s، وهي **نفسها لكل نقاط القرص**.` : `**Angular velocity** $\\omega = \\Delta\\theta/\\Delta t$ = ${fmt(p.w)} rad/s, the **same for every point**.` },
      { cam: [3, 2, 2], at: [0.8, 0.4, 0], text: (p, r) => ar() ? `لكن **السرعة الخطية** تختلف: $v = r\\omega$. النقطة الحمراء ${fmt(r.v)} m/s، والزرقاء في منتصف المسافة ${fmt(r.v2)} m/s فقط.` : `But the **linear speed** differs: $v = r\\omega$. The red point moves at ${fmt(r.v)} m/s, the blue one halfway out at only ${fmt(r.v2)} m/s.` },
      { cam: [0, 5, 2], at: [0, 0.4, 0], text: (p, r) => ar() ? `الزمن الدوري $T = 2\\pi/\\omega$ = ${fmt(r.T)} s. زِد ω وشاهد كل السرعات الخطية تزداد.` : `The period $T = 2\\pi/\\omega$ = ${fmt(r.T)} s. Raise ω and watch every linear speed grow.` },
    ],
  });

  SCENES.push({
    id: 'torque', keys: ['عزم', 'ذراع', 'مفتاح', 'ذراع القوة', 'torque', 'lever arm'],
    title: ['عزم القوة', 'Torque'], sub: ['τ = F r sin θ · مفتاح الشد', 'τ = F r sin θ · a wrench'],
    params: [
      { k: 'F', label: ['القوة F', 'Force F'], min: 10, max: 200, step: 1, def: 60, unit: 'N' },
      { k: 'r', label: ['بعد القوة عن المحور r', 'Distance from axis r'], min: 0.05, max: 0.5, step: 0.01, def: 0.3, unit: 'm' },
      { k: 'th', label: ['الزاوية بين القوة والذراع θ', 'Angle θ between force and arm'], min: 0, max: 90, step: 1, def: 90, unit: '°' },
    ],
    compute(p) { const s = Math.sin(p.th * Math.PI / 180); return { tau: p.F * p.r * s, Fp: p.F * s, arm: p.r * s }; },
    big: (r) => ({ k: 'τ', v: fmt(r.tau, 3) + ' N·m' }),
    cards: (r, p) => [['e', ['القوة F', 'Force F'], p.F, 'N'], ['k', ['ذراع القوة r sin θ', 'Lever arm r sin θ'], fmt(r.arm, 3), 'm'], ['r', ['المركبة العمودية F sin θ', 'Perpendicular part F sin θ'], fmt(r.Fp, 3), 'N'], ['g', ['العزم τ', 'Torque τ'], fmt(r.tau, 3), 'N·m']],
    chart: (p) => { const pts = []; for (let a = 0; a <= 90; a += 5) pts.push([a, p.F * p.r * Math.sin(a * Math.PI / 180)]); return { series: [{ pts }], mark: [p.th, p.F * p.r * Math.sin(p.th * Math.PI / 180)], xLabel: 'θ (°)', yLabel: 'τ (N·m)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); g.position.y = 0.9; S.root.add(g);
      const plate = box(2.4, 1.4, 0.1, mat(0x3a4560)); plate.position.set(0, 0, -0.25); g.add(plate);
      const bolt = cyl(0.12, 0.12, 0.3, mat(C.metal, { m: 0.8 }), 6); bolt.rotation.x = Math.PI / 2; g.add(bolt);
      const wr = new THREE.Group(); g.add(wr);
      const bar = box(1, 0.1, 0.05, mat(0xb8c2d2, { m: 0.8, r: 0.3 })); wr.add(bar);
      const head = mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 24), mat(0xb8c2d2, { m: 0.8 })); wr.add(head);
      const aF = arrow(C.sig), aP = arrow(C.green); g.add(aF, aP);
      const armLine = rod(0.01, mat(C.acc, { op: 0.8 })); g.add(armLine);
      const lF = label('', 'e'), lT = label('', 'k'); g.add(lF, lT);
      let rotA = 0;
      return {
        update(p, r, k, dt) {
          rotA = (rotA + dt * Math.min(r.tau, 60) / 60) % (Math.PI * 2);
          const L = 0.6 + p.r * 4; bar.scale.x = L; bar.position.x = L / 2; wr.rotation.z = rotA;
          const end = V(Math.cos(rotA) * L, Math.sin(rotA) * L, 0.1);
          const th = p.th * Math.PI / 180, dirArm = V(Math.cos(rotA), Math.sin(rotA), 0);
          const fd = dirArm.clone().applyAxisAngle(V(0, 0, 1), th).normalize();
          const len = 0.4 + p.F / 120;
          aF.set(end.clone().sub(fd.clone().multiplyScalar(len)), fd, len);
          const perp = dirArm.clone().applyAxisAngle(V(0, 0, 1), Math.PI / 2);
          aP.set(end, perp, 0.15 + r.Fp / 120);
          lF.position.copy(end).sub(fd.clone().multiplyScalar(len + 0.2)); lF.set(`F = ${p.F} N`);
          lT.position.set(0, -0.95, 0.2); lT.set(`τ = ${fmt(r.tau, 3)} N·m`);
          armLine.between(V(0, 0, 0.12), end.clone().setZ(0.12));
        },
      };
    },
    steps: [
      { cam: [0, 1.2, 5.2], at: [0.6, 0.9, 0], text: () => ar() ? '**العزم** مقياس قدرة القوة على إحداث دوران. نؤثر بقوة في طرف المفتاح فيدور البرغي حول محوره.' : '**Torque** measures how well a force causes rotation. A force at the wrench’s end turns the bolt about its axis.' },
      { cam: [0.6, 1.4, 4.4], at: [0.6, 0.9, 0], text: () => ar() ? '$\\tau = Fr\\sin\\theta$: يعتمد على **مقدار القوة**، و**بعدها عن المحور**، و**الزاوية** بينها وبين الذراع.' : '$\\tau = Fr\\sin\\theta$: it depends on **the force**, **its distance from the axis**, and **the angle** to the arm.' },
      { cam: [1.6, 1.6, 4], at: [0.8, 0.9, 0], text: (p, r) => ar() ? `فقط المركبة **العمودية** على الذراع (الخضراء) $F\\sin\\theta$ = ${fmt(r.Fp)} N تدير المفتاح. جرّب θ = 0: لا دوران مهما كبرت القوة.` : `Only the **perpendicular** part (green) $F\\sin\\theta$ = ${fmt(r.Fp)} N turns it. Try θ = 0: no turning however strong the force.` },
      { cam: [0, 1, 5.6], at: [0.6, 0.9, 0], text: () => ar() ? '**مفتاح أطول = عزم أكبر بالقوة نفسها.** لذلك نفك الصامولة العنيدة بمفتاح طويل، ونمسك المقبض من طرفه.' : '**A longer wrench gives more torque for the same force.** That is why a stubborn nut needs a long wrench held at its end.' },
    ],
  });

  SCENES.push({
    id: 'inertia', keys: ['القصور الذاتي', 'عزم القصور', 'تسارع زاوي', 'ديناميكا الحركة الدورانية', 'moment of inertia', 'angular acceleration'],
    title: ['عزم القصور الذاتي', 'Moment of inertia'], sub: ['قانون نيوتن الثاني للدوران α = τ/I', 'Newton’s second law for rotation α = τ/I'],
    params: [
      { k: 'tau', label: ['العزم المؤثر τ', 'Applied torque τ'], min: 0.5, max: 10, step: 0.1, def: 4, unit: 'N·m' },
      { k: 'm', label: ['كتلة كل ثقل', 'Each mass'], min: 0.5, max: 4, step: 0.1, def: 1, unit: 'kg' },
      { k: 'r', label: ['بعد الأثقال عن المحور', 'Masses’ distance from axis'], min: 0.1, max: 0.9, step: 0.01, def: 0.5, unit: 'm' },
    ],
    compute(p) { const I = 2 * p.m * p.r * p.r, al = p.tau / I; return { I, al, w2: al * 2 }; },
    big: (r) => ({ k: 'α', v: fmt(r.al, 3) + ' rad/s²' }),
    cards: (r, p) => [['k', ['I = Σmr²', 'I = Σmr²'], fmt(r.I, 3), 'kg·m²'], ['e', ['τ', 'τ'], fmt(p.tau, 3), 'N·m'], ['r', ['α = τ/I', 'α = τ/I'], fmt(r.al, 3), 'rad/s²'], ['g', ['ω بعد 2 s', 'ω after 2 s'], fmt(r.w2, 3), 'rad/s']],
    chart: (p) => { const pts = []; for (let x = 0.1; x <= 0.905; x += 0.05) pts.push([x, p.tau / (2 * p.m * x * x)]); return { series: [{ pts }], mark: [p.r, p.tau / (2 * p.m * p.r * p.r)], xLabel: 'r (m)', yLabel: 'α (rad/s²)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); g.position.y = 1.2; S.root.add(g);
      const post = cyl(0.06, 0.06, 1.2, mat(C.dark), 16); post.position.y = -0.6; g.add(post);
      const rot = new THREE.Group(); g.add(rot);
      const barM = cyl(0.03, 0.03, 2, mat(0xb8c2d2, { m: 0.7 }), 12); barM.rotation.z = Math.PI / 2; rot.add(barM);
      const mA = mesh(new THREE.SphereGeometry(0.15, 24, 16), mat(C.acc)), mB = mA.clone(); rot.add(mA, mB);
      const lW = label('', 'k'); g.add(lW);
      let w = 0, t = 0;
      return {
        update(p, r, k, dt) {
          t += dt; if (t > 4) { t = 0; w = 0; }
          w = r.al * t; rot.rotation.y += Math.min(w, 25) * dt;
          const sc = 0.75 + p.m / 4; mA.scale.setScalar(sc); mB.scale.setScalar(sc);
          const x = p.r * 1.1; mA.position.set(x, 0, 0); mB.position.set(-x, 0, 0);
          lW.position.set(0, 0.7, 0); lW.set(`t = ${fmt(t, 2)} s   ω = ${fmt(w, 3)} rad/s`);
        },
      };
    },
    steps: [
      { cam: [0, 2.6, 4.4], at: [0, 1.1, 0], text: () => ar() ? 'العزم يسبب **تسارعًا زاويًا** α، كما تسبب القوة تسارعًا خطيًا. هنا عزم ثابت يدير قضيبًا عليه ثقلان.' : 'Torque causes **angular acceleration** α, as force causes linear acceleration. A steady torque spins a rod with two masses.' },
      { cam: [1.6, 2.2, 3.6], at: [0, 1.1, 0], text: (p, r) => ar() ? `**عزم القصور الذاتي** $I = \\sum mr^2$ = ${fmt(r.I)} kg·m² يقيس ممانعة الجسم لتغيير دورانه، ويعتمد على الكتلة **وتوزيعها**.` : `The **moment of inertia** $I = \\sum mr^2$ = ${fmt(r.I)} kg·m² measures resistance to changes in rotation; it depends on mass **and its distribution**.` },
      { cam: [0, 3.4, 3], at: [0, 1.1, 0], text: (p, r) => ar() ? `**قانون نيوتن الثاني للدوران:** $\\alpha = \\frac{\\tau}{I}$ = ${fmt(r.al)} rad/s².` : `**Newton’s second law for rotation:** $\\alpha = \\frac{\\tau}{I}$ = ${fmt(r.al)} rad/s².` },
      { cam: [2.2, 1.8, 3.4], at: [0, 1.1, 0], text: () => ar() ? 'حرّك الأثقال **بعيدًا عن المحور**: يتضاعف البعد فيصبح I أربعة أضعاف، ويصبح الدوران أبطأ بكثير. ولهذا يضم المتزلج ذراعيه ليدور أسرع.' : 'Move the masses **away from the axis**: doubling r makes I four times larger and the spin-up much slower. That is why skaters pull their arms in.' },
    ],
  });

  SCENES.push({
    id: 'balance', keys: ['الاتزان', 'اتزان', 'مركز الكتلة', 'استقرار', 'حامل', 'equilibrium', 'centre of mass', 'stability'],
    title: ['الاتزان', 'Equilibrium'], sub: ['شرطا الاتزان: ΣF = 0 و Στ = 0', 'ΣF = 0 and Στ = 0'],
    params: [
      { k: 'm1', label: ['الكتلة اليسرى', 'Left mass'], min: 5, max: 60, step: 1, def: 30, unit: 'kg' },
      { k: 'x1', label: ['بعدها عن الارتكاز', 'Its distance'], min: 0.3, max: 2, step: 0.05, def: 1, unit: 'm' },
      { k: 'm2', label: ['الكتلة اليمنى', 'Right mass'], min: 5, max: 60, step: 1, def: 20, unit: 'kg' },
      { k: 'x2', label: ['بعدها عن الارتكاز', 'Its distance'], min: 0.3, max: 2, step: 0.05, def: 1.5, unit: 'm' },
    ],
    compute(p) { const t1 = p.m1 * G * p.x1, t2 = p.m2 * G * p.x2; return { t1, t2, net: t2 - t1, N: (p.m1 + p.m2) * G, xb: p.m1 * p.x1 / p.m2 }; },
    big: (r) => ({ k: 'Στ', v: fmt(r.net, 3) + ' N·m' }),
    cards: (r) => [['r', ['عزم الكتلة اليسرى', 'Left torque'], fmt(r.t1, 3), 'N·m'], ['e', ['عزم الكتلة اليمنى', 'Right torque'], fmt(r.t2, 3), 'N·m'], ['k', ['قوة الارتكاز (ΣF = 0)', 'Pivot force (ΣF = 0)'], fmt(r.N, 3), 'N'], ['g', ['x₂ اللازم للاتزان', 'x₂ for balance'], fmt(r.xb, 3), 'm']],
    chart: (p) => { const pts = []; for (let x = 0.3; x <= 2.01; x += 0.1) pts.push([x, p.m2 * G * x - p.m1 * G * p.x1]); return { series: [{ pts }], mark: [p.x2, p.m2 * G * p.x2 - p.m1 * G * p.x1], xLabel: 'x₂ (m)', yLabel: 'Στ (N·m)' }; },
    build(S) {
      const g = new THREE.Group(); S.root.add(g);
      const piv = mesh(new THREE.ConeGeometry(0.3, 0.6, 3), mat(C.metal, { m: 0.5 })); piv.position.y = 0.3; piv.rotation.y = Math.PI / 6; g.add(piv);
      const beamG = new THREE.Group(); beamG.position.y = 0.64; g.add(beamG);
      const beam = box(4.6, 0.08, 0.3, mat(0x8a5a2b, { r: 0.7 })); beamG.add(beam);
      const b1 = box(0.4, 0.4, 0.4, mat(C.red)), b2 = box(0.4, 0.4, 0.4, mat(C.sig)); beamG.add(b1, b2);
      const aN = arrow(C.green); g.add(aN);
      const l1 = label('', 'r sm'), l2 = label('', 'e sm'), lS = label('', 'k'); g.add(l1, l2, lS);
      let tilt = 0;
      return {
        update(p, r, k, dt) {
          const goal = Math.max(-0.2, Math.min(0.2, -r.net / 400)); tilt += (goal - tilt) * Math.min(1, dt * 3); beamG.rotation.z = tilt;
          const s1 = 0.6 + p.m1 / 80, s2 = 0.6 + p.m2 / 80;
          b1.scale.setScalar(s1); b2.scale.setScalar(s2);
          b1.position.set(-p.x1 * 1.1, 0.04 + 0.2 * s1, 0); b2.position.set(p.x2 * 1.1, 0.04 + 0.2 * s2, 0);
          aN.set(V(0, -0.1, 0.4), V(0, 1, 0), 0.4 + r.N / 700);
          beamG.updateMatrixWorld();
          l1.position.copy(b1.getWorldPosition(V(0, 0, 0))).add(V(0, 0.5, 0)); l1.set(`${p.m1} kg`);
          l2.position.copy(b2.getWorldPosition(V(0, 0, 0))).add(V(0, 0.5, 0)); l2.set(`${p.m2} kg`);
          lS.position.set(0, 1.9, 0); lS.set(Math.abs(r.net) < 2 ? (ar() ? 'متزن ✓' : 'Balanced ✓') : (ar() ? 'غير متزن' : 'Not balanced'));
        },
      };
    },
    steps: [
      { cam: [0, 1.8, 5.8], at: [0, 0.8, 0], text: () => ar() ? 'لوح على نقطة ارتكاز وعليه كتلتان. يكون الجسم في **اتزان ميكانيكي** عندما لا تتغير سرعته الخطية ولا الزاوية.' : 'A beam on a pivot with two masses. A body is in **mechanical equilibrium** when neither its velocity nor its angular velocity changes.' },
      { cam: [0.8, 1.2, 4.6], at: [0, 0.6, 0], text: (p, r) => ar() ? `**الشرط الأول** $\\sum F = 0$: قوة الارتكاز إلى أعلى تساوي الوزنين معًا ${fmt(r.N)} N.` : `**First condition** $\\sum F = 0$: the pivot pushes up with the total weight ${fmt(r.N)} N.` },
      { cam: [0, 2.4, 5], at: [0, 0.8, 0], text: (p, r) => ar() ? `**الشرط الثاني** $\\sum \\tau = 0$: $m_1 g x_1 = m_2 g x_2$. الآن الفرق ${fmt(r.net)} N·m، فيميل اللوح.` : `**Second condition** $\\sum \\tau = 0$: $m_1 g x_1 = m_2 g x_2$. Right now the difference is ${fmt(r.net)} N·m, so the beam tips.` },
      { cam: [1.4, 1.6, 5], at: [0, 0.8, 0], text: (p, r) => ar() ? `ضع الكتلة اليمنى على بعد ${fmt(r.xb)} m فيتزن اللوح: **الكتلة الأخف تحتاج ذراعًا أطول**.` : `Put the right mass at ${fmt(r.xb)} m and the beam balances: **the lighter mass needs a longer arm**.` },
    ],
  });
  /* ---------- momentum, work, energy and heat scenes (chapters 3 to 6) ---------- */
  function cart(color) {
    const c = new THREE.Group();
    const body = box(0.7, 0.3, 0.45, mat(color, { m: 0.3 })); body.position.y = 0.27; c.add(body);
    [[-0.22, 0.2], [0.22, 0.2], [-0.22, -0.2], [0.22, -0.2]].forEach(([x, z]) => { const w = cyl(0.09, 0.09, 0.06, mat(C.dark), 16); w.rotation.x = Math.PI / 2; w.position.set(x, 0.1, z); c.add(w); });
    c.body = body; return c;
  }

  SCENES.push({
    id: 'collide', keys: ['تصادم', 'التصادم', 'الزخم', 'زخم', 'الدفع', 'مرن', 'collision', 'momentum', 'impulse'],
    title: ['تصادم عربتين', 'Two carts collide'], sub: ['حفظ الزخم والطاقة الحركية', 'Momentum and kinetic energy'],
    params: [
      { k: 'm1', label: ['كتلة العربة الحمراء', 'Red cart mass'], min: 0.5, max: 5, step: 0.1, def: 1, unit: 'kg' },
      { k: 'v1', label: ['سرعتها', 'Its velocity'], min: 0.5, max: 4, step: 0.1, def: 2, unit: 'm/s' },
      { k: 'm2', label: ['كتلة العربة الزرقاء', 'Blue cart mass'], min: 0.5, max: 5, step: 0.1, def: 1, unit: 'kg' },
      { k: 'v2', label: ['سرعتها', 'Its velocity'], min: -3, max: 1.5, step: 0.1, def: 0, unit: 'm/s' },
      { k: 'e', label: ['المرونة (1 مرن، 0 ملتحم)', 'Elasticity (1 elastic, 0 sticks)'], min: 0, max: 1, step: 0.05, def: 1, unit: '' },
    ],
    compute(p) {
      const v2 = Math.min(p.v2, p.v1 - 0.2), P = p.m1 * p.v1 + p.m2 * v2, M = p.m1 + p.m2, rel = p.v1 - v2;
      const f1 = (P - p.m2 * p.e * rel) / M, f2 = (P + p.m1 * p.e * rel) / M;
      const Ki = 0.5 * p.m1 * p.v1 ** 2 + 0.5 * p.m2 * v2 ** 2, Kf = 0.5 * p.m1 * f1 ** 2 + 0.5 * p.m2 * f2 ** 2;
      return { v2, P, f1, f2, Ki, Kf, lost: Ki - Kf };
    },
    big: (r) => ({ k: 'p', v: fmt(r.P, 3) + ' kg·m/s' }),
    cards: (r) => [['r', ['سرعة الحمراء بعد', 'Red after'], fmt(r.f1, 3), 'm/s'], ['e', ['سرعة الزرقاء بعد', 'Blue after'], fmt(r.f2, 3), 'm/s'], ['g', ['الزخم قبل = بعد', 'Momentum before = after'], fmt(r.P, 3), 'kg·m/s'], ['k', ['KE قبل → بعد', 'KE before → after'], `${fmt(r.Ki, 3)} → ${fmt(r.Kf, 3)}`, 'J']],
    chart: (p) => { const pts = []; for (let e = 0; e <= 1.001; e += 0.1) { const r = SCENES.find((s) => s.id === 'collide').compute({ ...p, e }); pts.push([e, r.Kf]); } return { series: [{ pts }], mark: [p.e, SCENES.find((s) => s.id === 'collide').compute(p).Kf], xLabel: ar() ? 'المرونة' : 'elasticity', yLabel: 'KE بعد (J)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); S.root.add(g);
      const track = box(11, 0.04, 0.9, mat(0x2a3550)); track.position.y = 0.02; g.add(track);
      const c1 = cart(C.red), c2 = cart(C.sig); g.add(c1, c2);
      const a1 = arrow(C.red), a2 = arrow(C.sig); g.add(a1, a2);
      const l1 = label('', 'r sm'), l2 = label('', 'e sm'), lT = label('', 'k'); g.add(l1, l2, lT);
      const bars = energyBars(g, -0.6, 1.3, [[ar() ? 'p حمراء' : 'p red', C.red, 'r'], [ar() ? 'p زرقاء' : 'p blue', C.sig, 'e'], [ar() ? 'p الكلي' : 'p total', C.green, 'g']]);
      return {
        update(p, r, k) {
          const t = (k - 0.5) * 3, x1 = t < 0 ? p.v1 * t - 0.36 : r.f1 * t - 0.36, x2 = t < 0 ? r.v2 * t + 0.36 : r.f2 * t + 0.36;
          const cl = (x) => Math.max(-5.2, Math.min(5.2, x));
          c1.position.x = cl(x1); c2.position.x = cl(x2);
          const u1 = t < 0 ? p.v1 : r.f1, u2 = t < 0 ? r.v2 : r.f2;
          const s1 = 0.8 + p.m1 / 6, s2 = 0.8 + p.m2 / 6; c1.body.scale.set(1, s1, 1); c2.body.scale.set(1, s2, 1);
          a1.visible = Math.abs(u1) > 0.05; a2.visible = Math.abs(u2) > 0.05;
          a1.set(V(c1.position.x, 0.8, 0), V(Math.sign(u1) || 1, 0, 0), 0.3 + Math.abs(u1) / 2.5); a2.set(V(c2.position.x, 0.8, 0), V(Math.sign(u2) || 1, 0, 0), 0.3 + Math.abs(u2) / 2.5);
          l1.position.set(c1.position.x, 1.2, 0); l1.set(`${fmt(u1, 3)} m/s`); l2.position.set(c2.position.x, 1.2, 0); l2.set(`${fmt(u2, 3)} m/s`);
          lT.position.set(0, -0.25, 0.8); lT.set(t < 0 ? (ar() ? 'قبل التصادم' : 'Before') : (ar() ? 'بعد التصادم' : 'After'));
          bars.position.z = -1.2; bars.set([p.m1 * u1, p.m2 * u2, r.P], 1.1 / Math.max(Math.abs(r.P), Math.abs(p.m1 * p.v1), Math.abs(p.m2 * r.f2), 0.1));
        },
      };
    },
    steps: [
      { cam: [0.0, 3.1, 9.2], at: [0, 0.6, 0], text: () => ar() ? 'عربتان على مسار أملس تتصادمان. النظام **مغلق ومعزول**، فالقوى في أثناء التصادم داخلية.' : 'Two carts collide on a smooth track. The system is **closed and isolated**, so the collision forces are internal.' },
      { cam: [1.5, 2.4, 6.8], at: [0, 0.6, 0], text: () => ar() ? 'كل عربة تؤثر في الأخرى بقوة مساوية ومعاكسة، فما تفقده إحداهما من زخم تكسبه الأخرى. **العمود الأخضر (الزخم الكلي) لا يتغير.**' : 'Each cart pushes the other equally and oppositely, so momentum lost by one is gained by the other. **The green bar (total momentum) never changes.**' },
      { cam: [0.0, 3.6, 8.0], at: [0, 0.6, 0], text: (p, r) => ar() ? `أما **الطاقة الحركية** فتعتمد على نوع التصادم: قبل ${fmt(r.Ki)} J وبعد ${fmt(r.Kf)} J. المرن يحفظها، والملتحم يفقد جزءًا منها حرارةً وصوتًا.` : `**Kinetic energy** depends on the collision type: ${fmt(r.Ki)} J before, ${fmt(r.Kf)} J after. Elastic keeps it; sticking loses some as heat and sound.` },
      { cam: [-1.8, 1.9, 6.2], at: [0, 0.4, 0], text: () => ar() ? 'جرّب: كتلتان متساويتان والثانية ساكنة ومرونة 1: **تتوقف الأولى وتنطلق الثانية بسرعتها** مثل كرات البلياردو.' : 'Try equal masses, the second at rest, elasticity 1: **the first stops and the second moves off at its speed**, like billiard balls.' },
    ],
  });

  SCENES.push({
    id: 'recoil', keys: ['ارتداد', 'الارتداد', 'حفظ الزخم', 'صاروخ', 'الدفع في الفضاء', 'recoil', 'rocket', 'conservation of momentum'],
    title: ['الارتداد', 'Recoil'], sub: ['من السكون: الزخم الكلي يبقى صفرًا', 'From rest: total momentum stays zero'],
    params: [
      { k: 'mA', label: ['كتلة المتزلج الأيمن', 'Right skater mass'], min: 30, max: 100, step: 1, def: 68, unit: 'kg' },
      { k: 'mB', label: ['كتلة المتزلج الأيسر', 'Left skater mass'], min: 20, max: 100, step: 0.5, def: 45.5, unit: 'kg' },
      { k: 'vB', label: ['سرعة الأيسر بعد الدفع', 'Left skater speed after push'], min: 0.5, max: 3, step: 0.1, def: 1.5, unit: 'm/s' },
    ],
    compute(p) { const vA = p.mB * p.vB / p.mA; return { vA, p: p.mB * p.vB }; },
    big: (r) => ({ k: 'vA', v: fmt(r.vA, 3) + ' m/s' }),
    cards: (r, p) => [['e', ['زخم الأيسر', 'Left momentum'], '−' + fmt(r.p, 3), 'kg·m/s'], ['r', ['زخم الأيمن', 'Right momentum'], '+' + fmt(r.p, 3), 'kg·m/s'], ['g', ['الزخم الكلي', 'Total momentum'], '0', 'kg·m/s'], ['k', ['نسبة السرعتين', 'Speed ratio'], fmt(p.mA / p.mB, 3), '']],
    chart: (p) => { const pts = []; for (let m = 30; m <= 100; m += 5) pts.push([m, p.mB * p.vB / m]); return { series: [{ pts }], mark: [p.mA, p.mB * p.vB / p.mA], xLabel: 'mA (kg)', yLabel: 'vA (m/s)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); S.root.add(g);
      const ice = box(10, 0.02, 3, mat(0xcfe6f5, { r: 0.15, m: 0.1 })); ice.position.y = 0.01; g.add(ice);
      const person = (color) => { const q = new THREE.Group(); const b = mesh(new THREE.CapsuleGeometry(0.2, 0.7, 6, 12), mat(color)); b.position.y = 0.75; q.add(b); const h = mesh(new THREE.SphereGeometry(0.15, 16, 12), mat(0xc9a27a)); h.position.y = 1.4; q.add(h); return q; };
      const A = person(C.red), B = person(C.sig); g.add(A, B);
      const aA = arrow(C.red), aB = arrow(C.sig); g.add(aA, aB);
      const lA = label('', 'r sm'), lB = label('', 'e sm'); g.add(lA, lB);
      return {
        update(p, r, k) {
          const t = Math.max(0, k - 0.25) * 3.2;
          A.scale.setScalar(0.8 + p.mA / 250); B.scale.setScalar(0.8 + p.mB / 250);
          A.position.x = 0.3 + r.vA * t; B.position.x = -0.3 - p.vB * t;
          const moving = t > 0; aA.visible = aB.visible = moving;
          aA.set(V(A.position.x, 1.9, 0), V(1, 0, 0), 0.3 + r.vA / 2); aB.set(V(B.position.x, 1.9, 0), V(-1, 0, 0), 0.3 + p.vB / 2);
          lA.position.set(A.position.x, 2.3, 0); lA.set(moving ? `${fmt(r.vA, 3)} m/s` : `${p.mA} kg`); lB.position.set(B.position.x, 2.3, 0); lB.set(moving ? `${fmt(p.vB, 3)} m/s` : `${p.mB} kg`);
        },
      };
    },
    steps: [
      { cam: [0.0, 2.7, 9.3], at: [0, 1, 0], text: () => ar() ? 'متزلجان ساكنان على جليد أملس. **الزخم الكلي صفر** قبل الدفع.' : 'Two skaters at rest on smooth ice. **Total momentum is zero** before the push.' },
      { cam: [1.2, 2.2, 8.1], at: [0, 1, 0], text: () => ar() ? 'قوة الدفع داخلية، فيبقى الزخم الكلي صفرًا بعدها: $m_A v_A = -m_B v_B$. يتحركان في **اتجاهين متعاكسين** بزخمين متساويين.' : 'The push is internal, so total momentum stays zero: $m_A v_A = -m_B v_B$. They move **apart** with equal momenta.' },
      { cam: [0.0, 4.0, 8.7], at: [0, 0.8, 0], text: (p) => ar() ? `**الأخف أسرع:** نسبة السرعتين تساوي مقلوب نسبة الكتلتين = ${fmt(p.mA / p.mB)}. وبالمبدأ نفسه ترتد البندقية ويتسارع الصاروخ في الفضاء.` : `**The lighter one is faster:** the speed ratio is the inverse mass ratio = ${fmt(p.mA / p.mB)}. The same idea makes a gun recoil and a rocket accelerate in space.` },
    ],
  });

  SCENES.push({
    id: 'work', keys: ['الشغل', 'شغل', 'القدرة', 'قدرة', 'جول', 'واط', 'work', 'power', 'joule'],
    title: ['الشغل والقدرة', 'Work and power'], sub: ['W = Fd cos θ · P = W/t', 'W = Fd cos θ · P = W/t'],
    params: [
      { k: 'F', label: ['قوة السحب', 'Pulling force'], min: 10, max: 300, step: 5, def: 125, unit: 'N' },
      { k: 'th', label: ['زاوية الحبل مع الأفقي', 'Rope angle'], min: 0, max: 85, step: 1, def: 25, unit: '°' },
      { k: 'd', label: ['المسافة', 'Distance'], min: 1, max: 5, step: 0.1, def: 3, unit: 'm' },
      { k: 'm', label: ['كتلة الصندوق', 'Box mass'], min: 5, max: 60, step: 1, def: 20, unit: 'kg' },
    ],
    compute(p) { const c = Math.cos(p.th * Math.PI / 180), Fx = p.F * c, W = Fx * p.d, v = Math.sqrt(2 * W / p.m), t = 2 * p.d / v; return { Fx, Fy: p.F * Math.sin(p.th * Math.PI / 180), W, v, t, P: W / t }; },
    big: (r) => ({ k: 'W', v: fmt(r.W, 3) + ' J' }),
    cards: (r) => [['e', ['المركبة الأفقية F cos θ', 'Horizontal part F cos θ'], fmt(r.Fx, 3), 'N'], ['g', ['الشغل = ΔKE', 'Work = ΔKE'], fmt(r.W, 3), 'J'], ['k', ['السرعة في النهاية', 'Final speed'], fmt(r.v, 3), 'm/s'], ['r', ['القدرة P = W/t', 'Power P = W/t'], fmt(r.P, 3), 'W']],
    chart: (p) => { const pts = []; for (let a = 0; a <= 85; a += 5) pts.push([a, p.F * Math.cos(a * Math.PI / 180) * p.d]); return { series: [{ pts }], mark: [p.th, p.F * Math.cos(p.th * Math.PI / 180) * p.d], xLabel: 'θ (°)', yLabel: 'W (J)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); S.root.add(g);
      const floor = box(9, 0.04, 1.6, mat(0x3a4560)); floor.position.y = 0.02; g.add(floor);
      const bx = box(0.7, 0.6, 0.7, mat(C.wood, { r: 0.8 })); g.add(bx);
      const rope = rod(0.015, mat(C.rope)); g.add(rope);
      const aF = arrow(C.sig), aX = arrow(C.green), aY = arrow(C.violet); g.add(aF, aX, aY);
      const lF = label('', 'e sm'), lX = label('', 'g sm'), lW = label('', 'k'); g.add(lF, lX, lW);
      const startM = rod(0.01, mat(C.acc, { op: 0.7 })), endM = rod(0.01, mat(C.acc, { op: 0.7 })); g.add(startM, endM);
      return {
        update(p, r, k) {
          const u = ease(Math.min(1, k * 1.25)), x0 = -p.d / 2 - 0.6, x = x0 + u * p.d;
          bx.position.set(x, 0.32, 0); bx.scale.setScalar(0.8 + p.m / 120);
          const th = p.th * Math.PI / 180, att = V(x + 0.35, 0.45, 0), hand = att.clone().add(V(Math.cos(th), Math.sin(th), 0).multiplyScalar(1.6));
          rope.between(att, hand);
          aF.set(hand, V(Math.cos(th), Math.sin(th), 0), 0.4 + p.F / 300); aX.set(att.clone().add(V(0, -0.3, 0.5)), V(1, 0, 0), 0.3 + r.Fx / 300); aY.visible = r.Fy > 2; aY.set(att.clone().add(V(0.3, 0, 0.5)), V(0, 1, 0), 0.2 + r.Fy / 300);
          lF.position.copy(hand).add(V(0.5, 0.4, 0)); lF.set(`F = ${p.F} N`); lX.position.copy(att).add(V(0.6, -0.55, 0.5)); lX.set(`F cos θ = ${fmt(r.Fx, 3)} N`);
          lW.position.set(0, 2.2, 0); lW.set(`W = ${fmt(r.W * u, 3)} J`);
          startM.between(V(x0, 0.05, 0.8), V(x0, 0.05, -0.8)); endM.between(V(x0 + p.d, 0.05, 0.8), V(x0 + p.d, 0.05, -0.8));
        },
      };
    },
    steps: [
      { cam: [0, 2.2, 6.6], at: [0, 0.8, 0], text: () => ar() ? 'نسحب صندوقًا بحبل على أرض ملساء. **الشغل** هو القوة مضروبة في الإزاحة في اتجاهها: $W = Fd$.' : 'We pull a box with a rope on a smooth floor. **Work** is force times displacement in its direction: $W = Fd$.' },
      { cam: [1.4, 1.4, 4.6], at: [0, 0.6, 0], text: (p, r) => ar() ? `الحبل مائل بزاوية ${p.th}°، فالمركبة **الأفقية** (الخضراء) $F\\cos\\theta$ = ${fmt(r.Fx)} N وحدها تبذل شغلًا؛ والرأسية لا تحرك الصندوق أفقيًا.` : `The rope is at ${p.th}°, so only the **horizontal** part (green) $F\\cos\\theta$ = ${fmt(r.Fx)} N does work; the vertical part does not move the box along.` },
      { cam: [0, 2.8, 6], at: [0, 0.8, 0], text: (p, r) => ar() ? `$W = Fd\\cos\\theta$ = ${fmt(r.W)} J، ويساوي حسب **نظرية الشغل – الطاقة** الطاقة الحركية التي اكتسبها الصندوق، فتصبح سرعته ${fmt(r.v)} m/s.` : `$W = Fd\\cos\\theta$ = ${fmt(r.W)} J, which by the **work–energy theorem** equals the kinetic energy gained, giving ${fmt(r.v)} m/s.` },
      { cam: [-1.6, 2, 5.4], at: [0, 0.8, 0], text: (p, r) => ar() ? `**القدرة** معدل بذل الشغل: $P = W/t$ = ${fmt(r.P)} W. صغّر الزاوية: يزيد الشغل والقدرة بالقوة نفسها.` : `**Power** is the rate of doing work: $P = W/t$ = ${fmt(r.P)} W. Lower the angle: more work and power for the same force.` },
    ],
  });

  SCENES.push({
    id: 'coaster', keys: ['حفظ الطاقة', 'الطاقة الميكانيكية', 'قطار الملاهي', 'منحدر', 'conservation of energy', 'mechanical energy', 'roller coaster'],
    title: ['قطار الملاهي', 'Roller coaster'], sub: ['حفظ الطاقة الميكانيكية · E = KE + PE', 'Conservation of mechanical energy'],
    params: [
      { k: 'h0', label: ['ارتفاع القمة الأولى', 'First hill height'], min: 10, max: 40, step: 1, def: 30, unit: 'm' },
      { k: 'f', label: ['الطاقة المفقودة بالاحتكاك', 'Energy lost to friction'], min: 0, max: 30, step: 1, def: 0, unit: '%' },
    ],
    compute(p) { const m = 500, E = m * G * p.h0; return { m, E, vmax: Math.sqrt(2 * G * p.h0 * (1 - p.f / 100)) }; },
    big: (r) => ({ k: 'E', v: fmt(r.E / 1000, 3) + ' kJ' }),
    cards: (r, p) => [['g', ['الطاقة عند القمة', 'Energy at the top'], fmt(r.E, 3), 'J'], ['k', ['أقصى سرعة تقريبًا', 'Top speed (approx.)'], fmt(r.vmax, 3), 'm/s'], ['r', ['المفقود حرارةً', 'Lost as heat'], p.f, '%'], ['e', ['كتلة العربة', 'Car mass'], r.m, 'kg']],
    chart: (p) => { const pts = []; for (let x = -7; x <= 7.01; x += 0.25) pts.push([x, 500 * G * p.h0 * (TR(x) / 1)]); return { series: [{ pts }], xLabel: 'x', yLabel: 'PE (J)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); S.root.add(g);
      const SC = 0.1, pts = []; for (let x = -7; x <= 7.001; x += 0.1) pts.push(V(x, 0.3 + TR(x) * 3, 0));
      const curve = new THREE.CatmullRomCurve3(pts);
      const rail = new THREE.Mesh(new THREE.TubeGeometry(curve, 300, 0.05, 8), mat(C.metal, { m: 0.7 })); g.add(rail);
      for (let x = -6.5; x <= 7; x += 0.9) { const y = 0.3 + TR(x) * 3; const leg = cyl(0.03, 0.03, y, mat(C.dark), 8); leg.position.set(x, y / 2, 0); g.add(leg); }
      const car = box(0.7, 0.4, 0.5, mat(C.red, { m: 0.3, e: C.red, ei: 0.3 })); g.add(car);
      const bars = energyBars(g, 1.6, 0.4, [['KE', C.acc, 'k'], ['PE', C.sig, 'e'], [ar() ? 'حرارة' : 'Heat', C.red, 'r'], [ar() ? 'المجموع' : 'Total', C.green, 'g']]); bars.position.z = -2.2;
      const lV = label('', 'k sm'); g.add(lV);
      let x = -6.9, dir = 1; void SC;
      return {
        update(p, r, k, dt) {
          const h = (xx) => TR(xx) * p.h0, h0 = h(-7) || p.h0;
          const lostFrac = p.f / 100 * Math.min(1, (x + 7) / 14);
          const Ek = r.m * G * (p.h0 - h(x)) - r.E * lostFrac, v = Math.sqrt(Math.max(0.3, 2 * Ek / r.m));
          x += dir * v * dt * 0.12; if (x > 6.95) x = -6.9;
          const y = 0.3 + TR(x) * 3, slope = (TR(x + 0.01) - TR(x - 0.01)) / 0.02 * 3;
          car.position.set(x, y + 0.2, 0); car.rotation.z = Math.atan(slope);
          const PE = r.m * G * h(x), KE = Math.max(0, r.E - PE - r.E * lostFrac);
          bars.set([KE, PE, r.E * lostFrac, r.E], 1.8 / r.E);
          lV.position.set(x, y + 0.7, 0); lV.set(`v = ${fmt(v, 3)} m/s`); void h0;
        },
      };
    },
    steps: [
      { cam: [0, 3.2, 9], at: [0, 1.6, 0], text: (p, r) => ar() ? `العربة تبدأ ساكنة أعلى القمة الأولى (${p.h0} m): طاقتها الميكانيكية كلها **طاقة وضع** = ${fmt(r.E)} J.` : `The car starts at rest on the first hill (${p.h0} m): all its mechanical energy is **potential** = ${fmt(r.E)} J.` },
      { cam: [-2, 2.4, 6.4], at: [-2, 1.4, 0], text: () => ar() ? 'وهي تنزل تتحول طاقة الوضع إلى **طاقة حركية** فتزداد سرعتها، وعند الصعود يحدث العكس. بلا احتكاك: $KE_i + PE_i = KE_f + PE_f$.' : 'Going down, potential energy becomes **kinetic** and it speeds up; going up, the reverse. Without friction: $KE_i + PE_i = KE_f + PE_f$.' },
      { cam: [0, 4, 8], at: [0, 1.6, 0], text: () => ar() ? '**العمود الأخضر ثابت**، ولذلك لا تستطيع العربة صعود قمة أعلى من القمة الأولى، ولهذا تكون أول قمة هي الأعلى دائمًا.' : '**The green total stays constant**, so the car can never climb higher than the first hill, which is why the first hill is always the tallest.' },
      { cam: [2, 2.6, 7], at: [1, 1.4, 0], text: () => ar() ? 'أضف **احتكاكًا**: يتحول جزء من الطاقة إلى حرارة (العمود الأحمر)، فتقل الطاقة الميكانيكية. الطاقة الكلية ما زالت محفوظة.' : 'Add **friction**: part of the energy becomes heat (red bar) and the mechanical energy falls. Total energy is still conserved.' },
    ],
  });
  // track profile, 1 at the first hill
  function TR(x) { return Math.max(0, Math.exp(-((x + 6.6) ** 2) / 2.2) + 0.72 * Math.exp(-((x + 0.6) ** 2) / 1.6) + 0.4 * Math.exp(-((x - 4.2) ** 2) / 1.2) + 0.02); }

  SCENES.push({
    id: 'pendulum', keys: ['بندول', 'البندول', 'تذبذب', 'pendulum', 'oscillation'],
    title: ['البندول', 'The pendulum'], sub: ['تبادل طاقة الوضع والطاقة الحركية', 'Potential and kinetic energy trade places'],
    params: [
      { k: 'L', label: ['طول الخيط', 'String length'], min: 0.5, max: 2.5, step: 0.05, def: 2, unit: 'm' },
      { k: 'a0', label: ['زاوية البداية', 'Starting angle'], min: 5, max: 70, step: 1, def: 35, unit: '°' },
      { k: 'b', label: ['مقاومة الهواء', 'Air resistance'], min: 0, max: 0.3, step: 0.01, def: 0, unit: '' },
    ],
    compute(p) { const m = 1, h = p.L * (1 - Math.cos(p.a0 * Math.PI / 180)); return { T: 2 * Math.PI * Math.sqrt(p.L / G), h, E: m * G * h, vmax: Math.sqrt(2 * G * h) }; },
    big: (r) => ({ k: 'T', v: fmt(r.T, 3) + ' s' }),
    cards: (r) => [['e', ['أقصى ارتفاع', 'Max height'], fmt(r.h, 3), 'm'], ['k', ['أقصى سرعة', 'Max speed'], fmt(r.vmax, 3), 'm/s'], ['g', ['الطاقة (1 kg)', 'Energy (1 kg)'], fmt(r.E, 3), 'J'], ['r', ['الزمن الدوري', 'Period'], fmt(r.T, 3), 's']],
    chart: (p) => { const pts = []; for (let L = 0.5; L <= 2.51; L += 0.1) pts.push([L, 2 * Math.PI * Math.sqrt(L / G)]); return { series: [{ pts }], mark: [p.L, 2 * Math.PI * Math.sqrt(p.L / G)], xLabel: 'L (m)', yLabel: 'T (s)', yMin: 0 }; },
    build(S) {
      const g = new THREE.Group(); S.root.add(g);
      const top = 3.1, frame = box(2.6, 0.08, 0.3, mat(C.dark)); frame.position.y = top; g.add(frame);
      [-1.25, 1.25].forEach((x) => { const leg = cyl(0.04, 0.04, top, mat(C.dark), 8); leg.position.set(x, top / 2, 0); g.add(leg); });
      const str = rod(0.008, mat(0xffffff)); g.add(str);
      const bob = mesh(new THREE.SphereGeometry(0.16, 24, 16), mat(C.acc, { m: 0.5 })); g.add(bob);
      const ref = rod(0.008, mat(C.sig, { op: 0.6 })); g.add(ref);
      const bars = energyBars(g, 1.9, 0.6, [['KE', C.acc, 'k'], ['PE', C.sig, 'e'], [ar() ? 'المجموع' : 'Total', C.green, 'g']]);
      let th = null, w = 0, lastKey = '';
      return {
        update(p, r, k, dt) {
          const key = p.L + '|' + p.a0; if (key !== lastKey) { lastKey = key; th = p.a0 * Math.PI / 180; w = 0; }
          for (let i = 0; i < 4; i++) { const h = dt / 4; w += (-G / p.L * Math.sin(th) - p.b * w) * h; th += w * h; }
          if (Math.abs(th) < 0.02 && Math.abs(w) < 0.02) { th = p.a0 * Math.PI / 180; w = 0; }
          const Ld = p.L * 1.1, piv = V(0, top, 0), pos = V(Math.sin(th) * Ld, top - Math.cos(th) * Ld, 0);
          str.between(piv, pos); bob.position.copy(pos);
          const low = top - Ld; ref.between(V(-1.2, low, 0.3), V(1.2, low, 0.3));
          const PE = G * p.L * (1 - Math.cos(th)), KE = 0.5 * (w * p.L) ** 2;
          bars.set([KE, PE, KE + PE], 2 / Math.max(r.E, 0.01));
        },
      };
    },
    steps: [
      { cam: [0, 2.2, 6.6], at: [0.6, 1.8, 0], text: () => ar() ? 'نرفع ثقل البندول جانبًا فنبذل شغلًا يكسب النظام (الثقل والأرض) **طاقة وضع**. نختار مستوى الإسناد عند أدنى نقطة.' : 'Pulling the bob aside does work that gives the bob–Earth system **potential energy**. We put the reference level at the lowest point.' },
      { cam: [1, 1.6, 5.4], at: [0.8, 1.4, 0], text: () => ar() ? 'عند أدنى نقطة الطاقة كلها **حركية**، وعند الطرفين كلها **وضع**. والمجموع (الأخضر) ثابت عند انعدام الاحتكاك.' : 'At the bottom it is all **kinetic**, at each end all **potential**. The green total stays constant without friction.' },
      { cam: [-1.2, 2, 6], at: [0.6, 1.8, 0], text: (p, r) => ar() ? `الزمن الدوري $T = 2\\pi\\sqrt{L/g}$ = ${fmt(r.T)} s يعتمد على الطول فقط. أضف **مقاومة الهواء**: تقل الطاقة الميكانيكية تدريجيًا وتتحول حرارة حتى يتوقف.` : `The period $T = 2\\pi\\sqrt{L/g}$ = ${fmt(r.T)} s depends only on length. Add **air resistance**: mechanical energy slowly turns into heat until it stops.` },
    ],
  });

  SCENES.push({
    id: 'particles', keys: ['درجة الحرارة', 'الطاقة الحرارية', 'اتزان حراري', 'الاتزان الحراري', 'جزيئات', 'حرارة نوعية', 'الحرارة النوعية', 'المسعر', 'temperature', 'thermal energy', 'specific heat'],
    title: ['الجزيئات والاتزان الحراري', 'Molecules and thermal equilibrium'], sub: ['الحرارة تنتقل من الأسخن إلى الأبرد', 'Heat flows from hot to cold'],
    params: [
      { k: 'TA', label: ['درجة حرارة الجسم الساخن', 'Hot body temperature'], min: 300, max: 600, step: 5, def: 500, unit: 'K' },
      { k: 'TB', label: ['درجة حرارة الجسم البارد', 'Cold body temperature'], min: 200, max: 400, step: 5, def: 280, unit: 'K' },
      { k: 'mB', label: ['كتلة الجسم البارد (ماء)', 'Cold body mass (water)'], min: 0.5, max: 3, step: 0.1, def: 1, unit: 'kg' },
    ],
    compute(p) { const mA = 1, Tf = (mA * p.TA + p.mB * p.TB) / (mA + p.mB); return { Tf, Q: mA * 4180 * (p.TA - Tf) }; },
    big: (r) => ({ k: 'T_f', v: fmt(r.Tf, 3) + ' K' }),
    cards: (r, p) => [['r', ['الساخن (1 kg ماء)', 'Hot (1 kg water)'], p.TA, 'K'], ['e', ['البارد', 'Cold'], p.TB, 'K'], ['g', ['درجة الاتزان', 'Equilibrium temperature'], fmt(r.Tf, 3), 'K'], ['k', ['الحرارة المنتقلة Q', 'Heat transferred Q'], fmt(r.Q, 3), 'J']],
    chart: (p) => { const r = { Tf: (p.TA + p.mB * p.TB) / (1 + p.mB) }, a = [], b = []; for (let t = 0; t <= 1.001; t += 0.05) { const f = Math.exp(-4 * t); a.push([t, r.Tf + (p.TA - r.Tf) * f]); b.push([t, r.Tf + (p.TB - r.Tf) * f]); } return { series: [{ pts: a }, { pts: b }], xLabel: ar() ? 'الزمن' : 'time', yLabel: 'T (K)' }; },
    build(S) {
      const g = new THREE.Group(); g.position.y = 1; S.root.add(g);
      const glass = new THREE.MeshStandardMaterial({ color: 0x9fb4d6, transparent: true, opacity: 0.12, roughness: 0.1 });
      const boxA = mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), glass, false); boxA.position.x = -0.92; g.add(boxA);
      const boxB = mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), glass.clone(), false); boxB.position.x = 0.92; g.add(boxB);
      const wall = box(0.04, 1.8, 1.8, mat(C.metal, { m: 0.8, op: 0.6 })); g.add(wall);
      const N = 40, geo = new THREE.SphereGeometry(0.05, 10, 8);
      const make = (cx) => Array.from({ length: N }, () => { const s = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.4 })); s.position.set(cx + (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6); const d = V(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(); s.d = d; g.add(s); return s; });
      const A = make(-0.92), B = make(0.92);
      const lA = label('', 'r'), lB = label('', 'e'), lQ = label('', 'k sm'); g.add(lA, lB, lQ);
      const aQ = arrow(C.acc); g.add(aQ);
      const col = (T) => new THREE.Color().setHSL(0.62 - 0.62 * Math.max(0, Math.min(1, (T - 200) / 400)), 0.9, 0.55);
      return {
        update(p, r, k, dt) {
          const f = Math.exp(-4 * Math.min(1, k * 1.2)), TA = r.Tf + (p.TA - r.Tf) * f, TB = r.Tf + (p.TB - r.Tf) * f;
          const move = (arr, cx, T) => { const sp = Math.sqrt(T / 300) * 1.4, c = col(T); arr.forEach((s) => { s.position.addScaledVector(s.d, sp * dt); ['x', 'y', 'z'].forEach((ax) => { const lo = (ax === 'x' ? cx : 0) - 0.85, hi = (ax === 'x' ? cx : 0) + 0.85; if (s.position[ax] < lo) { s.position[ax] = lo; s.d[ax] *= -1; } if (s.position[ax] > hi) { s.position[ax] = hi; s.d[ax] *= -1; } }); s.material.color.copy(c); s.material.emissive.copy(c); }); };
          move(A, -0.92, TA); move(B, 0.92, TB);
          lA.position.set(-0.92, 1.2, 0); lA.set(`${fmt(TA, 3)} K`); lB.position.set(0.92, 1.2, 0); lB.set(`${fmt(TB, 3)} K`);
          aQ.visible = Math.abs(TA - TB) > 3; aQ.set(V(-0.5, -1.15, 0.9), V(1, 0, 0), 0.4 + Math.abs(TA - TB) / 300);
          lQ.position.set(0, -1.45, 0.9); lQ.set(Math.abs(TA - TB) > 3 ? (ar() ? 'الحرارة Q →' : 'heat Q →') : (ar() ? 'اتزان حراري' : 'thermal equilibrium'));
        },
      };
    },
    steps: [
      { cam: [0, 2, 5], at: [0, 1, 0], text: () => ar() ? 'جسمان متلامسان: جزيئات الساخن (الأحمر) **متوسط طاقتها الحركية أكبر** فتتحرك أسرع. **درجة الحرارة** مقياس لهذا المتوسط.' : 'Two bodies in contact: the hot one’s molecules (red) have **higher average kinetic energy** and move faster. **Temperature** measures that average.' },
      { cam: [0.6, 1.4, 4], at: [0, 0.6, 0], text: () => ar() ? 'عند الجدار تصطدم الجزيئات السريعة بالبطيئة فتنقل لها طاقة بالتوصيل: هذه **الحرارة** Q، وتتدفق تلقائيًا من الأسخن إلى الأبرد.' : 'At the wall fast molecules hit slow ones and pass energy by conduction: this is **heat** Q, flowing by itself from hot to cold.' },
      { cam: [0, 2.4, 5.4], at: [0, 1, 0], text: (p, r) => ar() ? `يستمر التدفق حتى **الاتزان الحراري** عند ${fmt(r.Tf)} K. زِد كتلة البارد: يتغير الساخن كثيرًا والبارد قليلًا، كما في المسعر.` : `Flow continues until **thermal equilibrium** at ${fmt(r.Tf)} K. Increase the cold mass: the hot one changes a lot, the cold one little, as in a calorimeter.` },
    ],
  });

  SCENES.push({
    id: 'phase', keys: ['انصهار', 'غليان', 'تبخر', 'الحرارة الكامنة', 'كامنة', 'حالة المادة', 'تغير الحالة', 'melting', 'boiling', 'latent heat'],
    title: ['من الجليد إلى البخار', 'From ice to steam'], sub: ['منحنى التسخين والحرارة الكامنة · الشكل 10-6', 'Heating curve and latent heat · Figure 6-10'],
    params: [
      { k: 'm', label: ['الكتلة', 'Mass'], min: 0.1, max: 1, step: 0.05, def: 0.5, unit: 'kg' },
      { k: 'P', label: ['قدرة السخان', 'Heater power'], min: 500, max: 3000, step: 50, def: 1500, unit: 'W' },
    ],
    compute(p) { const m = p.m, q = [m * 2060 * 20, m * 3.34e5, m * 4180 * 100, m * 2.26e6, m * 2020 * 20]; const tot = q.reduce((a, b) => a + b, 0); return { q, tot, time: tot / p.P }; },
    big: (r) => ({ k: 'Q', v: fmt(r.tot / 1000, 3) + ' kJ' }),
    cards: (r) => [['e', ['انصهار mH_f', 'Melting mH_f'], fmt(r.q[1] / 1000, 3), 'kJ'], ['k', ['تسخين الماء 100 K', 'Heating water 100 K'], fmt(r.q[2] / 1000, 3), 'kJ'], ['r', ['تبخر mH_v', 'Boiling mH_v'], fmt(r.q[3] / 1000, 3), 'kJ'], ['g', ['زمن التسخين كله', 'Total heating time'], fmt(r.time / 60, 3), 'min']],
    chart: (p) => { const r = SCENES.find((s) => s.id === 'phase').compute(p), T = [253, 273, 273, 373, 373, 393]; let acc = 0; const pts = [[0, 253]]; r.q.forEach((q, i) => { acc += q; pts.push([acc / 1000, T[i + 1]]); }); return { series: [{ pts }], xLabel: 'Q (kJ)', yLabel: 'T (K)' }; },
    build(S) {
      const g = new THREE.Group(); S.root.add(g);
      const stove = box(1.6, 0.3, 1.6, mat(C.dark)); stove.position.y = 0.15; g.add(stove);
      const coil = mesh(new THREE.TorusGeometry(0.45, 0.04, 8, 32), mat(C.red, { e: C.red, ei: 0.2 })); coil.rotation.x = Math.PI / 2; coil.position.y = 0.32; g.add(coil);
      const pot = mesh(new THREE.CylinderGeometry(0.6, 0.55, 1.1, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x9fb4d6, transparent: true, opacity: 0.18, side: THREE.DoubleSide }), false); pot.position.y = 0.9; g.add(pot);
      const water = cyl(0.56, 0.53, 1, new THREE.MeshStandardMaterial({ color: 0x3f8fd6, transparent: true, opacity: 0.7 }), 40); g.add(water);
      const ice = box(0.55, 0.45, 0.55, new THREE.MeshStandardMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.85, roughness: 0.1 })); g.add(ice);
      const steam = Array.from({ length: 24 }, () => { const s = mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 }), false); s.p = Math.random(); s.x = (Math.random() - 0.5) * 0.8; s.z = (Math.random() - 0.5) * 0.8; g.add(s); return s; });
      const thermo = cyl(0.04, 0.04, 1.6, mat(0xffffff, { op: 0.3 }), 8); thermo.position.set(1.2, 1.1, 0); g.add(thermo);
      const merc = cyl(0.03, 0.03, 1, mat(C.red, { e: C.red }), 8); g.add(merc);
      const lT = label('', 'r'), lP = label('', 'k'); g.add(lT, lP);
      return {
        update(p, r, k) {
          const Q = Math.min(1, k * 1.1) * r.tot; let acc = 0, seg = 0; for (; seg < 5; seg++) { if (Q <= acc + r.q[seg]) break; acc += r.q[seg]; }
          const f = seg < 5 ? (Q - acc) / r.q[seg] : 1;
          const T = [253 + 20 * f, 273, 273 + 100 * f, 373, 373 + 20 * f][Math.min(seg, 4)];
          const iceLeft = seg === 0 ? 1 : seg === 1 ? 1 - f : 0, waterAmt = seg === 0 ? 0 : seg === 1 ? f : seg === 2 ? 1 : seg === 3 ? 1 - f : 0;
          ice.visible = iceLeft > 0.02; ice.scale.setScalar(Math.max(0.05, Math.cbrt(iceLeft))); ice.position.y = 0.4 + 0.22 * ice.scale.y;
          water.visible = waterAmt > 0.02; const hw = 0.7 * waterAmt + 0.02; water.scale.y = hw; water.position.y = 0.36 + hw / 2;
          const boiling = seg >= 3;
          steam.forEach((s) => { s.visible = boiling; s.p = (s.p + 0.01) % 1; s.position.set(s.x * (1 + s.p), 1.2 + s.p * 1.6, s.z * (1 + s.p)); s.material.opacity = 0.5 * (1 - s.p); });
          const hm = 0.05 + 1.5 * (T - 253) / 140; merc.scale.y = hm; merc.position.set(1.2, 0.3 + hm / 2, 0);
          lT.position.set(1.2, 2.1, 0); lT.set(`${fmt(T, 3)} K`);
          lP.position.set(0, 2.6, 0); lP.set([ar() ? 'تسخين الجليد' : 'heating ice', ar() ? 'انصهار: الحرارة ثابتة' : 'melting: T constant', ar() ? 'تسخين الماء' : 'heating water', ar() ? 'غليان: الحرارة ثابتة' : 'boiling: T constant', ar() ? 'تسخين البخار' : 'heating steam'][Math.min(seg, 4)]);
        },
      };
    },
    steps: [
      { cam: [0, 2, 4.6], at: [0.3, 1, 0], text: () => ar() ? 'نسخن جليدًا عند 253 K. في البداية ترتفع درجة حرارته: الحرارة تزيد الطاقة الحركية لجزيئاته.' : 'We heat ice at 253 K. At first its temperature rises: the heat raises the molecules’ kinetic energy.' },
      { cam: [0.8, 1.6, 3.6], at: [0, 0.8, 0], text: (p, r) => ar() ? `عند 273 K **ينصهر** والحرارة **ثابتة**: الطاقة تُستهلك في فك الروابط. $Q = mH_f$ = ${fmt(r.q[1] / 1000)} kJ.` : `At 273 K it **melts** and the temperature **stays constant**: energy goes into breaking bonds. $Q = mH_f$ = ${fmt(r.q[1] / 1000)} kJ.` },
      { cam: [0, 2.4, 4.4], at: [0.3, 1.2, 0], text: (p, r) => ar() ? `يسخن الماء حتى 373 K ثم **يغلي** والحرارة ثابتة مرة أخرى: $Q = mH_v$ = ${fmt(r.q[3] / 1000)} kJ، وهي أكبر جزء من الطاقة كلها.` : `The water warms to 373 K, then **boils** at constant temperature again: $Q = mH_v$ = ${fmt(r.q[3] / 1000)} kJ, the biggest share of all.` },
    ],
  });

  SCENES.push({
    id: 'engine', keys: ['محرك', 'المحرك الحراري', 'الديناميكا الحرارية', 'القانون الأول', 'إنتروبي', 'مبرد', 'heat engine', 'thermodynamics', 'entropy'],
    title: ['المحرك الحراري', 'Heat engine'], sub: ['W = Q_H − Q_L · الكفاءة أقل من 100%', 'W = Q_H − Q_L · efficiency below 100%'],
    params: [
      { k: 'QH', label: ['الحرارة من المستودع الساخن', 'Heat from the hot reservoir'], min: 100, max: 2000, step: 50, def: 1000, unit: 'J' },
      { k: 'e', label: ['الكفاءة', 'Efficiency'], min: 5, max: 60, step: 1, def: 30, unit: '%' },
    ],
    compute(p) { const W = p.QH * p.e / 100; return { W, QL: p.QH - W }; },
    big: (r) => ({ k: 'W', v: fmt(r.W, 3) + ' J' }),
    cards: (r, p) => [['r', ['Q_H (داخل)', 'Q_H (in)'], p.QH, 'J'], ['g', ['W شغل نافع', 'W useful work'], fmt(r.W, 3), 'J'], ['e', ['Q_L ضائعة', 'Q_L wasted'], fmt(r.QL, 3), 'J'], ['k', ['الكفاءة', 'Efficiency'], p.e, '%']],
    chart: (p) => ({ series: [{ pts: [[5, p.QH * 0.05], [60, p.QH * 0.6]] }], mark: [p.e, p.QH * p.e / 100], xLabel: 'e (%)', yLabel: 'W (J)', yMin: 0 }),
    build(S) {
      const g = new THREE.Group(); S.root.add(g);
      const hot = box(3, 0.4, 1.4, mat(C.red, { e: C.red, ei: 0.3 })); hot.position.y = 3.3; g.add(hot);
      const cold = box(3, 0.4, 1.4, mat(C.sig, { e: C.sig, ei: 0.2 })); cold.position.y = 0.2; g.add(cold);
      const cylM = mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.3, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x9fb4d6, transparent: true, opacity: 0.25, side: THREE.DoubleSide }), false); cylM.position.y = 1.75; g.add(cylM);
      const piston = cyl(0.43, 0.43, 0.14, mat(C.metal, { m: 0.7 }), 32); g.add(piston);
      const gas = cyl(0.42, 0.42, 1, new THREE.MeshStandardMaterial({ color: 0xff8a5c, transparent: true, opacity: 0.45 }), 32); g.add(gas);
      const fly = wheel(0.5, 0.12, mat(C.acc, { m: 0.5 })); fly.position.set(2.2, 1.75, 0); g.add(fly);
      const link = rod(0.03, mat(C.metal)); g.add(link);
      const aH = arrow(C.red), aL = arrow(C.sig), aW = arrow(C.green); g.add(aH, aL, aW);
      const lH = label('', 'r'), lL = label('', 'e'), lW = label('', 'g'), lHot = label(ar() ? 'مستودع ساخن T_H' : 'Hot reservoir T_H', 'r sm'), lCold = label(ar() ? 'مستودع بارد T_L' : 'Cold reservoir T_L', 'e sm'); g.add(lH, lL, lW, lHot, lCold);
      let ang = 0;
      return {
        update(p, r, k, dt) {
          ang += dt * (1 + r.W / 300); fly.rotation.z = -ang;
          const y = 1.75 + Math.sin(ang) * 0.35; piston.position.y = y; const gh = y - 1.12; gas.scale.y = Math.max(0.05, gh); gas.position.y = 1.1 + gas.scale.y / 2;
          const crank = V(2.2 + Math.cos(ang) * 0.35, 1.75 + Math.sin(ang) * 0.35, 0.1); link.between(V(0, y, 0.1), crank);
          aH.set(V(-0.9, 3.05, 0), V(0, -1, 0), 0.4 + p.QH / 1500); aL.set(V(-0.9, 1.0, 0), V(0, -1, 0), 0.25 + r.QL / 1800); aW.set(V(2.9, 2.6, 0), V(1, 0, 0), 0.3 + r.W / 1200);
          lH.position.set(-1.6, 2.7, 0); lH.set(`Q_H = ${p.QH} J`); lL.position.set(-1.6, 0.8, 0); lL.set(`Q_L = ${fmt(r.QL, 3)} J`); lW.position.set(3.4, 3, 0); lW.set(`W = ${fmt(r.W, 3)} J`);
          lHot.position.set(1.2, 3.75, 0.6); lCold.position.set(1.2, -0.15, 0.6);
        },
      };
    },
    steps: [
      { cam: [0.6, 2, 7], at: [0.6, 1.8, 0], text: () => ar() ? 'المحرك الحراري يمتص حرارة $Q_H$ من **مستودع ساخن** (مثل احتراق الوقود)، فيتمدد الغاز ويدفع المكبس.' : 'A heat engine takes heat $Q_H$ from a **hot reservoir** (like burning fuel); the gas expands and pushes the piston.' },
      { cam: [2, 2, 5.4], at: [1.2, 1.8, 0], text: (p, r) => ar() ? `جزء من الحرارة يصبح **شغلًا نافعًا** $W$ = ${fmt(r.W)} J يدير الحدافة، والباقي $Q_L$ = ${fmt(r.QL)} J يذهب **حرارة ضائعة** إلى المستودع البارد.` : `Part becomes **useful work** $W$ = ${fmt(r.W)} J turning the flywheel; the rest $Q_L$ = ${fmt(r.QL)} J is **waste heat** to the cold reservoir.` },
      { cam: [0, 2.4, 6.6], at: [0.6, 1.8, 0], text: () => ar() ? 'في الدورة الكاملة $\\Delta U = 0$، فبالقانون الأول: $W = Q_H - Q_L$. ولا يوجد محرك يحول الحرارة كلها إلى شغل، فكفاءته $W/Q_H$ أقل من 100% دائمًا.' : 'Over a full cycle $\\Delta U = 0$, so by the first law $W = Q_H - Q_L$. No engine turns all heat into work, so $W/Q_H$ is always below 100%.' },
    ],
  });

  /* ---------- picking scenes for any lesson: the book's own list, the AI's choice, or keywords from the lesson ---------- */
  NL.pickScenes = (l) => {
    const ok = (ids) => (ids || []).filter((id) => SCENES.some((s) => s.id === id));
    if (ok(l.scenes3d).length) return ok(l.scenes3d);
    if (ok(l.analysis?.scenes3d).length) return ok(l.analysis.scenes3d);
    const a = l.analysis || {}, text = [l.title, l.unit, ...(a.sections || []).map((s) => s.title), ...(a.concepts || []).map((c) => c.name), ...(a.laws || []).map((x) => x.name)].join(' ').toLowerCase();
    const scored = SCENES.map((s) => ({ id: s.id, n: (s.keys || []).reduce((n, kw) => n + (text.includes(kw.toLowerCase()) ? 1 : 0), 0) })).filter((x) => x.n > 0).sort((x, y) => y.n - x.n);
    return scored.length ? scored.slice(0, 3).map((x) => x.id) : ['throw', 'collide', 'work'];
  };
  NL.SCENE_CATALOG = () => SCENES.map((s) => `${s.id}: ${s.title[1]} — ${s.sub[1]}`).join('\n');

  // keywords for the scenes written before the picker existed
  Object.entries({ lever: ['رافعة', 'الرافعة', 'نقطة الارتكاز', 'lever'], pulley: ['بكرة', 'بكرات', 'pulley'], wheel: ['العجلة والمحور', 'عجلة', 'wheel and axle'], incline: ['مستوى مائل', 'المستوى المائل', 'إسفين', 'incline'], bike: ['دراجة', 'آلة مركبة', 'ناقل الحركة', 'bicycle'], throw: ['طاقة الوضع', 'الطاقة الحركية', 'طاقة حركية', 'مستوى الإسناد', 'potential energy', 'kinetic energy'], bow: ['مرونية', 'نابض', 'قوس', 'elastic'], vault: ['زانة', 'تحولات الطاقة', 'pole vault'] }).forEach(([id, keys]) => { const s = SCENES.find((x) => x.id === id); if (s) s.keys = keys; });
  NL.SCENES3D = SCENES;

  /* ---------- player ---------- */
  NL.mount3D = async (host, { onInteract, sceneIds } = {}) => {
    const list = sceneIds ? sceneIds.map((id) => SCENES.find((s) => s.id === id)).filter(Boolean) : SCENES;
    host.innerHTML = `<div class="s3d"><div class="s3d-tabs" role="tablist">${list.map((s, i) => `<button role="tab" data-sc="${i}">${esc(tt(s.title))}</button>`).join('')}</div>
      <div class="s3d-stage"><div class="s3d-canvas"></div><div class="s3d-wait"><div class="orbit-loader"><span></span><span></span><span></span></div><p>${t('s3dLoading')}</p></div>
        <div class="s3d-title"><small></small><h3></h3></div>
        <div class="s3d-big"><span class="s3d-cap">${t('s3dLive')}</span><div class="s3d-bigv"></div><div class="s3d-chart"></div></div>
        <div class="s3d-cards"></div>
        <div class="s3d-hint">${t('s3dHint')}</div>
      </div>
      <div class="s3d-narr"><div class="s3d-dots"></div><div class="s3d-text prose"></div>
        <div class="s3d-nav"><button class="btn sm ghost" data-n="prev">${t('s3dPrev')}</button><button class="btn sm" data-n="play">${t('s3dPause')}</button><button class="btn sm ghost" data-n="next">${t('s3dNext')}</button></div></div>
      <details class="s3d-ctl" open><summary>${t('s3dControls')}</summary><div class="s3d-sliders"></div><div class="row gap wrap"><button class="btn sm ghost" data-n="reset">${t('s3dReset')}</button><span class="fine">${t('s3dModel')}</span></div></details></div>`;
    try { await load3D(); } catch (e) { console.error(e); host.querySelector('.s3d-wait').innerHTML = `<p class="bad">${t('s3dFail')}</p>`; return () => {}; }
    if (!host.isConnected) return () => {};
    host.querySelector('.s3d-wait').remove();
    const wrap = host.querySelector('.s3d-canvas'), stage = host.querySelector('.s3d-stage');
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    wrap.append(renderer.domElement);
    const labels = new CSS2DRenderer(); labels.domElement.className = 's3d-labels'; wrap.append(labels.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color(C.bg); scene.fog = new THREE.Fog(C.bg, 9, 20);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 60);
    const controls = new OrbitControls(camera, labels.domElement); controls.enableDamping = true; controls.maxPolarAngle = Math.PI * 0.49; controls.minDistance = 2; controls.maxDistance = 14;
    scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x10131c, 0.9));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(4, 7, 5); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 }); scene.add(sun);
    const rim = new THREE.DirectionalLight(0x5cc8ff, 0.5); rim.position.set(-5, 3, -4); scene.add(rim);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: C.floor, roughness: 0.95 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const grid = new THREE.GridHelper(40, 80, 0x2b3a5a, 0x1a2338); grid.position.y = 0.002; scene.add(grid);
    const root = new THREE.Group(); scene.add(root);

    let cur = null, built = null, p = {}, step = 0, playing = true, stepAt = performance.now(), camGoal = null, userMoved = false, interacted = false;
    const touched = () => { if (!interacted) { interacted = true; onInteract?.(); } };
    controls.addEventListener('start', () => { userMoved = true; touched(); });
    const fit = () => { const b = stage.getBoundingClientRect(); renderer.setSize(b.width, b.height, false); labels.setSize(b.width, b.height); camera.aspect = b.width / b.height; camera.fov = camera.aspect < 0.9 ? 64 : camera.aspect < 1.4 ? 54 : 42; camera.updateProjectionMatrix(); };
    const ro = new ResizeObserver(fit); ro.observe(stage);

    const sliders = host.querySelector('.s3d-sliders'), cardsEl = host.querySelector('.s3d-cards'), bigEl = host.querySelector('.s3d-bigv'), chartEl = host.querySelector('.s3d-chart');
    const textEl = host.querySelector('.s3d-text'), dotsEl = host.querySelector('.s3d-dots');
    const paintText = () => {
      const r = cur.compute(p), st = cur.steps[step];
      textEl.innerHTML = `<p class="fine">${t('s3dStep', { i: step + 1, n: cur.steps.length })}</p>` + NL.md(st.text(p, r));
      dotsEl.innerHTML = cur.steps.map((_, i) => `<button class="${i === step ? 'on' : ''}" data-dot="${i}" aria-label="${i + 1}"></button>`).join('');
      dotsEl.querySelectorAll('[data-dot]').forEach((b) => (b.onclick = () => goStep(+b.dataset.dot, true)));
    };
    const paintData = () => {
      const r = cur.compute(p), big = cur.big(r);
      bigEl.innerHTML = `<b>${esc(big.k)}</b> = <span>${esc(big.v)}</span>`;
      cardsEl.innerHTML = cur.cards(r, p).map(([cls, l, v, u]) => `<div class="s3d-card c-${cls}"><span>${esc(tt(l))}</span><b>${esc(String(v))} <small>${esc(u)}</small></b></div>`).join('');
      chartEl.innerHTML = NL.lineChart({ ...cur.chart(p), height: 170 });
    };
    const goStep = (i, manual) => {
      step = (i + cur.steps.length) % cur.steps.length; stepAt = performance.now();
      const st = cur.steps[step]; camGoal = { pos: V(...st.cam), at: V(...st.at) }; userMoved = false;
      if (manual) touched();
      paintText();
    };
    const open = (i) => {
      cur = list[i]; host.querySelectorAll('[data-sc]').forEach((b) => b.setAttribute('aria-selected', b.dataset.sc == i));
      while (root.children.length) root.remove(root.children[0]);
      // CSS2D label elements of the previous scene stay in the DOM until removed
      labels.domElement.querySelectorAll('.l3d').forEach((el) => el.remove());
      p = {}; cur.params.forEach((q) => (p[q.k] = q.def));
      built = cur.build({ root });
      host.querySelector('.s3d-title small').textContent = tt(cur.sub); host.querySelector('.s3d-title h3').textContent = tt(cur.title);
      sliders.innerHTML = cur.params.map((q) => `<label class="ctl"><span>${esc(tt(q.label))}<output>${fmt(p[q.k], 3)} ${q.unit}</output></span><input type="range" id="s3d-${cur.id}-${q.k}" data-k="${q.k}" min="${q.min}" max="${q.max}" step="${q.step}" value="${q.def}"></label>`).join('');
      sliders.querySelectorAll('[data-k]').forEach((inp) => (inp.oninput = () => { p[inp.dataset.k] = +inp.value; inp.previousElementSibling.querySelector('output').textContent = `${fmt(+inp.value, 3)} ${cur.params.find((q) => q.k === inp.dataset.k).unit}`; paintData(); paintText(); touched(); }));
      const st = cur.steps[0]; camera.position.set(...st.cam); controls.target.set(...st.at);
      goStep(0); paintData();
    };
    host.querySelectorAll('[data-sc]').forEach((b) => (b.onclick = () => { open(+b.dataset.sc); touched(); }));
    host.querySelector('[data-n="prev"]').onclick = () => goStep(step - 1, true);
    host.querySelector('[data-n="next"]').onclick = () => goStep(step + 1, true);
    const playBtn = host.querySelector('[data-n="play"]');
    playBtn.onclick = () => { playing = !playing; playBtn.textContent = t(playing ? 's3dPause' : 's3dPlay'); stepAt = performance.now(); touched(); };
    host.querySelector('[data-n="reset"]').onclick = () => { cur.params.forEach((q) => { p[q.k] = q.def; const el = sliders.querySelector(`[data-k="${q.k}"]`); el.value = q.def; el.dispatchEvent(new Event('input')); }); };

    let raf, last = performance.now(), cycle = 0;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      cycle = (cycle + dt / (reduce ? 8 : 4)) % 1;
      if (playing && now - stepAt > 7000) goStep(step + 1);
      if (camGoal && !userMoved) { camera.position.lerp(camGoal.pos, 0.045); controls.target.lerp(camGoal.at, 0.06); if (camera.position.distanceTo(camGoal.pos) < 0.01) camGoal = null; }
      try { built.update(p, cur.compute(p), cycle, dt, playing); } catch (e) { console.error(e); }
      controls.update(); renderer.render(scene, camera); labels.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    // on phones the data cards sit under the stage instead of covering the scene
    const mq = matchMedia('(max-width: 760px)'), place = () => (mq.matches ? stage.after(cardsEl) : stage.append(cardsEl));
    place(); mq.addEventListener?.('change', place);
    fit(); open(0); raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); scene.traverse((o) => { o.geometry?.dispose?.(); }); };
  };
})();
