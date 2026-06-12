/* ═══════════════════════════════════════════════════════════════
   ASCII GRADIENT BACKGROUND  — high quality
═══════════════════════════════════════════════════════════════ */
(function () {

  const ascii = document.getElementById('bgCanvas');
  const ctx   = ascii.getContext('2d', { willReadFrequently: true });

  /* offscreen blob canvas — drawn at GRID resolution, not screen res.
     This means every pixel in the blob canvas = exactly one ASCII cell,
     so there is zero resampling error.                                  */
  const blob    = document.createElement('canvas');
  const blobCtx = blob.getContext('2d');

  /* ── ASCII ramp: index 0 = darkest, last = brightest ── */
  const RAMP      = ' .:-=+*#';   /* shorter ramp = cleaner steps  */
  const FONT_SIZE = 11;                   /* px — increase for bigger chars */
  const FONT_FACE = '"Courier New", Courier, monospace';

  /* measure exact character cell dimensions once */
  ctx.font = `${FONT_SIZE}px ${FONT_FACE}`;
  const CHAR_W = ctx.measureText('M').width;   /* monospace: all same width */
  const CHAR_H = FONT_SIZE * 1.2;              /* line height with a touch of leading */

  let cols = 0, rows = 0;

  function resize() {
    ascii.width  = window.innerWidth;
    ascii.height = window.innerHeight;
    cols = Math.floor(ascii.width  / CHAR_W);
    rows = Math.floor(ascii.height / CHAR_H);
    blob.width  = cols;
    blob.height = rows;
  }
  window.addEventListener('resize', resize);
  resize();

  /* ── Blobs ── */
  const NUM_BLOBS = 6;
  const blobs = Array.from({ length: NUM_BLOBS }, () => ({
    x: Math.random(), y: Math.random(),
    r: 0.25 + Math.random() * 0.30,
    speedX: (Math.random() - 0.5) * 0.00014,
    speedY: (Math.random() - 0.5) * 0.00014,
    ox: Math.random() * 100, oy: Math.random() * 100,
    brightness: 0.06 + Math.random() * 0.10,
  }));

  /* value noise */
  const P = new Uint8Array(512);
  for (let i = 0; i < 256; i++) P[i] = P[i + 256] = Math.floor(Math.random() * 256);
  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + t * (b - a); }
  function grad(h, x, y) { h &= 3; return ((h < 2) ? x : y) * (h & 1 ? -1 : 1); }
  function noise2(x, y) {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    x -= Math.floor(x); y -= Math.floor(y);
    const u = fade(x), v = fade(y);
    const a = P[X] + Y,  b = P[X + 1] + Y;
    return lerp(
      lerp(grad(P[a],     x,     y),     grad(P[b],     x-1, y),     u),
      lerp(grad(P[a + 1], x,     y - 1), grad(P[b + 1], x-1, y - 1), u), v);
  }

  let t = 0;

  /* ── Draw blobs at GRID size (cols × rows px) ──
     Each output pixel = the average colour of one ASCII cell.
     No resampling needed later.                              */
  function drawBlobs() {
    const W = blob.width, H = blob.height;
    blobCtx.fillStyle = '#000';
    blobCtx.fillRect(0, 0, W, H);

    for (const b of blobs) {
      const nx = noise2(b.ox + t * 0.16, b.oy);
      const ny = noise2(b.ox, b.oy + t * 0.16);
      b.x += b.speedX + nx * 0.00007;
      b.y += b.speedY + ny * 0.00007;
      if (b.x < -b.r) b.x = 1 + b.r;
      if (b.x > 1 + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = 1 + b.r;
      if (b.y > 1 + b.r) b.y = -b.r;

      const cx = b.x * W, cy = b.y * H;
      const r  = b.r * Math.max(W, H);
      const lv = Math.round(b.brightness * 255);
      const cs = `rgb(${lv},${lv},${lv})`;

      const g = blobCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0,   cs);
      g.addColorStop(0.45, `rgba(${lv},${lv},${lv},0.3)`);
      g.addColorStop(1,   'rgba(0,0,0,0)');

      blobCtx.globalCompositeOperation = 'lighter';
      blobCtx.beginPath();
      blobCtx.arc(cx, cy, r, 0, Math.PI * 2);
      blobCtx.fillStyle = g;
      blobCtx.fill();
      blobCtx.globalCompositeOperation = 'source-over';
    }
  }

  /* ── Pre-build 64 fillStyle strings (alpha LUT) ──
     Avoids constructing a new string on every cell every frame.
     Index 0 = fully transparent, 63 = max opacity (capped at 0.6). */
  const ALPHA_LEVELS = 64;
  const ALPHA_LUT = Array.from({ length: ALPHA_LEVELS }, (_, i) => {
    const a = ((i / (ALPHA_LEVELS - 1)) * 0.38).toFixed(3);
    return `rgba(240,237,230,${a})`;
  });

  /* ── ASCII render ──
     Read directly from the cols×rows blob canvas.
     pixel[col, row] == brightness of that ASCII cell. Exact. */
  function renderASCII() {
    const { data: sd } = blobCtx.getImageData(0, 0, cols, rows);

    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, ascii.width, ascii.height);

    ctx.font         = `${FONT_SIZE}px ${FONT_FACE}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'left';

    for (let row = 0; row < rows; row++) {
      const y = row * CHAR_H + CHAR_H * 0.5;
      for (let col = 0; col < cols; col++) {
        const idx = (row * cols + col) * 4;
        /* Rec.709 luminance */
        const lum = (sd[idx] * 0.2126 + sd[idx+1] * 0.7152 + sd[idx+2] * 0.0722) / 255;

        if (lum < 0.015) continue;

        /* gamma curve so mid-tones spread across the ramp */
        const gamma   = Math.pow(lum, 0.6);
        const charIdx = Math.min(Math.floor(gamma * (RAMP.length - 1)), RAMP.length - 1);
        const ch      = RAMP[charIdx];
        if (ch === ' ') continue;

        /* look up pre-built alpha string — zero string allocations */
        const alphaIdx = Math.min(Math.floor(Math.min(lum * 6, 1) * (ALPHA_LEVELS - 1)), ALPHA_LEVELS - 1);
        ctx.fillStyle  = ALPHA_LUT[alphaIdx];
        ctx.fillText(ch, col * CHAR_W, y);
      }
    }
  }

  /* ── 30 fps cap ──
     rAF fires at ~60fps. We skip frames where less than 33ms
     has elapsed since the last render, halving the CPU/GPU load. */
  const FPS      = 30;
  const INTERVAL = 1000 / FPS;
  let lastTime   = 0;

  function loop(now) {
    requestAnimationFrame(loop);
    if (now - lastTime < INTERVAL) return;
    lastTime = now - ((now - lastTime) % INTERVAL);
    drawBlobs();
    renderASCII();
    t++;
  }

  requestAnimationFrame(loop);

})();


/* ═══════════════════════════════════════════════
   CUSTOM CURSOR — desktop only
═══════════════════════════════════════════════ */
(function () {
  /* touch devices don't need a custom cursor */
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (isTouch) return;

  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursorRing');
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  /* show elements now that we know it's a pointer device */
  cursor.style.display = 'block';
  ring.style.display   = 'block';

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cursor.style.left = mx + 'px';
    cursor.style.top  = my + 'px';
  });

  (function animateRing() {
    rx += (mx - rx) * 0.13;
    ry += (my - ry) * 0.13;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  })();

  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('grow'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('grow'));
  });
})();


/* ═══════════════════════════════════════════════
   SCROLL ARROW — fade out on scroll, fade back in at top
═══════════════════════════════════════════════ */
(function () {
  const arrow = document.querySelector('.scroll-arrow');
  if (!arrow) return;

  let hidden = false;
  let ready  = false; // don't trigger before the initial appear animation finishes

  setTimeout(() => { ready = true; }, 1600); // matches arrowAppear delay + duration

  window.addEventListener('scroll', () => {
    if (!ready) return;
    const shouldHide = window.scrollY > 40;
    if (shouldHide === hidden) return;
    hidden = shouldHide;
    if (hidden) {
      arrow.classList.remove('visible');
      arrow.classList.add('hidden');
    } else {
      arrow.classList.remove('hidden');
      arrow.classList.add('visible');
    }
  }, { passive: true });
})();


/* ═══════════════════════════════════════════════
   MOBILE MENU
═══════════════════════════════════════════════ */
(function () {
  const menu     = document.getElementById('mobileMenu');
  const openBtn  = document.getElementById('hamburger');
  const closeBtn = document.getElementById('closeMenu');

  openBtn.addEventListener('click',  () => menu.classList.add('open'));
  closeBtn.addEventListener('click', () => menu.classList.remove('open'));
  menu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => menu.classList.remove('open'))
  );
})();


/* ═══════════════════════════════════════════════
   SCROLL REVEAL
═══════════════════════════════════════════════ */
(function () {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();


/* ═══════════════════════════════════════════════
   LOADING SCREEN — typewriter → text fade → bg fade
═══════════════════════════════════════════════ */
(function () {
  const loader     = document.getElementById('loader');
  const loaderName = document.getElementById('loaderName');
  const loaderCur  = document.getElementById('loaderCursor');

  if (!loader) return;

  const FULL_TEXT   = 'DⱯNⱯ.A';
  const TYPE_SPEED  = 80;   /* ms per character                  */
  const PAUSE_AFTER = 700;  /* hold after fully typed            */
  const TEXT_FADE   = 600;  /* duration of text fade-out         */
  const BG_FADE     = 800;  /* duration of background fade-out   */
  const GAP         = 100;  /* gap between text gone & bg starts */

  let i = 0;

  function typeNext() {
    if (i <= FULL_TEXT.length) {
      loaderName.textContent = FULL_TEXT.slice(0, i);
      i++;
      setTimeout(typeNext, TYPE_SPEED);
    } else {
      /* fully typed — pause, then fade out text */
      setTimeout(fadeText, PAUSE_AFTER);
    }
  }

  function fadeText() {
    /* stop cursor blink and fade it with the text */
    loaderCur.classList.add('hide');
    loaderName.classList.add('fade-out');

    /* once text is gone, fade the black background */
    setTimeout(fadeBg, TEXT_FADE + GAP);
  }

  function fadeBg() {
    loader.classList.add('bg-fade');

    /* after bg fully transparent, remove from DOM */
    setTimeout(() => loader.classList.add('done'), BG_FADE);
  }

  /* small delay so the canvas renders its first frame first */
  setTimeout(typeNext, 200);
})();