/* Explore Bangladesh — shared content + language helpers.
   The page language comes from <html lang>: "bn" (root pages) or "en" (pages in /en/).
   Every user-facing string is written as a [bangla, english] pair and picked with T()/L(). */
(function () {
  const SITE = 'https://explorebangladesh.xyz';
  const EN = document.documentElement.lang === 'en';
  const T = (b, e) => (EN ? e : b);
  const L = (v) => (Array.isArray(v) ? v[EN ? 1 : 0] : v);
  const img = (id, w) => `https://img.explorebangladesh.xyz/p/${id}/${w || 800}.webp`;

  /* The five beats of the boat story, dawn to dusk — every stop is a place you reach by water. */
  const JOURNEY = [
    { key: 'dawn', guide: 'tanguar-haor', img: '77a36a9f', mx: 1920,
      time: ['ভোর', 'Dawn'], clock: ['৫:৪০', '5:40'], place: ['টাঙ্গুয়ার হাওর', 'Tanguar Haor'], region: ['সুনামগঞ্জ', 'Sunamganj'],
      line: ['কুয়াশা ভাঙার আগেই নৌকা ছাড়ে। পাখিরা জেগে ওঠে, আর দিগন্ত-জোড়া পানিতে প্রথম আলো পড়ে।', 'The boat slips out before the mist lifts. Birds wake, and first light spreads across water as wide as the sky.'] },
    { key: 'morning', guide: 'ratargul-swamp-forest', img: 'e129b5de', mx: 1920,
      time: ['সকাল', 'Morning'], clock: ['৮:৩০', '8:30'], place: ['রাতারগুল', 'Ratargul'], region: ['সিলেট', 'Sylhet'],
      line: ['ডিঙি ঢুকে পড়ে জলাবনের ভেতরে। মাথার ওপর হিজল-করচের ছাউনি, নিচে সবুজ স্থির পানি।', 'A dinghy glides into the drowned forest. Hijal and koroch trees overhead, still green water below.'] },
    { key: 'noon', guide: 'lalakhal', img: 'cecec929', mx: 1280,
      time: ['দুপুর', 'Noon'], clock: ['১২:১৫', '12:15'], place: ['লালাখাল', 'Lalakhal'], region: ['সিলেট', 'Sylhet'],
      line: ['দুপুরের রোদে নদীর পানি হয়ে যায় নীল-সবুজ। চা-বাগানের টিলার পাশ দিয়ে নৌকা চলে সীমান্তের দিকে।', 'Under the midday sun the river turns a clear blue-green, and the boat drifts past tea-covered hills towards the border.'] },
    { key: 'afternoon', guide: 'kaptai-lake', img: 'a5f28966', mx: 1920,
      time: ['বিকেল', 'Afternoon'], clock: ['৩:৪৫', '3:45'], place: ['কাপ্তাই হ্রদ', 'Kaptai Lake'], region: ['রাঙ্গামাটি', 'Rangamati'],
      line: ['পাহাড়ে ঘেরা দেশের সবচেয়ে বড় হ্রদ। বিকেলের সোনালি আলোয় নৌকা চলে শুভলং ঝরনার দিকে।', 'The country’s largest lake, ringed by hills. In the golden afternoon the boat heads for the Shuvolong falls.'] },
    { key: 'dusk', guide: 'st-martins-island', img: '3504ab27', mx: 1920,
      time: ['সন্ধ্যা', 'Dusk'], clock: ['৫:৪০', '5:40'], place: ['সেন্ট মার্টিন', 'Saint Martin'], region: ['কক্সবাজার', 'Cox’s Bazar'],
      line: ['দিনের শেষ ঘাট দেশের একমাত্র প্রবাল দ্বীপ। সূর্য ডোবে সাগরে, আর জেলে নৌকাগুলো ফেরে তীরে।', 'The last landing of the day is the country’s only coral island. The sun sinks into the sea as fishing boats come home.'] },
  ];

  /* Six seasons. The places for each come from EB_SEASON_PICKS (guides whose “best time” names the season);
     SEASON_LEAD puts the best-known ones first. */
  const SEASONS = [
    { key: 'grishmo', name: ['গ্রীষ্ম', 'Summer'], months: ['বৈশাখ · জ্যৈষ্ঠ', 'Boishakh · Joishtho'], greg: ['এপ্রিল – মে', 'April – May'], tint: '#d99a12',
      mood: ['আম-কাঁঠালের দিন। রোদ এড়িয়ে ছায়াঘেরা জায়গা আর জাদুঘরে ঘোরার সময়।', 'Mango and jackfruit days. A time for shady places and museums, out of the sun.'] },
    { key: 'borsha', name: ['বর্ষা', 'Monsoon'], months: ['আষাঢ় · শ্রাবণ', 'Asharh · Shrabon'], greg: ['জুন – জুলাই', 'June – July'], tint: '#13708a',
      mood: ['বৃষ্টিতে সবুজ আরও গাঢ় হয়। হাওর, জলাবন আর ভরা নদী দেখার সেরা সময়।', 'Rain turns the green deeper. The best time for haors, swamp forests and brimming rivers.'] },
    { key: 'shorot', name: ['শরৎ', 'Autumn'], months: ['ভাদ্র · আশ্বিন', 'Bhadro · Ashwin'], greg: ['আগস্ট – সেপ্টেম্বর', 'August – September'], tint: '#3d86b8',
      mood: ['নীল আকাশ, সাদা মেঘ আর কাশফুল। নদীর ধারে আর পুরোনো শহরে হাঁটার দিন।', 'Blue skies, white clouds and kash flowers. Days for riverbanks and old-town walks.'] },
    { key: 'hemonto', name: ['হেমন্ত', 'Late autumn'], months: ['কার্তিক · অগ্রহায়ণ', 'Kartik · Ogrohayon'], greg: ['অক্টোবর – নভেম্বর', 'October – November'], tint: '#c77b2a',
      mood: ['ধান পাকার সময়, হালকা শীতের শুরু। পাহাড়ে ওঠা আর ঝরনায় যাওয়ার সবচেয়ে আরামের দিন।', 'Rice ripens and the first chill arrives. The most comfortable days for hill climbs and waterfalls.'] },
    { key: 'sheet', name: ['শীত', 'Winter'], months: ['পৌষ · মাঘ', 'Poush · Magh'], greg: ['ডিসেম্বর – জানুয়ারি', 'December – January'], tint: '#5d7fa3',
      mood: ['পিঠা, খেজুরের রস আর কুয়াশার সকাল। সৈকত, দ্বীপ আর পুরোনো স্থাপত্য ঘোরার মৌসুম।', 'Pitha, date-palm juice and misty mornings. The season for beaches, islands and old architecture.'] },
    { key: 'boshonto', name: ['বসন্ত', 'Spring'], months: ['ফাল্গুন · চৈত্র', 'Falgun · Choitro'], greg: ['ফেব্রুয়ারি – মার্চ', 'February – March'], tint: '#cc2633',
      mood: ['পলাশ-শিমুলের লাল, কোকিলের ডাক। বাগান আর পুরোনো শহর ঘোরার রঙিন সময়।', 'Red palash and shimul blossoms, the call of the koel. A colourful time for gardens and old towns.'] },
  ];
  const SEASON_LEAD = {
    grishmo: ['mangal-shobhajatra', 'kansat-mango-market', 'srimangal-pineapple', 'khagrachhari-amrapali-mango', 'chuadanga-mango'],
    borsha: ['ratargul-swamp-forest', 'tanguar-haor', 'sajek-valley', 'srimangal-tea-gardens', 'bichanakandi', 'jaflong', 'chalan-beel'],
    shorot: ['nafakhum-waterfall', 'tanguar-haor', 'ratargul-swamp-forest', 'sajek-valley', 'alutila-cave', 'lalakhal'],
    hemonto: ['kuakata-sea-beach', 'nafakhum-waterfall', 'lalakhal', 'karamjal', 'kantajew-temple', 'chandranath-hill-sitakunda'],
    sheet: ['kuakata-sea-beach', 'st-martins-island', 'sajek-valley', 'tanguar-haor', 'lalbagh-fort', 'magura-winter-pitha', 'rajshahi-khejur-gur'],
    boshonto: ['srimangal-tea-gardens', 'ahsan-manzil', 'lalbagh-fort', 'star-mosque-dhaka', 'alta-dighi-national-park'],
  };
  /* Bengali seasons run mid-month to mid-month: Boishakh starts mid-April */
  const md = (new Date().getMonth() + 1) * 100 + new Date().getDate();
  const CUR_SEASON = md >= 1216 || md < 215 ? 4 : md < 415 ? 5 : md < 615 ? 0 : md < 816 ? 1 : md < 1016 ? 2 : 3;

  const FOOD_IDS = ['titas-river-fish', 'chawkbazar-iftar-bazar', 'jashore-khejur-gur', 'rangpur-shidol', 'dinajpur-papad', 'sunamganj-haor-duck', 'surjapuri-mango', 'narail-nalini-patali'];
  /* Places offered as one-tap chips in the planner (district ids or guide ids). */
  const POPULAR = ['sylhet', 'coxs-bazar', 'sajek-valley', 'bandarban', 'karamjal', 'srimangal-tea-gardens'];

  const MODES = [
    { id: 'bus', name: ['বাস', 'Bus'], by: ['বাসে', 'by bus'], speed: 38 },
    { id: 'car', name: ['গাড়ি', 'Car'], by: ['গাড়িতে', 'by car'], speed: 45 },
    { id: 'bike', name: ['বাইক', 'Bike'], by: ['বাইকে', 'by motorbike'], speed: 42 },
  ];

  /* numbers: Bangla digits on Bangla pages, Latin on English pages */
  const BN = '০১২৩৪৫৬৭৮৯';
  const bn = (n) => (EN ? String(n) : String(n).replace(/\d/g, (d) => BN[d]));
  const taka = (n) => '৳' + bn(Math.round(n).toLocaleString('en-IN'));
  const two = (n) => String(n).padStart(2, '0');

  /* ---- content lookups (work once guides.js / atlas.js are loaded) ---- */
  let gIdx = null;
  const guides = () => {
    if (!gIdx && window.EB_GUIDES) gIdx = Object.fromEntries(window.EB_GUIDES.map((g) => [g[0], { id: g[0], t: g[1], alt: g[2], img: g[3], d: g[4], type: g[5], s: g[6], mx: g[7] }]));
    return gIdx || {};
  };
  const guide = (id) => guides()[id];
  /* district display name in the page language */
  const dname = (id) => {
    if (EN && window.EB_DINFO && window.EB_DINFO[id]) return window.EB_DINFO[id].en;
    const d = (window.EB_DISTRICTS || []).find((x) => x.id === id);
    return d ? d.bn : id;
  };
  const seasonList = (key) => {
    const all = (window.EB_SEASON_PICKS || {})[key] || [];
    const lead = SEASON_LEAD[key].filter((x) => all.includes(x));
    return lead.concat(all.filter((x) => !lead.includes(x))).map(guide).filter(Boolean);
  };

  /* live-site paths → pages of this prototype */
  const LISTS = { '/trips': 'trips.html', '/explore': 'explore.html', '/foods': 'discover.html?type=foods', '/hidden': 'discover.html?type=hidden', '/places': 'discover.html?type=places', '/traditions': 'discover.html?type=traditions', '/hotels': 'hotels.html', '/map': 'map.html', '/seasons': 'seasons.html' };
  const local = (href) => {
    const m = href.match(/^\/(trips|guide|district)\/([a-z0-9-]+)$/);
    if (m) return ({ trips: 'trip', guide: 'guide', district: 'district' })[m[1]] + '.html?id=' + m[2];
    return LISTS[href] || SITE + (EN ? '/en' : '') + href;
  };

  window.T = T;
  window.L = L;
  window.EB = { SITE, EN, T, L, base: EN ? '../' : '', local, img, JOURNEY, SEASONS, SEASON_LEAD, CUR_SEASON, FOOD_IDS, POPULAR, MODES, bn, taka, two, guides, guide, dname, seasonList };
})();
