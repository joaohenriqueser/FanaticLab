/* ==========================================================================
   FanaticLab 3D — comportamento da página
   1) Links do WhatsApp   2) Cabeçalho   3) Revelar ao rolar
   4) Bico 3D que desce desenhando o filamento em diagonal
   ========================================================================== */

/* >>> TROQUE AQUI pelo número de vocês (55 + DDD + número, só dígitos) <<< */
const WHATSAPP_NUMBER = '5518997281973';

/* ---------- 1) Links do WhatsApp ---------- */
document.querySelectorAll('[data-wa]').forEach((el) => {
  el.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(el.dataset.wa)}`;
  el.target = '_blank';
  el.rel = 'noopener';
});

/* ---------- 2) Cabeçalho ---------- */
const header = document.getElementById('header');
const onScrollHeader = () => header.classList.toggle('scrolled', window.scrollY > 8);
onScrollHeader();
window.addEventListener('scroll', onScrollHeader, { passive: true });

/* ---------- 3) Revelar ao rolar ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* ---------- 4) Bico + filamento ---------- */
(() => {
  const page = document.getElementById('page');
  const trail = document.getElementById('trail');
  const svg = document.getElementById('trail-svg');
  const nozzle = document.getElementById('nozzle');
  const line = document.getElementById('t-line');
  const shine = document.getElementById('t-shine');
  const ghost = document.getElementById('t-ghost');
  const ticks = document.getElementById('t-ticks');
  const mask = document.getElementById('t-mask');
  const maskEl = document.getElementById('drawn');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TIP_X = 0.4987;   // posição da ponta do bico dentro da imagem
  const TIP_Y = 0.994;
  const STEP = 5;         // precisão da leitura do caminho (px)
  const FOLLOW = 0.5;     // ponto da tela onde o bico "trabalha" (0 = topo, 1 = base)

  let total = 0;
  let xs = new Float32Array(0);
  let ys = new Float32Array(0);
  let current = 0;
  let angle = 0;
  let nozzleW = 0;
  let nozzleH = 0;
  let measured = false;
  let lastT = 0;
  let lastRendered = -1;
  let lastAngle = 999;

  /* Objetos que "nascem" nos espaços vazios quando o bico passa */
  const prints = [...document.querySelectorAll('.print')].map((el) => {
    const solid = el.querySelector('.print-solid');
    const ghost = solid.cloneNode(true);
    ghost.classList.replace('print-solid', 'print-ghost');
    ghost.setAttribute('aria-hidden', 'true');
    el.insertBefore(ghost, solid);
    return { el, solid, edge: el.querySelector('.print-edge'), top: 0, height: 0, f: -1 };
  });

  function updatePrints(tipY) {
    for (const pr of prints) {
      if (!pr.height) continue;
      // Object builds from bottom to top as the nozzle approaches it.
      // Starts when nozzle is 1 object-height above. Finishes when nozzle reaches the top.
      const f = Math.max(0, Math.min(1, (tipY - (pr.top - pr.height * 1.2)) / (pr.height * 1.2)));
      if (f === pr.f) continue;
      if (Math.abs(f - pr.f) < 0.002 && f > 0 && f < 1) continue;
      pr.f = f;
      
      const hidden = ((1 - f) * 100).toFixed(2);
      pr.solid.style.clipPath = `inset(${hidden}% 0 0 0)`;
      pr.edge.style.top = hidden + '%';
      
      pr.edge.style.opacity = f > 0 && f < 1 ? 1 : 0;
      pr.el.classList.toggle('done', f >= 1);
    }
  }

  /* Caminho com cantos arredondados passando pelos pontos */
  function roundedPath(points, radius) {
    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length - 1; i++) {
      const a = points[i - 1], b = points[i], c = points[i + 1];
      const l1 = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const l2 = Math.hypot(c.x - b.x, c.y - b.y) || 1;
      const r = Math.min(radius, l1 * 0.46, l2 * 0.46);
      const sx = b.x + ((a.x - b.x) / l1) * r, sy = b.y + ((a.y - b.y) / l1) * r;
      const ex = b.x + ((c.x - b.x) / l2) * r, ey = b.y + ((c.y - b.y) / l2) * r;
      d += ` L${sx.toFixed(1)},${sy.toFixed(1)} Q${b.x.toFixed(1)},${b.y.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
    }
    const last = points[points.length - 1];
    return d + ` L${last.x.toFixed(1)},${last.y.toFixed(1)}`;
  }

  function measure() {
    const W = document.documentElement.clientWidth;
    const H = Math.max(document.documentElement.scrollHeight, page.scrollHeight);
    const mobile = W < 860;

    trail.style.height = H + 'px';
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    maskEl.setAttribute('width', W);
    maskEl.setAttribute('height', H);

    const sx = window.scrollX, sy = window.scrollY;
    let points = [...document.querySelectorAll('[data-anchor]')]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + sx + r.width / 2, y: r.top + sy + r.height / 2 };
      })
      .sort((a, b) => a.y - b.y);

    if (points.length < 2) return;

    /* No celular o filamento corre pela lateral, em ondas suaves */
    if (mobile) points = points.map((p, i) => ({ x: i % 2 ? 33 : 25, y: p.y }));

    const d = roundedPath(points, mobile ? 40 : 130);
    [line, shine, ghost, ticks, mask].forEach((p) => p.setAttribute('d', d));
    ghost.style.display = mobile ? 'none' : '';

    total = line.getTotalLength();
    [line, shine, mask].forEach((p) => { p.style.strokeDasharray = `${total} ${total}`; });

    const n = Math.ceil(total / STEP);
    xs = new Float32Array(n + 1);
    ys = new Float32Array(n + 1);
    for (let i = 0; i <= n; i++) {
      const pt = line.getPointAtLength(Math.min(total, i * STEP));
      xs[i] = pt.x; ys[i] = pt.y;
    }
    lastRendered = -1;

    nozzleW = nozzle.offsetWidth;
    nozzleH = nozzle.offsetHeight;

    prints.forEach((pr) => {
      const r = pr.el.getBoundingClientRect();
      pr.top = r.top + sy;
      pr.height = mobile ? 0 : r.height;
      pr.f = -1;
    });
    current = Math.min(current, total);
    measured = true;
  }

  /* Comprimento do filamento correspondente a uma posição vertical da página */
  function lengthForY(y) {
    const n = ys.length - 1;
    if (y <= ys[0]) return 0;
    if (y >= ys[n]) return total;
    let lo = 0, hi = n;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (ys[mid] <= y) lo = mid; else hi = mid;
    }
    const t = (y - ys[lo]) / ((ys[hi] - ys[lo]) || 1);
    return Math.min(total, (lo + t) * STEP);
  }

  /* Posição no caminho lida da tabela pré-calculada (bem mais leve) */
  function pointAt(len) {
    const f = Math.max(0, Math.min(len / STEP, ys.length - 1));
    const i = Math.min(Math.floor(f), ys.length - 2);
    const t = f - i;
    return { x: xs[i] + (xs[i + 1] - xs[i]) * t, y: ys[i] + (ys[i + 1] - ys[i]) * t };
  }

  function render(len, dt) {
    const off = total - len;
    line.style.strokeDashoffset = off;
    shine.style.strokeDashoffset = off;
    mask.style.strokeDashoffset = off;

    const p = pointAt(len);
    updatePrints(p.y);
    const q = pointAt(Math.min(total, len + 14));
    const dx = q.x - p.x, dy = q.y - p.y;
    const targetAngle = Math.max(-7, Math.min(7, -Math.atan2(dx, dy || 1) * (180 / Math.PI) * 0.16));
    angle += (targetAngle - angle) * (1 - Math.exp(-dt * 8));

    nozzle.style.transform =
      `translate3d(${(p.x - nozzleW * TIP_X).toFixed(1)}px, ${(p.y - nozzleH * TIP_Y).toFixed(1)}px, 0) rotate(${angle.toFixed(2)}deg)`;
  }

  function frame(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
    lastT = t;
    if (measured && !document.hidden) {
      const target = lengthForY(window.scrollY + window.innerHeight * FOLLOW);
      const diff = target - current;
      // suavização independente da taxa de quadros
      current = reduceMotion || Math.abs(diff) < 0.3 ? target : current + diff * (1 - Math.exp(-dt * 11));
      // só redesenha quando algo mudou
      if (Math.abs(current - lastRendered) > 0.01 || Math.abs(angle) > 0.01 && Math.abs(angle - lastAngle) > 0.005) {
        render(current, dt);
        lastRendered = current;
        lastAngle = angle;
      }
    }
    requestAnimationFrame(frame);
  }

  let resizeTimer;
  const remeasure = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(measure, 120); };

  measure();
  nozzle.classList.add('ready');
  requestAnimationFrame(frame);

  window.addEventListener('resize', remeasure);
  window.addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.querySelector('main'));
  if (nozzle.complete === false) nozzle.addEventListener('load', measure);
})();

/* ---------- 5) Título que digita e apaga ---------- */
(() => {
  const el = document.getElementById('typed');
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const phrases = [
    'nossa impressão.',
    'impressa em 3D.',
    'vira realidade.',
    'do papel à mão.',
    'camada a camada.',
    'com a sua cara.',
    'sob medida.',
  ];
  let p = 0, i = phrases[0].length, deleting = true;

  function tick() {
    const word = phrases[p];
    if (deleting) {
      i--;
      if (i <= 0) { deleting = false; p = (p + 1) % phrases.length; setTimeout(tick, 350); el.textContent = ''; return; }
    } else {
      i++;
      if (i >= phrases[p].length) { el.textContent = phrases[p]; deleting = true; setTimeout(tick, 2200); return; }
    }
    el.textContent = (deleting ? word : phrases[p]).slice(0, i);
    setTimeout(tick, deleting ? 38 : 85);
  }
  setTimeout(tick, 2600);
})();
