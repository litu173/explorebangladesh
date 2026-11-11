/* Shared page furniture for EVERY page (home and plan included): header, menu, footer, SVG symbols, grain.
   Injected before core.js runs so the header behaviour picks it up. */
(function () {
  const here = (document.body.dataset.page || '');
  const nav = [
    ['trips.html', 'রেডিমেড ট্রিপ', 'Trips', ['trips', 'trip']],
    ['explore.html', '৬৪ জেলা', 'Districts', ['explore', 'district']],
    ['discover.html?type=places', 'ঘোরার জায়গা', 'Places', []],
    ['discover.html?type=foods', 'খাবার', 'Food', []],
    ['discover.html?type=hidden', 'অচেনা জায়গা', 'Hidden', []],
    ['hotels.html', 'হোটেল', 'Stay', ['hotels', 'hotel']],
  ];
  /* on the home page the plan links scroll up to the planner instead of reloading */
  const home = here === 'home', planHref = home ? '#top' : 'index.html#top', planAttr = home ? ' data-focus-planner' : '';
  const ownIntro = home || here === 'plan'; // these two have their own opening animation
  const type = new URLSearchParams(location.search).get('type');
  const isOn = (n) => n[3].includes(here) || (here === 'discover' && n[0].endsWith('=' + type));
  const brand = '<a class="brand" href="index.html" aria-label="এক্সপ্লোর বাংলাদেশ — হোম"><svg aria-hidden="true"><use href="#logo"/></svg><span class="wm" lang="en"><small>Explore</small><b>Bangladesh</b></span></a>';

  document.body.insertAdjacentHTML('afterbegin', `
${ownIntro ? '' : '<div class="page-in" aria-hidden="true"></div>'}
<div class="grain" aria-hidden="true"></div>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <symbol id="logo" viewBox="0 0 48 48"><clipPath id="lg"><rect width="48" height="48" rx="13"/></clipPath><g clip-path="url(#lg)"><rect width="48" height="48" fill="#0d5a3f"/><path d="M0 35c7-3.600 14.500-3.600 24 0s17 3.600 24 0v13H0z" fill="#11714f"/><path d="M0 40.500c7-3 14.500-3 24 0s17 3 24 0V48H0z" fill="#13708a"/><path d="M24 7.500c-7.200 0-13 5.600-13 12.700C11 29.600 24 40 24 40s13-10.400 13-19.800C37 13.100 31.200 7.500 24 7.500z" fill="#f6f7f2"/><circle cx="24" cy="20.200" r="6.600" fill="#e2323f"/></g></symbol>
  <symbol id="bird" viewBox="0 0 40 16"><path d="M1 10C7 2 14 2 20 9 26 2 33 2 39 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
</defs></svg>
<header class="site-header">
  <div class="wrap">
    ${brand}
    <nav class="nav" aria-label="প্রধান মেনু">${nav.map((n) => `<a href="${n[0]}"${isOn(n) ? ' aria-current="page"' : ''}>${n[1]}</a>`).join('')}</nav>
    <div class="header-actions">
      <a class="lang" href="https://explorebangladesh.xyz/en" lang="en">EN</a>
      <a class="btn btn-gold header-cta" href="${planHref}"${planAttr}>প্ল্যান করুন</a>
      <button class="menu-btn" aria-label="মেনু" aria-expanded="false"><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="menu-panel">
  <a class="big" style="--i:0" href="${planHref}"${planAttr}>ট্রিপ প্ল্যান <small>Plan</small></a>
  ${nav.map((n, i) => `<a class="big" style="--i:${i + 1}" href="${n[0]}">${n[1]} <small>${n[2]}</small></a>`).join('')}
  <div class="menu-foot"><a href="discover.html?type=traditions">ঐতিহ্য</a><a href="seasons.html">ষড়ঋতু</a><a href="map.html">আমার ভ্রমণ ম্যাপ</a><a href="https://explorebangladesh.xyz/en" lang="en">English</a></div>
</div>`);

  document.body.insertAdjacentHTML('beforeend', `
<footer class="site-footer">
  <div class="wrap">
    <div class="cols">
      <div>${brand}<p class="about">একটা ফ্রি ভ্রমণ গাইড আর ট্রিপ প্ল্যানার। ৬৪ জেলার ঘোরার জায়গা, যাওয়ার উপায়, হোটেল আর খরচ — সব বাংলায়, এক জায়গায়।</p></div>
      <div><h3 lang="en">Plan</h3><ul><li><a href="${planHref}"${planAttr}>AI ট্রিপ প্ল্যান</a></li><li><a href="trips.html">রেডিমেড ট্রিপ</a></li><li><a href="hotels.html">হোটেল</a></li><li><a href="map.html">ভ্রমণ ম্যাপ</a></li></ul></div>
      <div><h3 lang="en">Discover</h3><ul><li><a href="explore.html">৬৪ জেলা</a></li><li><a href="discover.html?type=places">ঘোরার জায়গা</a></li><li><a href="discover.html?type=hidden">অচেনা জায়গা</a></li><li><a href="seasons.html">ষড়ঋতু</a></li></ul></div>
      <div><h3 lang="en">Culture</h3><ul><li><a href="discover.html?type=foods">খাবার</a></li><li><a href="discover.html?type=traditions">ঐতিহ্য</a></li><li><a href="https://explorebangladesh.xyz/en" lang="en">English</a></li></ul></div>
    </div>
    <div class="legal"><span>© এক্সপ্লোর বাংলাদেশ</span><span lang="en" class="latin">Made with love for the delta.</span></div>
  </div>
</footer>`);
})();
