/* ═══════════════════════════════════════════════
   PROJECT PAGES — shared JS
   (no ASCII canvas, no loader on these pages)
═══════════════════════════════════════════════ */

/* ── Mobile menu ── */
(function () {
  const menu    = document.getElementById('mobileMenu');
  const openBtn = document.getElementById('hamburger');
  const closeBtn = document.getElementById('closeMenu');
  if (!menu) return;
  openBtn.addEventListener('click',  () => menu.classList.add('open'));
  closeBtn.addEventListener('click', () => menu.classList.remove('open'));
  menu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => menu.classList.remove('open'))
  );
})();


/* ── Scroll reveal ── */
(function () {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
})();


/* ── YouTube video placeholder ──
   If the iframe src still contains YOUR_VIDEO_ID, show the
   placeholder div instead of a broken embed.               */
(function () {
  const iframe      = document.getElementById('previewVideo');
  const placeholder = document.getElementById('videoPlaceholder');
  if (!iframe || !placeholder) return;

  if (iframe.src.includes('YOUR_VIDEO_ID')) {
    iframe.style.display = 'none';
    placeholder.style.display = 'flex';
  } else {
    placeholder.style.display = 'none';
  }
})();
