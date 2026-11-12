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


/* ── Video placeholder (other project pages) ──
   If the iframe src still contains YOUR_VIDEO_ID, show the
   placeholder div instead of a broken embed.               */
(function () {
  const iframe      = document.querySelector('iframe#previewVideo');
  const placeholder = document.getElementById('videoPlaceholder');
  if (!iframe || !placeholder) return;

  if (iframe.src.includes('YOUR_VIDEO_ID')) {
    iframe.style.display = 'none';
    placeholder.style.display = 'flex';
  } else {
    placeholder.style.display = 'none';
  }
})();


/* ── Inline looping video ──
   <video data-youtube="…"> plays the local file. If that file is missing
   or can't load, swap in the YouTube embed so the page never shows a
   blank box.                                                          */
(function () {
  const video = document.querySelector('video#previewVideo[data-youtube]');
  if (!video) return;

  function useYouTube() {
    const iframe = document.createElement('iframe');
    iframe.src = video.dataset.youtube;
    iframe.title = 'ErgoScan preview';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.setAttribute('allowfullscreen', '');
    video.replaceWith(iframe);
  }

  video.addEventListener('error', useYouTube, { once: true });
  if (video.error) useYouTube();

  /* some browsers block autoplay until the video is in view */
  const play = () => { const p = video.play(); if (p) p.catch(() => {}); };
  new IntersectionObserver(entries => {
    entries.forEach(e => e.isIntersecting ? play() : video.pause());
  }, { threshold: 0.25 }).observe(video);
})();


/* ── Looping mockup videos ──
   Play each muted autoplay video when it scrolls into view and pause it
   when it leaves, so it always starts even if the browser held autoplay. */
(function () {
  const vids = document.querySelectorAll('video[autoplay]:not(#previewVideo)');
  if (!vids.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { const p = e.target.play(); if (p) p.catch(() => {}); }
      else e.target.pause();
    });
  }, { threshold: 0.25 });
  vids.forEach(v => { v.muted = true; io.observe(v); });
})();
