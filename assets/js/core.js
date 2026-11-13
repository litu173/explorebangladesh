/* Shared behaviour: smooth scroll, frame loop, header, menu, cursor, reveals. */
(function () {
  const EB = window.EB;
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  EB.reduce = reduce;
  EB.fine = fine;

  /* ---- smooth scroll (Lenis on wheel devices; native momentum on touch) ---- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true, syncTouch: false });
  }
  EB.lenis = lenis;
  EB.scrollTo = (target, opts) => {
    if (lenis) lenis.scrollTo(target, Object.assign({ duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4) }, opts));
    else {
      const y = typeof target === 'number' ? target : target.getBoundingClientRect().top + scrollY + ((opts && opts.offset) || 0);
      scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    }
  };

  /* ---- one shared frame loop ---- */
  const frames = [];
  EB.onFrame = (fn) => frames.push(fn);
  let last = performance.now();
  function tick(now) {
    const dt = Math.min(64, now - last);
    last = now;
    if (lenis) lenis.raf(now);
    const y = lenis ? lenis.scroll : scrollY;
    for (let i = 0; i < frames.length; i++) frames[i](y, dt, now);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  EB.lerp = (a, b, t) => a + (b - a) * t;
  EB.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  EB.damp = (a, b, lambda, dt) => EB.lerp(a, b, 1 - Math.exp(-lambda * dt / 1000));

  /* ---- preloader ---- */
  const seen = root.classList.contains('seen');
  const pre = seen ? null : document.querySelector('.preloader');
  const ready = () => {
    if (pre) pre.classList.add('done');
    try { sessionStorage.setItem('eb-seen', '1'); } catch (e) { /* ignore */ }
    root.classList.add('is-ready');
    /* above-the-fold pieces never cross the reveal line, so show them straight away */
    document.querySelectorAll('.hero [data-reveal], .hero [data-lines]').forEach((el) => el.classList.add('in'));
  };
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1800))]).then(() => setTimeout(ready, pre ? 900 : 0));

  /* ---- header: hide on scroll down, show on scroll up ---- */
  const header = document.querySelector('.site-header');
  let prevY = 0;
  if (header) {
    EB.onFrame((y) => {
      const d = y - prevY;
      if (Math.abs(d) > 4) {
        header.classList.toggle('is-hidden', d > 0 && y > 240 && !root.classList.contains('menu-open'));
        prevY = y;
      }
      header.classList.toggle('is-solid', y > 60);
    });
  }

  /* ---- mobile menu ---- */
  const menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    const set = (open) => {
      root.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      if (lenis) open ? lenis.stop() : lenis.start();
    };
    menuBtn.addEventListener('click', () => set(!root.classList.contains('menu-open')));
    document.querySelectorAll('.menu-panel a').forEach((a) => a.addEventListener('click', () => set(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  }

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  EB.observe = (scope) => (scope || document).querySelectorAll('[data-reveal], [data-lines]').forEach((el) => io.observe(el));
  EB.observe();

  /* ---- custom cursor ---- */
  if (fine && !reduce) {
    const c = document.createElement('div');
    c.className = 'cursor';
    c.setAttribute('aria-hidden', 'true');
    c.innerHTML = '<div class="cursor-ring"><span></span></div><div class="cursor-dot"></div>';
    document.body.appendChild(c);
    root.classList.add('has-cursor');
    const ring = c.firstChild, dot = c.lastChild, label = ring.firstChild;
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('pointermove', (e) => { mx = e.clientX; my = e.clientY; c.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerleave', () => c.classList.add('is-hidden'));
    document.addEventListener('pointerover', (e) => {
      const lab = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, [role="button"], input, select, label');
      c.classList.toggle('is-label', !!lab);
      c.classList.toggle('is-link', !lab && !!link);
      if (lab) label.textContent = lab.dataset.cursor;
    });
    EB.onFrame((y, dt) => {
      rx = EB.damp(rx, mx, 14, dt); ry = EB.damp(ry, my, 14, dt);
      dot.style.transform = `translate3d(${mx}px,${my}px,0)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    });
  }

  /* ---- magnetic buttons ---- */
  if (fine && !reduce) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = `translate(${x}px,${y}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---- page-to-page: wipe out, the next page wipes in ---- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button || a.target === '_blank' || reduce) return;
    const href = a.getAttribute('href');
    if (!/^(\.\.\/|en\/)?[a-z-]+\.html(\?|#|$)/.test(href)) return;
    const url = new URL(a.href);
    if (url.pathname === location.pathname && url.search === location.search) return;
    e.preventDefault();
    const veil = document.createElement('div');
    veil.className = 'page-veil';
    document.body.appendChild(veil);
    requestAnimationFrame(() => requestAnimationFrame(() => veil.classList.add('on')));
    setTimeout(() => { location.href = a.href; }, 460);
  });
  addEventListener('pageshow', (e) => { if (e.persisted) document.querySelectorAll('.page-veil').forEach((v) => v.remove()); });

  /* ---- overlay scrollbar (mouse/trackpad devices): no layout width, starts below the header ---- */
  if (fine) {
    root.classList.add('has-sb');
    const sb = document.createElement('div');
    sb.className = 'sb'; sb.setAttribute('aria-hidden', 'true');
    sb.innerHTML = '<div class="sb-thumb"></div>';
    document.body.appendChild(sb);
    const thumb = sb.firstChild;
    let trackH = 0, thumbH = 0, maxScroll = 0, hideT, lastY = -1, drag = null;
    const measureSb = () => {
      maxScroll = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      sb.hidden = maxScroll < 4;
      trackH = sb.clientHeight;
      thumbH = Math.max(36, trackH * (innerHeight / (maxScroll + innerHeight)));
      thumb.style.height = thumbH + 'px';
      lastY = -1;
    };
    const show = () => { sb.classList.add('show'); clearTimeout(hideT); hideT = setTimeout(() => sb.classList.remove('show'), 1100); };
    const pos = (y) => (maxScroll ? (y / maxScroll) * (trackH - thumbH) : 0);
    EB.onFrame((y) => {
      if (y === lastY) return;
      if (lastY !== -1) show();
      lastY = y;
      thumb.style.transform = `translate3d(0,${pos(Math.min(y, maxScroll))}px,0)`;
    });
    const go = (y) => { y = EB.clamp(y, 0, maxScroll); if (lenis) lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y); };
    thumb.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      drag = { y0: e.clientY, s0: lenis ? lenis.scroll : scrollY };
      thumb.setPointerCapture(e.pointerId); sb.classList.add('drag'); root.classList.add('sb-dragging');
    });
    thumb.addEventListener('pointermove', (e) => { if (drag) go(drag.s0 + (e.clientY - drag.y0) * (maxScroll / Math.max(1, trackH - thumbH))); });
    const end = () => { drag = null; sb.classList.remove('drag'); root.classList.remove('sb-dragging'); show(); };
    thumb.addEventListener('pointerup', end); thumb.addEventListener('pointercancel', end);
    /* clicking the rail jumps there smoothly */
    sb.addEventListener('pointerdown', (e) => {
      if (e.target !== sb) return;
      const r = sb.getBoundingClientRect(), y = ((e.clientY - r.top - thumbH / 2) / Math.max(1, trackH - thumbH)) * maxScroll;
      EB.scrollTo(EB.clamp(y, 0, maxScroll), { duration: 0.9 });
    });
    measureSb();
    addEventListener('resize', measureSb);
    addEventListener('load', measureSb);
    new ResizeObserver(measureSb).observe(document.body);
  }

  /* ---- images fade in when they arrive (catches images added later by the page scripts too) ---- */
  const prep = (im) => {
    if (im.dataset.fi || im.closest('.preloader')) return;
    im.dataset.fi = '1';
    if (im.complete && im.naturalWidth) return;
    im.classList.add('fi');
    const done = () => im.classList.add('ld');
    im.addEventListener('load', done, { once: true });
    im.addEventListener('error', done, { once: true });
  };
  document.querySelectorAll('img').forEach(prep);
  new MutationObserver((list) => list.forEach((m) => m.addedNodes.forEach((n) => {
    if (n.nodeType !== 1) return;
    if (n.tagName === 'IMG') prep(n); else n.querySelectorAll('img').forEach(prep);
  }))).observe(document.body, { childList: true, subtree: true });

  /* ---- in-page anchors use the smooth scroller ---- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    const t = document.querySelector(a.getAttribute('href'));
    if (!t) return;
    e.preventDefault();
    EB.scrollTo(t, { offset: 0 });
  });
})();
