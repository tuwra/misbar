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

  NL.SCENES3D = SCENES;

  /* ---------- player ---------- */
  NL.mount3D = async (host, { onInteract, sceneIds } = {}) => {
    const list = sceneIds ? SCENES.filter((s) => sceneIds.includes(s.id)) : SCENES;
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
