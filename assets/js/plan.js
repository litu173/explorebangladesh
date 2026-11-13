/* Trip plan page. Reads the answers from the URL, builds a day-by-day plan and a cost estimate.
   Routes follow the highway network in roads.js (EB.route), so lines on the map run along real roads
   through every district they pass. Costs use flat average rates — when this design moves into the real
   site, swap buildPlan()'s cost and timing for the existing planner engine. */
(function () {
  const EB = window.EB;
  const { bn, taka, img, clamp } = EB;
  const $ = (s, r) => (r || document).querySelector(s);
  const D = window.EB_DISTRICTS, byId = Object.fromEntries(D.map((d) => [d.id, d]));
  const INFO = window.EB_DINFO || {};
  const G = EB.guides();
  const modeById = Object.fromEntries(EB.MODES.map((m) => [m.id, m]));
  const dn = EB.dname;

  const RATES = {
    food: { budget: 550, mid: 1100, lux: 2400 },      // per person per day
    stay: { budget: 1800, mid: 4500, lux: 12000 },    // per room (2 people) per night
    local: 250,                                       // entry fees + local transport, per person per day
  };

  /* ---------- state from the URL ---------- */
  const q = new URLSearchParams(location.search);
  const state = {
    from: byId[q.get('from')] ? q.get('from') : 'dhaka',
    to: (q.get('to') || '').split(',').filter((id) => byId[id] || G[id]),
    days: clamp(+q.get('days') || 3, 1, 15),
    people: clamp(+q.get('people') || 2, 1, 20),
    mode: modeById[q.get('mode')] ? q.get('mode') : 'bus',
    hours: [6, 8, 10, 12].includes(+q.get('hours')) ? +q.get('hours') : 8,
    food: RATES.food[q.get('food')] ? q.get('food') : 'budget',
    stay: RATES.stay[q.get('stay')] ? q.get('stay') : 'budget',
    rt: q.get('rt') !== '0',
  };
  const syncUrl = () => {
    const p = new URLSearchParams({ from: state.from, to: state.to.join(','), days: state.days, people: state.people, mode: state.mode, hours: state.hours, food: state.food, stay: state.stay, rt: state.rt ? 1 : 0 });
    history.replaceState(null, '', location.pathname + '?' + p.toString());
    try { localStorage.setItem('eb-planner-v1', JSON.stringify({ from: state.from, to: state.to, days: state.days, people: state.people, mode: state.mode })); } catch (e) { /* ignore */ }
  };

  /* what there is to see and eat in a district, in the order the live site's district guide uses */
  const byDistrict = (d, types) => {
    const rank = Object.fromEntries(((INFO[d] || {}).order || []).map((x, i) => [x, i]));
    return Object.values(G).filter((g) => g.d === d && types.includes(g.type)).sort((a, b) => (rank[a.id] ?? 99) - (rank[b.id] ?? 99));
  };

  /* ---------- the plan ---------- */
  function buildPlan() {
    /* group picked places by district */
    const stops = [];
    state.to.forEach((id) => {
      const g = G[id], d = g ? g.d : id;
      let s = stops.find((x) => x.d === d);
      if (!s) { s = { d, name: dn(d), picks: [] }; stops.push(s); }
      if (g) s.picks.push(g);
    });
    stops.forEach((s) => {
      let places = byDistrict(s.d, ['place', 'hidden']);
      /* for a specific place, only suggest what is actually near it (Kaptai Lake is not a side trip from Sajek) */
      const C = window.EB_COORDS || {}, here = s.picks.length && C[s.picks[0].id];
      if (here) places = places.filter((g) => C[g.id] && Math.hypot((C[g.id][0] - here[0]) * 111, (C[g.id][1] - here[1]) * 102) < 30);
      const picked = new Set(s.picks.map((g) => g.id));
      s.see = s.picks.concat(places.filter((g) => !picked.has(g.id))).slice(0, 8);
      const food = byDistrict(s.d, ['food'])[0];
      s.eat = food ? food.t : null;
      s.img = (s.picks[0] || s.see[0] || {}).img || (INFO[s.d] || {}).img || null;
      s.title = s.picks.length ? s.picks[0].t : s.name;
      s.at = s.picks.length ? EB.route.place(s.picks[0].id) : s.d; // where this stop really is
    });
    /* nearest-neighbour order from the starting point, by road distance */
    const ordered = []; let here = state.from; const pool = stops.slice();
    while (pool.length) { pool.sort((a, b) => EB.route.leg(here, a.at).km - EB.route.leg(here, b.at).km); const n = pool.shift(); ordered.push(n); here = n.at; }

    const speed = modeById[state.mode].speed;
    const mk = (a, b, da, db) => { const r = EB.route.leg(a, b); return { a: da, b: db, km: r.km, pts: r.pts, ds: r.ds, ferry: r.ferry, h: r.km / speed + (r.km > 60 ? 0.5 : 0.2) + (r.ferry ? 1 : 0) }; };
    /* the long road leg ends in the last district town before the place (the "gateway": Khagrachhari for Sajek,
       Cox's Bazar for Saint Martin); the final stretch there and back is its own short local leg, so long
       journeys split naturally across days and the night is spent where travellers actually stay */
    let prev = state.from;
    ordered.forEach((s) => {
      s.gw = typeof s.at === 'string' ? s.at : EB.route.gateway(prev, s.at);
      const lc = typeof s.at === 'string' ? null : mk(s.gw, s.at, s.gw, s.d);
      s.local = lc && lc.km > 12 ? lc : null;
      if (!s.local) s.gw = typeof s.at === 'string' ? s.at : s.d;
      prev = s.gw;
    });
    const legs = ordered.map((s, i) => mk(i ? ordered[i - 1].gw : state.from, s.local ? s.gw : (typeof s.at === 'string' ? s.at : s.at), i ? ordered[i - 1].gw : state.from, s.local ? s.gw : s.d));
    const back = state.rt && ordered.length ? mk(ordered[ordered.length - 1].gw, state.from, ordered[ordered.length - 1].gw, state.from) : null;
    const totalKm = legs.reduce((t, l) => t + l.km, 0) + ordered.reduce((t, s) => t + (s.local ? s.local.km * 2 : 0), 0) + (back ? back.km : 0);

    const H = state.hours, SIGHT = 2;
    const pack = (counts, rest) => {
      const days = [{ used: 0, ev: [], at: state.from }];
      const day = () => days[days.length - 1];
      const put = (ev) => {
        if (day().ev.length && day().used + ev.h > H + 0.6) days.push({ used: 0, ev: [], at: day().at });
        day().ev.push(ev); day().used += ev.h;
        if (ev.type === 'go') day().at = ev.b;
      };
      ordered.forEach((s, i) => {
        if (legs[i].a !== legs[i].b || legs[i].km > 15) put({ type: 'go', h: legs[i].h, km: legs[i].km, ferry: legs[i].ferry, a: legs[i].a, b: legs[i].b, stop: s });
        if (s.local) put({ type: 'go', h: s.local.h, km: s.local.km, ferry: s.local.ferry, a: s.gw, b: s.d, to: s.title, stop: s });
        day().at = s.d;
        for (let k = 0; k < counts[i]; k++) put({ type: 'see', h: SIGHT, g: s.see[k], stop: s });
        /* an unhurried day with nothing booked takes the whole day */
        for (let k = 0; k < rest[i]; k++) put({ type: 'free', h: H + 1, stop: s });
        if (s.local) put({ type: 'go', h: s.local.h, km: s.local.km, ferry: s.local.ferry, a: s.d, b: s.gw, from: s.title, stop: s });
      });
      if (back && back.a !== back.b) put({ type: 'go', h: back.h, km: back.km, ferry: back.ferry, a: back.a, b: back.b, home: true });
      return days;
    };
    /* start with one sight per stop, then keep adding while the trip still fits the days */
    const counts = ordered.map((s) => Math.min(1, s.see.length)), rest = ordered.map(() => 0);
    let days = pack(counts, rest);
    for (let guard = 0; guard < 80; guard++) {
      let pick = -1, best = Infinity;
      ordered.forEach((s, i) => { if (counts[i] < s.see.length) { const r = counts[i] / s.see.length; if (r < best) { best = r; pick = i; } } });
      if (pick < 0) break;
      counts[pick]++;
      const next = pack(counts, rest);
      if (next.length > state.days) { counts[pick]--; break; }
      days = next;
    }
    /* days still to spare become free days, shared out to the places with the most to see */
    for (let guard = 0; guard < 15 && days.length < state.days && ordered.length; guard++) {
      let pick = 0, best = -Infinity;
      ordered.forEach((s, i) => { const r = s.see.length - rest[i] * 3; if (r > best) { best = r; pick = i; } });
      rest[pick]++;
      const next = pack(counts, rest);
      if (next.length > state.days) { rest[pick]--; break; }
      days = next;
    }
    const tight = days.length > state.days;

    /* cost */
    const n = days.length, nights = Math.max(0, n - 1), ppl = state.people;
    let transport, transportNote;
    if (state.mode === 'bus') { transport = totalKm * 2.4 * ppl; transportNote = T(`বাস ভাড়া · ${bn(ppl)} জন`, `Bus fares · ${ppl} ${ppl > 1 ? 'people' : 'person'}`); }
    else if (state.mode === 'car') { const c = Math.ceil(ppl / 4); transport = c * (4500 * n + totalKm * 14); transportNote = T(`ড্রাইভারসহ গাড়ি ${bn(c)}টি + জ্বালানি`, `${c} car${c > 1 ? 's' : ''} with driver + fuel`); }
    else { const b = Math.ceil(ppl / 2); transport = b * totalKm * 3.2; transportNote = T(`${bn(b)}টি বাইকের জ্বালানি`, `Fuel for ${b} motorbike${b > 1 ? 's' : ''}`); }
    const stay = nights * Math.ceil(ppl / 2) * RATES.stay[state.stay];
    const food = n * ppl * RATES.food[state.food];
    const local = n * ppl * RATES.local;
    const total = transport + stay + food + local;
    return { ordered, legs, back, days, totalKm, tight, cost: { transport, transportNote, stay, food, local, total, per: total / ppl, nights, rooms: Math.ceil(ppl / 2) } };
  }

  /* ---------- render ---------- */
  const clock = (h) => {
    const m = Math.round(h * 60 / 15) * 15, hh = Math.floor(m / 60) % 24, mm = m % 60, h12 = ((hh + 11) % 12) + 1;
    if (EB.EN) return `${h12}:${EB.two(mm)} ${hh < 12 ? 'am' : 'pm'}`;
    const part = hh < 6 ? 'ভোর' : hh < 12 ? 'সকাল' : hh < 15 ? 'দুপুর' : hh < 18 ? 'বিকেল' : hh < 20 ? 'সন্ধ্যা' : 'রাত';
    return `${part} ${bn(h12)}:${bn(EB.two(mm))}`;
  };
  const dur = (h) => {
    const m = Math.max(15, Math.round(h * 60 / 15) * 15), hh = Math.floor(m / 60), mm = m % 60;
    return EB.EN ? [hh ? `${hh} h` : '', mm ? `${mm} min` : ''].filter(Boolean).join(' ') : [hh ? `${bn(hh)} ঘণ্টা` : '', mm ? `${bn(mm)} মিনিট` : ''].filter(Boolean).join(' ');
  };
  const kmTxt = (k) => T(`${bn(Math.round(k / 5) * 5)} কিমি`, `${Math.round(k / 5) * 5} km`);
  const STAY = { budget: ['সাধারণ হোটেল', 'Budget hotel'], mid: ['ভালো হোটেল', 'Good hotel'], lux: ['অভিজাত রিসোর্ট', 'Luxury resort'] };
  const ICON = {
    go: '<svg viewBox="0 0 24 24"><path d="M4 16V7a3 3 0 013-3h10a3 3 0 013 3v9M4 16h16M4 16v3m16-3v3M7 12h10M8 20v-1m8 1v-1" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    see: '<svg viewBox="0 0 24 24"><path d="M12 21s7-6.200 7-11.500A7 7 0 005 9.500C5 14.800 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="9.500" r="2.400" fill="currentColor"/></svg>',
    eat: '<svg viewBox="0 0 24 24"><path d="M7 3v7a2 2 0 002 2v9M5 3v5m4-5v5m7 13V3c-2 1-3 4-3 7s1 3 3 3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    stay: '<svg viewBox="0 0 24 24"><path d="M3 18v-7a2 2 0 012-2h9a4 4 0 014 4v5M3 15h18M3 18v2m18-2v2M7 9V7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    free: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.600 5.600L7 7m10 10l1.400 1.400M5.600 18.400L7 17M17 7l1.400-1.400" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  };

  let plan;
  function render(first) {
    plan = buildPlan();
    const { ordered, days, totalKm, cost } = plan;
    const fromName = dn(state.from), mode = modeById[state.mode];

    /* summary */
    const names = [fromName].concat(ordered.map((s) => s.title)).concat(state.rt ? [fromName] : []);
    $('#pn-route').innerHTML = names.map((n, i) => `<span class="rt-stop${i === 0 || (state.rt && i === names.length - 1) ? ' is-home' : ''}">${n}</span>`).join('<i class="rt-arrow" aria-hidden="true"></i>');
    const n = days.length;
    $('#pn-facts').innerHTML = [
      [T(`${bn(n)} দিন`, `${n} day${n > 1 ? 's' : ''}`), cost.nights ? T(`${bn(cost.nights)} রাত`, `${cost.nights} night${cost.nights > 1 ? 's' : ''}`) : T('দিনে গিয়ে দিনে ফেরা', 'There and back in a day')],
      [T(`${bn(state.people)} জন`, `${state.people} ${state.people > 1 ? 'people' : 'person'}`), L(mode.by)],
      ['~' + kmTxt(totalKm), T('রাস্তায় মোট পথ', 'total by road')],
      ['~' + taka(Math.round(cost.per / 100) * 100), T('জনপ্রতি খরচ', 'per person')],
    ].map(([a, b]) => `<li><b>${a}</b><span>${b}</span></li>`).join('');
    const heroImg = (ordered.find((s) => s.img) || {}).img || '536984ee';
    $('#pn-hero-bg').style.backgroundImage = `url(${img(heroImg, 1920)})`;
    document.title = `${names.join(' → ')} — ${T('ট্রিপ প্ল্যান', 'Trip plan')}`;

    /* note when the days are not enough */
    const note = $('#pn-note');
    note.hidden = !plan.tight;
    if (plan.tight) note.innerHTML = T(`<b>সময় একটু কম।</b> এই রুটে ${bn(state.days)} দিনে সব হবে না, তাই ${bn(n)} দিনে সাজিয়েছি। দিন বাড়াতে না চাইলে একটা জায়গা কমান বা দিনে ঘোরার ঘণ্টা বাড়ান।`,
      `<b>A little short on time.</b> This route doesn’t fit in ${state.days} day${state.days > 1 ? 's' : ''}, so we planned it over ${n}. If you can’t add days, drop a place or add more hours a day.`);

    /* days */
    const seenStops = new Set();
    $('#pn-days').innerHTML = days.map((d, i) => {
      let t = 8;
      const stopsToday = [...new Set(d.ev.map((e) => (e.stop ? e.stop.title : dn(e.b))))];
      const first0 = d.ev[0];
      const title = first0.type === 'free' ? T(`${first0.stop.name} — নিজের মতো একটা দিন`, `${first0.stop.name} — a day at your own pace`)
        : first0.type === 'go' && first0.from ? T(`${first0.from} থেকে ${dn(first0.b)}`, `${first0.from} to ${dn(first0.b)}`)
        : first0.type === 'go' ? T(`${dn(first0.a)} থেকে ${first0.home ? dn(first0.b) : first0.stop.title}`, `${dn(first0.a)} to ${first0.home ? dn(first0.b) : first0.stop.title}`)
        : stopsToday.join(T(' ও ', ' and '));
      const newStop = d.ev.map((e) => e.stop).find((s) => s && s.img && !seenStops.has(s.d));
      d.ev.forEach((e) => e.stop && seenStops.add(e.stop.d));
      const rows = [];
      let ate = false;
      d.ev.forEach((e) => {
        if (!ate && t >= 12.5 && (e.stop || {}).eat) { rows.push(row('eat', clock(t), T('দুপুরের খাবার', 'Lunch'), T(`এখানকার ${e.stop.eat} চেখে দেখুন`, `Try the local ${e.stop.eat}`))); t += 1; ate = true; }
        if (e.type === 'go' && e.from) rows.push(row('go', clock(t), `${e.from} → ${dn(e.b)}`, `${e.ferry ? T('জাহাজ বা নৌকায় ফেরা', 'back by ship or boat') : T('লোকাল গাড়িতে ফেরা', 'back by local transport')} · ${T('প্রায়', 'about')} ${kmTxt(e.km)} · ${dur(e.h)}`));
        else if (e.type === 'go' && e.to) rows.push(row('go', clock(t), `${dn(e.a)} → ${e.to}`, `${e.ferry ? T('জাহাজ বা নৌকায়', 'by ship or boat') : T('লোকাল গাড়িতে', 'by local transport')} · ${T('প্রায়', 'about')} ${kmTxt(e.km)} · ${dur(e.h)}`));
        else if (e.type === 'go') rows.push(row('go', clock(t), `${dn(e.a)} → ${dn(e.b)}${e.home ? T(' (ফেরা)', ' (return)') : ''}`, `${L(mode.by)} · ${T('প্রায়', 'about')} ${kmTxt(e.km)} · ${dur(e.h)}${e.ferry ? T(' · ফেরি পার', ' · includes a ferry') : ''}`));
        else if (e.type === 'see') rows.push(row('see', clock(t), e.g.t, `${e.stop.name} · ${T('প্রায় ২ ঘণ্টা', 'about 2 h')}`, `guide.html?id=${e.g.id}`));
        else rows.push(row('free', clock(t), T('কোনো তাড়া নেই', 'No rush today'), T(`${e.stop.name}-এ যা ভালো লেগেছে আবার ঘুরে আসুন, বা বিশ্রাম নিন।`, `Go back to what you liked most in ${e.stop.name}, or simply rest.`)));
        t += e.h + 0.25;
      });
      const lastStop = [...d.ev].reverse().find((e) => e.stop);
      if (!ate && t < 22.5 && lastStop && lastStop.stop.eat && first0.type !== 'free') rows.push(row('eat', clock(Math.max(t, 19.5)), T('রাতের খাবার', 'Dinner'), T(`${lastStop.stop.eat} — ${lastStop.stop.name}-এর স্বাদ`, `${lastStop.stop.eat} — a taste of ${lastStop.stop.name}`)));
      if (i < days.length - 1) rows.push(row('stay', T('রাত', 'Night'), T(`${dn(d.at)}-এ রাত কাটান`, `Stay the night in ${dn(d.at)}`), L(STAY[state.stay]), `hotels.html?d=${d.at}`));
      return `
        <article class="day" data-reveal style="--d:${first ? Math.min(i, 3) * 90 : 0}ms">
          <header class="day-head">
            <div class="day-no"><small>${T('দিন', 'Day')}</small><b>${bn(EB.two(i + 1))}</b></div>
            <h2 class="display">${title}</h2>
            ${newStop ? `<a class="day-ph" href="district.html?id=${newStop.d}" data-cursor="${T('গাইড', 'Guide')}"><img src="${img(newStop.img)}" alt="${newStop.name}" loading="lazy"></a>` : ''}
          </header>
          <ol class="day-list">${rows.join('')}</ol>
        </article>`;
    }).join('');
    EB.observe($('#pn-days'));
    if (!first) $('#pn-days').querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('in'));

    renderMap();
    renderCost();
    if (EB.lenis) EB.lenis.resize();
  }
  function row(type, time, title, sub, href) {
    return `<li class="ev ev-${type}"><span class="ev-time">${time}</span><span class="ev-ic">${ICON[type]}</span><div class="ev-tx"><b>${title}</b><span>${sub}${href ? ` · <a href="${href}">${T('দেখুন', 'View')} →</a>` : ''}</span></div></li>`;
  }

  /* the route follows the highway network, so the line runs along roads through every district on the way */
  function renderMap() {
    const { ordered, legs, back } = plan;
    const all = legs.flatMap((l, i) => (ordered[i].local ? [l, ordered[i].local, { pts: ordered[i].local.pts.slice().reverse(), ds: [] }] : [l])).concat(back ? [back] : []);
    const pts = all.flatMap((l, i) => (i ? l.pts.slice(1) : l.pts));
    const path = EB.route.d(pts);
    const on = new Set(ordered.map((s) => s.d));
    const pass = new Set(all.flatMap((l) => l.ds).filter((d) => !on.has(d) && d !== state.from));
    const home = EB.route.hq(state.from);
    const pinAt = (s) => (typeof s.at === 'string' ? EB.route.hq(s.at) : (s.at.ll ? EB.route.xy(s.at.ll[0], s.at.ll[1]) : EB.route.hq(s.d)));
    /* zoom the map onto the route */
    const xs = pts.map((p) => p[0]).concat(home[0]), ys = pts.map((p) => p[1]).concat(home[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = 70, w = Math.max(x1 - x0 + pad * 2, 260), h = Math.max(y1 - y0 + pad * 2, 300), side = Math.max(w, h * 0.86);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, vw = side, vh = side / 0.86;
    const k = vw / 420; // keeps markers a constant visual size
    const label = (x, y, t) => `<text x="${x.toFixed(1)}" y="${(y - 17 * k).toFixed(1)}" font-size="${13 * k}">${t}</text>`;
    $('#pn-map').innerHTML = `<svg viewBox="${(cx - vw / 2).toFixed(0)} ${(cy - vh / 2).toFixed(0)} ${vw.toFixed(0)} ${vh.toFixed(0)}" role="img" aria-label="${T('ম্যাপে আপনার রুট', 'Your route on the map')}">
      ${D.map((d) => `<path class="${on.has(d.id) ? 'on' : pass.has(d.id) ? 'pass' : d.id === state.from ? 'home' : ''}" d="${d.d}"><title>${dn(d.id)}</title></path>`).join('')}
      <path class="route-bg" d="${path}" style="stroke-width:${4.5 * k}"/>
      <path class="route" d="${path}" pathLength="1" style="stroke-width:${2.2 * k}"/>
      <circle class="runner" r="${4.5 * k}"><animateMotion dur="${Math.max(6, pts.length * 0.9)}s" repeatCount="indefinite" path="${path}"/></circle>
      <g class="pin home"><circle cx="${home[0]}" cy="${home[1]}" r="${7 * k}"/>${label(home[0], home[1], dn(state.from))}</g>
      ${ordered.map((s, i) => { const c = pinAt(s); return `<g class="pin"><circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${11 * k}"/><text class="n" x="${c[0].toFixed(1)}" y="${(c[1] + 4.5 * k).toFixed(1)}" font-size="${12.5 * k}">${bn(i + 1)}</text>${label(c[0], c[1], s.title)}</g>`; }).join('')}
    </svg>`;
    const passNames = [...pass].map(dn);
    $('#pn-legend').innerHTML = ordered.map((s, i) => `<li><b>${bn(i + 1)}</b><span>${s.title}${s.title !== s.name ? `<small>${s.name}</small>` : ''}</span><em>${kmTxt(legs[i].km)}</em></li>`).join('')
      + (passNames.length ? `<li class="pass-note"><span>${T('পথে যে জেলাগুলো পার হবেন', 'Districts you pass through')}<small>${passNames.join(T(', ', ', '))}</small></span></li>` : '');
  }

  let prevTotal = 0;
  function renderCost() {
    const c = plan.cost, n = plan.days.length, p = state.people;
    const line = (label, note, v) => `<li><div><b>${label}</b><span>${note}</span></div><em>${taka(v)}</em></li>`;
    $('#pn-cost').innerHTML = `
      <span class="eyebrow">${T('খরচের হিসাব <i>আনুমানিক</i>', 'Cost <i>estimate</i>')}</span>
      <div class="cost-big"><small>${T('জনপ্রতি আনুমানিক', 'Per person, roughly')}</small><b id="cost-per">${taka(c.per)}</b><span>${T(`মোট ${taka(c.total)} · ${bn(p)} জন`, `${taka(c.total)} in total · ${p} ${p > 1 ? 'people' : 'person'}`)}</span></div>
      <ul class="cost-lines">
        ${line(T('যাতায়াত', 'Getting around'), `${c.transportNote} · ${kmTxt(plan.totalKm)}`, c.transport)}
        ${line(T('থাকা', 'Stay'), c.nights ? T(`${bn(c.nights)} রাত · ${bn(c.rooms)}টি রুম`, `${c.nights} night${c.nights > 1 ? 's' : ''} · ${c.rooms} room${c.rooms > 1 ? 's' : ''}`) : T('রাতে থাকা লাগছে না', 'No nights away'), c.stay)}
        ${line(T('খাওয়া', 'Food'), T(`${bn(n)} দিন · ${bn(p)} জন`, `${n} day${n > 1 ? 's' : ''} · ${p} ${p > 1 ? 'people' : 'person'}`), c.food)}
        ${line(T('টিকিট ও লোকাল যাতায়াত', 'Tickets and local transport'), T('প্রবেশ ফি, সিএনজি, নৌকা', 'Entry fees, CNG, boats'), c.local)}
      </ul>
      <p class="cost-fine">${T('এগুলো গড় দরের আনুমানিক হিসাব। মৌসুম আর ছুটির দিনে ভাড়া বাড়ে।', 'These are estimates at average rates. Prices go up in peak season and on holidays.')}</p>`;
    /* count the headline number up/down */
    const el = $('#cost-per'), a = prevTotal || c.per * 0.6, b = c.per, t0 = performance.now(); prevTotal = b;
    if (!EB.reduce) { const step = (t) => { const k2 = clamp((t - t0) / 900, 0, 1), e = 1 - Math.pow(1 - k2, 3); el.textContent = taka(Math.round((a + (b - a) * e) / 10) * 10); if (k2 < 1) requestAnimationFrame(step); else el.textContent = taka(Math.round(b / 10) * 10); }; requestAnimationFrame(step); }
  }

  /* ---------- fine-tune controls ---------- */
  function bindControls() {
    document.querySelectorAll('.rf-step').forEach((st) => {
      const k = st.dataset.k, min = +st.dataset.min, max = +st.dataset.max, out = $('output', st);
      const paint = () => {
        const v = state[k];
        out.textContent = k === 'days' ? T(`${bn(v)} দিন`, `${v} day${v > 1 ? 's' : ''}`) : T(`${bn(v)} জন`, `${v} ${v > 1 ? 'people' : 'person'}`);
        $('[data-dir="-1"]', st).disabled = v <= min; $('[data-dir="1"]', st).disabled = v >= max;
      };
      st.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; state[k] = clamp(state[k] + +b.dataset.dir, min, max); paint(); update(); });
      paint();
    });
    document.querySelectorAll('.rf-seg').forEach((seg) => {
      const k = seg.dataset.k;
      seg.setAttribute('role', 'radiogroup');
      seg.innerHTML = (EB.EN && seg.dataset.optsEn ? seg.dataset.optsEn : seg.dataset.opts).split(',').map((o) => { const [v, l] = o.split(':'); return `<button type="button" role="radio" data-v="${v}">${l}</button>`; }).join('');
      const paint = () => seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === String(state[k]))));
      seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; state[k] = k === 'hours' ? +b.dataset.v : b.dataset.v; paint(); update(); });
      paint();
    });
    const rt = $('#rf-rt'); rt.checked = state.rt; $('#rf-from').textContent = dn(state.from);
    rt.addEventListener('change', () => { state.rt = rt.checked; update(); });
  }
  let flashT;
  function update() {
    syncUrl();
    const days = $('#pn-days');
    days.classList.add('is-updating');
    clearTimeout(flashT);
    flashT = setTimeout(() => { render(false); days.classList.remove('is-updating'); }, 220);
  }

  /* ---------- share / print ---------- */
  const toast = $('#toast');
  const say = (m) => { toast.textContent = m; toast.classList.add('on'); setTimeout(() => toast.classList.remove('on'), 2600); };
  $('#pn-share').addEventListener('click', async () => {
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ title: document.title, url: location.href });
      else { await navigator.clipboard.writeText(location.href); say(T('লিংক কপি হয়েছে — যাকে খুশি পাঠিয়ে দিন', 'Link copied — send it to anyone')); }
    } catch (e) { say(T('লিংকটা ঠিকানার বার থেকে কপি করে নিন', 'Copy the link from the address bar')); }
  });
  $('#pn-print').addEventListener('click', () => print());

  /* ---------- go ---------- */
  const crafting = $('#crafting');
  if (!state.to.length) {
    crafting.remove();
    $('#pn-empty').hidden = false; $('#pn-body').hidden = true; $('#pn-tune').hidden = true;
    $('#pn-route').textContent = T('ট্রিপ প্ল্যান', 'Trip plan'); $('.pn-actions').hidden = true;
    return;
  }
  bindControls();
  render(true);
  syncUrl();
  const reveal = () => { crafting.classList.add('done'); document.documentElement.classList.add('plan-ready'); setTimeout(() => crafting.remove(), 1000); };
  setTimeout(reveal, EB.reduce ? 0 : 2400);
})();
