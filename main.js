/* ═══════════════════════════════════════════════════════════════
   ASCII GRADIENT BACKGROUND
   Blob field → downscaled to grid resolution → one averaged
   pixel per cell → clean luminance → ASCII character mapping
═══════════════════════════════════════════════════════════════ */

(function () {

  /* ─── two canvases ─── */
  const offscreen = document.createElement('canvas'); // blob field (full-res)
  const off       = offscreen.getContext('2d');

  const ascii = document.getElementById('bgCanvas');  // final ASCII output
  const ctx   = ascii.getContext('2d');

  /* tiny canvas: exactly cols×rows pixels, one per cell */
  const small    = document.createElement('canvas');
  const smallCtx = small.getContext('2d', { willReadFrequently: true });

  /* ASCII ramp: space = darkest, $ = brightest */
  const RAMP      = ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$';
  const FONT_SIZE = 11;
  const FONT_FACE = 'monospace';

  let cols = 0, rows = 0;

  function resize() {
    ascii.width      = window.innerWidth;
    ascii.height     = window.innerHeight;
    offscreen.width  = window.innerWidth;
    offscreen.height = window.innerHeight;
    cols = Math.floor(ascii.width  / (FONT_SIZE * 0.6));
    rows = Math.floor(ascii.height / FONT_SIZE);
  }
  window.addEventListener('resize', resize);
  resize();

  /* ── Blobs ── */
  const NUM_BLOBS = 7;
  const blobs = Array.from({ length: NUM_BLOBS }, () => ({
    x:          Math.random(),
    y:          Math.random(),
    r:          0.22 + Math.random() * 0.28,
    speedX:     (Math.random() - 0.5) * 0.00012,
    speedY:     (Math.random() - 0.5) * 0.00012,
    noiseOffX:  Math.random() * 100,
    noiseOffY:  Math.random() * 100,
    brightness: 0.08 + Math.random() * 0.14,
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
    const a = P[X] + Y, b = P[X + 1] + Y;
    return lerp(
      lerp(grad(P[a],     x,     y),     grad(P[b],     x - 1, y),     u),
      lerp(grad(P[a + 1], x,     y - 1), grad(P[b + 1], x - 1, y - 1), u),
      v
    );
  }

  let t = 0;

  /* ── Draw blobs onto offscreen canvas ── */
  function drawBlobs() {
    const W = offscreen.width, H = offscreen.height;
    off.fillStyle = '#000';
    off.fillRect(0, 0, W, H);

    for (const b of blobs) {
      const nx = noise2(b.noiseOffX + t * 0.18, b.noiseOffY);
      const ny = noise2(b.noiseOffX, b.noiseOffY + t * 0.18);
      b.x += b.speedX + nx * 0.00008;
      b.y += b.speedY + ny * 0.00008;

      if (b.x < -b.r) b.x = 1 + b.r;
      if (b.x > 1 + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = 1 + b.r;
      if (b.y > 1 + b.r) b.y = -b.r;

      const cx     = b.x * W;
      const cy     = b.y * H;
      const radius = b.r * Math.max(W, H);
      const lv     = Math.round(b.brightness * 255);
      const col    = `rgb(${lv},${lv},${lv})`;

      const g = off.createRadialGradient(cx, cy, 0, cx, cy, radius);
      g.addColorStop(0,   col);
      g.addColorStop(0.5, `rgba(${lv},${lv},${lv},0.25)`);
      g.addColorStop(1,   'rgba(0,0,0,0)');

      off.globalCompositeOperation = 'lighter';
      off.beginPath();
      off.arc(cx, cy, radius, 0, Math.PI * 2);
      off.fillStyle = g;
      off.fill();
      off.globalCompositeOperation = 'source-over';
    }
  }

  /* ── ASCII render pass ──
     Key fix: downscale the full-res offscreen canvas to exactly
     cols×rows with one drawImage call. The browser's built-in
     bilinear downscaling averages every pixel in each cell, so
     each ASCII character reflects the true mean brightness of
     that region — no single-pixel sampling noise.
  */
  function renderASCII() {
    const W  = ascii.width;
    const H  = ascii.height;
    const cw = W / cols;
    const ch = H / rows;

    /* resize small canvas only when grid dimensions change */
    if (small.width !== cols || small.height !== rows) {
      small.width  = cols;
      small.height = rows;
    }

    /* downscale: 1920×1080 → ~213×90 in one fast GPU-accelerated call */
    smallCtx.drawImage(offscreen, 0, 0, cols, rows);
    const { data: sd } = smallCtx.getImageData(0, 0, cols, rows);

    /* clear output */
    ctx.fillStyle = '#080808';
    ctx.fillRect(0, 0, W, H);
    ctx.font         = `${FONT_SIZE}px ${FONT_FACE}`;
    ctx.textBaseline = 'top';

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = (row * cols + col) * 4;

        /* perceived luminance (Rec.709 coefficients) */
        const lum = (sd[idx] * 0.2126 + sd[idx + 1] * 0.7152 + sd[idx + 2] * 0.0722) / 255;

        if (lum < 0.012) continue; /* black cell — draw nothing */

        /* map luminance to character — gamma-expand slightly so
           mid-tones spread across more of the ramp */
        const gamma   = Math.pow(lum, 0.5);
        const charIdx = Math.min(Math.floor(gamma * (RAMP.length - 1)), RAMP.length - 1);
        const char    = RAMP[charIdx];
        if (char === ' ') continue;

        /* opacity scales with brightness, capped and darkened 40% */
        const alpha = Math.min(1, lum * 5.5) * 0.2;
        ctx.fillStyle = `rgba(240,237,230,${alpha.toFixed(3)})`;
        ctx.fillText(char, col * cw, row * ch);
      }
    }
  }

  /* ── main loop ── */
  function loop() {
    drawBlobs();
    renderASCII();
    t++;
    requestAnimationFrame(loop);
  }

  loop();

})();


/* ═══════════════════════════════════════════════
   CUSTOM CURSOR
═══════════════════════════════════════════════ */
(function () {
  const cursor = document.getElementById('cursor');
  const ring   = document.getElementById('cursorRing');
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
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