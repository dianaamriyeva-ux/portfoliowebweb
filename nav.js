/* ═══════════════════════════════════════════════
   NAVIGATION — clean URLs + contact link
   Loaded on every page, after main.js / project.js.

   Pages are linked without ".html" (about, project-ergoscan…);
   GitHub Pages serves the matching .html file for those.
   "home" and "works" are not real files: home.html and works.html
   just redirect to the home page, and this script keeps the address
   bar showing /home or /works.
═══════════════════════════════════════════════ */
(function () {
  const isHome = !!document.getElementById('works');

  /* change the visible URL without reloading (ignored on file:// previews) */
  function showUrl(path) {
    try { history.replaceState(null, '', path); } catch (e) {}
  }

  function smoothTo(el) {
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── tidy the address bar on load ── */
  const file = location.pathname.split('/').pop();
  if (isHome && location.hash === '#works') {
    /* jump to the section first, then drop the #works from the URL */
    const jump = () => {
      const top = document.getElementById('works').getBoundingClientRect().top + scrollY;
      window.scrollTo({ top, behavior: 'instant' });
      showUrl('works');
    };
    if (document.readyState === 'complete') jump();
    else window.addEventListener('load', jump, { once: true });
  } else if (isHome) {
    showUrl('home');
  } else if (file.endsWith('.html')) {
    showUrl(file.slice(0, -5) + location.hash);   /* about.html → about */
  }

  document.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');

    /* contact: scroll to the footer of whichever page you're on */
    if (href === '#contact') {
      e.preventDefault();
      smoothTo(document.getElementById('contact'));
      return;
    }

    /* already on the home page: scroll instead of reloading it */
    if (isHome && href === 'works') {
      e.preventDefault();
      smoothTo(document.getElementById('works'));
      showUrl('works');
    } else if (isHome && href === 'home') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showUrl('home');
    }
  });
})();
