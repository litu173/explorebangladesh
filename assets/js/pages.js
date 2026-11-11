/* Inner pages: trips · trip · explore · district · guide · discover.
   One template per page type; content comes from assets/data (extracted from the live site). */
(function () {
  const EB = window.EB;
  const { bn, taka, clamp } = EB;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const q = new URLSearchParams(location.search);
  const page = document.body.dataset.page, main = $('#main');

  const D = window.EB_DISTRICTS, dById = Object.fromEntries(D.map((d) => [d.id, d]));
  const INFO = window.EB_DINFO, DIVS = window.EB_DIVS, TRIPS = window.EB_TRIPS;
  const G = window.EB_GUIDES.map((g) => ({ id: g[0], t: g[1], en: g[2], img: g[3], d: g[4], type: g[5], s: g[6], mx: g[7] }));
  const gById = Object.fromEntries(G.map((g) => [g.id, g]));
  const divById = Object.fromEntries(DIVS.map((d) => [d.id, d]));
  const TYPE = {
    place: { bn: 'ঘোরার জায়গা', en: 'places to see', list: 'places', h: ['দেখার মতো', 'জায়গা'], cur: 'দেখুন' },
    food: { bn: 'খাবার', en: 'taste of the road', list: 'foods', h: ['প্রতিটা জেলার', 'নিজের স্বাদ'], cur: 'স্বাদ নিন' },
    hidden: { bn: 'অচেনা জায়গা', en: 'off the map', list: 'hidden', h: ['ভিড়ের বাইরে', 'অচেনা জায়গা'], cur: 'খুঁজুন' },
    tradition: { bn: 'ঐতিহ্য', en: 'living traditions', list: 'traditions', h: ['এখনও বেঁচে থাকা', 'ঐতিহ্য'], cur: 'জানুন' },
  };
  const U = {
    trip: (id) => `trip.html?id=${id}`, guide: (id) => `guide.html?id=${id}`, district: (id) => `district.html?id=${id}`,
    list: (type) => `discover.html?type=${TYPE[type].list}`,
    plan: (ds, days, mode) => `plan.html?from=dhaka&to=${ds.join(',')}&days=${days || 3}&people=2&mode=${mode || 'bus'}`,
  };
  const pic = (id, mx, want) => EB.img(id, [400, 800, 1280, 1920].filter((w) => w <= Math.min(mx || 800, want || 800)).pop() || 800);
  const two = (n) => String(n).padStart(2, '0');

  /* ---------- building blocks ---------- */
  const hero = ({ img, mx, crumbs, chip, small, title, sub, extra, short }) => `
    <section class="ph${short ? ' short' : ''}">
      <div class="ph-media"><img src="${pic(img, mx, 1920)}" alt="" fetchpriority="high"></div>
      <div class="wrap">
        ${crumbs ? `<nav class="crumbs" style="--k:0" aria-label="আপনি এখানে">${crumbs.map(([t, h]) => (h ? `<a href="${h}">${t}</a>` : `<b>${t}</b>`)).join('<span>/</span>')}</nav>` : ''}
        ${chip ? `<span class="chip t-${chip}" style="--k:1">${TYPE[chip].bn}</span>` : ''}
        <h1 class="display${String(title).replace(/<[^>]+>/g, '').length > 16 ? ' long' : ''}" style="--k:2">${small ? `<small lang="en">${esc(small)}</small>` : ''}${title}</h1>
        ${sub ? `<p class="ph-sub" style="--k:3">${esc(sub)}</p>` : ''}
        ${extra || ''}
      </div>
    </section>`;
  const tile = (g, i, o) => `
    <a class="tile t-${g.type}${o && o.cls ? ' ' + o.cls : ''}" href="${U.guide(g.id)}" data-cursor="${TYPE[g.type].cur}" style="--i:${i % 8}">
      <img src="${pic(g.img, g.mx, o && o.big ? 1280 : 800)}" alt="" loading="lazy" decoding="async">
      ${o && o.no ? `<span class="tile-no" lang="en">${two(i + 1)}</span>` : ''}
      <span class="tile-tx"><small>${o && o.where === false ? TYPE[g.type].bn : dById[g.d].bn}</small><b>${esc(g.t)}</b><p>${esc(g.s)}</p></span>
    </a>`;
  const tripTile = (t) => `
    <a class="tile" href="${U.trip(t.id)}" data-cursor="খুলুন">
      <img src="${pic(t.img, t.mx, 800)}" alt="" loading="lazy" decoding="async">
      <span class="tile-tx"><small>${bn(t.days)} দিন · ${t.mode} · ~${taka(Math.round(t.cost / 100) * 100)}</small><b>${esc(t.t)}</b><p>${esc(t.s)}</p></span>
    </a>`;
  const circle = (g) => `
    <a class="circle" href="${U.guide(g.id)}" data-cursor="স্বাদ নিন">
      <div class="circle-ph"><img src="${pic(g.img, g.mx, 400)}" alt="" loading="lazy" decoding="async"></div>
      <b>${esc(g.t)}</b><small>${dById[g.d].bn}</small>
    </a>`;
  const head = (eyebrow, en, h, right) => `
    <div class="wrap sec-head" data-lines>
      <div><span class="eyebrow" data-reveal>${eyebrow} <i lang="en">${en}</i></span>
      <h2 class="display"><span class="ln" style="--i:0"><span>${h[0]}</span></span>${h[1] ? `<span class="ln" style="--i:1"><span><em>${h[1]}</em></span></span>` : ''}</h2></div>
      ${right || ''}
    </div>`;
  /* people scan: show the first two sentences, keep the rest one tap away */
  const lede = (text) => {
    const parts = String(text).split(/(?<=[।?!])\s+/), headTx = parts.slice(0, 2).join(' '), rest = parts.slice(2).join(' ');
    return `<p class="lede-big" data-reveal>${esc(headTx)}${rest ? ` <span class="lede-rest" hidden>${esc(rest)}</span>` : ''}</p>${rest ? '<button class="link-arrow lede-more" type="button" data-reveal>পুরোটা পড়ুন <span class="arr">↓</span></button>' : ''}`;
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.lede-more'); if (!b) return;
    b.previousElementSibling.querySelector('.lede-rest').hidden = false; b.remove();
    if (EB.lenis) EB.lenis.resize();
  });
  const toNum = (str) => { const m = String(str).replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c)).match(/[\d,]+/); return m ? +m[0].replace(/,/g, '') : Infinity; };
  const TIER_BN = { budget: 'সাধারণ হোটেল', mid: 'ভালো হোটেল', upscale: 'অভিজাত রিসোর্ট' };
  const hotelCard = (id, h) => `
    <a class="hcard" href="hotel.html?id=${id}" data-cursor="রুম দেখুন">
      <div class="hcard-ph"><img src="${pic(INFO[h.d].img, INFO[h.d].mx, 800)}" alt="" loading="lazy" decoding="async"><span>${TIER_BN[h.tier] || ''}</span></div>
      <small>${dById[h.d].bn} · ${esc(h.where.split(',')[0])}</small><h3>${esc(h.t)}</h3><b>${esc(h.from.replace('রুম ভাড়া ', ''))}</b>
    </a>`;
  const glance = (rows, cls) => `<dl class="${cls || 'glance'}" data-reveal>${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;

  /* country map: highlight districts, optionally draw a route through them */
  function miniMap({ on, route, links, light, pulse }) {
    const set = new Set(on || []);
    let extra = '';
    if (route && route.length > 1) {
      const pts = route.map((id) => dById[id].c);
      let p = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], bend = (i % 2 ? 1 : -1) * 0.16;
        p += ` Q${((x0 + x1) / 2 - (y1 - y0) * bend).toFixed(1)} ${((y0 + y1) / 2 + (x1 - x0) * bend).toFixed(1)} ${x1} ${y1}`;
      }
      extra += `<path class="route" pathLength="1" d="${p}"/><circle class="runner" r="6"><animateMotion dur="${Math.max(6, pts.length * 2)}s" repeatCount="indefinite" path="${p}"/></circle>`;
      extra += [...new Set(route)].map((id) => `<circle class="pin" cx="${dById[id].c[0]}" cy="${dById[id].c[1]}" r="7"/>`).join('');
    }
    if (pulse) extra += `<circle class="pulse" cx="${dById[pulse].c[0]}" cy="${dById[pulse].c[1]}" r="8"/>`;
    return `<div class="mini-map${light ? ' light' : ''}" data-map><svg viewBox="0 0 600 760" role="img" aria-label="বাংলাদেশের ম্যাপ">
      ${D.map((d) => { const p = `<path data-d="${d.id}" class="${set.has(d.id) ? 'on' : ''}" d="${d.d}"/>`; return links ? `<a href="${U.district(d.id)}" aria-label="${d.bn}">${p}</a>` : p; }).join('')}
      ${extra}</svg></div>`;
  }
  const missing = (what) => { main.innerHTML = `<section class="ph short"><div class="wrap"><h1 class="display" style="--k:1">${what} খুঁজে পাইনি</h1><div class="ph-row" style="--k:2"><a class="btn btn-gold" href="explore.html">৬৪ জেলা ঘুরে দেখুন</a></div></div></section>`; };

  /* =================== pages =================== */
  const pages = {
    /* ---- all ready-made trips: scroll picks the trip, the whole screen becomes its photo ---- */
    trips() {
      document.title = 'রেডিমেড ট্রিপ — এক্সপ্লোর বাংলাদেশ';
      main.innerHTML = `
        <section class="tl" id="tl">
          <div class="tl-bg" aria-hidden="true">${TRIPS.map((t, i) => `<img src="${pic(t.img, t.mx, 1920)}" alt="" ${i > 1 ? 'loading="lazy"' : ''}>`).join('')}</div>
          <header class="wrap tl-head" data-lines>
            <span class="eyebrow" data-reveal>রেডিমেড ট্রিপ <i lang="en">${TRIPS.length} curated routes</i></span>
            <h1 class="display"><span class="ln" style="--i:0;--d:600ms"><span>ট্রিপ সাজানোই আছে।</span></span><span class="ln" style="--i:1;--d:600ms"><span><em>শুধু বেরিয়ে পড়ুন।</em></span></span></h1>
            <p data-reveal style="--d:900ms" lang="en">scroll to travel</p>
          </header>
          <ol class="wrap tl-list">${TRIPS.map((t, i) => `
            <li><a class="tl-row" href="${U.trip(t.id)}" data-i="${i}" data-cursor="খুলুন">
              <span class="no" lang="en">${two(i + 1)}</span>
              <span class="name"><b>${esc(t.t)}</b><span>${esc(t.s)}</span></span>
              <span class="meta"><b>~${taka(Math.round(t.cost / 100) * 100)}</b><span>${bn(t.days)} দিন · ${t.mode} · ${t.season}</span></span>
            </a></li>`).join('')}</ol>
        </section>`;
      const rows = $$('.tl-row'), bgs = $$('.tl-bg img');
      let cur = -1, lastY = -1;
      const set = (i) => { if (i === cur) return; cur = i; rows.forEach((r, k) => r.classList.toggle('on', k === i)); bgs.forEach((b, k) => b.classList.toggle('on', k === i)); };
      set(0);
      EB.onFrame((y) => {
        if (Math.abs(y - lastY) < 2) return; lastY = y;
        const mid = innerHeight * 0.52; let best = 0, bd = Infinity;
        rows.forEach((r, i) => { const b = r.getBoundingClientRect(), d = Math.abs(b.top + b.height / 2 - mid); if (d < bd) { bd = d; best = i; } });
        set(best);
      });
      if (EB.fine) rows.forEach((r, i) => r.addEventListener('pointerenter', () => set(i)));
    },

    /* ---- one trip told stop by stop; a sun travels down the route line ---- */
    trip() {
      const t = TRIPS.find((x) => x.id === q.get('id')) || null;
      if (!t) return missing('ট্রিপটা');
      const stops = t.stops.map((id) => gById[id]).filter(Boolean);
      const ds = [...new Set(stops.map((s) => s.d))];
      const mode = { 'বাসে': 'bus', 'গাড়িতে': 'car', 'বাইকে': 'bike' }[t.mode] || 'bus';
      const planHref = U.plan(ds, t.days, mode);
      document.title = `${t.t}: ${t.s} — এক্সপ্লোর বাংলাদেশ`;
      const others = TRIPS.filter((x) => x.id !== t.id).sort((a, b) => Math.abs(a.days - t.days) - Math.abs(b.days - t.days)).slice(0, 3);
      main.innerHTML = hero({
        img: t.img, mx: t.mx, crumbs: [['রেডিমেড ট্রিপ', 'trips.html'], [t.t]], small: `${t.days} days · ${stops.length} stops`, title: esc(t.t), sub: t.s,
        extra: `<ul class="facts" style="--k:4">
            <li><b>${bn(t.days)} দিন</b><span>লাগবে</span></li><li><b>${bn(t.km)} কিমি</b><span>মোট পথ</span></li>
            <li><b>${t.mode}</b><span>ঢাকা থেকে</span></li><li><b>${taka(t.cost)}</b><span>জনপ্রতি</span></li><li><b>${esc(t.season)}</b><span>সেরা সময়</span></li></ul>
          <div class="ph-row" style="--k:5"><a class="btn btn-gold" href="${planHref}" data-magnetic><span>এই ট্রিপ নিজের মতো সাজান</span><span class="arr">→</span></a></div>`,
      }) + `
        <section class="sec"><div class="wrap"><p class="lede-big" data-reveal>${esc(t.lede)}</p></div></section>
        <section class="stops" id="stops">
          <div class="stops-rail" aria-hidden="true"><i></i><span class="stops-sun"></span></div>
          ${stops.map((s, i) => `
            <article class="stop">
              <a class="stop-ph" href="${U.guide(s.id)}" data-cursor="দেখুন"><img src="${pic(s.img, s.mx, 1280)}" alt="${esc(s.t)}" loading="lazy" decoding="async"></a>
              <div class="stop-tx">
                <span class="stop-n" aria-hidden="true">${bn(two(i + 1))}</span>
                <small>${dById[s.d].bn}</small>
                <h3>${esc(s.t)}</h3>
                <p>${esc(s.s)}</p>
                <a class="link-arrow" href="${U.guide(s.id)}">জায়গাটা দেখুন <span class="arr">→</span></a>
              </div>
            </article>`).join('')}
        </section>
        <section class="sec dark">
          <div class="wrap route-band">
            <div data-lines>
              <span class="eyebrow" data-reveal>পুরো রুট <i lang="en">the route</i></span>
              <h2 class="display"><span class="ln" style="--i:0"><span>${bn(stops.length)}টা জায়গা,</span></span><span class="ln" style="--i:1"><span><em>${bn(t.days)} দিনে</em></span></span></h2>
              <p data-reveal>দিন, কতজন, বাহন বা থাকার মান বদলে নিন — রুট আর খরচ সঙ্গে সঙ্গে নতুন করে হিসাব হবে।</p>
              <a class="btn btn-gold" href="${planHref}" data-magnetic data-reveal><span>প্ল্যানারে খুলুন</span><span class="arr">→</span></a>
            </div>
            ${miniMap({ on: ds, route: ['dhaka'].concat(ds, ['dhaka']) })}
          </div>
        </section>
        <section class="sec">
          ${head('আরও রেডিমেড ট্রিপ', 'keep going', ['এর পরে', 'কোথায়?'], '<a class="link-arrow" href="trips.html" data-reveal>সব ট্রিপ <span class="arr">→</span></a>')}
          <div class="wrap more-trips">${others.map(tripTile).join('')}</div>
        </section>`;
      storyRail();
    },

    /* ---- 64 districts: the map stays put, the divisions scroll past it ---- */
    explore() {
      document.title = '৬৪ জেলা, ৮ বিভাগ — এক্সপ্লোর বাংলাদেশ';
      const count = (d) => G.filter((g) => g.d === d).length;
      main.innerHTML = hero({
        img: window.EB_EXPLORE_IMG, mx: 1920, short: true, small: 'sixty-four districts', title: '৬৪ জেলা, <em>৮ বিভাগ।</em>',
        sub: 'ম্যাপে ট্যাপ করুন, বা বিভাগ ধরে নামতে থাকুন।',
        extra: `<div class="div-pills" style="--k:4">${DIVS.map((d) => `<a class="pill" href="#div-${d.id}">${d.bn.replace(' বিভাগ', '')}<i>${bn(d.d.length)}</i></a>`).join('')}</div>`,
      }) + `
        <section class="sec">
          <div class="wrap ex">
            <aside class="ex-map">
              <div class="ex-now"><b id="ex-now">${DIVS[0].bn}</b><span id="ex-now-en" lang="en">${DIVS[0].en}</span></div>
              ${miniMap({ on: DIVS[0].d, links: true, light: true })}
            </aside>
            <div class="ex-list">
              ${DIVS.map((dv) => `
                <section class="division" id="div-${dv.id}" data-div="${dv.id}">
                  <header><h2 class="display">${dv.bn}</h2><span lang="en">${dv.en}</span><em>${bn(dv.d.length)}টি জেলা</em></header>
                  <div class="d-grid">${dv.d.map((id) => `
                    <a class="tile" href="${U.district(id)}" data-d="${id}" data-cursor="ঘুরে দেখুন" data-reveal>
                      <img src="${pic(INFO[id].img, INFO[id].mx, 800)}" alt="" loading="lazy" decoding="async">
                      <span class="tile-tx"><small>${bn(count(id))}টি লেখা</small><b>${dById[id].bn}</b><p>${esc(INFO[id].tag)}</p></span>
                    </a>`).join('')}</div>
                </section>`).join('')}
            </div>
          </div>
        </section>`;
      const paths = $$('.ex-map path'), now = $('#ex-now'), nowEn = $('#ex-now-en');
      let cur = DIVS[0].id;
      const setDiv = (id) => {
        if (id === cur) return; cur = id; const dv = divById[id], s = new Set(dv.d);
        paths.forEach((p) => p.classList.toggle('on', s.has(p.dataset.d)));
        now.textContent = dv.bn; nowEn.textContent = dv.en;
      };
      const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) setDiv(e.target.dataset.div); }), { rootMargin: '-45% 0px -50% 0px' });
      $$('.division').forEach((s) => io.observe(s));
      if (EB.fine) {
        const pathBy = Object.fromEntries(paths.map((p) => [p.dataset.d, p]));
        $$('.d-grid .tile').forEach((t) => {
          t.addEventListener('pointerenter', () => pathBy[t.dataset.d].classList.add('hot'));
          t.addEventListener('pointerleave', () => pathBy[t.dataset.d].classList.remove('hot'));
        });
      }
    },

    /* ---- one district ---- */
    district() {
      const id = q.get('id'), info = INFO[id];
      if (!info) return missing('জেলাটা');
      const d = dById[id], dv = divById[info.div];
      const rank = Object.fromEntries((info.order || []).map((x, i) => [x, i]));
      const by = (type) => G.filter((g) => g.d === id && g.type === type).sort((a, b) => (rank[a.id] ?? 99) - (rank[b.id] ?? 99));
      const places = by('place'), foods = by('food'), hidden = by('hidden'), trad = by('tradition');
      const trips = info.trips.map((t) => TRIPS.find((x) => x.id === t)).filter(Boolean);
      const sibs = dv.d, nextId = sibs[(sibs.indexOf(id) + 1) % sibs.length], next = INFO[nextId];
      document.title = `${d.bn} — এক্সপ্লোর বাংলাদেশ`;
      const railSec = (items, type, o) => items.length ? `
        <section class="sec${o.dark ? ' dark' : ''}${o.cream ? ' cream' : ''}">
          ${head(TYPE[type].bn, TYPE[type].en, o.h, `<span class="count" data-reveal lang="en">${two(items.length)}</span>`)}
          <div class="${type === 'food' ? 'circles' : 'rail'}" data-drag>${items.map((g, i) => (type === 'food' ? circle(g) : tile(g, i, { no: true, where: false }))).join('')}</div>
          ${items.length > 3 ? '<p class="rail-hint" lang="en">drag</p>' : ''}
        </section>` : '';
      main.innerHTML = hero({
        img: info.img, mx: info.mx, crumbs: [['৬৪ জেলা', 'explore.html'], [dv.bn, `explore.html#div-${dv.id}`], [d.bn]], small: info.en, title: d.bn, sub: info.tag,
        extra: `<div class="ph-row" style="--k:4"><a class="btn btn-gold" href="${U.plan([id], 3)}" data-magnetic><span>${d.bn} ঘোরার প্ল্যান করুন</span><span class="arr">→</span></a>${trips[0] ? `<a class="btn btn-ghost" href="${U.trip(trips[0].id)}">রেডিমেড ট্রিপ দেখুন</a>` : ''}</div>`,
      }) + `
        <section class="sec">
          <div class="wrap lede-grid">
            <div>${lede(info.lede)}
              ${info.known.length ? `<div class="known" data-reveal style="--d:120ms">${info.known.map((k) => `<span>${esc(k)}</span>`).join('')}</div>` : ''}</div>
            ${glance(info.glance.slice(0, 3), 'glance glance-side')}
          </div>
        </section>
        ${railSec(places, 'place', { cream: true, h: ['যা দেখতে', 'যাবেন'] })}
        ${railSec(foods, 'food', { h: ['যা না খেলে', 'চলবে না'] })}
        ${railSec(hidden, 'hidden', { dark: true, h: ['ভিড়ের বাইরে', 'অচেনা জায়গা'] })}
        ${railSec(trad, 'tradition', { cream: true, h: ['এখনও বেঁচে থাকা', 'ঐতিহ্য'] })}
        ${info.stay.length ? `
        <section class="sec dark">
          ${head('কোথায় থাকবেন', 'stay', ['এক রাতের', 'রুম ভাড়া'], `<a class="link-arrow" href="hotels.html?d=${id}" data-reveal>হোটেলের নাম ও দাম <span class="arr">→</span></a>`)}
          <div class="wrap"><div class="stay">${info.stay.map(([k, v], i) => `<div data-reveal style="--d:${i * 90}ms"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>
          ${info.peak ? `<p class="stay-note" data-reveal>${esc(info.peak)}</p>` : ''}</div>
        </section>` : ''}
        <a class="next" href="${U.district(nextId)}" data-cursor="চলুন">
          <img src="${pic(next.img, next.mx, 1920)}" alt="" loading="lazy">
          <small lang="en">next in ${dv.en}</small><b>${dById[nextId].bn}</b><span>${esc(next.tag)}</span>
        </a>`;
    },

    /* ---- one place / food / tradition ---- */
    async guide() {
      const g = gById[q.get('id')];
      if (!g) return missing('জায়গাটা');
      const info = INFO[g.d], d = dById[g.d];
      document.title = `${g.t} — ${d.bn} — এক্সপ্লোর বাংলাদেশ`;
      main.innerHTML = hero({
        img: g.img, mx: g.mx, crumbs: [['৬৪ জেলা', 'explore.html'], [d.bn, U.district(g.d)], [TYPE[g.type].bn, U.list(g.type)]], chip: g.type, small: g.en, title: esc(g.t), sub: g.s,
      }) + '<div id="g-body"></div>';
      let det = {};
      try { det = (await (await fetch(`assets/data/guide/${g.d}.json`)).json())[g.id] || {}; } catch (e) { /* show what we have */ }
      const blocks = det.blocks || [];
      const near = (det.near || []).map((id) => gById[id]).filter(Boolean);
      const more = near.length ? near : G.filter((x) => x.d === g.d && x.id !== g.id).slice(0, 4);
      const trips = (det.trips || []).map((t) => TRIPS.find((x) => x.id === t)).filter(Boolean);
      $('#g-body').innerHTML = `
        ${det.glance && det.glance.length ? `<section class="sec" style="padding-bottom:0"><div class="wrap">${glance(det.glance)}</div></section>` : ''}
        <section class="sec">
          <div class="wrap g-grid">
            <div>
              ${lede(det.desc || g.s)}
              <div class="g-cards">${blocks.map(([h, p], i) => `<div class="g-card ${/জেনে|সতর্ক|মনে/.test(h) ? 'tip' : 'go'}" data-reveal style="--d:${i * 90}ms"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('')}</div>
              ${det.tags && det.tags.length ? `<div class="tags" data-reveal>${det.tags.map((t) => `<span>#${esc(t)}</span>`).join('')}</div>` : ''}
            </div>
            <aside class="g-side" data-reveal>
              <div class="g-where">${miniMap({ on: [g.d], pulse: g.d })}<p>${d.bn} জেলা · ${divById[info.div].bn}</p></div>
              <div class="g-actions">
                <a class="btn btn-dark" href="${U.plan([g.d], 3)}"><span>${d.bn} ঘোরার প্ল্যান করুন</span><span class="arr">→</span></a>
                ${det.ll && det.ll.length === 2 ? `<a class="btn btn-line" href="https://www.google.com/maps/search/?api=1&query=${det.ll[0]},${det.ll[1]}" target="_blank" rel="noopener">গুগল ম্যাপে খুলুন</a>` : ''}
                <a class="btn btn-line" href="${U.district(g.d)}">${d.bn} জেলার গাইড</a>
              </div>
            </aside>
          </div>
        </section>
        ${trips.length ? `<section class="sec dark">${head('রেডিমেড ট্রিপ', 'on this route', ['এই জায়গাসহ', 'সাজানো ট্রিপ'])}<div class="wrap more-trips">${trips.slice(0, 3).map(tripTile).join('')}</div></section>` : ''}
        ${more.length ? `<section class="sec cream">${head(near.length ? 'কাছাকাছি' : d.bn, 'nearby', ['এর পাশেই', 'আরও যা আছে'], `<a class="link-arrow" href="${U.district(g.d)}" data-reveal>${d.bn} জেলা <span class="arr">→</span></a>`)}<div class="wrap cards4">${more.map((x, i) => tile(x, i)).join('')}</div></section>` : ''}`;
      after();
    },

    /* ---- galleries: places, foods, hidden, traditions ---- */
    discover() {
      const type = Object.keys(TYPE).find((k) => TYPE[k].list === q.get('type')) || 'place', T = TYPE[type];
      const all = G.filter((g) => g.type === type);
      const cover = all.find((g) => g.mx >= 1920 && /sajek|ratargul|sundarban|kacchi|biriyani|jamdani|nafakhum/.test(g.id)) || all.find((g) => g.mx >= 1920) || all[0];
      document.title = `${T.bn} — এক্সপ্লোর বাংলাদেশ`;
      const divCount = (id) => all.filter((g) => INFO[g.d].div === id).length;
      main.innerHTML = hero({
        img: cover.img, mx: cover.mx, short: true, small: T.en, title: `${T.h[0]} <em>${T.h[1]}</em>`,
        extra: `<div class="dc-types" style="--k:4">${Object.keys(TYPE).map((k) => `<a href="${U.list(k)}"${k === type ? ' aria-current="page"' : ''}>${TYPE[k].bn}</a>`).join('')}</div>`,
      }) + `
        <div class="dc-bar"><div class="wrap">
          <div class="dc-pills" role="group" aria-label="বিভাগ"><button class="pill" type="button" data-div="" aria-pressed="true">সব<i>${bn(all.length)}</i></button>${DIVS.map((d) => `<button class="pill" type="button" data-div="${d.id}" aria-pressed="false">${d.bn.replace(' বিভাগ', '')}<i>${bn(divCount(d.id))}</i></button>`).join('')}</div>
          <input class="dc-search" id="dc-q" type="search" placeholder="নাম বা জেলা লিখুন" aria-label="খুঁজুন">
        </div></div>
        <section class="sec" style="padding-top:36px"><div class="wrap"><p class="dc-count" id="dc-count" lang="en"></p><div class="dc-grid" id="dc-grid"></div><div id="dc-more" style="height:1px"></div></div></section>`;
      const grid = $('#dc-grid'), sentinel = $('#dc-more'), countEl = $('#dc-count');
      let list = all, shown = 0, div = '', term = '';
      const tileIo = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); tileIo.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
      const more = () => {
        const next = list.slice(shown, shown + 20); if (!next.length) return;
        const html = next.map((g, k) => tile(g, shown + k, { cls: (shown + k) % 9 === 0 && g.mx >= 1280 ? 'wide' : '', big: (shown + k) % 9 === 0 })).join('');
        grid.insertAdjacentHTML('beforeend', html); shown += next.length;
        $$('.tile:not(.in)', grid).forEach((t) => tileIo.observe(t));
        if (EB.lenis) EB.lenis.resize();
      };
      const apply = () => {
        const t = term.trim().toLowerCase();
        list = all.filter((g) => (!div || INFO[g.d].div === div) && (!t || (g.t + ' ' + g.en + ' ' + dById[g.d].bn + ' ' + g.d).toLowerCase().includes(t)));
        grid.innerHTML = list.length ? '' : '<p class="dc-empty">এই নামে কিছু পাইনি।</p>'; shown = 0;
        countEl.textContent = `${list.length} ${list.length === 1 ? 'entry' : 'entries'}`;
        more();
      };
      new IntersectionObserver((es) => { if (es[0].isIntersecting) more(); }, { rootMargin: '900px' }).observe(sentinel);
      $('.dc-pills').addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        div = b.dataset.div; $$('.dc-pills button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); apply();
        const top = $('.dc-bar').getBoundingClientRect().top + scrollY; if (scrollY > top) EB.scrollTo(top, { duration: 0.8 });
      });
      $('#dc-q').addEventListener('input', (e) => { term = e.target.value; apply(); });
      /* the filter bar tucks under the header whenever the header is showing */
      const bar = $('.dc-bar'), hd = $('.site-header');
      EB.onFrame(() => bar.classList.toggle('shift', bar.getBoundingClientRect().top <= 1 && !hd.classList.contains('is-hidden')));
      apply();
    },

    /* ---- where to stay: pick a budget, the map and every district re-price themselves ---- */
    hotels() {
      const S = window.EB_STAY;
      document.title = 'কোথায় থাকবেন — এক্সপ্লোর বাংলাদেশ';
      const TIERS = [['budget', 'সাধারণ হোটেল', 'simple'], ['mid', 'ভালো হোটেল', 'comfortable'], ['upscale', 'অভিজাত রিসোর্ট', 'luxury']];
      const price = (id, k) => { const row = (INFO[id].stay || [])[TIERS.findIndex((t) => t[0] === k)]; return row ? row[1] : ''; };
      const low = (id, k) => { const p = price(id, k); return p ? toNum(p) : Infinity; };
      let tier = 'budget', sort = 'price', term = '';
      main.innerHTML = hero({
        img: S.hero, mx: 1920, short: true, small: 'where to stay', title: 'কোথায় <em>থাকবেন</em>', sub: '৬৪ জেলায় এক রাতের রুম ভাড়া। বাজেট বেছে নিন, ম্যাপ নিজেই বদলে যাবে।',
      }) + `
        <div class="dc-bar"><div class="wrap">
          <div class="seg" id="st-tier" role="radiogroup" aria-label="হোটেলের মান">${TIERS.map((t) => `<button type="button" role="radio" data-k="${t[0]}" aria-checked="${t[0] === tier}">${t[1]}</button>`).join('')}</div>
          <div class="dc-pills" style="justify-content:flex-end"><button class="pill" type="button" data-sort="price" aria-pressed="true">কম ভাড়া আগে</button><button class="pill" type="button" data-sort="div" aria-pressed="false">বিভাগ ধরে</button></div>
          <input class="dc-search" id="st-q" type="search" placeholder="জেলার নাম লিখুন" aria-label="জেলা খুঁজুন">
        </div></div>
        <section class="sec" style="padding-top:44px">
          <div class="wrap ex">
            <aside class="ex-map st-map">
              <div class="st-read"><small id="st-r-s">সবচেয়ে কম ভাড়া</small><b id="st-r-n"></b><span id="st-r-p"></span></div>
              ${miniMap({ light: true, links: false })}
              <div class="st-legend"><span id="st-min"></span><i></i><span id="st-max"></span></div>
            </aside>
            <div><p class="dc-count" id="st-count" lang="en"></p><div class="d-grid st-grid" id="st-grid"></div></div>
          </div>
        </section>
        <section class="sec dark">
          ${head('নাম ধরে হোটেল', 'by name', ['রুম ধরে', 'ভাড়া দেখুন'], `<span class="count" data-reveal lang="en">${two(Object.keys(S.h).length)}</span>`)}
          <div class="rail" data-drag id="st-rail"></div>
          <p class="rail-hint" lang="en">drag</p>
        </section>
        <div class="sheet-back" id="sheet-back"></div>
        <aside class="sheet" id="sheet" aria-hidden="true" data-lenis-prevent></aside>`;
      const grid = $('#st-grid'), paths = $$('.st-map path'), pathBy = Object.fromEntries(paths.map((p) => [p.dataset.d, p]));
      const mix = (t) => { const a = [236, 227, 208], b = [13, 90, 63]; return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`; };
      const read = (id) => { $('#st-r-n').textContent = dById[id].bn; $('#st-r-p').textContent = price(id, tier) || 'তথ্য নেই'; };
      let cheapest = 'dhaka';
      function paint() {
        const ids = D.map((d) => d.id).filter((id) => isFinite(low(id, tier)));
        const lows = ids.map((id) => low(id, tier)), mn = Math.min(...lows), mx = Math.max(...lows);
        paths.forEach((p) => { const v = low(p.dataset.d, tier); p.style.fill = isFinite(v) ? mix(mx > mn ? Math.pow((v - mn) / (mx - mn), 0.6) : 0.5) : 'rgba(16,32,26,.04)'; });
        $('#st-min').textContent = taka(mn); $('#st-max').textContent = taka(mx) + '+';
        const t = term.trim().toLowerCase();
        let list = D.map((d) => d.id).filter((id) => !t || (dById[id].bn + ' ' + id + ' ' + INFO[id].en).toLowerCase().includes(t));
        if (sort === 'price') list.sort((a, b) => low(a, tier) - low(b, tier));
        else { const o = DIVS.flatMap((dv) => dv.d); list.sort((a, b) => o.indexOf(a) - o.indexOf(b)); }
        cheapest = ids.slice().sort((a, b) => low(a, tier) - low(b, tier))[0];
        $('#st-r-s').textContent = 'সবচেয়ে কম ভাড়া'; read(cheapest);
        $('#st-count').textContent = `${list.length} districts · per room, per night`;
        grid.innerHTML = list.length ? list.map((id, i) => `
          <button class="tile st-tile" type="button" data-d="${id}" style="--i:${i % 9}">
            <img src="${pic(INFO[id].img, INFO[id].mx, 800)}" alt="" loading="lazy" decoding="async">
            <span class="tile-tx"><small>${dById[id].bn}${S.d[id].named.length ? ` · ${bn(S.d[id].named.length)}টি হোটেল` : ''}</small><b>${price(id, tier) || '—'}</b></span>
          </button>`).join('') : '<p class="dc-empty">এই নামে কোনো জেলা পাইনি।</p>';
        requestAnimationFrame(() => $$('.st-tile', grid).forEach((el) => el.classList.add('in')));
        $('#st-rail').innerHTML = Object.entries(S.h).filter(([, h]) => h.tier === tier).map(([id, h]) => hotelCard(id, h)).join('') || '<p class="dc-empty" style="color:rgba(246,241,231,.6)">এই মানের হোটেলের নাম এখনও যোগ হয়নি।</p>';
        if (EB.lenis) EB.lenis.resize();
      }
      /* drawer with one district's prices and named hotels */
      const sheet = $('#sheet'), back = $('#sheet-back');
      const close = () => { sheet.classList.remove('on'); back.classList.remove('on'); sheet.setAttribute('aria-hidden', 'true'); if (EB.lenis) EB.lenis.start(); };
      function open(id) {
        const info = INFO[id], st = S.d[id];
        sheet.innerHTML = `
          <button class="sheet-x" type="button" aria-label="বন্ধ করুন">×</button>
          <div class="sheet-ph"><img src="${pic(info.img, info.mx, 800)}" alt=""><div><small lang="en">${info.en}</small><b>${dById[id].bn}</b></div></div>
          <div class="sheet-in">
            <p class="sheet-tag">${esc(st.year)} · রুমপ্রতি এক রাত</p>
            <dl class="sheet-tiers">${TIERS.map((t) => (price(id, t[0]) ? `<div class="${t[0] === tier ? 'on' : ''}"><dt>${t[1]}</dt><dd>${price(id, t[0])}</dd></div>` : '')).join('')}</dl>
            ${info.peak ? `<p class="sheet-note">${esc(info.peak)}</p>` : ''}
            ${st.named.length ? `<h3>হোটেলের নাম ও দাম</h3><ul class="sheet-list">${st.named.map((h) => `<li>${h.id ? `<a href="hotel.html?id=${h.id}">` : '<div>'}<span><b>${esc(h.t)}</b><small>${esc(h.area)}</small></span><em>${esc(h.price)}</em>${h.id ? '</a>' : '</div>'}</li>`).join('')}</ul>` : ''}
            <div class="sheet-btns"><a class="btn btn-dark" href="${U.plan([id], 3)}"><span>${dById[id].bn} ঘোরার প্ল্যান করুন</span><span class="arr">→</span></a><a class="btn btn-line" href="${U.district(id)}">জেলার গাইড</a></div>
          </div>`;
        sheet.classList.add('on'); back.classList.add('on'); sheet.setAttribute('aria-hidden', 'false'); sheet.scrollTop = 0; if (EB.lenis) EB.lenis.stop();
        $('.sheet-x', sheet).focus();
      }
      sheet.addEventListener('click', (e) => { if (e.target.closest('.sheet-x')) close(); });
      back.addEventListener('click', close);
      addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
      grid.addEventListener('click', (e) => { const t = e.target.closest('.st-tile'); if (t) open(t.dataset.d); });
      paths.forEach((p) => {
        p.addEventListener('click', () => open(p.dataset.d));
        p.addEventListener('pointerenter', () => { $('#st-r-s').textContent = INFO[p.dataset.d].en; read(p.dataset.d); });
        p.addEventListener('pointerleave', () => { $('#st-r-s').textContent = 'সবচেয়ে কম ভাড়া'; read(cheapest); });
      });
      if (EB.fine) {
        grid.addEventListener('pointerover', (e) => { const t = e.target.closest('.st-tile'); if (t) { pathBy[t.dataset.d].classList.add('hot'); $('#st-r-s').textContent = INFO[t.dataset.d].en; read(t.dataset.d); } });
        grid.addEventListener('pointerout', (e) => { const t = e.target.closest('.st-tile'); if (t) pathBy[t.dataset.d].classList.remove('hot'); });
      }
      $('#st-tier').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; tier = b.dataset.k; $$('#st-tier button').forEach((x) => x.setAttribute('aria-checked', String(x === b))); paint(); });
      $$('[data-sort]').forEach((b) => b.addEventListener('click', () => { sort = b.dataset.sort; $$('[data-sort]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); paint(); }));
      $('#st-q').addEventListener('input', (e) => { term = e.target.value; paint(); });
      const bar = $('.dc-bar'), hd = $('.site-header');
      EB.onFrame(() => bar.classList.toggle('shift', bar.getBoundingClientRect().top <= 1 && !hd.classList.contains('is-hidden')));
      paint();
      if (INFO[q.get('d')]) setTimeout(() => open(q.get('d')), 900);
    },

    /* ---- one hotel: rooms as cards, one clear way to get in touch ---- */
    hotel() {
      const S = window.EB_STAY, id = q.get('id'), h = S.h[id];
      if (!h) return missing('হোটেলটা');
      const info = INFO[h.d], d = dById[h.d];
      document.title = `${h.t} — ${d.bn} — এক্সপ্লোর বাংলাদেশ`;
      const others = Object.entries(S.h).filter(([k, x]) => x.d === h.d && k !== id);
      const near = h.near.map(([gid, dist]) => [gById[gid], dist]).filter((x) => x[0]);
      main.innerHTML = hero({
        img: info.img, mx: info.mx, crumbs: [['হোটেল', 'hotels.html'], [d.bn, `hotels.html?d=${h.d}`]], small: h.en, title: esc(h.t), sub: h.sum,
        extra: `<div class="ph-row" style="--k:4">${h.chips.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div>
          <ul class="facts" style="--k:5"><li><b>${esc(h.from.replace('রুম ভাড়া ', '').replace(' থেকে', ''))}</b><span>থেকে শুরু · ${esc(h.year)}</span></li><li><b>${bn(h.rooms.length)}</b><span>ধরনের রুম</span></li><li><b>${d.bn}</b><span>${esc(h.where.split(',')[0])}</span></li></ul>`,
      }) + `
        <section class="sec">
          <div class="wrap g-grid">
            <div>
              ${h.note ? `<p class="h-note" data-reveal>${esc(h.note)}</p>` : ''}
              <div class="rooms">${h.rooms.map((r, i) => `
                <div class="room" data-reveal style="--d:${Math.min(i, 5) * 70}ms">
                  <div><h3>${esc(r[0])}</h3><p>${[r[1], r[2], r[3]].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('')}</p>${r[5] ? `<small>${r[1] ? 'সঙ্গে ' : ''}${esc(r[5])}</small>` : ''}</div>
                  <b>${esc(r[4])}<i>এক রাত</i></b>
                </div>`).join('')}</div>
              ${h.amen.length ? `<h3 class="h-sub" data-reveal>যা যা সুবিধা আছে</h3><div class="tags amen" data-reveal>${h.amen.map((a) => `<span>${esc(a)}</span>`).join('')}</div>` : ''}
              ${h.times.length ? `<dl class="glance" style="margin-top:34px" data-reveal>${h.times.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
            </div>
            <aside class="g-side" data-reveal>
              <div class="g-where">${miniMap({ on: [h.d], pulse: h.d })}<p>${esc(h.where)}</p></div>
              <div class="g-actions">
                ${h.phone ? `<a class="btn btn-dark" href="tel:${h.phone}"><span>কল করুন · ${h.phone}</span></a>` : ''}
                ${h.book ? `<a class="btn btn-line" href="${h.book}" target="_blank" rel="noopener nofollow">অফিসিয়াল সাইটে বুক করুন ↗</a>` : (h.web ? `<a class="btn btn-line" href="${h.web}" target="_blank" rel="noopener nofollow">ওয়েবসাইট ↗</a>` : '')}
                ${h.ll.length === 2 ? `<a class="btn btn-line" href="https://www.google.com/maps/search/?api=1&query=${h.ll[0]},${h.ll[1]}" target="_blank" rel="noopener">গুগল ম্যাপে খুলুন</a>` : ''}
              </div>
            </aside>
          </div>
        </section>
        ${near.length ? `<section class="sec cream">${head('কাছেই', 'nearby', ['হোটেল থেকে', 'হাঁটা দূরত্বে'], `<a class="link-arrow" href="${U.district(h.d)}" data-reveal>${d.bn} জেলা <span class="arr">→</span></a>`)}<div class="wrap cards4">${near.map(([g, dist], i) => tile(g, i).replace(`<small>${dById[g.d].bn}</small>`, `<small>${esc(dist)}</small>`)).join('')}</div></section>` : ''}
        ${others.length ? `<section class="sec dark">${head(d.bn, 'more stays', ['এই জেলায়', 'আরও হোটেল'])}<div class="rail" data-drag>${others.map(([k, x]) => hotelCard(k, x)).join('')}</div></section>` : ''}`;
    },

    /* ---- my travel map: tap what you have seen, watch the sun fill up ---- */
    mymap() {
      document.title = 'আমার ভ্রমণ ম্যাপ — এক্সপ্লোর বাংলাদেশ';
      const KEY = 'eb-visited-v1', COLORS = ['#e2323f', '#c8a25a', '#2fa37a', '#3d86b8', '#d0764f'];
      let seen = new Set(), color = COLORS[0];
      try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); seen = new Set((s.ids || []).filter((x) => dById[x])); color = COLORS.includes(s.color) ? s.color : color; } catch (e) { /* ignore */ }
      const shared = q.get('v');
      if (shared && /^[0-9a-f]{16}$/.test(shared)) { const bits = BigInt('0x' + shared); seen = new Set(D.filter((d, i) => (bits >> BigInt(i)) & 1n).map((d) => d.id)); }
      if (dById[q.get('visited')]) seen.add(q.get('visited'));
      const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ ids: [...seen], color })); } catch (e) { /* ignore */ } };
      const level = (n) => (n === 0 ? 'যাত্রা শুরু হোক' : n < 8 ? 'নতুন পথিক' : n < 20 ? 'ঘুরে বেড়ানো মানুষ' : n < 40 ? 'পাকা ভ্রমণপিপাসু' : n < 64 ? 'দেশ-চেনা মুসাফির' : 'পুরো বাংলাদেশ দেখা!');
      const C = 2 * Math.PI * 88;
      main.innerHTML = hero({
        img: '43ff844d', mx: 1920, short: true, small: 'my travel map', title: 'বাংলাদেশের কতটা <em>দেখেছেন?</em>', sub: 'ঘুরে আসা জেলায় ট্যাপ করুন। সূর্যটা ভরে উঠবে।',
      }) + `
        <section class="sec dark mm">
          <div class="wrap mm-grid">
            <div class="mm-map" id="mm-map">${miniMap({})}<div class="tipp" id="mm-tip"></div></div>
            <div class="mm-side">
              <div class="mm-sun">
                <svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="88" class="trk"/><circle cx="100" cy="100" r="88" class="prg" id="mm-prg" stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 100 100)"/><circle cx="100" cy="100" r="66" class="core" id="mm-core"/></svg>
                <div><b id="mm-n">০</b><span>/ ৬৪ জেলা</span></div>
              </div>
              <p class="mm-level" id="mm-level" aria-live="polite"></p>
              <ul class="mm-divs" id="mm-divs">${DIVS.map((dv) => `<li data-div="${dv.id}"><span>${dv.bn.replace(' বিভাগ', '')}</span><i><u></u></i><em></em></li>`).join('')}</ul>
              <div class="mm-colors" role="radiogroup" aria-label="রং">${COLORS.map((c) => `<button type="button" role="radio" style="--c:${c}" data-c="${c}" aria-label="রং ${c}"></button>`).join('')}</div>
              <div class="mm-btns">
                <button class="btn btn-gold" type="button" id="mm-dl"><span>ছবি ডাউনলোড</span></button>
                <button class="btn btn-ghost" type="button" id="mm-share">লিংক কপি</button>
                <button class="btn btn-ghost" type="button" id="mm-reset">মুছে ফেলুন</button>
              </div>
            </div>
          </div>
        </section>
        <section class="sec cream">
          ${head('নাম ধরে বাছুন', 'tap to mark', ['তালিকা থেকে', 'টিক দিন'])}
          <div class="wrap mm-lists">${DIVS.map((dv) => `<div><h3>${dv.bn}<span lang="en">${dv.en}</span></h3><div class="mm-chips">${dv.d.map((id) => `<button type="button" data-d="${id}" aria-pressed="false">${dById[id].bn}</button>`).join('')}</div></div>`).join('')}</div>
        </section>
        <section class="sec" id="mm-next-sec">
          ${head('এরপর কোথায়', 'not yet seen', ['এখনও', 'বাকি আছে'], '<a class="link-arrow" href="explore.html" data-reveal>সব জেলা <span class="arr">→</span></a>')}
          <div class="wrap cards4" id="mm-next"></div>
        </section>
        <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
      const paths = $$('#mm-map path'), tip = $('#mm-tip'), toast = $('#toast');
      const say = (m) => { toast.textContent = m; toast.classList.add('on'); setTimeout(() => toast.classList.remove('on'), 2400); };
      const want = ['coxs-bazar', 'sylhet', 'bandarban', 'rangamati', 'sunamganj', 'khulna', 'moulvibazar', 'patuakhali', 'bagerhat', 'rajshahi', 'dinajpur', 'netrokona', 'kushtia', 'panchagarh', 'bogura', 'naogaon'];
      function paint(popId) {
        const n = seen.size;
        main.style.setProperty('--mm', color);
        paths.forEach((p) => { const on = seen.has(p.dataset.d); p.classList.toggle('on', on); if (p.dataset.d === popId) { p.classList.remove('pop'); void p.getBBox(); p.classList.add('pop'); } });
        $('#mm-prg').style.strokeDashoffset = C * (1 - n / 64);
        $('#mm-core').style.opacity = 0.18 + 0.82 * (n / 64);
        $('#mm-n').textContent = bn(n); $('#mm-level').textContent = level(n);
        $$('#mm-divs li').forEach((li) => { const dv = divById[li.dataset.div], k = dv.d.filter((x) => seen.has(x)).length; $('u', li).style.transform = `scaleX(${k / dv.d.length})`; $('em', li).textContent = `${bn(k)}/${bn(dv.d.length)}`; });
        $$('.mm-chips button').forEach((b) => b.setAttribute('aria-pressed', String(seen.has(b.dataset.d))));
        $$('.mm-colors button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.c === color)));
        const rest = want.filter((x) => !seen.has(x)).concat(D.map((d) => d.id).filter((x) => !seen.has(x) && !want.includes(x))).slice(0, 4);
        $('#mm-next-sec').hidden = !rest.length;
        $('#mm-next').innerHTML = rest.map((id2) => `<a class="tile" href="${U.district(id2)}" data-cursor="ঘুরে দেখুন"><img src="${pic(INFO[id2].img, INFO[id2].mx, 800)}" alt="" loading="lazy"><span class="tile-tx"><small lang="en">${INFO[id2].en}</small><b>${dById[id2].bn}</b><p>${esc(INFO[id2].tag)}</p></span></a>`).join('');
      }
      const toggle = (id2) => { seen.has(id2) ? seen.delete(id2) : seen.add(id2); save(); paint(id2); if (seen.size === 64) say('অভিনন্দন! পুরো বাংলাদেশ ঘোরা শেষ।'); };
      paths.forEach((p) => {
        p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button'); p.setAttribute('aria-label', dById[p.dataset.d].bn);
        p.addEventListener('click', () => toggle(p.dataset.d));
        p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(p.dataset.d); } });
      });
      const mm = $('#mm-map');
      if (EB.fine) {
        mm.addEventListener('pointermove', (e) => { const p = e.target.closest('path'); tip.classList.toggle('on', !!p); if (!p) return; tip.textContent = dById[p.dataset.d].bn + (seen.has(p.dataset.d) ? ' ✓' : ''); const r = mm.getBoundingClientRect(); tip.style.transform = `translate(${e.clientX - r.left + 16}px,${e.clientY - r.top + 16}px)`; });
        mm.addEventListener('pointerleave', () => tip.classList.remove('on'));
      }
      $('.mm-lists').addEventListener('click', (e) => { const b = e.target.closest('button[data-d]'); if (b) toggle(b.dataset.d); });
      $('.mm-colors').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; color = b.dataset.c; save(); paint(); });
      $('#mm-reset').addEventListener('click', () => { if (!seen.size) return; if (confirm('সব দাগ মুছে ফেলবেন?')) { seen.clear(); save(); paint(); } });
      $('#mm-share').addEventListener('click', async () => {
        let bits = 0n; D.forEach((d, i) => { if (seen.has(d.id)) bits |= 1n << BigInt(i); });
        const url = location.origin + location.pathname + '?v=' + bits.toString(16).padStart(16, '0');
        try { await navigator.clipboard.writeText(url); say('লিংক কপি হয়েছে'); } catch (e) { say('লিংক কপি করা গেল না'); }
      });
      $('#mm-dl').addEventListener('click', () => {
        const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const c = cv.getContext('2d');
        c.fillStyle = '#03190f'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#e7d3a4'; c.font = '500 34px "Anek Bangla", sans-serif'; c.textAlign = 'center'; c.fillText('আমার ভ্রমণ ম্যাপ', W / 2, 96);
        c.fillStyle = '#f6f1e7'; c.font = '600 84px "Anek Bangla", sans-serif'; c.fillText(`${bn(seen.size)} / ৬৪ জেলা`, W / 2, 196);
        c.font = '400 36px "Anek Bangla", sans-serif'; c.fillStyle = 'rgba(246,241,231,.75)'; c.fillText(level(seen.size), W / 2, 250);
        const sc = 1.3; c.save(); c.translate((W - 600 * sc) / 2, 280); c.scale(sc, sc); c.lineWidth = 0.8; c.lineJoin = 'round';
        D.forEach((d) => { const p = new Path2D(d.d); c.fillStyle = seen.has(d.id) ? color : 'rgba(246,241,231,.06)'; c.fill(p); c.strokeStyle = 'rgba(231,211,164,.55)'; c.stroke(p); });
        c.restore();
        c.fillStyle = 'rgba(246,241,231,.6)'; c.font = 'italic 30px "Cormorant Garamond", serif'; c.fillText('explorebangladesh.xyz', W / 2, H - 44);
        cv.toBlob((blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-bangladesh-map.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); say('ছবি ডাউনলোড হচ্ছে'); }, 'image/png');
      });
      if (shared || q.get('visited')) save();
      paint();
    },

    /* ---- six seasons: scroll turns the year; the sky, the weather and the photo change with it ---- */
    seasons() {
      document.title = 'ষড়ঋতু — কোন ঋতুতে কোথায় — এক্সপ্লোর বাংলাদেশ';
      const SS = EB.SEASONS, PICKS = window.EB_SEASON_PICKS, N = SS.length;
      const GREG = ['এপ্রিল – মে', 'জুন – জুলাই', 'আগস্ট – সেপ্টেম্বর', 'অক্টোবর – নভেম্বর', 'ডিসেম্বর – জানুয়ারি', 'ফেব্রুয়ারি – মার্চ'];
      /* the best-known picks lead each season; the rest follow from the data */
      const LEAD = {
        grishmo: ['mangal-shobhajatra', 'kansat-mango-market', 'srimangal-pineapple', 'khagrachhari-amrapali-mango', 'chuadanga-mango'],
        borsha: ['ratargul-swamp-forest', 'tanguar-haor', 'sajek-valley', 'srimangal-tea-gardens', 'bichanakandi', 'jaflong', 'chalan-beel'],
        shorot: ['nafakhum-waterfall', 'tanguar-haor', 'ratargul-swamp-forest', 'sajek-valley', 'alutila-cave', 'lalakhal'],
        hemonto: ['kuakata-sea-beach', 'nafakhum-waterfall', 'lalakhal', 'karamjal', 'kantajew-temple', 'chandranath-hill-sitakunda'],
        sheet: ['kuakata-sea-beach', 'st-martins-island', 'sajek-valley', 'tanguar-haor', 'lalbagh-fort', 'magura-winter-pitha', 'rajshahi-khejur-gur'],
        boshonto: ['srimangal-tea-gardens', 'ahsan-manzil', 'lalbagh-fort', 'star-mosque-dhaka', 'alta-dighi-national-park'],
      };
      const list = Object.fromEntries(SS.map((s) => { const all = PICKS[s.key] || [], lead = LEAD[s.key].filter((x) => all.includes(x)); return [s.key, lead.concat(all.filter((x) => !lead.includes(x))).map((x) => gById[x]).filter(Boolean)]; }));
      const now = new Date(), md = (now.getMonth() + 1) * 100 + now.getDate();
      const cur = md >= 1216 || md < 215 ? 4 : md < 415 ? 5 : md < 615 ? 0 : md < 816 ? 1 : md < 1016 ? 2 : 3;
      const PAL = [['#f6d98a', '#fbefc8', '#3a2606', '#d9760f'], ['#234f56', '#5f8f8a', '#f1f7f3', '#bfe3d6'], ['#a9d4ee', '#eef7fb', '#0c2b40', '#2f7fb4'], ['#e3b468', '#f6e6c0', '#3a2408', '#b5651d'], ['#b9c6d0', '#eef1f3', '#1c2b36', '#5d7fa3'], ['#f3b7a0', '#fdebd9', '#4a1414', '#cc2633']]
        .map((r) => r.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]));
      const VARS = ['--s1', '--s2', '--sink', '--sacc'];

      main.innerHTML = `
        <section class="sz" id="sz" aria-label="ছয় ঋতু">
          <h1 class="sr">ষড়ঋতু — কোন ঋতুতে কোথায় যাবেন</h1>
          <div class="sz-stage">
            <div class="sz-sky" aria-hidden="true"></div>
            <div class="sz-fx" aria-hidden="true">${Array.from({ length: 30 }, (_, i) => `<i style="--x:${(i * 37 + 7) % 100};--dl:${-((i * 53) % 90) / 10}s;--sp:${0.7 + ((i * 29) % 60) / 100};--sz:${0.6 + ((i * 17) % 80) / 100}"></i>`).join('')}</div>
            <div class="sz-top wrap"><span class="eyebrow">ষড়ঋতুর দেশ <i lang="en">the year turns</i></span><span class="jr-count"><b id="sz-n">০১</b><i>/ ০৬</i></span></div>
            <div class="wrap sz-grid">
              <div class="sz-texts">${SS.map((s, i) => `
                <article class="sz-text" data-i="${i}">
                  <div class="sz-when" style="--k:0"><b>${s.months}</b><span>${GREG[i]}</span>${i === cur ? '<em>এখন চলছে</em>' : ''}</div>
                  <h2 class="display" style="--k:1"><span class="ln"><span>${s.bn}</span></span></h2>
                  <p style="--k:2">${s.mood}</p>
                  <div class="sz-thumbs" style="--k:3">${list[s.key].slice(1, 4).map((g) => `<a href="${U.guide(g.id)}" title="${esc(g.t)}" data-cursor="দেখুন"><img src="${pic(g.img, g.mx, 400)}" alt="${esc(g.t)}" loading="lazy"></a>`).join('')}<button class="link-arrow" type="button" data-go="${i}">${bn(list[s.key].length)}টা জায়গা ও খাবার <span class="arr">↓</span></button></div>
                </article>`).join('')}</div>
              <div class="sz-arch"><div class="sz-arch-in">${SS.map((s, i) => { const g = list[s.key][0]; return g ? `<a href="${U.guide(g.id)}" data-cursor="দেখুন" aria-label="${esc(g.t)}"><img src="${pic(g.img, g.mx, 1280)}" alt="" ${i > 1 ? 'loading="lazy"' : ''}><span>${esc(g.t)} · ${dById[g.d].bn}</span></a>` : '<a></a>'; }).join('')}</div></div>
            </div>
            <div class="sz-wheel" aria-hidden="true"><div class="sz-ring"></div><div class="sz-sun"></div>${SS.map((s, i) => `<span style="--a:${i * 60}deg">${s.bn}</span>`).join('')}</div>
            <nav class="sz-marks" aria-label="ঋতু">${SS.map((s, i) => `<button type="button" data-i="${i}">${s.bn}</button>`).join('')}</nav>
          </div>
        </section>
        <div class="dc-bar" id="sz-bar"><div class="wrap">
          <div class="seg" id="sz-season" role="radiogroup" aria-label="ঋতু">${SS.map((s, i) => `<button type="button" role="radio" data-i="${i}" aria-checked="false">${s.bn}</button>`).join('')}</div>
          <div class="dc-pills" style="justify-content:flex-end" role="group" aria-label="ধরন"><button class="pill" type="button" data-t="" aria-pressed="true">সব</button>${Object.keys(TYPE).map((k) => `<button class="pill" type="button" data-t="${k}" aria-pressed="false">${TYPE[k].bn}</button>`).join('')}</div>
        </div></div>
        <section class="sec" style="padding-top:40px" id="sz-list"><div class="wrap"><p class="dc-count" id="sz-count" lang="en"></p><div class="dc-grid" id="sz-gridl"></div><div id="sz-more" style="height:1px"></div></div></section>`;

      /* ----- the turning year ----- */
      const sec = $('#sz'), stage = $('.sz-stage'), texts = $$('.sz-text'), imgs = $$('.sz-arch-in a'), marks = $$('.sz-marks button'), wheel = $('.sz-wheel'), nEl = $('#sz-n');
      const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
      let top = 0, dist = 1, active = -1, rot = 0, lastS = -1;
      const measure = () => { top = sec.getBoundingClientRect().top + (EB.lenis ? EB.lenis.scroll : scrollY); dist = Math.max(1, sec.offsetHeight - stage.offsetHeight); lastS = -1; };
      const setActive = (i) => {
        if (i === active || !SS[i]) return; const prev = active; active = i;
        texts.forEach((t, k) => t.classList.toggle('on', k === i));
        imgs.forEach((im) => im.classList.remove('was')); if (prev > -1) imgs[prev].classList.add('was');
        imgs.forEach((im, k) => im.classList.toggle('on', k === i));
        marks.forEach((m, k) => m.classList.toggle('on', k === i));
        stage.dataset.season = SS[i].key; nEl.textContent = bn(two(i + 1));
      };
      const jump = (i) => EB.scrollTo(top + ((i + 0.5) / N) * dist, { duration: 1.6 });
      $('.sz-marks').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) jump(+b.dataset.i); });
      EB.onFrame((y, dt) => {
        if (y < top - innerHeight || y > top + dist + innerHeight) return;
        const s = clamp((y - top) / dist, 0, 1) * N;
        setActive(clamp(Math.floor(s), 0, N - 1));
        if (Math.abs(s - lastS) > 0.0004) {
          lastS = s;
          const u = clamp(s - 0.5, 0, N - 1), i0 = Math.min(N - 2, Math.floor(u)), t = smooth(0.2, 0.8, u - i0), a = PAL[i0], b = PAL[i0 + 1];
          for (let k = 0; k < VARS.length; k++) sec.style.setProperty(VARS[k], `rgb(${a[k].map((v, j) => Math.round(v + (b[k][j] - v) * t)).join(',')})`);
        }
        rot = EB.damp(rot, -clamp(s - 0.5, 0, N - 1) * 60, 5, dt);
        wheel.style.setProperty('--rot', rot.toFixed(2) + 'deg');
      });

      /* ----- everything for one season ----- */
      const grid = $('#sz-gridl'), sentinel = $('#sz-more');
      let season = cur, type = '', items = [], shown = 0;
      const tileIo = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); tileIo.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
      const more = () => {
        const next = items.slice(shown, shown + 20); if (!next.length) return;
        grid.insertAdjacentHTML('beforeend', next.map((g, k) => tile(g, shown + k, { cls: (shown + k) % 9 === 0 && g.mx >= 1280 ? 'wide' : '', big: (shown + k) % 9 === 0 })).join(''));
        shown += next.length; $$('.tile:not(.in)', grid).forEach((t) => tileIo.observe(t)); if (EB.lenis) EB.lenis.resize();
      };
      const apply = () => {
        items = list[SS[season].key].filter((g) => !type || g.type === type);
        grid.innerHTML = items.length ? '' : '<p class="dc-empty">এই ঋতুতে এই ধরনের কিছু নেই।</p>'; shown = 0;
        $('#sz-count').textContent = `${items.length} for ${SS[season].en.toLowerCase()}`;
        $$('#sz-season button').forEach((b) => b.setAttribute('aria-checked', String(+b.dataset.i === season)));
        $('#sz-bar').style.setProperty('--tint', SS[season].tint);
        more();
      };
      new IntersectionObserver((es) => { if (es[0].isIntersecting) more(); }, { rootMargin: '900px' }).observe(sentinel);
      const toList = () => EB.scrollTo($('#sz-bar').getBoundingClientRect().top + (EB.lenis ? EB.lenis.scroll : scrollY) + 2, { duration: 1.4 });
      $('#sz-season').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; season = +b.dataset.i; apply(); });
      $$('#sz-bar [data-t]').forEach((b) => b.addEventListener('click', () => { type = b.dataset.t; $$('#sz-bar [data-t]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); apply(); }));
      $('.sz-texts').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (!b) return; season = +b.dataset.go; apply(); toList(); });
      const bar = $('#sz-bar'), hd = $('.site-header');
      EB.onFrame(() => bar.classList.toggle('shift', bar.getBoundingClientRect().top <= 1 && !hd.classList.contains('is-hidden')));
      apply();
      measure(); setActive(0);
      addEventListener('resize', measure); addEventListener('load', measure);
      /* open on the season that is happening right now */
      if (cur > 0 && !EB.reduce) setTimeout(() => { measure(); if ((EB.lenis ? EB.lenis.scroll : scrollY) < 40) EB.scrollTo(top + ((cur + 0.5) / N) * dist, { duration: 2.6 }); }, 1300);
      else if (cur > 0) { measure(); scrollTo(0, top + ((cur + 0.5) / N) * dist); }
    },
  };

  /* ---------- behaviours shared by the pages ---------- */
  function storyRail() {
    const wrap = $('#stops'); if (!wrap) return;
    const rail = $('.stops-rail', wrap), fill = $('i', rail), stops = $$('.stop', wrap), imgs = stops.map((s) => $('img', s));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); }), { rootMargin: '0px 0px -28% 0px' });
    stops.forEach((s) => io.observe(s));
    EB.onFrame(() => {
      const r = rail.getBoundingClientRect(), vh = innerHeight;
      if (r.bottom < -200 || r.top > vh + 200) return;
      fill.style.setProperty('--p', clamp((vh * 0.5 - r.top) / r.height, 0, 1).toFixed(4));
      if (EB.reduce) return;
      for (let i = 0; i < imgs.length; i++) {
        const b = stops[i].getBoundingClientRect(); if (b.bottom < 0 || b.top > vh) continue;
        imgs[i].style.transform = `translate3d(0,${(((b.top + b.height / 2) / vh) - 0.5) * -7}%,0)`;
      }
    });
  }
  function dragRails() {
    if (!EB.fine) return;
    $$('[data-drag]').forEach((el) => {
      let down = false, x0 = 0, s0 = 0, moved = 0;
      el.addEventListener('pointerdown', (e) => { if (e.button) return; down = true; x0 = e.clientX; s0 = el.scrollLeft; moved = 0; });
      addEventListener('pointermove', (e) => { if (!down) return; moved = e.clientX - x0; if (Math.abs(moved) > 6) el.classList.add('dragging'); el.scrollLeft = s0 - moved; });
      addEventListener('pointerup', () => { if (!down) return; down = false; setTimeout(() => el.classList.remove('dragging'), 0); });
      el.addEventListener('click', (e) => { if (Math.abs(moved) > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
      el.addEventListener('dragstart', (e) => e.preventDefault());
    });
  }
  function after() {
    EB.observe(main);
    $$('[data-map]').forEach((m) => new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { m.classList.add('in'); o.disconnect(); } }, { threshold: 0.3 }).observe(m));
    dragRails();
    if (EB.lenis) EB.lenis.resize();
  }

  (pages[page] || (() => {}))();
  after();

  /* hero parallax */
  const media = $('.ph-media');
  if (media && !EB.reduce) EB.onFrame((y) => { if (y < innerHeight * 1.2) media.style.transform = `translate3d(0,${y * 0.2}px,0)`; });
  addEventListener('load', () => EB.lenis && EB.lenis.resize());
})();
