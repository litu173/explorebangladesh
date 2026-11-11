/* Home page: hero parallax, the dawn-to-night journey, trips gallery, seasons, food marquee, map. */
(function () {
  const EB = window.EB;
  const { lerp, clamp, damp, bn, img, SITE } = EB;
  const $ = (s, r) => (r || document).querySelector(s);
  const desktop = () => innerWidth > 900;
  let vw = innerWidth, vh = innerHeight;

  /* ============ HERO ============ */
  const heroMedia = $('.hero-media'), heroCopy = $('.hero-copy');
  EB.onFrame((y) => {
    if (y > vh * 1.2) return;
    heroMedia.style.transform = `translate3d(0,${y * 0.22}px,0)`;
    if (desktop()) heroCopy.style.transform = `translate3d(0,${y * -0.08}px,0)`;
  });

  /* ============ JOURNEY ============ */
  const J = EB.JOURNEY, S = J.length + 1; // five places + nightfall
  const jr = $('#journey'), stage = $('.jr-stage'), texts = $('#jr-texts'), archIn = $('.jr-arch-in'), marks = $('#jr-marks');
  const sun = $('.jr-sun'), boat = $('#jr-boat'), hillFar = $('.jr-hills.far'), hillNear = $('.jr-hills.near'), nEl = $('#jr-n'), flies = $('.jr-flies');

  texts.innerHTML = J.map((c, i) => `
    <article class="jr-text" data-i="${i}">
      <div class="jr-time" style="--k:0"><b>${c.time}</b><span>${c.clock} · ${c.region}</span></div>
      <h2 class="display" style="--k:1"><span class="ln"><span>${c.place}</span></span></h2>
      <p style="--k:2">${c.line}</p>
      <a class="link-arrow" style="--k:3" href="${EB.local(c.href)}">${c.cta} <span class="arr">→</span></a>
    </article>`).join('');
  archIn.innerHTML = J.map((c, i) => `<img src="${img(c.img, i === 0 ? 1920 : 800)}" data-full="${img(c.img, 1920)}" alt="${c.place}, ${c.region}" ${i ? 'loading="lazy"' : ''} decoding="async">`).join('');
  const labels = J.map((c) => c.time).concat('রাত');
  const markX = (i) => lerp(9, 91, i / (S - 1));
  marks.innerHTML = labels.map((l, i) => `<button type="button" style="left:${markX(i)}%" data-i="${i}">${l}</button>`).join('');
  flies.innerHTML = Array.from({ length: 14 }, (_, i) => `<i style="left:${(i * 37 + 11) % 96}%;top:${(i * 53 + 7) % 90}%;--t:${5 + (i % 5)}s;--b:${1.6 + (i % 4) * 0.5}s;--dl:-${i * 0.7}s;--dx:${((i % 3) - 1) * 46}px;--dy:${-20 - (i % 4) * 16}px"></i>`).join('');

  const textEls = [...texts.children], imgEls = [...archIn.children], markEls = [...marks.children];

  /* palette for each beat: sky top, sky bottom, far hills, near bank, wave back, wave front, ink, sun */
  const PAL = [
    ['#f6b98a', '#fbe6cc', '#e3a988', '#7a4a3a', '#d99a78', '#b9735a', '#2d1a12', '#ff6a3d'],
    ['#bfe0cf', '#f1f5e3', '#9cc7ad', '#1f5a3f', '#5aa088', '#2f7a63', '#0c2a1d', '#ffd98a'],
    ['#8ecde6', '#e9f6f3', '#a9d6e0', '#1c6a6a', '#3aa0b8', '#1b7f9a', '#08283a', '#fff6cf'],
    ['#ecc56f', '#f8edcf', '#d6b46a', '#4a5a22', '#a89a4e', '#7b7a34', '#2a2209', '#ffb23f'],
    ['#3d1c47', '#d9684f', '#8a3f5a', '#2a1230', '#8a3a52', '#5a2244', '#fff0e4', '#e2323f'],
    ['#04121f', '#0b3a3a', '#0c2a33', '#03131a', '#0a2c38', '#061c26', '#f6f1e7', '#e2323f'],
  ].map((row) => row.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]));
  const VARS = ['--sky1', '--sky2', '--hill1', '--hill2', '--water1', '--water2', '--jink', '--sunc'];
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  let top = 0, dist = 1, cur = -1, boatX = null, lastS = -1;
  function measureJourney() {
    const r = jr.getBoundingClientRect();
    top = r.top + (EB.lenis ? EB.lenis.scroll : scrollY);
    dist = jr.offsetHeight - stage.offsetHeight;
  }
  function setChapter(i) {
    if (i === cur) return;
    const prev = cur; cur = i;
    const outro = i >= J.length;
    stage.classList.toggle('is-outro', outro);
    textEls.forEach((t, k) => t.classList.toggle('on', k === i));
    imgEls.forEach((im) => im.classList.remove('was'));
    if (!outro) {
      if (prev > -1 && prev < J.length) imgEls[prev].classList.add('was');
      imgEls.forEach((im, k) => im.classList.toggle('on', k === i));
      const im = imgEls[i];
      if (im.dataset.full && im.src !== im.dataset.full && vw > 700) { const hi = new Image(); hi.onload = () => { im.src = im.dataset.full; }; hi.src = im.dataset.full; }
      nEl.textContent = bn(String(i + 1).padStart(2, '0'));
    }
    markEls.forEach((m, k) => m.classList.toggle('on', k === i));
  }
  marks.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    EB.scrollTo(top + ((+b.dataset.i + 0.5) / S) * dist, { duration: 1.8 });
  });

  EB.onFrame((y, dt) => {
    const p = clamp((y - top) / dist, 0, 1);
    if (y < top - vh || y > top + dist + vh) return;
    const s = p * S;
    setChapter(clamp(Math.floor(s), 0, S - 1));

    if (Math.abs(s - lastS) > 0.0004) {
      lastS = s;
      /* colours hold in the middle of a beat and blend around the hand-over */
      const u = clamp(s - 0.5, 0, S - 1), i0 = Math.min(S - 2, Math.floor(u)), t = smooth(0.18, 0.82, u - i0);
      const a = PAL[i0], b = PAL[i0 + 1];
      for (let k = 0; k < VARS.length; k++) {
        jr.style.setProperty(VARS[k], `rgb(${Math.round(lerp(a[k][0], b[k][0], t))},${Math.round(lerp(a[k][1], b[k][1], t))},${Math.round(lerp(a[k][2], b[k][2], t))})`);
      }
      jr.style.setProperty('--night', smooth(4.55, 5.25, s).toFixed(3));
      archIn.style.setProperty('--lp', (s - Math.floor(s)).toFixed(3));

      /* the sun rises on the left, peaks, and sets into the water on the right */
      const st = clamp(s / (S - 1), 0, 1.12), sw = sun.offsetWidth, wh = $('.jr-water').offsetHeight;
      const sx = lerp(vw * 0.08, vw * 0.8, st) - sw / 2;
      const sy = (vh - wh) - sw * 0.35 - Math.sin(Math.PI * Math.min(st, 1.1)) * vh * 0.56;
      sun.style.transform = `translate3d(${sx}px,${sy}px,0)`;
      hillFar.style.transform = `translate3d(${-p * hillFar.clientWidth * 0.3}px,0,0)`;
      hillNear.style.transform = `translate3d(${-p * (hillNear.clientWidth - vw) * 0.85}px,0,0)`;
    }
    /* the boat trails the scroll a little, so it feels like it is being rowed */
    const bw = boat.offsetWidth, target = (lerp(9, 91, clamp((s - 0.5) / (S - 1), 0, 1)) / 100) * vw - bw / 2;
    boatX = boatX === null ? target : damp(boatX, target, 3.2, dt);
    boat.style.transform = `translate3d(${boatX}px,0,0) rotate(${clamp((target - boatX) * 0.02, -3, 3)}deg)`;
  });

  /* ============ TRIPS: vertical scroll drives a horizontal gallery ============ */
  const trips = $('#trips'), track = $('#tr-track'), bar = $('#tr-bar');
  track.innerHTML = EB.TRIPS.map((t, i) => `
    <a class="tr-card" href="${EB.local(t.href)}" data-cursor="খুলুন">
      <div class="tr-ph">
        <img src="${img(t.img)}" alt="" loading="lazy" decoding="async">
        <span class="tr-no" lang="en">${String(i + 1).padStart(2, '0')}</span>
        <span class="tr-days">${bn(t.days)} দিন</span>
        <div class="tr-ti"><h3>${t.t}</h3><p>${t.s}</p></div>
      </div>
      <div class="tr-meta"><span>${t.mode} · ${t.season}</span><b>~${EB.taka(t.cost)}</b></div>
    </a>`).join('');
  const tripImgs = [...track.querySelectorAll('img')];
  let tTop = 0, tDist = 0, tx = 0;
  function measureTrips() {
    if (!desktop()) { trips.style.height = ''; tDist = 0; return; }
    tDist = Math.max(0, track.scrollWidth - vw);
    trips.style.height = vh + tDist + 'px';
    tTop = trips.getBoundingClientRect().top + (EB.lenis ? EB.lenis.scroll : scrollY);
  }
  EB.onFrame((y, dt) => {
    if (!tDist) return;
    if (y < tTop - vh || y > tTop + tDist + vh) return;
    const p = clamp((y - tTop) / tDist, 0, 1);
    tx = damp(tx, p * tDist, 9, dt);
    track.style.transform = `translate3d(${-tx}px,0,0)`;
    bar.style.transform = `scaleX(${p})`;
    const shift = (0.5 - tx / tDist) * 8;
    for (let i = 0; i < tripImgs.length; i++) tripImgs[i].style.transform = `translate3d(${shift}%,0,0)`;
  });

  /* ============ SEASONS ============ */
  const ssList = $('#ss-list'), ssCards = $('#ss-cards'), ssMood = $('#ss-mood'), ssGhost = $('#ss-ghost'), ssSec = $('#seasons');
  /* Bengali seasons run mid-month to mid-month: Boishakh starts mid-April */
  const now = new Date(), doy = (now.getMonth() + 1) * 100 + now.getDate();
  const curSeason = doy >= 1216 || doy < 215 ? 4 : doy < 415 ? 5 : doy < 615 ? 0 : doy < 816 ? 1 : doy < 1016 ? 2 : 3;
  ssList.innerHTML = EB.SEASONS.map((s, i) => `<button type="button" role="tab" data-i="${i}" aria-selected="false"><i></i><b>${s.bn}</b><small lang="en">${s.en}</small>${i === curSeason ? '<em>এখন</em>' : ''}<span>${s.months}</span></button>`).join('');
  let ssCur = -1, ssTimer;
  function setSeason(i, instant) {
    if (i === ssCur) return;
    ssCur = i;
    const s = EB.SEASONS[i];
    ssList.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-selected', String(k === i)));
    ssSec.style.setProperty('--tint', s.tint);
    const paint = () => {
      ssMood.textContent = s.mood;
      ssGhost.textContent = s.bn;
      ssCards.innerHTML = s.places.map((p, k) => `
        <a class="ss-card" style="--i:${k}" href="${EB.local(p.href)}" data-cursor="দেখুন">
          <div class="ss-ph"><img src="${img(p.img)}" alt="" loading="lazy" decoding="async"></div>
          <small>${p.where}</small><h3>${p.t}</h3><p>${p.d}</p>
        </a>`).join('');
      requestAnimationFrame(() => requestAnimationFrame(() => ssCards.classList.remove('swap')));
    };
    clearTimeout(ssTimer);
    ssCards.classList.add('swap');
    if (instant) paint(); else ssTimer = setTimeout(paint, 420);
  }
  ssList.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setSeason(+b.dataset.i); });
  setSeason(curSeason, true);

  /* ============ FOOD MARQUEE (speeds up with the scroll) ============ */
  const fdRow = $('#fd-row'), fdWrap = $('#fd-marquee');
  const foodHtml = EB.FOODS.map((f) => `
    <a class="fd-item" href="${EB.local(f.href)}" data-cursor="স্বাদ নিন">
      <div class="fd-ph"><img src="${img(f.img)}" alt="" loading="lazy" decoding="async"></div>
      <h3>${f.t}</h3><small>${f.where}</small>
    </a>`).join('');
  fdRow.innerHTML = foodHtml + foodHtml;
  [...fdRow.children].slice(EB.FOODS.length).forEach((el) => { el.setAttribute('aria-hidden', 'true'); el.tabIndex = -1; });
  let fx = 0, fHalf = 0, fHover = false, fPrevY = 0, fVis = false;
  fdWrap.addEventListener('pointerenter', () => { fHover = true; });
  fdWrap.addEventListener('pointerleave', () => { fHover = false; });
  new IntersectionObserver((e) => { fVis = e[0].isIntersecting; }, { rootMargin: '100px' }).observe(fdWrap);
  let fSpeed = 0.05;
  EB.onFrame((y, dt) => {
    const vel = Math.abs(y - fPrevY); fPrevY = y;
    if (!fVis || EB.reduce || !fHalf) return;
    fSpeed = damp(fSpeed, fHover ? 0 : 0.05 + Math.min(vel, 60) * 0.012, 4, dt);
    fx = (fx + fSpeed * dt) % fHalf;
    fdRow.style.transform = `translate3d(${-fx}px,0,0)`;
  });

  /* ============ MAP ============ */
  const mp = $('#mp-map'), tip = $('#mp-tip');
  const D = window.EB_DISTRICTS, byId = Object.fromEntries(D.map((d) => [d.id, d]));
  const hot = ['coxs-bazar', 'sylhet', 'bandarban', 'rangamati', 'khulna', 'moulvibazar', 'patuakhali', 'sunamganj', 'dhaka'];
  const order = D.map((d, i) => i).sort((a, b) => D[a].c[1] - D[b].c[1]);
  const rank = []; order.forEach((idx, r) => { rank[idx] = r; });
  mp.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 600 760" role="img" aria-label="বাংলাদেশের ৬৪ জেলার ম্যাপ">
    ${D.map((d, i) => `<a href="district.html?id=${d.id}" aria-label="${d.bn}" data-bn="${d.bn}"><path style="--i:${rank[i]}" d="${d.d}"/></a>`).join('')}
    ${hot.map((id, k) => `<circle class="ring" cx="${byId[id].c[0]}" cy="${byId[id].c[1]}" r="5" style="animation-delay:${k * 0.3}s"/><circle class="dot" cx="${byId[id].c[0]}" cy="${byId[id].c[1]}" r="2.6"/>`).join('')}
  </svg>`);
  new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { mp.classList.add('in'); o.disconnect(); } }, { threshold: 0.25 }).observe(mp);
  if (EB.fine) {
    mp.addEventListener('pointermove', (e) => {
      const a = e.target.closest('a[data-bn]');
      tip.classList.toggle('on', !!a);
      if (!a) return;
      tip.firstElementChild.textContent = a.dataset.bn;
      const r = mp.getBoundingClientRect();
      tip.style.transform = `translate(${e.clientX - r.left + 18}px,${e.clientY - r.top + 18}px)`;
    });
    mp.addEventListener('pointerleave', () => tip.classList.remove('on'));
  }

  /* counters */
  const stats = $('#mp-stats');
  new IntersectionObserver((e, o) => {
    if (!e[0].isIntersecting) return; o.disconnect();
    stats.querySelectorAll('[data-count]').forEach((el) => {
      const n = +el.dataset.count, t0 = performance.now(), dur = 1800;
      const step = (t) => { const k = clamp((t - t0) / dur, 0, 1), e2 = 1 - Math.pow(1 - k, 4); el.textContent = bn(Math.round(n * e2)); if (k < 1) requestAnimationFrame(step); };
      EB.reduce ? (el.textContent = bn(n)) : requestAnimationFrame(step);
    });
  }, { threshold: 0.4 }).observe(stats);

  /* ============ CLOSING SUN ============ */
  const closing = $('.closing'), clSun = $('.cl-sun');
  EB.onFrame(() => {
    const r = closing.getBoundingClientRect();
    if (r.top > vh || r.bottom < 0) return;
    clSun.style.setProperty('--rise', clamp(1 - r.top / vh, 0, 1).toFixed(3));
  });

  /* ============ measure ============ */
  function measure() {
    vw = innerWidth; vh = innerHeight;
    measureTrips(); measureJourney(); lastS = -1;
    fHalf = fdRow.scrollWidth / 2 + parseFloat(getComputedStyle(fdRow).columnGap || 0) / 2;
    if (EB.lenis) EB.lenis.resize();
  }
  measure();
  addEventListener('resize', measure);
  addEventListener('load', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
})();
