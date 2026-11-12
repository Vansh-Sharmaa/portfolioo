/* Vansh Sharma — portfolio. No dependencies, no network requests.
   Everything visual is generated at runtime on canvas. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rng = seed => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

  /* Drop a real headshot at assets/portrait.jpg and set this path to use it
     instead of the generated dithered bust. Leave empty for the default. */
  const PORTRAIT_IMAGE = '';

  /* ───────────────────────── content ───────────────────────── */
  const PROJECTS = [
    {
      title: ['JOB AGENT'],
      label: '01 / PIPELINE',
      desc: 'END-TO-END JOB SCRAPING, MATCHING AND RESUME TAILORING',
      role: 'PYTHON · LLM · FASTAPI · WHATSAPP',
      palette: 'green'
    },
    {
      title: ['RESEARCHMIND'],
      label: '02 / MULTI-AGENT',
      desc: 'DEEP RESEARCH ORCHESTRATED ACROSS SPECIALISED AGENTS',
      role: 'LANGGRAPH · LANGCHAIN · SEARCH',
      palette: 'ice'
    },
    {
      title: ['LEXAI'],
      label: '03 / RAG',
      desc: 'LEGAL DOCUMENT RAG WITH GROUNDED CITATIONS',
      role: 'FAISS · EMBEDDINGS · FASTAPI',
      palette: 'paper'
    },
    {
      title: ['LLM JOB', 'EXTRACTOR'],
      label: '04 / FINE-TUNE',
      desc: 'LLAMA-3.2-3B QLORA EXTRACTION SERVICE',
      role: 'UNSLOTH · QLORA · FASTAPI',
      palette: 'pcb'
    }
  ];

  /* ───────────────────────── DOM refs ───────────────────────── */
  const gridC = $('#gridCanvas'), gridX = gridC.getContext('2d');
  const tunnelC = $('#tunnelCanvas'), tunnelX = tunnelC.getContext('2d');
  const carousel = $('#carousel');
  const preloader = $('#preloader');
  const gate = $('#gate');
  const body = document.body;
  const sceneEls = $$('.scene');
  const hudBar = $('#hudBar'), hudPct = $('#hudPct'), hudSection = $('#hudSection');
  const scrollTopBtn = $('#scrollTop');
  const cursor = $('#cursor');
  const menu = $('#menu'), menuToggle = $('#menuToggle'), menuLabel = $('#menuLabel');

  let W = 0, H = 0, DPR = 1, portrait = null, portraitPhoto = null, cards = [], cardSpacing = 600;
  let scrollY = 0, smoothP = 0, maxScroll = 1, started = false, lastFrame = 0;
  let lastLiveScene = null;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

  /* ───────────────── WAAPI motion layer (2D DOM) ─────────────────
     The reference site inlines anime.js v4.5.0. Its `waapi` module is a thin
     wrapper over Element.animate(), so we use the native primitive directly:
     compositor-driven, cancellable, and zero dependencies. The `translate`
     property (not `transform`) is animated so CSS hover transforms still work. */
  const EASE_OUT = 'cubic-bezier(.22,1,.36,1)';
  const waapiOK = !reduced && typeof Element !== 'undefined' && typeof Element.prototype.animate === 'function';
  const playing = new WeakMap();
  const IN_FRAMES = [
    { opacity: 0, translate: '0 20px' },
    { opacity: 1, translate: '0 0' }
  ];
  function play(el, frames, opts) {
    if (!waapiOK || !el) return;
    const prev = playing.get(el);
    if (prev) { try { prev.cancel(); } catch (_) {} }
    const a = el.animate(frames, Object.assign({ duration: 620, easing: EASE_OUT, fill: 'both' }, opts));
    /* release the fill override once done, otherwise :hover styles stay blocked */
    a.onfinish = () => { try { a.cancel(); } catch (_) {} };
    playing.set(el, a);
  }
  function staggerIn(selector, opts) {
    const base = Object.assign({}, opts);
    const step = base.step || 0; delete base.step;
    $$(selector).forEach((el, i) => play(el, IN_FRAMES, Object.assign({}, base, {
      delay: (base.delay || 0) + i * step
    })));
  }
  const ENTRANCE = {
    hero: '.scene--hero .hero__name, .scene--hero .hero__meta, .scene--hero .hero__right p, .scene--hero .hero__scroll',
    work: '.scene--work .work__title, .scene--work .work__list li, .scene--work .work__note, .scene--work .work__counter',
    about: '.scene--about .eyebrow, .scene--about h2, .scene--about p, .scene--about .text-link',
    who: '.scene--who .eyebrow, .scene--who h2, .scene--who p, .scene--who .chips',
    contact: '.scene--contact .eyebrow, .scene--contact h2, .scene--contact .contact__note, .scene--contact .cta, .scene--contact .socials li'
  };
  function enterScene(key, delay = 40) {
    if (ENTRANCE[key]) staggerIn(ENTRANCE[key], { duration: 600, step: 62, delay });
  }
  function stopAnims(selector) {
    $$(selector).forEach(el => { const a = playing.get(el); if (a) { try { a.cancel(); } catch (_) {} } });
  }

  /* ─────────────────── project cover artwork ───────────────── */
  function buildCards() {
    carousel.innerHTML = '<div class="cards" id="cards"></div>';
    const wrap = $('#cards');
    wrap.style.perspective = '1400px';
    PROJECTS.forEach((p, i) => {
      const el = document.createElement('article');
      el.className = 'card';
      el.innerHTML =
        '<div class="card__screen"><canvas></canvas><div class="card__glare"></div></div>' +
        '<div class="card__caption"><span>PROJECT ' + String(i + 1).padStart(2, '0') + ' / 04</span>' +
        '<strong>' + p.title.join(' ') + '</strong><span>' + p.label + '</span></div>';
      wrap.appendChild(el);
    });
    cards = $$('.card', wrap);
    drawCovers();
  }

  function coverArt(x, w, h, p, i) {
    const r = rng(97 + i * 131);
    const dark = p.palette !== 'paper';
    x.fillStyle = dark ? '#080e0d' : '#e7e1d2';
    x.fillRect(0, 0, w, h);

    if (p.palette === 'green') {
      const g = x.createRadialGradient(w * .72, h * .55, 0, w * .72, h * .55, w * .8);
      g.addColorStop(0, 'rgba(17,255,0,.20)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 9) for (let xx = 0; xx < w; xx += 9) {
        const v = Math.sin(xx * .013 + Math.sin(y * .021) * 2.4) * .5 + .5;
        const a = v * (.35 + .65 * Math.sin(y / h * Math.PI));
        if (a > .34) { x.fillStyle = `rgba(17,255,0,${a * .58})`; x.beginPath(); x.arc(xx, y, a * 2.9, 0, TAU); x.fill(); }
      }
      x.strokeStyle = 'rgba(17,255,0,.16)'; x.lineWidth = 1;
      for (let k = 0; k < 9; k++) { const xx = w * (.08 + k * .105); x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, h); x.stroke(); }
    } else if (p.palette === 'ice') {
      const g = x.createRadialGradient(w * .5, h * .52, 0, w * .5, h * .52, w * .72);
      g.addColorStop(0, '#123a52'); g.addColorStop(.55, '#081826'); g.addColorStop(1, '#04080d');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      for (let k = 0; k < 22; k++) {
        const rad = (k + 1) * w * .036;
        x.strokeStyle = `rgba(205,231,233,${.30 - k * .011})`; x.lineWidth = k % 4 === 0 ? 1.4 : .7;
        x.beginPath(); x.ellipse(w * .63, h * .58, rad, rad * .62, -.24, 0, TAU); x.stroke();
      }
      const pts = [];
      for (let k = 0; k < 42; k++) pts.push([w * (.18 + r() * .78), h * (.12 + r() * .8)]);
      x.strokeStyle = 'rgba(173,250,167,.28)'; x.lineWidth = .8;
      for (let k = 0; k < pts.length; k++) for (let j = k + 1; j < pts.length; j++) {
        const dx = pts[k][0] - pts[j][0], dy = pts[k][1] - pts[j][1];
        if (dx * dx + dy * dy < w * w * .018) { x.beginPath(); x.moveTo(...pts[k]); x.lineTo(...pts[j]); x.stroke(); }
      }
      pts.forEach((q, k) => { x.fillStyle = k % 5 === 0 ? '#adfaa7' : '#cde7e9'; x.beginPath(); x.arc(q[0], q[1], k % 5 === 0 ? 3 : 1.7, 0, TAU); x.fill(); });
    } else if (p.palette === 'paper') {
      x.fillStyle = '#e7e1d2'; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(30,32,28,.13)'; x.lineWidth = 1;
      for (let k = 0; k < 26; k++) { const xx = w * .06 + k * (w * .88 / 26); x.beginPath(); x.moveTo(xx, h * .38); x.lineTo(xx, h * .96); x.stroke(); }
      for (let k = 0; k < 30; k++) {
        const yy = h * (.40 + k * .019);
        x.fillStyle = `rgba(22,26,24,${.28 + r() * .35})`;
        x.fillRect(w * .07, yy, w * (.34 + r() * .54), 2.2);
        if (r() > .76) { x.fillStyle = '#141715'; x.fillRect(w * (.1 + r() * .6), yy - 1, w * (.07 + r() * .13), 7); }
      }
      x.fillStyle = 'rgba(150,40,30,.75)'; x.fillRect(w * .06, h * .30, w * .11, 6);
      const g = x.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(60,50,30,.18)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    } else {
      const g = x.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#061a10'); g.addColorStop(1, '#020807');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(17,255,0,.30)'; x.lineWidth = 1.6;
      for (let k = 0; k < 26; k++) {
        const yy = h * (.08 + k * .036), start = w * (.05 + r() * .35);
        x.beginPath(); x.moveTo(start, yy); x.lineTo(start + w * .16, yy);
        x.lineTo(start + w * .20, yy + h * .018); x.lineTo(w * (.75 + r() * .2), yy + h * .018); x.stroke();
        x.fillStyle = '#11ff00'; x.beginPath(); x.arc(start, yy, 2.6, 0, TAU); x.fill();
      }
      for (let k = 0; k < 8; k++) {
        const bx = w * (.12 + (k % 4) * .23), by = h * (.5 + Math.floor(k / 4) * .22);
        x.strokeStyle = 'rgba(205,231,233,.5)'; x.strokeRect(bx, by, w * .10, h * .12);
        x.fillStyle = 'rgba(17,255,0,.55)'; x.fillRect(bx + 5, by + 5, w * .10 - 10, h * .12 - 10);
      }
    }

    /* type + chrome */
    const ink = dark ? '#e9f4f2' : '#141715';
    const sub = dark ? 'rgba(205,231,233,.66)' : 'rgba(20,23,21,.7)';
    x.textBaseline = 'top';
    x.font = `700 ${Math.max(9, Math.round(h * .033))}px Silkscreen, monospace`;
    x.fillStyle = dark ? '#11ff00' : '#7a241c';
    x.fillText('// VS — ' + p.label, w * .065, h * .085);
    x.strokeStyle = dark ? 'rgba(205,231,233,.35)' : 'rgba(20,23,21,.35)';
    x.beginPath(); x.moveTo(w * .065, h * .155); x.lineTo(w * .935, h * .155); x.stroke();

    const size = clamp(h * .105, 20, 64);
    x.font = `700 ${Math.round(size)}px Silkscreen, monospace`;
    x.fillStyle = ink;
    p.title.forEach((line, k) => x.fillText(line, w * .065, h * .20 + k * size * 1.16));

    x.font = `600 ${Math.max(9, Math.round(h * .031))}px Doto, monospace`;
    x.fillStyle = sub;
    x.fillText(p.desc.slice(0, 54), w * .065, h * .20 + p.title.length * size * 1.16 + h * .045);
    x.fillText(p.role, w * .065, h * .875);
    x.font = `700 ${Math.max(8, Math.round(h * .026))}px Silkscreen, monospace`;
    x.fillStyle = dark ? '#11ff00' : '#7a241c';
    x.textAlign = 'right'; x.fillText('2026', w * .935, h * .875); x.textAlign = 'left';

    /* CRT scan + noise + curved screen mask */
    x.fillStyle = 'rgba(0,0,0,.16)';
    for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 1);
    x.fillStyle = dark ? 'rgba(255,255,255,.045)' : 'rgba(0,0,0,.04)';
    for (let k = 0; k < (w * h) / 550; k++) x.fillRect(r() * w, r() * h, 1, 1);

    x.globalCompositeOperation = 'destination-in';
    x.fillStyle = '#fff';
    x.beginPath();
    x.moveTo(0, h * .055);
    x.quadraticCurveTo(w * .5, -h * .025, w, h * .055);
    x.lineTo(w, h * .945);
    x.quadraticCurveTo(w * .5, h * 1.025, 0, h * .945);
    x.closePath(); x.fill();
    x.globalCompositeOperation = 'source-over';
  }

  function drawCovers() {
    cards.forEach((card, i) => {
      const c = $('canvas', card);
      const w = c.clientWidth || Math.round(window.innerWidth * .6);
      const h = c.clientHeight || Math.round(Math.min(window.innerHeight * .6, 560));
      if (!w || !h) return;
      c.width = Math.round(w * DPR); c.height = Math.round(h * DPR);
      const x = c.getContext('2d');
      x.setTransform(DPR, 0, 0, DPR, 0, 0);
      coverArt(x, w, h, PROJECTS[i], i);
    });
  }

  /* ─────────────── dithered procedural portrait ────────────── */
  function makePortrait(w, h) {
    w = Math.ceil(w); h = Math.ceil(h);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const p = c.getContext('2d');
    p.fillStyle = '#000'; p.fillRect(0, 0, w, h);
    const cx = w * .5, cy = h * .47, S = Math.min(w, h * 1.12);

    if (portraitPhoto) {
      const iw = portraitPhoto.naturalWidth, ih = portraitPhoto.naturalHeight;
      const k = Math.max(w / iw, h / ih), dw = iw * k, dh = ih * k;
      p.drawImage(portraitPhoto, (w - dw) / 2, (h - dh) / 2, dw, dh);
    } else {
      const rx = S * .158, ry = S * .232;
      /* soft elliptical light/shadow brush — unit circle in scaled space, so there are no hard edges */
      const soft = (x, y, r, col, a = 1, sx = 1, sy = 1) => {
        p.save();
        p.translate(x, y); p.scale(r * sx, r * sy);
        const gg = p.createRadialGradient(0, 0, 0, 0, 0, 1);
        gg.addColorStop(0, `rgba(${col},${a})`); gg.addColorStop(1, `rgba(${col},0)`);
        p.fillStyle = gg;
        p.beginPath(); p.arc(0, 0, 1, 0, TAU); p.fill();
        p.restore();
      };
      const D = '4,14,18', L = '226,250,248';

      /* shoulders, kept dark so the head carries the light */
      let g = p.createRadialGradient(cx, h * .80, S * .02, cx, h * .95, S * .62);
      g.addColorStop(0, '#35565b'); g.addColorStop(.38, '#15282d'); g.addColorStop(1, '#03080a');
      p.fillStyle = g;
      p.beginPath(); p.ellipse(cx, h * 1.13, S * .45, S * .38, 0, 0, TAU); p.fill();

      /* neck + the shadow the jaw casts on it */
      g = p.createLinearGradient(cx - S * .09, 0, cx + S * .09, 0);
      g.addColorStop(0, '#16292e'); g.addColorStop(.42, '#4e7176'); g.addColorStop(.62, '#3a5a5f'); g.addColorStop(1, '#0d1c20');
      p.fillStyle = g; p.fillRect(cx - S * .085, cy + S * .12, S * .17, S * .25);
      g = p.createLinearGradient(0, cy + ry * .70, 0, cy + ry * 1.16);
      g.addColorStop(0, 'rgba(2,8,10,.84)'); g.addColorStop(1, 'rgba(2,8,10,0)');
      p.fillStyle = g; p.fillRect(cx - S * .095, cy + ry * .70, S * .19, S * .16);

      /* head silhouette: broad forehead, tapered jaw */
      p.beginPath();
      p.moveTo(cx, cy - ry);
      p.bezierCurveTo(cx + rx * 1.02, cy - ry, cx + rx * 1.01, cy - ry * .34, cx + rx * .97, cy + ry * .12);
      p.bezierCurveTo(cx + rx * .90, cy + ry * .64, cx + rx * .43, cy + ry, cx, cy + ry);
      p.bezierCurveTo(cx - rx * .43, cy + ry, cx - rx * .90, cy + ry * .64, cx - rx * .97, cy + ry * .12);
      p.bezierCurveTo(cx - rx * 1.01, cy - ry * .34, cx - rx * 1.02, cy - ry, cx, cy - ry);
      p.closePath();
      /* base form: key light from upper-left, no blown-out white blob */
      g = p.createRadialGradient(cx - rx * .46, cy - ry * .46, S * .012, cx + rx * .10, cy + ry * .14, S * .36);
      g.addColorStop(0, '#dcecea'); g.addColorStop(.20, '#a9cacc');
      g.addColorStop(.46, '#6f979c'); g.addColorStop(.72, '#345a60'); g.addColorStop(1, '#0a1a1e');
      p.fillStyle = g; p.fill();

      p.save(); p.clip();
      /* hair with an actual hairline and a soft side part */
      p.beginPath();
      p.moveTo(cx - rx * 1.1, cy - ry * 1.12);
      p.lineTo(cx + rx * 1.1, cy - ry * 1.12);
      p.lineTo(cx + rx * 1.1, cy - ry * .34);
      p.bezierCurveTo(cx + rx * .88, cy - ry * .52, cx + rx * .48, cy - ry * .46, cx + rx * .18, cy - ry * .62);
      p.bezierCurveTo(cx - rx * .14, cy - ry * .76, cx - rx * .62, cy - ry * .56, cx - rx * .92, cy - ry * .30);
      p.lineTo(cx - rx * 1.1, cy - ry * .26);
      p.closePath();
      /* hair must sit above the halftone cutoff: pure black just disappears */
      g = p.createLinearGradient(0, cy - ry * 1.1, 0, cy - ry * .28);
      g.addColorStop(0, 'rgba(30,54,60,.94)'); g.addColorStop(.55, 'rgba(22,44,50,.90)'); g.addColorStop(1, 'rgba(14,30,35,.86)');
      p.fillStyle = g; p.fill();
      soft(cx - rx * .50, cy - ry * .82, rx * .80, L, .30, 1, .50);
      soft(cx + rx * .48, cy - ry * .88, rx * .60, L, .18, 1, .55);
      soft(cx, cy - ry * 1.00, rx * .98, L, .34, 1, .20);   /* top rim light */
      soft(cx - rx * .10, cy - ry * .56, rx * .95, D, .42, 1, .30); /* hairline shadow on forehead */

      /* temples and edge falloff */
      soft(cx - rx * .92, cy - ry * .05, rx * .58, D, .56, .70, 1.5);
      soft(cx + rx * .95, cy - ry * .02, rx * .62, D, .66, .70, 1.6);

      /* brow ridge: shadow band under a lit ridge */
      soft(cx, cy - ry * .24, rx * .92, D, .28, 1.05, .34);
      soft(cx - rx * .40, cy - ry * .31, rx * .38, L, .17, 1, .42);
      soft(cx + rx * .40, cy - ry * .31, rx * .38, L, .10, 1, .42);

      /* eyes: soft almond sockets, iris, one catchlight each */
      [-1, 1].forEach(s => {
        const ex = cx + s * rx * .41, ey = cy - ry * .11;
        soft(ex, ey, rx * .30, D, .60, 1.05, .52);
        soft(ex, ey + ry * .012, rx * .15, '2,8,11', .70, 1, .48);
        soft(ex - rx * .05, ey - ry * .02, rx * .045, L, .55);
        soft(ex, ey - ry * .07, rx * .30, D, .32, 1, .30);
        soft(ex, ey + ry * .075, rx * .28, L, .14, 1, .28);
      });

      /* nose: shaded side, bridge highlight, tip, nostrils */
      soft(cx + rx * .105, cy + ry * .10, rx * .20, D, .46, .62, 1.55);
      soft(cx - rx * .045, cy - ry * .02, rx * .12, L, .30, .62, 1.9);
      soft(cx, cy + ry * .31, rx * .20, L, .26, 1, .50);
      soft(cx - rx * .12, cy + ry * .33, rx * .075, D, .44, 1, .60);
      soft(cx + rx * .12, cy + ry * .33, rx * .075, D, .50, 1, .60);

      /* cheekbones, mouth, chin — all soft, no outlines */
      soft(cx - rx * .60, cy + ry * .16, rx * .40, L, .20, 1, .72);
      soft(cx + rx * .58, cy + ry * .18, rx * .36, L, .10, 1, .72);
      soft(cx + rx * .70, cy + ry * .40, rx * .38, D, .38, 1, 1.0);
      soft(cx, cy + ry * .52, rx * .40, D, .40, 1, .28);
      soft(cx - rx * .04, cy + ry * .60, rx * .26, L, .18, 1, .28);
      soft(cx, cy + ry * .72, rx * .30, D, .26, 1, .36);
      soft(cx - rx * .10, cy + ry * .84, rx * .30, L, .22, 1, .50);
      soft(cx, cy + ry * 1.00, rx * .90, D, .55, 1.05, .42);

      /* jaw shadow and a thin rim light on the shaded edge */
      g = p.createLinearGradient(cx + rx * .30, 0, cx + rx * 1.02, 0);
      g.addColorStop(0, 'rgba(3,10,13,0)'); g.addColorStop(1, 'rgba(3,10,13,.62)');
      p.fillStyle = g; p.fillRect(cx + rx * .30, cy - ry, rx * .72, ry * 2.1);
      g = p.createLinearGradient(cx + rx * .68, 0, cx + rx * 1.02, 0);
      g.addColorStop(0, 'rgba(205,245,245,0)'); g.addColorStop(1, 'rgba(205,245,245,.32)');
      p.fillStyle = g; p.fillRect(cx + rx * .68, cy - ry * .6, rx * .34, ry * 1.8);
      p.restore();
    }

    /* halftone sampling */
    const src = p.getImageData(0, 0, w, h).data;
    const out = document.createElement('canvas'); out.width = w; out.height = h;
    const o = out.getContext('2d');
    const step = Math.max(4, Math.round(Math.min(w, h) / 165));
    for (let y = 0; y < h; y += step) {
      const sy = clamp(y + (Math.floor(y / step) % 23 === 0 ? step * 2 : 0), 0, h - 1);
      for (let xx = 0; xx < w; xx += step) {
        const idx = (sy * w + xx) * 4;
        const raw = (src[idx] * .30 + src[idx + 1] * .59 + src[idx + 2] * .11) / 255;
        const lum = clamp((raw - .06) * 1.38, 0, 1);
        if (lum < .055) continue;
        const rad = Math.min(step * .54, lum * step * .72);
        const a = clamp(.16 + lum * .88, 0, .98);
        const r = Math.round(150 + lum * 105), g2 = Math.round(206 + lum * 49), b = Math.round(212 + lum * 43);
        o.fillStyle = `rgba(${r},${g2},${b},${a})`;
        o.beginPath(); o.arc(xx + step / 2, y + step / 2, rad, 0, TAU); o.fill();
      }
    }
    return out;
  }

  /* ───────────────── warped wireframe grid ──────────────────── */
  function drawGrid(t, phase) {
    const x = gridX;
    x.clearRect(0, 0, W, H);
    x.fillStyle = '#050505'; x.fillRect(0, 0, W, H);

    let g = x.createLinearGradient(0, H * .10, 0, H * .48);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.48, 'rgba(74,138,148,.15)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);

    if (portrait) {
      x.globalAlpha = phase === 'contact' ? .62 : .94;
      x.drawImage(portrait, 0, 0, W, H);
      x.globalAlpha = 1;
    }

    const cx = W * .5 + mouse.x * W * .028;
    const cy = H * .47 + mouse.y * H * .022;
    const amp = .52 + Math.sin(t * .00042) * .045;
    const sigma2 = 2 * Math.pow(Math.min(W, H) * .37, 2);
    const lens = (px, py) => {
      const dx = px - cx, dy = py - cy;
      const f = 1 + amp * Math.exp(-(dx * dx + dy * dy) / sigma2);
      return [cx + dx * f, cy + dy * f];
    };

    x.lineWidth = 1;
    for (let i = -5; i <= 33; i++) {
      const bx = -W * .12 + (i / 28) * W * 1.24;
      x.beginPath();
      for (let j = 0; j <= 56; j++) {
        const y = -H * .16 + (j / 56) * H * 1.32;
        const q = lens(bx, y); j ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]);
      }
      const d = Math.abs(bx - W * .5) / W;
      x.strokeStyle = `rgba(158,214,220,${(.055 + .15 * (1 - d)).toFixed(3)})`;
      x.stroke();
    }
    for (let i = 0; i <= 32; i++) {
      const u = i / 32;
      const by = -H * .12 + Math.pow(u, 1.48) * H * 1.30;
      x.beginPath();
      for (let j = 0; j <= 56; j++) {
        const px = -W * .14 + (j / 56) * W * 1.28;
        const q = lens(px, by); j ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]);
      }
      x.strokeStyle = `rgba(172,226,230,${(.05 + .14 * Math.pow(u, 1.15)).toFixed(3)})`;
      x.stroke();
    }

    /* bright travelling scan line */
    const scanY = H * (.12 + ((t * .000045) % 1) * .76);
    g = x.createLinearGradient(0, scanY - 40, 0, scanY + 40);
    g.addColorStop(0, 'rgba(205,231,233,0)'); g.addColorStop(.5, 'rgba(205,231,233,.10)'); g.addColorStop(1, 'rgba(205,231,233,0)');
    x.fillStyle = g; x.fillRect(0, scanY - 40, W, 80);

    /* corner registration marks */
    x.strokeStyle = 'rgba(205,231,233,.35)'; x.lineWidth = 1;
    const m = Math.min(W, H) * .045;
    [[m, m], [W - m, m], [m, H - m], [W - m, H - m]].forEach(([px, py]) => {
      x.beginPath(); x.moveTo(px - 6, py); x.lineTo(px + 6, py); x.moveTo(px, py - 6); x.lineTo(px, py + 6); x.stroke();
    });
  }

  /* ─────────────────── generative tunnel ────────────────────── */
  function drawTunnel(t) {
    const x = tunnelX;
    x.clearRect(0, 0, W, H);
    const cx = W * .5, cy = H * .44;
    let g = x.createRadialGradient(cx, cy, 0, cx, cy, W * .85);
    g.addColorStop(0, '#17414c'); g.addColorStop(.38, '#081d25'); g.addColorStop(1, '#02060a');
    x.fillStyle = g; x.fillRect(0, 0, W, H);

    /* radial beams */
    for (let k = 0; k < 28; k++) {
      const a = (k / 28) * TAU + .1;
      x.strokeStyle = `rgba(150,205,220,${.035 + (k % 4 === 0 ? .07 : 0)})`;
      x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * W, cy + Math.sin(a) * W); x.stroke();
    }

    /* nested perspective frames moving toward the viewer */
    const N = 30, phase = (t * .00022) % 1;
    for (let j = 0; j < N; j++) {
      const u = (j + phase) / N;
      const s = Math.pow(u, 2.05);
      const rw = W * 1.55 * s, rh = H * 1.75 * s;
      x.strokeStyle = `rgba(148,204,218,${(.03 + .24 * (1 - u)).toFixed(3)})`;
      x.lineWidth = u > .8 ? 1.6 : 1;
      x.strokeRect(cx - rw / 2, cy - rh / 2, rw, rh);
      if (j % 4 === 0 && u > .18) {
        x.fillStyle = `rgba(17,255,0,${(.18 + .5 * u).toFixed(3)})`;
        const bw = Math.max(6, W * .02 * s), bh = Math.max(4, H * .012 * s);
        x.fillRect(cx - rw * .22 - bw / 2, cy + rh * .22, bw, bh);
        x.fillRect(cx + rw * .22 - bw / 2, cy - rh * .22, bw, bh);
      }
    }

    /* side ribs */
    for (let k = 0; k < 12; k++) {
      const u = ((k / 12) + phase * .5) % 1;
      const s = Math.pow(u, 1.6);
      const yy = cy + H * .78 * s, xx = W * .5 * s;
      x.fillStyle = `rgba(120,170,185,${(.05 + .22 * s).toFixed(3)})`;
      x.fillRect(cx - xx - W * .06, yy, W * .055, H * .09 * s + 2);
      x.fillRect(cx + xx + W * .005, yy, W * .055, H * .09 * s + 2);
    }

    /* central fog + scanlines */
    g = x.createLinearGradient(0, H * .18, 0, H);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.55, 'rgba(90,160,180,.10)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(0,0,0,.20)';
    for (let y = 0; y < H; y += 4) x.fillRect(0, y, W, 1);
  }

  /* ───────────────────── scroll engine ──────────────────────── */
  const SCENES = [
    { key: 'hero',     inS: -1,    inE: -1,    outS: .115, outE: .175, label: 'INTRO' },
    { key: 'work',     inS: .115,  inE: .175,  outS: .455, outE: .505, label: 'SELECTED WORK' },
    { key: 'about',    inS: .455,  inE: .505,  outS: .630, outE: .675, label: 'ABOUT' },
    { key: 'who',      inS: .630,  inE: .675,  outS: .775, outE: .820, label: 'CAPABILITIES' },
    { key: 'contact',  inS: .775,  inE: .820,  outS: 2,    outE: 2,    label: 'CONTACT' }
  ];
  const opOf = s => (s.inS < 0 ? 1 : smooth(s.inS, s.inE, smoothP)) * (s.outS > 1 ? 1 : 1 - smooth(s.outS, s.outE, smoothP));

  function currentPhase() {
    let best = SCENES[0], bo = -1;
    SCENES.forEach(s => { const o = opOf(s); if (o > bo) { bo = o; best = s; } });
    return best.key;
  }

  function update(dt = 16.7) {
    if (!started) return;
    scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const p = clamp(scrollY / maxScroll, 0, 1);
    const k = reduced ? 1 : 1 - Math.exp(-dt / 110);
    smoothP += (p - smoothP) * k;
    if (Math.abs(p - smoothP) < .0002) smoothP = p;

    const ops = {};
    SCENES.forEach((s, i) => {
      const o = opOf(s); ops[s.key] = o;
      const el = sceneEls[i];
      if (!el) return;
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o > .004 ? 'visible' : 'hidden';
      el.classList.toggle('is-live', o > .7);
      el.style.transform = `translate3d(0,${((1 - o) * (i % 2 ? 22 : -22)).toFixed(1)}px,0)`;
    });

    gridC.style.opacity = clamp(ops.hero + ops.contact, 0, 1).toFixed(3);
    tunnelC.style.opacity = clamp(ops.about + ops.who, 0, 1).toFixed(3);

    /* work carousel: card 0 centered at p=.19, last card at p=.415 */
    const wp = clamp((smoothP - .19) / (.415 - .19), 0, 1);
    const pos = wp * (cards.length - 1);
    cards.forEach((card, i) => {
      const off = (i - pos) * cardSpacing;
      const dist = Math.abs(off) / cardSpacing;
      card.style.transform = `translate3d(0,${off.toFixed(1)}px,0) rotateX(${clamp(-off * .006, -9, 9).toFixed(2)}deg) scale(${(1 - Math.min(.24, dist * .11)).toFixed(3)})`;
      card.style.opacity = (1 - clamp(dist / 1.55, 0, .94)).toFixed(3);
    });
    const active = clamp(Math.round(pos), 0, cards.length - 1);
    $$('#workList button').forEach((b, i) => b.classList.toggle('is-active', i === active));
    $('#cardCurrent').textContent = String(active + 1).padStart(2, '0');

    /* HUD */
    const cur = SCENES.reduce((a, s) => ops[s.key] > ops[a.key] ? s : a, SCENES[0]);
    hudBar.style.width = (p * 100).toFixed(1) + '%';
    hudPct.textContent = String(Math.round(p * 100)).padStart(2, '0');
    hudSection.textContent = cur.label;
    body.dataset.phase = cur.key;
    if (started && cur.key !== lastLiveScene) {
      lastLiveScene = cur.key;
      enterScene(cur.key);
    }
    scrollTopBtn.classList.toggle('is-visible', p > .62);
  }

  function frame(t) {
    const dt = lastFrame ? Math.min(120, t - lastFrame) : 16.7;
    lastFrame = t;
    if (!started) { requestAnimationFrame(frame); return; }
    mouse.x += (mouse.tx - mouse.x) * .06;
    mouse.y += (mouse.ty - mouse.y) * .06;
    update(dt);
    const phase = body.dataset.phase || 'hero';
    if (parseFloat(gridC.style.opacity || '1') > .01) drawGrid(t, phase);
    if (parseFloat(tunnelC.style.opacity || '0') > .01) drawTunnel(t);
    requestAnimationFrame(frame);
  }

  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    [gridC, tunnelC].forEach(c => {
      c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
      c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0);
    });
    maxScroll = Math.max(1, document.documentElement.scrollHeight - H);
    cardSpacing = H * .84;
    portrait = makePortrait(W, H);
    drawCovers();
    update();
  }

  /* ───────────────────── interactions ───────────────────────── */
  const TARGETS = { hero: .012, work: .195, about: .565, who: .720, contact: .925 };
  function goTo(key) {
    closeMenu();
    const y = (TARGETS[key] || 0) * maxScroll;
    window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }

  function openMenu() {
    menu.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    menuLabel.textContent = 'CLOSE';
    body.classList.add('menu-open');
    staggerIn('.menu__item, .menu__block, .menu__foot', { duration: 440, step: 38, delay: 60 });
    $('.menu__item').focus({ preventScroll: true });
  }
  function closeMenu() {
    if (!body.classList.contains('menu-open')) return;
    menu.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuLabel.textContent = 'MENU';
    body.classList.remove('menu-open');
    stopAnims('.menu__item, .menu__block, .menu__foot');
  }

  menuToggle.addEventListener('click', () => body.classList.contains('menu-open') ? closeMenu() : openMenu());
  $$('[data-target]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); goTo(el.dataset.target); }));
  $$('#workList button').forEach(b => b.addEventListener('click', () => {
    const i = Number(b.dataset.card);
    const p = .19 + (i / (cards.length - 1)) * (.415 - .19);
    window.scrollTo({ top: p * maxScroll, behavior: reduced ? 'auto' : 'smooth' });
  }));
  scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeMenu(); if (!started) finishLoading('off'); }
  });

  /* text scramble on hover */
  const CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/*<>';
  $$('[data-scramble]').forEach(el => {
    if (el.children.length) return;
    const original = el.textContent;
    let raf = 0;
    el.addEventListener('mouseenter', () => {
      if (reduced) return;
      let n = 0;
      cancelAnimationFrame(raf);
      const run = () => {
        n += .55;
        el.textContent = original.split('').map((ch, i) => {
          if (ch === ' ' || i < n) return ch;
          return CH[Math.floor(Math.random() * CH.length)];
        }).join('');
        if (n < original.length) raf = requestAnimationFrame(run);
        else el.textContent = original;
      };
      run();
    });
    el.addEventListener('mouseleave', () => { cancelAnimationFrame(raf); el.textContent = original; });
  });

  /* cursor + pointer parallax */
  window.addEventListener('pointermove', e => {
    mouse.tx = (e.clientX / W - .5) * 2;
    mouse.ty = (e.clientY / H - .5) * 2;
    cursor.style.transform = `translate3d(${e.clientX - 13}px,${e.clientY - 13}px,0)`;
    const hot = !!(e.target.closest && e.target.closest('a,button'));
    cursor.classList.toggle('is-hover', hot);
  }, { passive: true });

  /* optional device orientation tilt */
  let motionOK = false;
  window.addEventListener('deviceorientation', e => {
    if (!motionOK || reduced) return;
    mouse.tx = clamp((e.gamma || 0) / 35, -1, 1);
    mouse.ty = clamp((e.beta || 0) / 70 - .5, -1, 1);
  }, { passive: true });

  /* ───────────────────── preloader ──────────────────────────── */
  const loadBar = $('#loadBar'), loadPct = $('#loadPct'), loadWord = $('#loadWord');
  function finishLoading(mode) {
    if (started) return;
    started = true;
    motionOK = mode === 'on';
    gate.classList.remove('is-open');
    gate.setAttribute('aria-hidden', 'true');
    preloader.classList.add('is-hidden');
    body.classList.remove('is-loading');
    lastLiveScene = 'hero';   // avoid a duplicate trigger from update()
    resize();
    setTimeout(resize, 250);
    setTimeout(() => enterScene('hero', 220), 240);
  }

  /* time-based so a slow main thread can never stall the intro */
  const loadStart = Date.now();
  let prog = 0;
  const timer = setInterval(() => {
    prog = Math.min(100, ((Date.now() - loadStart) / 1250) * 100);
    loadBar.style.width = prog + '%';
    loadPct.textContent = String(Math.floor(prog)).padStart(3, '0') + '%';
    if (prog >= 100) {
      clearInterval(timer);
      loadWord.textContent = 'READY';
      if (reduced) { setTimeout(() => finishLoading('off'), 260); return; }
      setTimeout(() => { gate.classList.add('is-open'); gate.setAttribute('aria-hidden', 'false'); }, 180);
    }
  }, 60);

  $$('[data-motion]').forEach(b => b.addEventListener('click', () => finishLoading(b.dataset.motion)));

  /* ─────────────────────── boot ─────────────────────────────── */
  buildCards();
  resize();
  if (PORTRAIT_IMAGE) {
    const img = new Image();
    img.onload = () => { portraitPhoto = img; portrait = makePortrait(W, H); };
    img.src = PORTRAIT_IMAGE;
  }
  window.addEventListener('resize', () => { clearTimeout(window.__rz); window.__rz = setTimeout(resize, 160); }, { passive: true });
  window.addEventListener('scroll', () => { /* rAF loop reads scrollY */ }, { passive: true });
  requestAnimationFrame(frame);
  Promise.all([
    document.fonts ? document.fonts.load('700 40px Silkscreen') : Promise.resolve(),
    document.fonts ? document.fonts.load('600 20px Doto') : Promise.resolve()
  ]).then(() => document.fonts.ready).then(drawCovers).catch(() => {});

  /* expose for verification */
  window.__portfolio = { goTo, get p() { return smoothP; }, scenes: SCENES, PROJECTS };
})();
