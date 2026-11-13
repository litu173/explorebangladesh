/* Shared page furniture for EVERY page: header, menu, footer, SVG symbols, grain, language switch.
   Runs before core.js so the header behaviour picks it up. Also swaps static [data-en] text on English pages. */
(function () {
  const EN = EB.EN;
  const here = document.body.dataset.page || '';

  /* static markup in index.html / plan.html carries its English text in data-en attributes */
  if (EN) {
    document.querySelectorAll('[data-en]').forEach((el) => { el.innerHTML = el.getAttribute('data-en'); });
    [['data-en-ph', 'placeholder'], ['data-en-label', 'aria-label'], ['data-en-content', 'content'], ['data-en-title', 'title']].forEach(([a, p]) =>
      document.querySelectorAll(`[${a}]`).forEach((el) => el.setAttribute(p, el.getAttribute(a))));
  }

  const nav = [
    ['trips.html', ['রেডিমেড ট্রিপ', 'Ready-made trips'], ['trips', 'trip']],
    ['explore.html', ['৬৪ জেলা', '64 districts'], ['explore', 'district']],
    ['discover.html?type=places', ['ঘোরার জায়গা', 'Places'], []],
    ['discover.html?type=foods', ['খাবার', 'Food'], []],
    ['discover.html?type=hidden', ['অচেনা জায়গা', 'Hidden places'], []],
    ['hotels.html', ['হোটেল', 'Hotels'], ['hotels', 'hotel']],
  ];
  /* on the home page the plan links scroll up to the planner instead of reloading */
  const home = here === 'home', planHref = home ? '#top' : 'index.html#top', planAttr = home ? ' data-focus-planner' : '';
  const type = new URLSearchParams(location.search).get('type');
  const isOn = (n) => n[2].includes(here) || (here === 'discover' && n[0].endsWith('=' + type));
  const wm = EN ? '<small>Explore</small><b>Bangladesh</b>' : '<small>এক্সপ্লোর</small><b>বাংলাদেশ</b>';
  const brand = `<a class="brand" href="index.html" aria-label="${T('এক্সপ্লোর বাংলাদেশ — হোম', 'Explore Bangladesh — home')}"><svg aria-hidden="true"><use href="#logo"/></svg><span class="wm">${wm}</span></a>`;
  /* the same page in the other language: Bangla lives at the root, English in /en/ */
  const swap = `<a class="lang" data-lang-switch href="${EN ? '../' : 'en/'}index.html" lang="${EN ? 'bn' : 'en'}" hreflang="${EN ? 'bn' : 'en'}">${EN ? 'বাংলা' : 'EN'}</a>`;

  document.body.insertAdjacentHTML('afterbegin', `
<div class="grain" aria-hidden="true"></div>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <symbol id="logo" viewBox="0 0 48 48"><clipPath id="lg"><rect width="48" height="48" rx="13"/></clipPath><g clip-path="url(#lg)"><rect width="48" height="48" fill="#0d5a3f"/><path d="M0 35c7-3.600 14.500-3.600 24 0s17 3.600 24 0v13H0z" fill="#11714f"/><path d="M0 40.500c7-3 14.500-3 24 0s17 3 24 0V48H0z" fill="#13708a"/><path d="M24 7.500c-7.200 0-13 5.600-13 12.700C11 29.600 24 40 24 40s13-10.400 13-19.800C37 13.100 31.200 7.500 24 7.500z" fill="#f6f7f2"/><circle cx="24" cy="20.200" r="6.600" fill="#e2323f"/></g></symbol>
  <symbol id="bird" viewBox="0 0 40 16"><path d="M1 10C7 2 14 2 20 9 26 2 33 2 39 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
</defs></svg>
<header class="site-header">
  <div class="wrap">
    ${brand}
    <nav class="nav" aria-label="${T('প্রধান মেনু', 'Main menu')}">${nav.map((n) => `<a href="${n[0]}"${isOn(n) ? ' aria-current="page"' : ''}>${L(n[1])}</a>`).join('')}</nav>
    <div class="header-actions">
      ${swap}
      <a class="btn btn-gold header-cta" href="${planHref}"${planAttr}>${T('প্ল্যান করুন', 'Plan a trip')}</a>
      <button class="menu-btn" aria-label="${T('মেনু', 'Menu')}" aria-expanded="false"><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="menu-panel">
  <a class="big" style="--i:0" href="${planHref}"${planAttr}>${T('ট্রিপ প্ল্যান', 'Trip planner')}</a>
  ${nav.map((n, i) => `<a class="big" style="--i:${i + 1}" href="${n[0]}">${L(n[1])}</a>`).join('')}
  <div class="menu-foot"><a href="discover.html?type=traditions">${T('ঐতিহ্য', 'Traditions')}</a><a href="seasons.html">${T('ষড়ঋতু', 'Six seasons')}</a><a href="map.html">${T('আমার ভ্রমণ ম্যাপ', 'My travel map')}</a>${swap.replace('class="lang"', 'class="lang-text"')}</div>
</div>`);

  document.body.insertAdjacentHTML('beforeend', `
<footer class="site-footer">
  <div class="wrap">
    <div class="cols">
      <div>${brand}<p class="about">${T('একটা ফ্রি ভ্রমণ গাইড আর ট্রিপ প্ল্যানার। ৬৪ জেলার ঘোরার জায়গা, যাওয়ার উপায়, হোটেল আর খরচ — সব বাংলায়, এক জায়গায়।', 'A free travel guide and trip planner. Places, routes, hotels and costs for all 64 districts, in one place.')}</p></div>
      <div><h3>${T('পরিকল্পনা', 'Plan')}</h3><ul><li><a href="${planHref}"${planAttr}>${T('AI ট্রিপ প্ল্যান', 'AI trip planner')}</a></li><li><a href="trips.html">${T('রেডিমেড ট্রিপ', 'Ready-made trips')}</a></li><li><a href="hotels.html">${T('হোটেল', 'Hotels')}</a></li><li><a href="map.html">${T('ভ্রমণ ম্যাপ', 'Travel map')}</a></li></ul></div>
      <div><h3>${T('ঘুরে দেখুন', 'Discover')}</h3><ul><li><a href="explore.html">${T('৬৪ জেলা', '64 districts')}</a></li><li><a href="discover.html?type=places">${T('ঘোরার জায়গা', 'Places')}</a></li><li><a href="discover.html?type=hidden">${T('অচেনা জায়গা', 'Hidden places')}</a></li><li><a href="seasons.html">${T('ষড়ঋতু', 'Six seasons')}</a></li></ul></div>
      <div><h3>${T('সংস্কৃতি', 'Culture')}</h3><ul><li><a href="discover.html?type=foods">${T('খাবার', 'Food')}</a></li><li><a href="discover.html?type=traditions">${T('ঐতিহ্য', 'Traditions')}</a></li><li>${swap.replace('class="lang"', 'class="lang-text"').replace(EN ? 'বাংলা' : '>EN<', EN ? 'বাংলা' : '>English<')}</li></ul></div>
    </div>
    <div class="legal"><span>${T('© এক্সপ্লোর বাংলাদেশ', '© Explore Bangladesh')}</span><span>${T('বদ্বীপের প্রতি ভালোবাসা থেকে তৈরি।', 'Made with love for the delta.')}</span></div>
  </div>
</footer>`);

  /* the language switch keeps you on the same page, with the same filters / plan */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-lang-switch]'); if (!a) return;
    const file = location.pathname.split('/').pop() || 'index.html';
    a.href = (EN ? '../' : 'en/') + file + location.search + location.hash;
  }, true);

  /* fetch the next page quietly when a link is hovered, so moving between pages feels instant */
  try {
    if (HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
      const s = document.createElement('script');
      s.type = 'speculationrules';
      s.textContent = JSON.stringify({ prefetch: [{ source: 'document', where: { selector_matches: 'a[href*=".html"]' }, eagerness: 'moderate' }] });
      document.head.appendChild(s);
    }
  } catch (e) { /* not supported */ }
})();
