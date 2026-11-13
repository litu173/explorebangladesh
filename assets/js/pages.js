/* Inner pages: trips · trip · explore · district · guide · discover · hotels · hotel · my map · seasons.
   One template per page type; content comes from assets/data (extracted from the live site), in the page language.
   Every UI string is a T('বাংলা', 'English') pair. */
(function () {
  const EB = window.EB;
  const { bn, taka, clamp, two } = EB;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const q = new URLSearchParams(location.search);
  const page = document.body.dataset.page, main = $('#main');
  const SITE_NAME = T('এক্সপ্লোর বাংলাদেশ', 'Explore Bangladesh');

  const D = window.EB_DISTRICTS, dById = Object.fromEntries(D.map((d) => [d.id, d]));
  const INFO = window.EB_DINFO, DIVS = window.EB_DIVS, TRIPS = window.EB_TRIPS;
  const gById = EB.guides(), G = Object.values(gById);
  const divById = Object.fromEntries(DIVS.map((d) => [d.id, d]));
  const dn = EB.dname;
  const divName = (dv) => dv.bn;                                   // “Sylhet Division” / “সিলেট বিভাগ”
  const divShort = (dv) => (EB.EN ? dv.en : dv.bn.replace(' বিভাগ', ''));
  const TYPE = {
    place: { name: T('ঘোরার জায়গা', 'Places'), accent: T('দেখার মতো', 'places to see'), list: 'places', h: [T('দেখার মতো', 'Places'), T('জায়গা', 'worth the trip')], cur: T('দেখুন', 'View') },
    food: { name: T('খাবার', 'Food'), accent: T('পথের স্বাদ', 'taste of the road'), list: 'foods', h: [T('প্রতিটা জেলার', 'Every district'), T('নিজের স্বাদ', 'has its own taste')], cur: T('স্বাদ নিন', 'Taste') },
    hidden: { name: T('অচেনা জায়গা', 'Hidden places'), accent: T('ভিড়ের বাইরে', 'off the map'), list: 'hidden', h: [T('ভিড়ের বাইরে', 'Away from'), T('অচেনা জায়গা', 'the crowds')], cur: T('খুঁজুন', 'Explore') },
    tradition: { name: T('ঐতিহ্য', 'Traditions'), accent: T('জীবন্ত সংস্কৃতি', 'living traditions'), list: 'traditions', h: [T('এখনও বেঁচে থাকা', 'Living'), T('ঐতিহ্য', 'traditions')], cur: T('জানুন', 'Learn') },
  };
  const U = {
    trip: (id) => `trip.html?id=${id}`, guide: (id) => `guide.html?id=${id}`, district: (id) => `district.html?id=${id}`,
    list: (type) => `discover.html?type=${TYPE[type].list}`,
    plan: (ds, days, mode) => `plan.html?from=dhaka&to=${ds.join(',')}&days=${days || 3}&people=2&mode=${mode || 'bus'}`,
  };
  const pic = (id, mx, want) => EB.img(id, [400, 800, 1280, 1920].filter((w) => w <= Math.min(mx || 800, want || 800)).pop() || 800);
  const days = (n) => T(`${bn(n)} দিন`, `${n} day${n > 1 ? 's' : ''}`);
  const fromPrice = (s) => String(s || '').replace(/^রুম ভাড়া\s*/, '').replace(/\s*থেকে$/, '').replace(/^Rooms from\s*/i, '');

  /* ---------- building blocks ---------- */
  const hero = ({ img, mx, crumbs, chip, small, title, sub, extra, short }) => `
    <section class="ph${short ? ' short' : ''}">
      <div class="ph-media"><img src="${pic(img, mx, 1920)}" alt="" fetchpriority="high"></div>
      <div class="wrap">
        ${crumbs ? `<nav class="crumbs" style="--k:0" aria-label="${T('আপনি এখানে', 'You are here')}">${crumbs.map(([t, h]) => (h ? `<a href="${h}">${t}</a>` : `<b>${t}</b>`)).join('<span>/</span>')}</nav>` : ''}
        ${chip ? `<span class="chip t-${chip}" style="--k:1">${TYPE[chip].name}</span>` : ''}
        <h1 class="display${String(title).replace(/<[^>]+>/g, '').length > (EB.EN ? 22 : 16) ? ' long' : ''}" style="--k:2">${small ? `<small>${esc(small)}</small>` : ''}${title}</h1>
        ${sub ? `<p class="ph-sub" style="--k:3">${esc(sub)}</p>` : ''}
        ${extra || ''}
      </div>
    </section>`;
  const tile = (g, i, o) => `
    <a class="tile t-${g.type}${o && o.cls ? ' ' + o.cls : ''}" href="${U.guide(g.id)}" data-cursor="${TYPE[g.type].cur}" style="--i:${i % 8}">
      <img src="${pic(g.img, g.mx, o && o.big ? 1280 : 800)}" alt="" loading="lazy" decoding="async">
      ${o && o.no ? `<span class="tile-no">${bn(two(i + 1))}</span>` : ''}
      <span class="tile-tx"><small>${o && o.where === false ? TYPE[g.type].name : dn(g.d)}</small><b>${esc(g.t)}</b><p>${esc(g.s)}</p></span>
    </a>`;
  const tripTile = (t) => `
    <a class="tile" href="${U.trip(t.id)}" data-cursor="${T('খুলুন', 'Open')}">
      <img src="${pic(t.img, t.mx, 800)}" alt="" loading="lazy" decoding="async">
      <span class="tile-tx"><small>${days(t.days)} · ${t.mode} · ~${taka(Math.round(t.cost / 100) * 100)}</small><b>${esc(t.t)}</b><p>${esc(t.s)}</p></span>
    </a>`;
  const circle = (g) => `
    <a class="circle" href="${U.guide(g.id)}" data-cursor="${TYPE.food.cur}">
      <div class="circle-ph"><img src="${pic(g.img, g.mx, 400)}" alt="" loading="lazy" decoding="async"></div>
      <b>${esc(g.t)}</b><small>${dn(g.d)}</small>
    </a>`;
  const head = (eyebrow, accent, h, right) => `
    <div class="wrap sec-head" data-lines>
      <div><span class="eyebrow" data-reveal>${eyebrow} <i>${accent}</i></span>
      <h2 class="display"><span class="ln" style="--i:0"><span>${h[0]}</span></span>${h[1] ? `<span class="ln" style="--i:1"><span><em>${h[1]}</em></span></span>` : ''}</h2></div>
      ${right || ''}
    </div>`;
  const count = (n) => `<span class="count" data-reveal>${bn(two(n))}</span>`;
  const dragHint = () => `<p class="rail-hint">${T('টেনে আরও দেখুন', 'drag for more')}</p>`;
  /* people scan: show the first two sentences, keep the rest one tap away */
  const lede = (text) => {
    const parts = String(text).split(/(?<=[।?!.])\s+/), headTx = parts.slice(0, 2).join(' '), rest = parts.slice(2).join(' ');
    return `<p class="lede-big" data-reveal>${esc(headTx)}${rest ? ` <span class="lede-rest" hidden>${esc(rest)}</span>` : ''}</p>${rest ? `<button class="link-arrow lede-more" type="button" data-reveal>${T('পুরোটা পড়ুন', 'Read more')} <span class="arr">↓</span></button>` : ''}`;
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.lede-more'); if (!b) return;
    b.previousElementSibling.querySelector('.lede-rest').hidden = false; b.remove();
    if (EB.lenis) EB.lenis.resize();
  });
  const toNum = (str) => { const m = String(str).replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c)).match(/[\d,]+/); return m ? +m[0].replace(/,/g, '') : Infinity; };
  const latinDigits = (s) => String(s).replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c));
  const TIER = { budget: T('সাধারণ হোটেল', 'Budget'), mid: T('ভালো হোটেল', 'Mid-range'), upscale: T('অভিজাত রিসোর্ট', 'Upscale') };
  const hotelCard = (id, h) => `
    <a class="hcard" href="hotel.html?id=${id}" data-cursor="${T('রুম দেখুন', 'Rooms')}">
      <div class="hcard-ph"><img src="${pic(INFO[h.d].img, INFO[h.d].mx, 800)}" alt="" loading="lazy" decoding="async"><span>${TIER[h.tier] || ''}</span></div>
      <small>${dn(h.d)} · ${esc(h.where.split(',')[0])}</small><h3>${esc(h.t)}</h3><b>${T(`${esc(fromPrice(h.from))} থেকে`, `from ${esc(fromPrice(h.from))}`)}</b>
    </a>`;
  const glance = (rows, cls) => `<dl class="${cls || 'glance'}" data-reveal>${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;

  /* country map: highlight districts; optionally draw a road route through stops (needs route.js) */
  function miniMap({ on, stops, links, light, pulse }) {
    const set = new Set(on || []);
    let extra = '';
    const pass = new Set();
    if (stops && stops.length > 1 && EB.route) {
      const legs = stops.slice(1).map((s, i) => EB.route.leg(stops[i], s));
      const pts = legs.flatMap((l, i) => (i ? l.pts.slice(1) : l.pts)), p = EB.route.d(pts);
      legs.forEach((l) => l.ds.forEach((d) => { if (!set.has(d)) pass.add(d); }));
      extra += `<path class="route-shadow" d="${p}"/><path class="route" pathLength="1" d="${p}"/><circle class="runner" r="6"><animateMotion dur="${Math.max(7, pts.length * 0.8)}s" repeatCount="indefinite" path="${p}"/></circle>`;
      extra += stops.map((s) => { const c = typeof s === 'string' ? EB.route.hq(s) : (s.ll ? EB.route.xy(s.ll[0], s.ll[1]) : EB.route.hq(s.d)); return `<circle class="pin" cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="7"/>`; }).join('');
    }
    if (pulse) extra += `<circle class="pulse" cx="${dById[pulse].c[0]}" cy="${dById[pulse].c[1]}" r="8"/>`;
    return `<div class="mini-map${light ? ' light' : ''}" data-map><svg viewBox="0 0 600 760" role="img" aria-label="${T('বাংলাদেশের ম্যাপ', 'Map of Bangladesh')}">
      ${D.map((d) => { const p = `<path data-d="${d.id}" class="${set.has(d.id) ? 'on' : pass.has(d.id) ? 'pass' : ''}" d="${d.d}"/>`; return links ? `<a href="${U.district(d.id)}" aria-label="${dn(d.id)}">${p}</a>` : p; }).join('')}
      ${extra}</svg></div>`;
  }
  const missing = (what) => { main.innerHTML = `<section class="ph short"><div class="wrap"><h1 class="display" style="--k:1">${what}</h1><div class="ph-row" style="--k:2"><a class="btn btn-gold" href="explore.html">${T('৬৪ জেলা ঘুরে দেখুন', 'Explore the 64 districts')}</a></div></div></section>`; };

  /* =================== pages =================== */
  const pages = {
    /* ---- all ready-made trips: scroll picks the trip, the whole screen becomes its photo ---- */
    trips() {
      document.title = `${T('রেডিমেড ট্রিপ', 'Ready-made trips')} — ${SITE_NAME}`;
      main.innerHTML = `
        <section class="tl" id="tl">
          <div class="tl-bg" aria-hidden="true">${TRIPS.map((t, i) => `<img src="${pic(t.img, t.mx, 1920)}" alt="" ${i > 1 ? 'loading="lazy"' : ''}>`).join('')}</div>
          <header class="wrap tl-head" data-lines>
            <span class="eyebrow" data-reveal>${T('রেডিমেড ট্রিপ', 'Ready-made trips')} <i>${T(`${bn(TRIPS.length)}টি সাজানো রুট`, `${TRIPS.length} curated routes`)}</i></span>
            <h1 class="display"><span class="ln" style="--i:0;--d:600ms"><span>${T('ট্রিপ সাজানোই আছে।', 'The trip is planned.')}</span></span><span class="ln" style="--i:1;--d:600ms"><span><em>${T('শুধু বেরিয়ে পড়ুন।', 'Just go.')}</em></span></span></h1>
            <p data-reveal style="--d:900ms">${T('স্ক্রল করে ঘুরে দেখুন', 'scroll to travel')}</p>
          </header>
          <ol class="wrap tl-list">${TRIPS.map((t, i) => `
            <li><a class="tl-row" href="${U.trip(t.id)}" data-i="${i}" data-cursor="${T('খুলুন', 'Open')}">
              <span class="no">${bn(two(i + 1))}</span>
              <span class="name"><b>${esc(t.t)}</b><span>${esc(t.s)}</span></span>
              <span class="meta"><b>~${taka(Math.round(t.cost / 100) * 100)}</b><span>${days(t.days)} · ${t.mode} · ${t.season}</span></span>
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
      if (!t) return missing(T('ট্রিপটা খুঁজে পাইনি', 'We couldn’t find that trip'));
      const stops = t.stops.map((id) => gById[id]).filter(Boolean);
      const ds = [...new Set(stops.map((s) => s.d))];
      const mode = /গাড়ি|car/i.test(t.mode) ? 'car' : /বাইক|bike/i.test(t.mode) ? 'bike' : 'bus';
      const planHref = U.plan(stops.map((s) => s.id), t.days, mode);
      document.title = `${t.t}: ${t.s} — ${SITE_NAME}`;
      const others = TRIPS.filter((x) => x.id !== t.id).sort((a, b) => Math.abs(a.days - t.days) - Math.abs(b.days - t.days)).slice(0, 3);
      const routeStops = EB.route ? ['dhaka'].concat(stops.map((s) => EB.route.place(s.id)), ['dhaka']) : null;
      main.innerHTML = hero({
        img: t.img, mx: t.mx, crumbs: [[T('রেডিমেড ট্রিপ', 'Ready-made trips'), 'trips.html'], [t.t]], small: T(`${bn(t.days)} দিন · ${bn(stops.length)}টা জায়গা`, `${t.days} days · ${stops.length} stops`), title: esc(t.t), sub: t.s,
        extra: `<ul class="facts" style="--k:4">
            <li><b>${days(t.days)}</b><span>${T('লাগবে', 'needed')}</span></li><li><b>${T(`${bn(t.km)} কিমি`, `${t.km} km`)}</b><span>${T('মোট পথ', 'distance')}</span></li>
            <li><b>${t.mode}</b><span>${T('ঢাকা থেকে', 'from Dhaka')}</span></li><li><b>${taka(t.cost)}</b><span>${T('জনপ্রতি', 'per person')}</span></li><li><b>${esc(t.season)}</b><span>${T('সেরা সময়', 'best time')}</span></li></ul>
          <div class="ph-row" style="--k:5"><a class="btn btn-gold" href="${planHref}" data-magnetic><span>${T('এই ট্রিপ নিজের মতো সাজান', 'Make this trip your own')}</span><span class="arr">→</span></a></div>`,
      }) + `
        <section class="sec"><div class="wrap">${lede(t.lede)}</div></section>
        <section class="stops" id="stops">
          <div class="stops-rail" aria-hidden="true"><i></i><span class="stops-sun"></span></div>
          ${stops.map((s, i) => `
            <article class="stop">
              <a class="stop-ph" href="${U.guide(s.id)}" data-cursor="${T('দেখুন', 'View')}"><img src="${pic(s.img, s.mx, 1280)}" alt="${esc(s.t)}" loading="lazy" decoding="async"></a>
              <div class="stop-tx">
                <span class="stop-n" aria-hidden="true">${bn(two(i + 1))}</span>
                <small>${dn(s.d)}</small>
                <h3>${esc(s.t)}</h3>
                <p>${esc(s.s)}</p>
                <a class="link-arrow" href="${U.guide(s.id)}">${T('জায়গাটা দেখুন', 'See this place')} <span class="arr">→</span></a>
              </div>
            </article>`).join('')}
        </section>
        <section class="sec dark">
          <div class="wrap route-band">
            <div data-lines>
              <span class="eyebrow" data-reveal>${T('পুরো রুট', 'The whole route')} <i>${T('রাস্তা ধরে', 'by road')}</i></span>
              <h2 class="display"><span class="ln" style="--i:0"><span>${T(`${bn(stops.length)}টা জায়গা,`, `${stops.length} places,`)}</span></span><span class="ln" style="--i:1"><span><em>${T(`${bn(t.days)} দিনে`, `${t.days} days`)}</em></span></span></h2>
              <p data-reveal>${T('দিন, কতজন, বাহন বা থাকার মান বদলে নিন — রুট আর খরচ সঙ্গে সঙ্গে নতুন করে হিসাব হবে।', 'Change the days, the group, the transport or the hotels — the route and the cost update straight away.')}</p>
              <a class="btn btn-gold" href="${planHref}" data-magnetic data-reveal><span>${T('প্ল্যানারে খুলুন', 'Open in the planner')}</span><span class="arr">→</span></a>
            </div>
            ${miniMap({ on: ds, stops: routeStops })}
          </div>
        </section>
        <section class="sec">
          ${head(T('আরও রেডিমেড ট্রিপ', 'More ready-made trips'), T('চলতে থাকুন', 'keep going'), [T('এর পরে', 'Where to'), T('কোথায়?', 'next?')], `<a class="link-arrow" href="trips.html" data-reveal>${T('সব ট্রিপ', 'All trips')} <span class="arr">→</span></a>`)}
          <div class="wrap more-trips">${others.map(tripTile).join('')}</div>
        </section>`;
      storyRail();
    },

    /* ---- 64 districts: the map stays put, the divisions scroll past it ---- */
    explore() {
      document.title = `${T('৬৪ জেলা, ৮ বিভাগ', '64 districts, 8 divisions')} — ${SITE_NAME}`;
      const countG = (d) => G.filter((g) => g.d === d).length;
      main.innerHTML = hero({
        img: window.EB_EXPLORE_IMG, mx: 1920, short: true, small: T('পুরো দেশ', 'the whole country'), title: T('৬৪ জেলা, <em>৮ বিভাগ।</em>', '64 districts, <em>8 divisions.</em>'),
        sub: T('ম্যাপে ট্যাপ করুন, বা বিভাগ ধরে নামতে থাকুন।', 'Tap the map, or scroll down division by division.'),
        extra: `<div class="div-pills" style="--k:4">${DIVS.map((d) => `<a class="pill" href="#div-${d.id}">${divShort(d)}<i>${bn(d.d.length)}</i></a>`).join('')}</div>`,
      }) + `
        <section class="sec">
          <div class="wrap ex">
            <aside class="ex-map">${miniMap({ on: DIVS[0].d, links: true, light: true })}</aside>
            <div class="ex-list">
              ${DIVS.map((dv) => `
                <section class="division" id="div-${dv.id}" data-div="${dv.id}">
                  <header><h2 class="display">${divName(dv)}</h2><em>${T(`${bn(dv.d.length)}টি জেলা`, `${dv.d.length} districts`)}</em></header>
                  <div class="d-grid">${dv.d.map((id) => `
                    <a class="tile" href="${U.district(id)}" data-d="${id}" data-cursor="${T('ঘুরে দেখুন', 'Explore')}" data-reveal>
                      <img src="${pic(INFO[id].img, INFO[id].mx, 800)}" alt="" loading="lazy" decoding="async">
                      <span class="tile-tx"><small>${T(`${bn(countG(id))}টি লেখা`, `${countG(id)} guides`)}</small><b>${dn(id)}</b><p>${esc(INFO[id].tag)}</p></span>
                    </a>`).join('')}</div>
                </section>`).join('')}
            </div>
          </div>
        </section>`;
      const paths = $$('.ex-map path');
      let cur = DIVS[0].id;
      const setDiv = (id) => { if (id === cur) return; cur = id; const s = new Set(divById[id].d); paths.forEach((p) => p.classList.toggle('on', s.has(p.dataset.d))); };
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
      if (!info) return missing(T('জেলাটা খুঁজে পাইনি', 'We couldn’t find that district'));
      const dv = divById[info.div];
      const rank = Object.fromEntries((info.order || []).map((x, i) => [x, i]));
      const by = (type) => G.filter((g) => g.d === id && g.type === type).sort((a, b) => (rank[a.id] ?? 99) - (rank[b.id] ?? 99));
      const places = by('place'), foods = by('food'), hidden = by('hidden'), trad = by('tradition');
      const trips = info.trips.map((t) => TRIPS.find((x) => x.id === t)).filter(Boolean);
      const sibs = dv.d, nextId = sibs[(sibs.indexOf(id) + 1) % sibs.length], next = INFO[nextId];
      document.title = `${dn(id)} — ${SITE_NAME}`;
      const railSec = (items, type, o) => items.length ? `
        <section class="sec${o.dark ? ' dark' : ''}${o.cream ? ' cream' : ''}">
          ${head(TYPE[type].name, TYPE[type].accent, o.h, count(items.length))}
          <div class="${type === 'food' ? 'circles' : 'rail'}" data-drag>${items.map((g, i) => (type === 'food' ? circle(g) : tile(g, i, { no: true, where: false }))).join('')}</div>
          ${dragHint()}
        </section>` : '';
      main.innerHTML = hero({
        img: info.img, mx: info.mx, crumbs: [[T('৬৪ জেলা', '64 districts'), 'explore.html'], [divName(dv), `explore.html#div-${dv.id}`], [dn(id)]], small: divName(dv), title: dn(id), sub: info.tag,
        extra: `<div class="ph-row" style="--k:4"><a class="btn btn-gold" href="${U.plan([id], 3)}" data-magnetic><span>${T(`${dn(id)} ঘোরার প্ল্যান করুন`, `Plan a trip to ${dn(id)}`)}</span><span class="arr">→</span></a>${trips[0] ? `<a class="btn btn-ghost" href="${U.trip(trips[0].id)}">${T('রেডিমেড ট্রিপ দেখুন', 'See a ready-made trip')}</a>` : ''}</div>`,
      }) + `
        <section class="sec">
          <div class="wrap lede-grid">
            <div>${lede(info.lede)}
              ${info.known.length ? `<div class="known" data-reveal style="--d:120ms">${info.known.map((k) => `<span>${esc(k)}</span>`).join('')}</div>` : ''}</div>
            ${glance(info.glance.slice(0, 3), 'glance glance-side')}
          </div>
        </section>
        ${railSec(places, 'place', { cream: true, h: [T('যা দেখতে', 'What to'), T('যাবেন', 'see')] })}
        ${railSec(foods, 'food', { h: [T('যা না খেলে', 'What you'), T('চলবে না', 'must eat')] })}
        ${railSec(hidden, 'hidden', { dark: true, h: TYPE.hidden.h })}
        ${railSec(trad, 'tradition', { cream: true, h: TYPE.tradition.h })}
        ${info.stay.length ? `
        <section class="sec dark">
          ${head(T('কোথায় থাকবেন', 'Where to stay'), T('রাত কাটানো', 'stay'), [T('এক রাতের', 'Room rates'), T('রুম ভাড়া', 'per night')], `<a class="link-arrow" href="hotels.html?d=${id}" data-reveal>${T('হোটেলের নাম ও দাম', 'Hotels and prices')} <span class="arr">→</span></a>`)}
          <div class="wrap"><div class="stay">${info.stay.map(([k, v], i) => `<div data-reveal style="--d:${i * 90}ms"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div>
          ${info.peak ? `<p class="stay-note" data-reveal>${esc(info.peak)}</p>` : ''}</div>
        </section>` : ''}
        <a class="next" href="${U.district(nextId)}" data-cursor="${T('চলুন', 'Go')}">
          <img src="${pic(next.img, next.mx, 1920)}" alt="" loading="lazy">
          <small>${T(`${divName(dv)}-এর পরের জেলা`, `next in ${divName(dv)}`)}</small><b>${dn(nextId)}</b><span>${esc(next.tag)}</span>
        </a>`;
    },

    /* ---- one place / food / tradition ---- */
    async guide() {
      const g = gById[q.get('id')];
      if (!g) return missing(T('জায়গাটা খুঁজে পাইনি', 'We couldn’t find that place'));
      const info = INFO[g.d];
      document.title = `${g.t} — ${dn(g.d)} — ${SITE_NAME}`;
      main.innerHTML = hero({
        img: g.img, mx: g.mx, crumbs: [[T('৬৪ জেলা', '64 districts'), 'explore.html'], [dn(g.d), U.district(g.d)], [TYPE[g.type].name, U.list(g.type)]], chip: g.type, small: dn(g.d), title: esc(g.t), sub: g.s,
      }) + '<div id="g-body"></div>';
      let det = {};
      try { det = (await (await fetch(`${EB.base}assets/data/${EB.EN ? 'guide-en' : 'guide'}/${g.d}.json`)).json())[g.id] || {}; } catch (e) { /* show what we have */ }
      const blocks = det.blocks || [];
      const near = (det.near || []).map((id) => gById[id]).filter(Boolean);
      const more = near.length ? near : G.filter((x) => x.d === g.d && x.id !== g.id).slice(0, 4);
      const trips = (det.trips || []).map((t) => TRIPS.find((x) => x.id === t)).filter(Boolean);
      const canPlan = g.type === 'place' || g.type === 'hidden';
      $('#g-body').innerHTML = `
        ${det.glance && det.glance.length ? `<section class="sec" style="padding-bottom:0"><div class="wrap">${glance(det.glance)}</div></section>` : ''}
        <section class="sec">
          <div class="wrap g-grid">
            <div>
              ${lede(det.desc || g.s)}
              <div class="g-cards">${blocks.map(([h, p], i) => `<div class="g-card ${/জেনে|সতর্ক|মনে|good to know|note|warning|tip/i.test(h) ? 'tip' : 'go'}" data-reveal style="--d:${i * 90}ms"><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`).join('')}</div>
              ${det.tags && det.tags.length ? `<div class="tags" data-reveal>${det.tags.map((t) => `<span>#${esc(t)}</span>`).join('')}</div>` : ''}
            </div>
            <aside class="g-side" data-reveal>
              <div class="g-where">${miniMap({ on: [g.d], pulse: g.d })}<p>${T(`${dn(g.d)} জেলা`, `${dn(g.d)} district`)} · ${divName(divById[info.div])}</p></div>
              <div class="g-actions">
                <a class="btn btn-dark" href="${U.plan([canPlan ? g.id : g.d], 3)}"><span>${canPlan ? T('এখানে যাওয়ার প্ল্যান করুন', 'Plan a trip here') : T(`${dn(g.d)} ঘোরার প্ল্যান করুন`, `Plan a trip to ${dn(g.d)}`)}</span><span class="arr">→</span></a>
                ${det.ll && det.ll.length === 2 ? `<a class="btn btn-line" href="https://www.google.com/maps/search/?api=1&query=${det.ll[0]},${det.ll[1]}" target="_blank" rel="noopener">${T('গুগল ম্যাপে খুলুন', 'Open in Google Maps')}</a>` : ''}
                <a class="btn btn-line" href="${U.district(g.d)}">${T(`${dn(g.d)} জেলার গাইড`, `${dn(g.d)} district guide`)}</a>
              </div>
            </aside>
          </div>
        </section>
        ${trips.length ? `<section class="sec dark">${head(T('রেডিমেড ট্রিপ', 'Ready-made trips'), T('এই পথে', 'on this route'), [T('এই জায়গাসহ', 'Trips that'), T('সাজানো ট্রিপ', 'include it')])}<div class="wrap more-trips">${trips.slice(0, 3).map(tripTile).join('')}</div></section>` : ''}
        ${more.length ? `<section class="sec cream">${head(near.length ? T('কাছাকাছি', 'Nearby') : dn(g.d), T('আশেপাশে', 'close by'), [T('এর পাশেই', 'More to see'), T('আরও যা আছে', 'nearby')], `<a class="link-arrow" href="${U.district(g.d)}" data-reveal>${T(`${dn(g.d)} জেলা`, `${dn(g.d)} district`)} <span class="arr">→</span></a>`)}<div class="wrap cards4">${more.map((x, i) => tile(x, i)).join('')}</div></section>` : ''}`;
      after();
    },

    /* ---- galleries: places, foods, hidden, traditions ---- */
    discover() {
      const type = Object.keys(TYPE).find((k) => TYPE[k].list === q.get('type')) || 'place', Ty = TYPE[type];
      const all = G.filter((g) => g.type === type).sort((a, b) => a.t.localeCompare(b.t, T('bn', 'en')));
      const cover = all.find((g) => g.mx >= 1920 && /sajek|ratargul|sundarban|kacchi|biriyani|jamdani|nafakhum/.test(g.id)) || all.find((g) => g.mx >= 1920) || all[0];
      document.title = `${Ty.name} — ${SITE_NAME}`;
      const divCount = (id) => all.filter((g) => INFO[g.d].div === id).length;
      main.innerHTML = hero({
        img: cover.img, mx: cover.mx, short: true, small: Ty.accent, title: `${Ty.h[0]} <em>${Ty.h[1]}</em>`,
        extra: `<div class="dc-types" style="--k:4">${Object.keys(TYPE).map((k) => `<a href="${U.list(k)}"${k === type ? ' aria-current="page"' : ''}>${TYPE[k].name}</a>`).join('')}</div>`,
      }) + `
        <div class="dc-bar"><div class="wrap">
          <label class="dd"><span class="sr">${T('বিভাগ', 'Division')}</span>
            <select id="dc-div">
              <option value="">${T(`সব বিভাগ · ${bn(all.length)}`, `All divisions · ${all.length}`)}</option>
              ${DIVS.map((d) => `<option value="${d.id}">${divName(d)} · ${bn(divCount(d.id))}</option>`).join('')}
            </select>
          </label>
          <input class="dc-search" id="dc-q" type="search" placeholder="${T('নাম বা জেলা লিখুন', 'Search by name or district')}" aria-label="${T('খুঁজুন', 'Search')}">
        </div></div>
        <section class="sec" style="padding-top:36px"><div class="wrap"><p class="dc-count" id="dc-count"></p><div class="dc-grid" id="dc-grid"></div><div id="dc-more" style="height:1px"></div></div></section>`;
      const grid = $('#dc-grid'), sentinel = $('#dc-more'), countEl = $('#dc-count'), sel = $('#dc-div');
      let list = all, shown = 0, div = '', term = '';
      const tileIo = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); tileIo.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px' });
      const more = () => {
        const next = list.slice(shown, shown + 20); if (!next.length) return;
        grid.insertAdjacentHTML('beforeend', next.map((g, k) => tile(g, shown + k, { cls: (shown + k) % 9 === 0 && g.mx >= 1280 ? 'wide' : '', big: (shown + k) % 9 === 0 })).join(''));
        shown += next.length;
        $$('.tile:not(.in)', grid).forEach((t) => tileIo.observe(t));
        if (EB.lenis) EB.lenis.resize();
      };
      const apply = () => {
        const t = term.trim().toLowerCase();
        list = all.filter((g) => (!div || INFO[g.d].div === div) && (!t || (g.t + ' ' + g.id.replace(/-/g, ' ') + ' ' + dn(g.d) + ' ' + g.d).toLowerCase().includes(t)));
        grid.innerHTML = list.length ? '' : `<p class="dc-empty">${T('এই নামে কিছু পাইনি।', 'Nothing found by that name.')}</p>`; shown = 0;
        countEl.textContent = T(`${bn(list.length)}টি`, `${list.length} ${list.length === 1 ? 'entry' : 'entries'}`);
        sel.closest('.dd').classList.toggle('on', !!div);
        more();
      };
      new IntersectionObserver((es) => { if (es[0].isIntersecting) more(); }, { rootMargin: '900px' }).observe(sentinel);
      sel.addEventListener('change', () => {
        div = sel.value; apply();
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
      document.title = `${T('কোথায় থাকবেন', 'Where to stay')} — ${SITE_NAME}`;
      const TIERS = [['budget', T('সাধারণ হোটেল', 'Budget')], ['mid', T('ভালো হোটেল', 'Mid-range')], ['upscale', T('অভিজাত রিসোর্ট', 'Upscale')]];
      const price = (id, k) => { const row = (INFO[id].stay || [])[TIERS.findIndex((t) => t[0] === k)]; return row ? row[1] : ''; };
      const low = (id, k) => { const p = price(id, k); return p ? toNum(p) : Infinity; };
      let tier = 'budget', sort = 'price', term = '';
      main.innerHTML = hero({
        img: S.hero, mx: 1920, short: true, small: T('৬৪ জেলার রুম ভাড়া', 'room rates in 64 districts'), title: T('কোথায় <em>থাকবেন</em>', 'Where to <em>stay</em>'), sub: T('বাজেট বেছে নিন, ম্যাপ নিজেই বদলে যাবে।', 'Pick a budget and the map re-colours itself.'),
      }) + `
        <div class="dc-bar"><div class="wrap">
          <div class="seg" id="st-tier" role="radiogroup" aria-label="${T('হোটেলের মান', 'Hotel class')}">${TIERS.map((t) => `<button type="button" role="radio" data-k="${t[0]}" aria-checked="${t[0] === tier}">${t[1]}</button>`).join('')}</div>
          <div class="dc-pills" style="justify-content:flex-end"><button class="pill" type="button" data-sort="price" aria-pressed="true">${T('কম ভাড়া আগে', 'Cheapest first')}</button><button class="pill" type="button" data-sort="div" aria-pressed="false">${T('বিভাগ ধরে', 'By division')}</button></div>
          <input class="dc-search" id="st-q" type="search" placeholder="${T('জেলার নাম লিখুন', 'Search a district')}" aria-label="${T('জেলা খুঁজুন', 'Search a district')}">
        </div></div>
        <section class="sec" style="padding-top:44px">
          <div class="wrap ex">
            <aside class="ex-map st-map">
              <div class="st-read"><small id="st-r-s"></small><b id="st-r-n"></b><span id="st-r-p"></span></div>
              ${miniMap({ light: true })}
              <div class="st-legend"><span id="st-min"></span><i></i><span id="st-max"></span></div>
            </aside>
            <div><p class="dc-count" id="st-count"></p><div class="d-grid st-grid" id="st-grid"></div></div>
          </div>
        </section>
        <section class="sec dark">
          ${head(T('নাম ধরে হোটেল', 'Hotels by name'), T('রুম ধরে ভাড়া', 'room by room'), [T('রুম ধরে', 'Room-by-room'), T('ভাড়া দেখুন', 'prices')], count(Object.keys(S.h).length))}
          <div class="rail" data-drag id="st-rail"></div>
          ${dragHint()}
        </section>
        <div class="sheet-back" id="sheet-back"></div>
        <aside class="sheet" id="sheet" aria-hidden="true" data-lenis-prevent></aside>`;
      const grid = $('#st-grid'), paths = $$('.st-map path'), pathBy = Object.fromEntries(paths.map((p) => [p.dataset.d, p]));
      const mix = (t) => { const a = [236, 227, 208], b = [13, 90, 63]; return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`; };
      const CHEAP = T('সবচেয়ে কম ভাড়া', 'Lowest rates');
      const read = (id) => { $('#st-r-n').textContent = dn(id); $('#st-r-p').textContent = price(id, tier) || T('তথ্য নেই', 'No data'); };
      let cheapest = 'dhaka';
      function paint() {
        const ids = D.map((d) => d.id).filter((id) => isFinite(low(id, tier)));
        const lows = ids.map((id) => low(id, tier)), mn = Math.min(...lows), mx = Math.max(...lows);
        paths.forEach((p) => { const v = low(p.dataset.d, tier); p.style.fill = isFinite(v) ? mix(mx > mn ? Math.pow((v - mn) / (mx - mn), 0.6) : 0.5) : 'rgba(16,32,26,.04)'; });
        $('#st-min').textContent = taka(mn); $('#st-max').textContent = taka(mx) + '+';
        const t = term.trim().toLowerCase();
        const list = D.map((d) => d.id).filter((id) => !t || (dn(id) + ' ' + id + ' ' + INFO[id].en).toLowerCase().includes(t));
        if (sort === 'price') list.sort((a, b) => low(a, tier) - low(b, tier));
        else { const o = DIVS.flatMap((dv) => dv.d); list.sort((a, b) => o.indexOf(a) - o.indexOf(b)); }
        cheapest = ids.slice().sort((a, b) => low(a, tier) - low(b, tier))[0];
        $('#st-r-s').textContent = CHEAP; read(cheapest);
        $('#st-count').textContent = T(`${bn(list.length)}টি জেলা · রুমপ্রতি এক রাতের ভাড়া`, `${list.length} districts · per room, per night`);
        grid.innerHTML = list.length ? list.map((id, i) => `
          <button class="tile st-tile" type="button" data-d="${id}" style="--i:${i % 9}">
            <img src="${pic(INFO[id].img, INFO[id].mx, 800)}" alt="" loading="lazy" decoding="async">
            <span class="tile-tx"><small>${dn(id)}${S.d[id].named.length ? T(` · ${bn(S.d[id].named.length)}টি হোটেল`, ` · ${S.d[id].named.length} hotel${S.d[id].named.length > 1 ? 's' : ''}`) : ''}</small><b>${price(id, tier) || '—'}</b></span>
          </button>`).join('') : `<p class="dc-empty">${T('এই নামে কোনো জেলা পাইনি।', 'No district by that name.')}</p>`;
        requestAnimationFrame(() => $$('.st-tile', grid).forEach((el) => el.classList.add('in')));
        $('#st-rail').innerHTML = Object.entries(S.h).filter(([, h]) => h.tier === tier).map(([id, h]) => hotelCard(id, h)).join('') || `<p class="dc-empty" style="color:rgba(246,241,231,.6)">${T('এই মানের হোটেলের নাম এখনও যোগ হয়নি।', 'No named hotels in this class yet.')}</p>`;
        fitRails();
        if (EB.lenis) EB.lenis.resize();
      }
      /* drawer with one district's prices and named hotels */
      const sheet = $('#sheet'), back = $('#sheet-back');
      const close = () => { sheet.classList.remove('on'); back.classList.remove('on'); sheet.setAttribute('aria-hidden', 'true'); if (EB.lenis) EB.lenis.start(); };
      function open(id) {
        const info = INFO[id], st = S.d[id];
        sheet.innerHTML = `
          <button class="sheet-x" type="button" aria-label="${T('বন্ধ করুন', 'Close')}">×</button>
          <div class="sheet-ph"><img src="${pic(info.img, info.mx, 800)}" alt=""><div><small>${divName(divById[info.div])}</small><b>${dn(id)}</b></div></div>
          <div class="sheet-in">
            <p class="sheet-tag">${esc(st.year)} · ${T('রুমপ্রতি এক রাত', 'per room, per night')}</p>
            <dl class="sheet-tiers">${TIERS.map((t) => (price(id, t[0]) ? `<div class="${t[0] === tier ? 'on' : ''}"><dt>${t[1]}</dt><dd>${price(id, t[0])}</dd></div>` : '')).join('')}</dl>
            ${info.peak ? `<p class="sheet-note">${esc(info.peak)}</p>` : ''}
            ${st.named.length ? `<h3>${T('হোটেলের নাম ও দাম', 'Hotels and prices')}</h3><ul class="sheet-list">${st.named.map((h) => `<li>${h.id ? `<a href="hotel.html?id=${h.id}">` : '<div>'}<span><b>${esc(h.t)}</b><small>${esc(h.area)}</small></span><em>${esc(h.price)}</em>${h.id ? '</a>' : '</div>'}</li>`).join('')}</ul>` : ''}
            <div class="sheet-btns"><a class="btn btn-dark" href="${U.plan([id], 3)}"><span>${T(`${dn(id)} ঘোরার প্ল্যান করুন`, `Plan a trip to ${dn(id)}`)}</span><span class="arr">→</span></a><a class="btn btn-line" href="${U.district(id)}">${T('জেলার গাইড', 'District guide')}</a></div>
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
        p.addEventListener('pointerenter', () => { $('#st-r-s').textContent = divName(divById[INFO[p.dataset.d].div]); read(p.dataset.d); });
        p.addEventListener('pointerleave', () => { $('#st-r-s').textContent = CHEAP; read(cheapest); });
      });
      if (EB.fine) {
        grid.addEventListener('pointerover', (e) => { const t = e.target.closest('.st-tile'); if (t) { pathBy[t.dataset.d].classList.add('hot'); $('#st-r-s').textContent = divName(divById[INFO[t.dataset.d].div]); read(t.dataset.d); } });
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
      if (!h) return missing(T('হোটেলটা খুঁজে পাইনি', 'We couldn’t find that hotel'));
      const info = INFO[h.d];
      document.title = `${h.t} — ${dn(h.d)} — ${SITE_NAME}`;
      const others = Object.entries(S.h).filter(([k, x]) => x.d === h.d && k !== id);
      const near = h.near.map(([gid, dist]) => [gById[gid], dist]).filter((x) => x[0]);
      const distTxt = (s) => (EB.EN ? latinDigits(s).replace(/প্রায়\s*/, 'about ').replace('কিমি', 'km') : s);
      main.innerHTML = hero({
        img: info.img, mx: info.mx, crumbs: [[T('হোটেল', 'Hotels'), 'hotels.html'], [dn(h.d), `hotels.html?d=${h.d}`]], small: dn(h.d), title: esc(h.t), sub: h.sum,
        extra: `<div class="ph-row" style="--k:4">${h.chips.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div>
          <ul class="facts" style="--k:5"><li><b>${esc(fromPrice(h.from))}</b><span>${T('থেকে শুরু', 'and up')} · ${esc(h.year)}</span></li><li><b>${bn(h.rooms.length)}</b><span>${T('ধরনের রুম', h.rooms.length > 1 ? 'room types' : 'room type')}</span></li><li><b>${dn(h.d)}</b><span>${esc(h.where.split(',')[0])}</span></li></ul>`,
      }) + `
        <section class="sec">
          <div class="wrap g-grid">
            <div>
              ${h.note ? `<p class="h-note" data-reveal>${esc(h.note)}</p>` : ''}
              <div class="rooms">${h.rooms.map((r, i) => `
                <div class="room" data-reveal style="--d:${Math.min(i, 5) * 70}ms">
                  <div><h3>${esc(r[0])}</h3><p>${[r[1], r[2], r[3]].filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('')}</p>${r[5] ? `<small>${r[1] ? T('সঙ্গে ', 'Includes: ') : ''}${esc(r[5])}</small>` : ''}</div>
                  <b>${esc(r[4])}<i>${T('এক রাত', 'per night')}</i></b>
                </div>`).join('')}</div>
              ${h.amen.length ? `<h3 class="h-sub" data-reveal>${T('যা যা সুবিধা আছে', 'Facilities')}</h3><div class="tags amen" data-reveal>${h.amen.map((a) => `<span>${esc(a)}</span>`).join('')}</div>` : ''}
              ${h.times.length ? `<dl class="glance" style="margin-top:34px" data-reveal>${h.times.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(EB.EN ? latinDigits(v) : v)}</dd></div>`).join('')}</dl>` : ''}
            </div>
            <aside class="g-side" data-reveal>
              <div class="g-where">${miniMap({ on: [h.d], pulse: h.d })}<p>${esc(h.where)}</p></div>
              <div class="g-actions">
                ${h.phone ? `<a class="btn btn-dark" href="tel:${h.phone}"><span>${T('কল করুন', 'Call')} · ${h.phone}</span></a>` : ''}
                ${h.book ? `<a class="btn btn-line" href="${h.book}" target="_blank" rel="noopener nofollow">${T('অফিসিয়াল সাইটে বুক করুন', 'Book on the official site')} ↗</a>` : (h.web ? `<a class="btn btn-line" href="${h.web}" target="_blank" rel="noopener nofollow">${T('ওয়েবসাইট', 'Website')} ↗</a>` : '')}
                ${h.ll.length === 2 ? `<a class="btn btn-line" href="https://www.google.com/maps/search/?api=1&query=${h.ll[0]},${h.ll[1]}" target="_blank" rel="noopener">${T('গুগল ম্যাপে খুলুন', 'Open in Google Maps')}</a>` : ''}
              </div>
            </aside>
          </div>
        </section>
        ${near.length ? `<section class="sec cream">${head(T('কাছেই', 'Nearby'), T('আশেপাশে', 'close by'), [T('হোটেল থেকে', 'A short trip'), T('হাঁটা দূরত্বে', 'from the hotel')], `<a class="link-arrow" href="${U.district(h.d)}" data-reveal>${T(`${dn(h.d)} জেলা`, `${dn(h.d)} district`)} <span class="arr">→</span></a>`)}<div class="wrap cards4">${near.map(([g, dist], i) => tile(g, i).replace(`<small>${dn(g.d)}</small>`, `<small>${esc(distTxt(dist))}</small>`)).join('')}</div></section>` : ''}
        ${others.length ? `<section class="sec dark">${head(dn(h.d), T('আরও থাকার জায়গা', 'more stays'), [T('এই জেলায়', 'More hotels'), T('আরও হোটেল', 'in this district')])}<div class="rail" data-drag>${others.map(([k, x]) => hotelCard(k, x)).join('')}</div>${dragHint()}</section>` : ''}`;
    },

    /* ---- my travel map: tap what you have seen, watch the sun fill up ---- */
    mymap() {
      document.title = `${T('আমার ভ্রমণ ম্যাপ', 'My travel map')} — ${SITE_NAME}`;
      const KEY = 'eb-visited-v1', COLORS = ['#e2323f', '#c8a25a', '#2fa37a', '#3d86b8', '#d0764f'];
      let seen = new Set(), color = COLORS[0];
      try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); seen = new Set((s.ids || []).filter((x) => dById[x])); color = COLORS.includes(s.color) ? s.color : color; } catch (e) { /* ignore */ }
      const shared = q.get('v');
      if (shared && /^[0-9a-f]{16}$/.test(shared)) { const bits = BigInt('0x' + shared); seen = new Set(D.filter((d, i) => (bits >> BigInt(i)) & 1n).map((d) => d.id)); }
      if (dById[q.get('visited')]) seen.add(q.get('visited'));
      const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ ids: [...seen], color })); } catch (e) { /* ignore */ } };
      const level = (n) => (n === 0 ? T('যাত্রা শুরু হোক', 'Let the journey begin') : n < 8 ? T('নতুন পথিক', 'New traveller') : n < 20 ? T('ঘুরে বেড়ানো মানুষ', 'Wanderer') : n < 40 ? T('পাকা ভ্রমণপিপাসু', 'Seasoned explorer') : n < 64 ? T('দেশ-চেনা মুসাফির', 'Knows the country') : T('পুরো বাংলাদেশ দেখা!', 'Seen all of Bangladesh!'));
      const C = 2 * Math.PI * 88;
      main.innerHTML = hero({
        img: '43ff844d', mx: 1920, short: true, small: T('আমার ভ্রমণ ম্যাপ', 'my travel map'), title: T('বাংলাদেশের কতটা <em>দেখেছেন?</em>', 'How much of Bangladesh <em>have you seen?</em>'), sub: T('ঘুরে আসা জেলায় ট্যাপ করুন। সূর্যটা ভরে উঠবে।', 'Tap the districts you’ve been to and watch the sun fill up.'),
      }) + `
        <section class="sec dark mm">
          <div class="wrap mm-grid">
            <div class="mm-map" id="mm-map">${miniMap({})}<div class="tipp" id="mm-tip"></div></div>
            <div class="mm-side">
              <div class="mm-sun">
                <svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="88" class="trk"/><circle cx="100" cy="100" r="88" class="prg" id="mm-prg" stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 100 100)"/><circle cx="100" cy="100" r="66" class="core" id="mm-core"/></svg>
                <div><b id="mm-n">${bn(0)}</b><span>${T('/ ৬৪ জেলা', '/ 64 districts')}</span></div>
              </div>
              <p class="mm-level" id="mm-level" aria-live="polite"></p>
              <ul class="mm-divs" id="mm-divs">${DIVS.map((dv) => `<li data-div="${dv.id}"><span>${divShort(dv)}</span><i><u></u></i><em></em></li>`).join('')}</ul>
              <div class="mm-colors" role="radiogroup" aria-label="${T('রং', 'Colour')}">${COLORS.map((c, i) => `<button type="button" role="radio" style="--c:${c}" data-c="${c}" aria-label="${T(`রং ${bn(i + 1)}`, `Colour ${i + 1}`)}"></button>`).join('')}</div>
              <div class="mm-btns">
                <button class="btn btn-gold" type="button" id="mm-dl"><span>${T('ছবি ডাউনলোড', 'Download image')}</span></button>
                <button class="btn btn-ghost" type="button" id="mm-share">${T('লিংক কপি', 'Copy link')}</button>
                <button class="btn btn-ghost" type="button" id="mm-reset">${T('মুছে ফেলুন', 'Clear')}</button>
              </div>
            </div>
          </div>
        </section>
        <section class="sec cream">
          ${head(T('নাম ধরে বাছুন', 'Pick by name'), T('টিক দিন', 'tap to mark'), [T('তালিকা থেকে', 'Tick them off'), T('টিক দিন', 'the list')])}
          <div class="wrap mm-lists">${DIVS.map((dv) => `<div><h3>${divName(dv)}</h3><div class="mm-chips">${dv.d.map((id) => `<button type="button" data-d="${id}" aria-pressed="false">${dn(id)}</button>`).join('')}</div></div>`).join('')}</div>
        </section>
        <section class="sec" id="mm-next-sec">
          ${head(T('এরপর কোথায়', 'Where next'), T('এখনও দেখা হয়নি', 'not yet seen'), [T('এখনও', 'Still'), T('বাকি আছে', 'waiting for you')], `<a class="link-arrow" href="explore.html" data-reveal>${T('সব জেলা', 'All districts')} <span class="arr">→</span></a>`)}
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
        $('#mm-next').innerHTML = rest.map((id2) => `<a class="tile" href="${U.district(id2)}" data-cursor="${T('ঘুরে দেখুন', 'Explore')}"><img src="${pic(INFO[id2].img, INFO[id2].mx, 800)}" alt="" loading="lazy"><span class="tile-tx"><small>${divName(divById[INFO[id2].div])}</small><b>${dn(id2)}</b><p>${esc(INFO[id2].tag)}</p></span></a>`).join('');
      }
      const toggle = (id2) => { seen.has(id2) ? seen.delete(id2) : seen.add(id2); save(); paint(id2); if (seen.size === 64) say(T('অভিনন্দন! পুরো বাংলাদেশ ঘোরা শেষ।', 'Congratulations! You’ve seen all of Bangladesh.')); };
      paths.forEach((p) => {
        p.setAttribute('tabindex', '0'); p.setAttribute('role', 'button'); p.setAttribute('aria-label', dn(p.dataset.d));
        p.addEventListener('click', () => toggle(p.dataset.d));
        p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(p.dataset.d); } });
      });
      const mm = $('#mm-map');
      if (EB.fine) {
        mm.addEventListener('pointermove', (e) => { const p = e.target.closest('path'); tip.classList.toggle('on', !!p); if (!p) return; tip.textContent = dn(p.dataset.d) + (seen.has(p.dataset.d) ? ' ✓' : ''); const r = mm.getBoundingClientRect(); tip.style.transform = `translate(${e.clientX - r.left + 16}px,${e.clientY - r.top + 16}px)`; });
        mm.addEventListener('pointerleave', () => tip.classList.remove('on'));
      }
      $('.mm-lists').addEventListener('click', (e) => { const b = e.target.closest('button[data-d]'); if (b) toggle(b.dataset.d); });
      $('.mm-colors').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; color = b.dataset.c; save(); paint(); });
      $('#mm-reset').addEventListener('click', () => { if (!seen.size) return; if (confirm(T('সব দাগ মুছে ফেলবেন?', 'Clear all your marks?'))) { seen.clear(); save(); paint(); } });
      $('#mm-share').addEventListener('click', async () => {
        let bits = 0n; D.forEach((d, i) => { if (seen.has(d.id)) bits |= 1n << BigInt(i); });
        const url = location.origin + location.pathname + '?v=' + bits.toString(16).padStart(16, '0');
        try { await navigator.clipboard.writeText(url); say(T('লিংক কপি হয়েছে', 'Link copied')); } catch (e) { say(T('লিংক কপি করা গেল না', 'Couldn’t copy the link')); }
      });
      $('#mm-dl').addEventListener('click', () => {
        const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        const c = cv.getContext('2d'), font = '"Anek Bangla", sans-serif';
        c.fillStyle = '#03190f'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#e7d3a4'; c.font = `500 34px ${font}`; c.textAlign = 'center'; c.fillText(T('আমার ভ্রমণ ম্যাপ', 'My travel map'), W / 2, 96);
        c.fillStyle = '#f6f1e7'; c.font = `600 84px ${font}`; c.fillText(T(`${bn(seen.size)} / ৬৪ জেলা`, `${seen.size} / 64 districts`), W / 2, 196);
        c.font = `400 36px ${font}`; c.fillStyle = 'rgba(246,241,231,.75)'; c.fillText(level(seen.size), W / 2, 250);
        const sc = 1.3; c.save(); c.translate((W - 600 * sc) / 2, 280); c.scale(sc, sc); c.lineWidth = 0.8; c.lineJoin = 'round';
        D.forEach((d) => { const p = new Path2D(d.d); c.fillStyle = seen.has(d.id) ? color : 'rgba(246,241,231,.06)'; c.fill(p); c.strokeStyle = 'rgba(231,211,164,.55)'; c.stroke(p); });
        c.restore();
        c.fillStyle = 'rgba(246,241,231,.6)'; c.font = 'italic 30px "Cormorant Garamond", serif'; c.fillText('explorebangladesh.xyz', W / 2, H - 44);
        cv.toBlob((blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-bangladesh-map.png'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); say(T('ছবি ডাউনলোড হচ্ছে', 'Downloading the image')); }, 'image/png');
      });
      if (shared || q.get('visited')) save();
      paint();
    },

    /* ---- six seasons: scroll turns the year; the sky, the weather and the photo change with it ---- */
    seasons() {
      document.title = `${T('ষড়ঋতু — কোন ঋতুতে কোথায়', 'Six seasons — where to go when')} — ${SITE_NAME}`;
      const SS = EB.SEASONS, N = SS.length, cur = EB.CUR_SEASON;
      const list = Object.fromEntries(SS.map((s) => [s.key, EB.seasonList(s.key)]));
      const PAL = [['#f6d98a', '#fbefc8', '#3a2606', '#d9760f'], ['#234f56', '#5f8f8a', '#f1f7f3', '#bfe3d6'], ['#a9d4ee', '#eef7fb', '#0c2b40', '#2f7fb4'], ['#e3b468', '#f6e6c0', '#3a2408', '#b5651d'], ['#b9c6d0', '#eef1f3', '#1c2b36', '#5d7fa3'], ['#f3b7a0', '#fdebd9', '#4a1414', '#cc2633']]
        .map((r) => r.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]));
      const VARS = ['--s1', '--s2', '--sink', '--sacc'];

      main.innerHTML = `
        <section class="sz" id="sz" aria-label="${T('ছয় ঋতু', 'Six seasons')}">
          <h1 class="sr">${T('ষড়ঋতু — কোন ঋতুতে কোথায় যাবেন', 'Six seasons — where to go in each')}</h1>
          <div class="sz-stage">
            <div class="sz-sky" aria-hidden="true"></div>
            <div class="sz-fx" aria-hidden="true">${Array.from({ length: 30 }, (_, i) => `<i style="--x:${(i * 37 + 7) % 100};--dl:${-((i * 53) % 90) / 10}s;--sp:${0.7 + ((i * 29) % 60) / 100};--sz:${0.6 + ((i * 17) % 80) / 100}"></i>`).join('')}</div>
            <div class="sz-top wrap"><span class="eyebrow">${T('ষড়ঋতুর দেশ', 'Land of six seasons')} <i>${T('বছর ঘোরে', 'the year turns')}</i></span><span class="jr-count"><b id="sz-n">${bn('01')}</b><i>/ ${bn('06')}</i></span></div>
            <div class="wrap sz-grid">
              <div class="sz-texts">${SS.map((s, i) => `
                <article class="sz-text" data-i="${i}">
                  <div class="sz-when" style="--k:0"><b>${L(s.months)}</b><span>${L(s.greg)}</span>${i === cur ? `<em>${T('এখন চলছে', 'Happening now')}</em>` : ''}</div>
                  <h2 class="display" style="--k:1"><span class="ln"><span>${L(s.name)}</span></span></h2>
                  <p style="--k:2">${L(s.mood)}</p>
                  <div class="sz-thumbs" style="--k:3">${list[s.key].slice(1, 4).map((g) => `<a href="${U.guide(g.id)}" title="${esc(g.t)}" data-cursor="${T('দেখুন', 'View')}"><img src="${pic(g.img, g.mx, 400)}" alt="${esc(g.t)}" loading="lazy"></a>`).join('')}<button class="link-arrow" type="button" data-go="${i}">${T(`${bn(list[s.key].length)}টা জায়গা ও খাবার`, `${list[s.key].length} places and foods`)} <span class="arr">↓</span></button></div>
                </article>`).join('')}</div>
              <div class="sz-arch"><div class="sz-arch-in">${SS.map((s, i) => { const g = list[s.key][0]; return g ? `<a href="${U.guide(g.id)}" data-cursor="${T('দেখুন', 'View')}" aria-label="${esc(g.t)}"><img src="${pic(g.img, g.mx, 1280)}" alt="" ${i > 1 ? 'loading="lazy"' : ''}><span>${esc(g.t)} · ${dn(g.d)}</span></a>` : '<a></a>'; }).join('')}</div></div>
            </div>
            <div class="sz-wheel" aria-hidden="true"><div class="sz-ring"></div><div class="sz-sun"></div>${SS.map((s, i) => `<span style="--a:${i * 60}deg">${L(s.name)}</span>`).join('')}</div>
            <nav class="sz-marks" aria-label="${T('ঋতু', 'Seasons')}">${SS.map((s, i) => `<button type="button" data-i="${i}">${L(s.name)}</button>`).join('')}</nav>
          </div>
        </section>
        <div class="dc-bar" id="sz-bar"><div class="wrap">
          <div class="seg" id="sz-season" role="radiogroup" aria-label="${T('ঋতু', 'Season')}">${SS.map((s, i) => `<button type="button" role="radio" data-i="${i}" aria-checked="false">${L(s.name)}</button>`).join('')}</div>
          <div class="dc-pills" style="justify-content:flex-end" role="group" aria-label="${T('ধরন', 'Type')}"><button class="pill" type="button" data-t="" aria-pressed="true">${T('সব', 'All')}</button>${Object.keys(TYPE).map((k) => `<button class="pill" type="button" data-t="${k}" aria-pressed="false">${TYPE[k].name}</button>`).join('')}</div>
        </div></div>
        <section class="sec" style="padding-top:40px" id="sz-list"><div class="wrap"><p class="dc-count" id="sz-count"></p><div class="dc-grid" id="sz-gridl"></div><div id="sz-more" style="height:1px"></div></div></section>`;

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
        grid.innerHTML = items.length ? '' : `<p class="dc-empty">${T('এই ঋতুতে এই ধরনের কিছু নেই।', 'Nothing of this kind for this season.')}</p>`; shown = 0;
        $('#sz-count').textContent = T(`${L(SS[season].name)} · ${bn(items.length)}টি`, `${items.length} for ${L(SS[season].name).toLowerCase()}`);
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
  /* rails: when every item fits on screen they line up under the section title and stop acting like a scroller */
  function fitRails() {
    $$('.rail, .circles').forEach((el) => {
      el.classList.remove('fits');
      const fits = el.scrollWidth <= el.clientWidth + 4;
      el.classList.toggle('fits', fits);
      const hint = el.nextElementSibling;
      if (hint && hint.classList.contains('rail-hint')) hint.hidden = fits;
    });
  }
  function dragRails() {
    if (!EB.fine) return;
    $$('[data-drag]').forEach((el) => {
      if (el.dataset.dragOn) return; el.dataset.dragOn = '1';
      let down = false, x0 = 0, s0 = 0, moved = 0;
      el.addEventListener('pointerdown', (e) => { if (e.button || el.classList.contains('fits')) return; down = true; x0 = e.clientX; s0 = el.scrollLeft; moved = 0; });
      addEventListener('pointermove', (e) => { if (!down) return; moved = e.clientX - x0; if (Math.abs(moved) > 6) el.classList.add('dragging'); el.scrollLeft = s0 - moved; });
      addEventListener('pointerup', () => { if (!down) return; down = false; setTimeout(() => el.classList.remove('dragging'), 0); });
      el.addEventListener('click', (e) => { if (Math.abs(moved) > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
      el.addEventListener('dragstart', (e) => e.preventDefault());
    });
  }
  function after() {
    EB.observe(main);
    $$('[data-map]').forEach((m) => new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { m.classList.add('in'); o.disconnect(); } }, { threshold: 0.3 }).observe(m));
    fitRails();
    dragRails();
    if (EB.lenis) EB.lenis.resize();
  }

  (pages[page] || (() => {}))();
  after();
  addEventListener('resize', fitRails);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitRails);

  /* hero parallax */
  const media = $('.ph-media');
  if (media && !EB.reduce) EB.onFrame((y) => { if (y < innerHeight * 1.2) media.style.transform = `translate3d(0,${y * 0.2}px,0)`; });
  addEventListener('load', () => { fitRails(); if (EB.lenis) EB.lenis.resize(); });
})();
