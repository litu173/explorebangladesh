/* Home-page trip planner: only the first answers (where, from, days, people, how).
   Submitting goes to plan.html — the plan itself is never rendered on the home page. */
(function () {
  const EB = window.EB;
  const form = document.getElementById('planner');
  if (!form) return;

  const D = window.EB_DISTRICTS;
  /* everything a traveller can type: the 64 districts, then every place and hidden place in the guide */
  const OPTIONS = D.map((d) => ({ id: d.id, bn: EB.dname(d.id), key: (EB.dname(d.id) + ' ' + d.bn + ' ' + d.id.replace(/-/g, ' ')).toLowerCase(), kind: T('জেলা', 'District'), where: '', rank: 0 }))
    .concat(Object.values(EB.guides()).filter((g) => g.type === 'place' || g.type === 'hidden')
      .map((g) => ({ id: g.id, bn: g.t, key: (g.t + ' ' + g.id.replace(/-/g, ' ')).toLowerCase(), kind: T('জায়গা', 'Place'), where: EB.dname(g.d), rank: 1 })));
  const optById = Object.fromEntries(OPTIONS.map((o) => [o.id, o]));

  const KEY = 'eb-planner-v1';
  const state = { from: 'dhaka', to: [], days: 3, people: 2, mode: 'bus' };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* storage unavailable */ }
  state.to = (state.to || []).filter((id) => optById[id]);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } };

  const $ = (s) => form.querySelector(s);
  const chips = $('#pl-chips'), q = $('#pl-q'), box = $('#pl-chipbox'), sug = $('#pl-suggest'), err = $('#pl-error'), pop = $('#pl-popular');

  /* ---- from ---- */
  const from = $('#pl-from');
  from.innerHTML = D.map((d) => [d.id, EB.dname(d.id)]).sort((a, b) => a[1].localeCompare(b[1], T('bn', 'en'))).map(([id, n]) => `<option value="${id}">${n}</option>`).join('');
  from.value = state.from;
  from.addEventListener('change', () => { state.from = from.value; save(); });

  /* ---- mode ---- */
  const mode = $('#pl-mode');
  mode.innerHTML = EB.MODES.map((m) => `<button type="button" role="radio" data-id="${m.id}">${L(m.name)}</button>`).join('');
  const paintMode = () => mode.querySelectorAll('button').forEach((b) => {
    const on = b.dataset.id === state.mode;
    b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1;
  });
  mode.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) { state.mode = b.dataset.id; paintMode(); save(); } });
  mode.addEventListener('keydown', (e) => {
    if (!/Arrow(Left|Right)/.test(e.key)) return;
    const ids = EB.MODES.map((m) => m.id);
    state.mode = ids[(ids.indexOf(state.mode) + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length];
    paintMode(); save(); mode.querySelector('[aria-checked="true"]').focus();
  });
  paintMode();

  /* ---- steppers ---- */
  form.querySelectorAll('.pl-stepper').forEach((st) => {
    const k = st.dataset.step, min = +st.dataset.min, max = +st.dataset.max, out = st.querySelector('output');
    const paint = (bump) => {
      const n = state[k];
      out.textContent = k === 'days' ? T(`${EB.bn(n)} দিন`, `${n} day${n > 1 ? 's' : ''}`) : T(`${EB.bn(n)} জন`, `${n} ${n > 1 ? 'people' : 'person'}`);
      st.querySelector('[data-dir="-1"]').disabled = state[k] <= min;
      st.querySelector('[data-dir="1"]').disabled = state[k] >= max;
      if (bump) { out.classList.remove('bump'); void out.offsetWidth; out.classList.add('bump'); }
    };
    state[k] = EB.clamp(+state[k] || min, min, max);
    st.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      state[k] = EB.clamp(state[k] + +b.dataset.dir, min, max); paint(true); save();
    });
    paint(false);
  });

  /* ---- destinations ---- */
  function paintChips() {
    chips.innerHTML = state.to.map((id) => `<li>${optById[id].bn}<button type="button" data-rm="${id}" aria-label="${T(optById[id].bn + ' বাদ দিন', 'Remove ' + optById[id].bn)}">×</button></li>`).join('');
    q.placeholder = state.to.length ? T('আরও জায়গা যোগ করুন', 'Add another place') : T('জেলা বা জায়গার নাম — যেমন সিলেট, সাজেক', 'A district or place — e.g. Sylhet, Sajek');
    pop.querySelectorAll('button').forEach((b) => { b.disabled = state.to.includes(b.dataset.id); });
  }
  function add(id) {
    if (!optById[id] || state.to.includes(id) || state.to.length >= 8) return;
    state.to.push(id); err.hidden = true; paintChips(); save();
  }
  function remove(id) { state.to = state.to.filter((x) => x !== id); paintChips(); save(); }

  pop.innerHTML = EB.POPULAR.filter((id) => optById[id]).map((id) => `<button type="button" data-id="${id}">${optById[id].bn}</button>`).join('');
  pop.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) add(b.dataset.id); });
  chips.addEventListener('click', (e) => { const b = e.target.closest('[data-rm]'); if (b) { remove(b.dataset.rm); q.focus(); } });
  box.addEventListener('click', (e) => { if (e.target === box || e.target === chips) q.focus(); });

  let active = -1, shown = [];
  function suggest() {
    const term = q.value.trim().toLowerCase();
    if (!term) { close(); return; }
    shown = OPTIONS.filter((o) => !state.to.includes(o.id) && o.key.includes(term))
      .sort((a, b) => ((a.key.startsWith(term) ? 0 : 2) + a.rank) - ((b.key.startsWith(term) ? 0 : 2) + b.rank)).slice(0, 7);
    active = shown.length ? 0 : -1;
    sug.innerHTML = shown.length
      ? shown.map((o, i) => `<li role="option" id="pl-o-${i}" data-id="${o.id}" aria-selected="${i === active}"><span>${o.bn}${o.where ? ` <span style="color:var(--muted);font-size:14px">· ${o.where}</span>` : ''}</span><small>${o.kind}</small></li>`).join('')
      : `<li class="none">${T('এই নামে কিছু পাইনি — জেলার নাম লিখে দেখুন', 'Nothing by that name — try a district name')}</li>`;
    sug.hidden = false; q.setAttribute('aria-expanded', 'true');
    sug.style.top = box.offsetTop + box.offsetHeight + 6 + 'px';
  }
  function close() { sug.hidden = true; q.setAttribute('aria-expanded', 'false'); q.removeAttribute('aria-activedescendant'); shown = []; active = -1; }
  function move(d) {
    if (!shown.length) return;
    active = (active + d + shown.length) % shown.length;
    sug.querySelectorAll('li').forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
    q.setAttribute('aria-activedescendant', 'pl-o-' + active);
    const li = sug.children[active];
    if (li.offsetTop < sug.scrollTop) sug.scrollTop = li.offsetTop; else if (li.offsetTop + li.offsetHeight > sug.scrollTop + sug.clientHeight) sug.scrollTop = li.offsetTop + li.offsetHeight - sug.clientHeight;
  }
  q.addEventListener('input', suggest);
  q.addEventListener('focus', suggest);
  q.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Enter') { if (shown.length && active > -1) { e.preventDefault(); add(shown[active].id); q.value = ''; close(); } }
    else if (e.key === 'Escape') close();
    else if (e.key === 'Backspace' && !q.value && state.to.length) remove(state.to[state.to.length - 1]);
  });
  sug.addEventListener('pointerdown', (e) => {
    const li = e.target.closest('li[data-id]'); if (!li) return;
    e.preventDefault(); add(li.dataset.id); q.value = ''; close(); q.focus();
  });
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.pl-dest')) close(); });
  paintChips();

  /* ---- generate → separate plan page ---- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!state.to.length) {
      err.hidden = false; box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake'); q.focus();
      return;
    }
    save();
    const p = new URLSearchParams({ from: state.from, to: state.to.join(','), days: state.days, people: state.people, mode: state.mode });
    const go = () => { location.href = 'plan.html?' + p.toString(); };
    const veil = document.createElement('div');
    veil.className = 'page-veil';
    document.body.appendChild(veil);
    requestAnimationFrame(() => veil.classList.add('on'));
    setTimeout(go, EB.reduce ? 0 : 650);
  });

  /* ---- any "plan" CTA scrolls back up and puts the cursor in the first answer ---- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-focus-planner]'); if (!a) return;
    e.preventDefault(); e.stopPropagation();
    EB.scrollTo(0, { duration: 1.8 });
    setTimeout(() => q.focus({ preventScroll: true }), EB.reduce ? 0 : 1500);
  }, true);

  EB.plannerAdd = add;
})();
