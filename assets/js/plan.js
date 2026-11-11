/* Trip plan page. Reads the answers from the URL, builds a day-by-day plan and a cost estimate.
   NOTE: this is a stand-in planner for the prototype (straight-line distance × road factor, flat rates).
   When this design is moved into the real site, swap buildPlan() for the existing route/cost engine. */
(function () {
  const EB = window.EB;
  const { bn, taka, img, SITE, clamp } = EB;
  const $ = (s, r) => (r || document).querySelector(s);
  const D = window.EB_DISTRICTS, byId = Object.fromEntries(D.map((d) => [d.id, d]));
  const spotById = Object.fromEntries(EB.SPOTS.map((s) => [s.id, s]));
  const modeById = Object.fromEntries(EB.MODES.map((m) => [m.id, m]));

  const KM_PER_UNIT = 1.08; // map units → road km (0.82 straight-line × ~1.3 road factor)
  const RATES = {
    food: { budget: 550, mid: 1100, lux: 2400 },      // per person per day
    stay: { budget: 1800, mid: 4500, lux: 12000 },    // per room (2 people) per night
    local: 250,                                       // entry fees + local transport, per person per day
  };

  /* ---------- state from the URL ---------- */
  const q = new URLSearchParams(location.search);
  const state = {
    from: byId[q.get('from')] ? q.get('from') : 'dhaka',
    to: (q.get('to') || '').split(',').filter((id) => spotById[id] || byId[id]),
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

  /* ---------- the plan ---------- */
  const km = (a, b) => a === b ? 14 : Math.max(18, Math.hypot(byId[a].c[0] - byId[b].c[0], byId[a].c[1] - byId[b].c[1]) * KM_PER_UNIT);

  function buildPlan() {
    /* group picked places by district */
    const stops = [];
    state.to.forEach((id) => {
      const spot = spotById[id], d = spot ? spot.d : id;
      let s = stops.find((x) => x.d === d);
      if (!s) { s = { d, name: byId[d].bn, picks: [] }; stops.push(s); }
      if (spot) s.picks.push(spot.bn);
    });
    stops.forEach((s) => {
      const g = EB.GUIDE[s.d];
      const see = (g ? g.see : [`${s.name} শহর ঘুরে দেখা`, 'স্থানীয় বাজার ও নদীর ঘাট', 'জেলার পুরোনো স্থাপনা']).slice();
      /* what the traveller named goes first */
      s.picks.forEach((p) => { const key = p.split(' ')[0]; const i = see.findIndex((x) => x.includes(key)); if (i > -1) see.unshift(see.splice(i, 1)[0]); else see.unshift(p); });
      s.see = see; s.eat = g ? g.eat : null; s.img = g ? g.img : null; s.known = !!g;
      s.title = s.picks.length ? s.picks[0] : s.name;
    });
    /* nearest-neighbour order from the starting point */
    const ordered = []; let here = state.from; const pool = stops.slice();
    while (pool.length) { pool.sort((a, b) => km(here, a.d) - km(here, b.d)); const n = pool.shift(); ordered.push(n); here = n.d; }

    const speed = modeById[state.mode].speed;
    const legs = ordered.map((s, i) => { const a = i ? ordered[i - 1].d : state.from; const k = km(a, s.d); return { a, b: s.d, km: k, h: k / speed + (k > 60 ? 0.5 : 0.2) }; });
    const back = state.rt && ordered.length ? (() => { const a = ordered[ordered.length - 1].d, k = km(a, state.from); return { a, b: state.from, km: k, h: k / speed + (k > 60 ? 0.5 : 0.2) }; })() : null;
    const totalKm = legs.reduce((t, l) => t + l.km, 0) + (back ? back.km : 0);

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
        if (legs[i].a !== legs[i].b || legs[i].km > 15) put({ type: 'go', h: legs[i].h, km: legs[i].km, a: legs[i].a, b: legs[i].b, stop: s });
        day().at = s.d;
        for (let k = 0; k < counts[i]; k++) put({ type: 'see', h: SIGHT, text: s.see[k], stop: s });
        /* an unhurried day with nothing booked takes the whole day */
        for (let k = 0; k < rest[i]; k++) put({ type: 'free', h: H + 1, stop: s });
      });
      if (back && back.a !== back.b) put({ type: 'go', h: back.h, km: back.km, a: back.a, b: back.b, home: true });
      return days;
    };
    /* start with one sight per stop, then keep adding while the trip still fits the days */
    const counts = ordered.map(() => 1), rest = ordered.map(() => 0);
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
    if (state.mode === 'bus') { transport = totalKm * 2.4 * ppl; transportNote = `বাস ভাড়া · ${bn(ppl)} জন`; }
    else if (state.mode === 'car') { transport = Math.ceil(ppl / 4) * (4500 * n + totalKm * 14); transportNote = `ড্রাইভারসহ গাড়ি ${bn(Math.ceil(ppl / 4))}টি + জ্বালানি`; }
    else { transport = Math.ceil(ppl / 2) * totalKm * 3.2; transportNote = `${bn(Math.ceil(ppl / 2))}টি বাইকের জ্বালানি`; }
    const stay = nights * Math.ceil(ppl / 2) * RATES.stay[state.stay];
    const food = n * ppl * RATES.food[state.food];
    const local = n * ppl * RATES.local;
    const total = transport + stay + food + local;
    return { ordered, legs, back, days, totalKm, tight, cost: { transport, transportNote, stay, food, local, total, per: total / ppl, nights, rooms: Math.ceil(ppl / 2) } };
  }

  /* ---------- render ---------- */
  const clock = (h) => {
    const m = Math.round(h * 60 / 15) * 15, hh = Math.floor(m / 60) % 24, mm = m % 60;
    const part = hh < 6 ? 'ভোর' : hh < 12 ? 'সকাল' : hh < 15 ? 'দুপুর' : hh < 18 ? 'বিকেল' : hh < 20 ? 'সন্ধ্যা' : 'রাত';
    return `${part} ${bn(((hh + 11) % 12) + 1)}:${bn(String(mm).padStart(2, '0'))}`;
  };
  const dur = (h) => { const m = Math.round(h * 60 / 15) * 15, hh = Math.floor(m / 60), mm = m % 60; return (hh ? bn(hh) + ' ঘণ্টা ' : '') + (mm ? bn(mm) + ' মিনিট' : '') || '১৫ মিনিট'; };
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
    const fromBn = byId[state.from].bn, mode = modeById[state.mode];

    /* summary */
    const names = [fromBn].concat(ordered.map((s) => s.title)).concat(state.rt ? [fromBn] : []);
    $('#pn-route').innerHTML = names.map((n, i) => `<span class="rt-stop${i === 0 || (state.rt && i === names.length - 1) ? ' is-home' : ''}">${n}</span>`).join('<i class="rt-arrow" aria-hidden="true"></i>');
    $('#pn-facts').innerHTML = [
      [bn(days.length) + ' দিন', cost.nights ? bn(cost.nights) + ' রাত' : 'দিনে গিয়ে দিনে ফেরা'],
      [bn(state.people) + ' জন', mode.by],
      ['~' + bn(Math.round(totalKm / 5) * 5) + ' কিমি', 'মোট পথ'],
      ['~' + taka(Math.round(cost.per / 100) * 100), 'জনপ্রতি খরচ'],
    ].map(([a, b]) => `<li><b>${a}</b><span>${b}</span></li>`).join('');
    const heroImg = (ordered.find((s) => s.img) || {}).img || '536984ee';
    $('#pn-hero-bg').style.backgroundImage = `url(${img(heroImg, 1920)})`;
    document.title = `${names.join(' → ')} — ট্রিপ প্ল্যান`;

    /* note when the days are not enough */
    const note = $('#pn-note');
    note.hidden = !plan.tight;
    if (plan.tight) note.innerHTML = `<b>সময় একটু কম।</b> এই রুটে ${bn(state.days)} দিনে সব হবে না, তাই ${bn(days.length)} দিনে সাজিয়েছি। দিন বাড়াতে না চাইলে একটা জায়গা কমান বা দিনে ঘোরার ঘণ্টা বাড়ান।`;

    /* days */
    let seenStops = new Set();
    $('#pn-days').innerHTML = days.map((d, i) => {
      let t = 8;
      const stopsToday = [...new Set(d.ev.map((e) => (e.stop ? e.stop.title : byId[e.b].bn)))];
      const title = d.ev[0].type === 'free' ? `${d.ev[0].stop.name} — নিজের মতো একটা দিন` : (d.ev[0].type === 'go' ? `${byId[d.ev[0].a].bn} থেকে ${d.ev[0].home ? byId[d.ev[0].b].bn : d.ev[0].stop.title}` : stopsToday.join(' ও '));
      const newStop = d.ev.map((e) => e.stop).find((s) => s && s.img && !seenStops.has(s.d));
      d.ev.forEach((e) => e.stop && seenStops.add(e.stop.d));
      const rows = [];
      let ate = false;
      d.ev.forEach((e) => {
        if (!ate && t >= 12.5 && (e.stop || {}).eat) { rows.push(row('eat', clock(t), 'দুপুরের খাবার', `এখানকার ${e.stop.eat} চেখে দেখুন`)); t += 1; ate = true; }
        if (e.type === 'go') rows.push(row('go', clock(t), `${byId[e.a].bn} → ${e.home ? byId[e.b].bn + ' (ফেরা)' : byId[e.b].bn}`, `${mode.by} · প্রায় ${bn(Math.round(e.km / 5) * 5)} কিমি · ${dur(e.h)}`));
        else if (e.type === 'see') rows.push(row('see', clock(t), e.text, e.stop.known ? `${e.stop.name} · প্রায় ২ ঘণ্টা` : `${e.stop.name} · জেলার গাইডে বিস্তারিত`, e.stop.known ? null : `district.html?id=${e.stop.d}`));
        else rows.push(row('free', clock(t), 'কোনো তাড়া নেই', `${e.stop.name}-এ যা ভালো লেগেছে আবার ঘুরে আসুন, বা বিশ্রাম নিন।`));
        t += e.h + 0.25;
      });
      const lastStop = [...d.ev].reverse().find((e) => e.stop);
      if (!ate && lastStop && lastStop.stop.eat && d.ev[0].type !== 'free') rows.push(row('eat', clock(Math.max(t, 19.5)), 'রাতের খাবার', `${lastStop.stop.eat} — ${lastStop.stop.name}-এর স্বাদ`));
      if (i < days.length - 1) rows.push(row('stay', 'রাত', `${byId[d.at].bn}-এ রাত কাটান`, ({ budget: 'সাধারণ হোটেল', mid: 'ভালো হোটেল', lux: 'অভিজাত রিসোর্ট' })[state.stay], `hotels.html?d=${d.at}`));
      return `
        <article class="day" data-reveal style="--d:${first ? Math.min(i, 3) * 90 : 0}ms">
          <header class="day-head">
            <div class="day-no"><small>দিন</small><b>${bn(String(i + 1).padStart(2, '0'))}</b></div>
            <h2 class="display">${title}</h2>
            ${newStop ? `<a class="day-ph" href="district.html?id=${newStop.d}" data-cursor="গাইড"><img src="${img(newStop.img)}" alt="${newStop.name}" loading="lazy"></a>` : ''}
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
    return `<li class="ev ev-${type}"><span class="ev-time">${time}</span><span class="ev-ic">${ICON[type]}</span><div class="ev-tx"><b>${title}</b><span>${sub}${href ? ` · <a href="${href}">দেখুন →</a>` : ''}</span></div></li>`;
  }

  function renderMap() {
    const { ordered } = plan;
    const pts = [byId[state.from].c].concat(ordered.map((s) => byId[s.d].c));
    if (state.rt) pts.push(byId[state.from].c);
    const on = new Set(ordered.map((s) => s.d));
    /* gently curved route through the stops */
    let path = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0, bend = (i % 2 ? 1 : -1) * 0.16;
      path += ` Q${(mx - dy * bend).toFixed(1)} ${(my + dx * bend).toFixed(1)} ${x1} ${y1}`;
    }
    /* zoom the map onto the route */
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = 90, w = Math.max(x1 - x0 + pad * 2, 300), h = Math.max(y1 - y0 + pad * 2, 340), side = Math.max(w, h * 0.86);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, vw = side, vh = side / 0.86;
    const k = vw / 420; // keeps markers a constant visual size
    $('#pn-map').innerHTML = `<svg viewBox="${(cx - vw / 2).toFixed(0)} ${(cy - vh / 2).toFixed(0)} ${vw.toFixed(0)} ${vh.toFixed(0)}" role="img" aria-label="ম্যাপে আপনার রুট">
      ${D.map((d) => `<path class="${on.has(d.id) ? 'on' : d.id === state.from ? 'home' : ''}" d="${d.d}"/>`).join('')}
      <path class="route-bg" d="${path}" style="stroke-width:${1.4 * k}"/>
      <path class="route" d="${path}" pathLength="1" style="stroke-width:${2.2 * k}"/>
      <circle class="runner" r="${4.5 * k}"><animateMotion dur="${Math.max(5, pts.length * 2.2)}s" repeatCount="indefinite" path="${path}"/></circle>
      <g class="pin home"><circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="${7 * k}"/><text x="${pts[0][0]}" y="${pts[0][1] - 13 * k}" font-size="${13 * k}">${byId[state.from].bn}</text></g>
      ${ordered.map((s, i) => { const c = byId[s.d].c; return `<g class="pin"><circle cx="${c[0]}" cy="${c[1]}" r="${11 * k}"/><text class="n" x="${c[0]}" y="${c[1] + 4.5 * k}" font-size="${12.5 * k}">${bn(i + 1)}</text><text x="${c[0]}" y="${c[1] - 17 * k}" font-size="${13 * k}">${s.title}</text></g>`; }).join('')}
    </svg>`;
    $('#pn-legend').innerHTML = ordered.map((s, i) => `<li><b>${bn(i + 1)}</b><span>${s.title}${s.title !== s.name ? `<small>${s.name}</small>` : ''}</span><em>${bn(Math.round(plan.legs[i].km / 5) * 5)} কিমি</em></li>`).join('');
  }

  let prevTotal = 0;
  function renderCost() {
    const c = plan.cost, n = plan.days.length;
    const line = (label, note, v) => `<li><div><b>${label}</b><span>${note}</span></div><em>${taka(v)}</em></li>`;
    $('#pn-cost').innerHTML = `
      <span class="eyebrow">খরচের হিসাব <i lang="en">estimate</i></span>
      <div class="cost-big"><small>জনপ্রতি আনুমানিক</small><b id="cost-per">${taka(c.per)}</b><span>মোট ${taka(c.total)} · ${bn(state.people)} জন</span></div>
      <ul class="cost-lines">
        ${line('যাতায়াত', c.transportNote + ` · ${bn(Math.round(plan.totalKm / 5) * 5)} কিমি`, c.transport)}
        ${line('থাকা', c.nights ? `${bn(c.nights)} রাত · ${bn(c.rooms)}টি রুম` : 'রাতে থাকা লাগছে না', c.stay)}
        ${line('খাওয়া', `${bn(n)} দিন · ${bn(state.people)} জন`, c.food)}
        ${line('টিকিট ও লোকাল যাতায়াত', 'প্রবেশ ফি, সিএনজি, নৌকা', c.local)}
      </ul>
      <p class="cost-fine">এগুলো গড় দরের আনুমানিক হিসাব। মৌসুম আর ছুটির দিনে ভাড়া বাড়ে।</p>`;
    /* count the headline number up/down */
    const el = $('#cost-per'), a = prevTotal || c.per * 0.6, b = c.per, t0 = performance.now(); prevTotal = b;
    if (!EB.reduce) { const step = (t) => { const k2 = clamp((t - t0) / 900, 0, 1), e = 1 - Math.pow(1 - k2, 3); el.textContent = taka(Math.round((a + (b - a) * e) / 10) * 10); if (k2 < 1) requestAnimationFrame(step); else el.textContent = taka(Math.round(b / 10) * 10); }; requestAnimationFrame(step); }
  }

  /* ---------- fine-tune controls ---------- */
  function bindControls() {
    document.querySelectorAll('.rf-step').forEach((st) => {
      const k = st.dataset.k, min = +st.dataset.min, max = +st.dataset.max, out = $('output', st), unit = k === 'days' ? 'দিন' : 'জন';
      const paint = () => { out.textContent = `${bn(state[k])} ${unit}`; $('[data-dir="-1"]', st).disabled = state[k] <= min; $('[data-dir="1"]', st).disabled = state[k] >= max; };
      st.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; state[k] = clamp(state[k] + +b.dataset.dir, min, max); paint(); update(); });
      paint();
    });
    document.querySelectorAll('.rf-seg').forEach((seg) => {
      const k = seg.dataset.k;
      seg.setAttribute('role', 'radiogroup');
      seg.innerHTML = seg.dataset.opts.split(',').map((o) => { const [v, l] = o.split(':'); return `<button type="button" role="radio" data-v="${v}">${l}</button>`; }).join('');
      const paint = () => seg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.v === String(state[k]))));
      seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; state[k] = k === 'hours' ? +b.dataset.v : b.dataset.v; paint(); update(); });
      paint();
    });
    const rt = $('#rf-rt'); rt.checked = state.rt; $('#rf-from').textContent = byId[state.from].bn;
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
      else { await navigator.clipboard.writeText(location.href); say('লিংক কপি হয়েছে — যাকে খুশি পাঠিয়ে দিন'); }
    } catch (e) { say('লিংকটা ঠিকানার বার থেকে কপি করে নিন'); }
  });
  $('#pn-print').addEventListener('click', () => print());

  /* ---------- go ---------- */
  const crafting = $('#crafting');
  if (!state.to.length) {
    crafting.remove();
    $('#pn-empty').hidden = false; $('#pn-body').hidden = true; $('#pn-tune').hidden = true;
    $('#pn-route').textContent = 'ট্রিপ প্ল্যান'; $('.pn-actions').hidden = true;
    return;
  }
  bindControls();
  render(true);
  syncUrl();
  const reveal = () => { crafting.classList.add('done'); document.documentElement.classList.add('plan-ready'); setTimeout(() => crafting.remove(), 1000); };
  setTimeout(reveal, EB.reduce ? 0 : 2600);
})();
