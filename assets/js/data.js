/* Explore Bangladesh — content for the home + plan prototype.
   Text and photos are taken from the live site (explorebangladesh.xyz). */
(function () {
  const SITE = 'https://explorebangladesh.xyz';
  const img = (id, w) => `https://img.explorebangladesh.xyz/p/${id}/${w || 800}.webp`;

  /* The five beats of the story section, dawn to dusk. */
  const JOURNEY = [
    { key: 'dawn', time: 'ভোর', clock: '৫:৪০', place: 'টাঙ্গুয়ার হাওর', region: 'সুনামগঞ্জ', img: '0fafd605',
      line: 'কুয়াশা ভাঙার আগেই পাখিরা জেগে ওঠে। পানির ওপর প্রথম আলো পড়ে, আর পুরো হাওর সোনালি হয়ে যায়।',
      href: '/trips/haor-and-hills-sunamganj', cta: 'হাওরের ট্রিপ দেখুন' },
    { key: 'morning', time: 'সকাল', clock: '৯:১৫', place: 'রাতারগুল', region: 'সিলেট', img: '1d3d07b8',
      line: 'ডিঙি নৌকা ঢুকে পড়ে জলাবনের ভেতরে। মাথার ওপর হিজল-করচের ছাউনি, নিচে সবুজ স্থির পানি।',
      href: '/trips/sylhet-tea-and-rivers', cta: 'সিলেটের ট্রিপ দেখুন' },
    { key: 'noon', time: 'দুপুর', clock: '১২:৩০', place: 'সেন্ট মার্টিন', region: 'কক্সবাজার', img: '3504ab27',
      line: 'দেশের একমাত্র প্রবাল দ্বীপ। চারদিকে নীল পানি, নারকেল গাছের ছায়া, আর ভাটায় জেগে ওঠা প্রবাল।',
      href: '/trips/st-martins-island', cta: 'দ্বীপের ট্রিপ দেখুন' },
    { key: 'afternoon', time: 'বিকেল', clock: '৪:০০', place: 'নীলগিরি', region: 'বান্দরবান', img: '6408af3e',
      line: 'পাহাড়ের পর পাহাড়, তার ফাঁকে ফাঁকে মেঘ। এখানে দাঁড়ালে মনে হয় মেঘ হাত দিয়ে ছোঁয়া যায়।',
      href: '/trips/coxs-bazar-and-bandarban', cta: 'পাহাড়ের ট্রিপ দেখুন' },
    { key: 'dusk', time: 'সন্ধ্যা', clock: '৫:৫০', place: 'সাজেক ভ্যালি', region: 'রাঙ্গামাটি', img: '72041c57',
      line: 'সূর্য নামে পাহাড়ের ওপারে। আকাশ লাল থেকে বেগুনি হয়, আর উপত্যকায় একটা একটা করে আলো জ্বলে।',
      href: '/trips/rangamati-khagrachhari-sajek', cta: 'সাজেকের ট্রিপ দেখুন' },
  ];

  const TRIPS = [
    { href: '/trips/coxs-bazar-and-bandarban', img: '6408af3e', t: 'কক্সবাজার-বান্দরবান', s: 'এক ট্রিপে সাগর আর পাহাড়', days: 5, mode: 'বাসে', season: 'শীত, হেমন্ত', cost: 8800 },
    { href: '/trips/rangamati-khagrachhari-sajek', img: '72041c57', t: 'সাজেক-রাঙামাটি', s: 'মেঘের পাহাড় আর কাপ্তাই লেক', days: 5, mode: 'বাসে', season: 'শরৎ, হেমন্ত', cost: 7700 },
    { href: '/trips/sundarbans-and-bagerhat', img: 'a943eed4', t: 'সুন্দরবন-বাগেরহাট', s: 'করমজলের বন আর ষাট গম্বুজ', days: 4, mode: 'বাসে', season: 'শীত, হেমন্ত', cost: 5200 },
    { href: '/trips/kuakata-sunrise-sunset', img: '3460505a', t: 'কুয়াকাটা', s: 'এক সৈকতে সূর্যোদয় আর সূর্যাস্ত', days: 4, mode: 'বাসে', season: 'শীত, হেমন্ত', cost: 6600 },
    { href: '/trips/dhaka-old-town-and-sonargaon', img: '8d009406', t: 'পুরান ঢাকা-সোনারগাঁও', s: 'লালবাগ থেকে পানাম নগর', days: 2, mode: 'গাড়িতে', season: 'শীত, বসন্ত', cost: 2200 },
    { href: '/trips/kushtia-lalon-and-tagore', img: '9f148ba9', t: 'কুষ্টিয়া', s: 'লালনের আখড়া আর রবীন্দ্রনাথের শিলাইদহ', days: 3, mode: 'গাড়িতে', season: 'হেমন্ত, বসন্ত', cost: 5600 },
    { href: '/trips/sylhet-tea-and-rivers', img: '1d3d07b8', t: 'সিলেট', s: 'চা-বাগান আর পাথুরে নদী', days: 6, mode: 'বাসে', season: 'বর্ষা, শরৎ', cost: 9500 },
    { href: '/trips/st-martins-island', img: '3504ab27', t: 'সেন্ট মার্টিন', s: 'প্রবাল দ্বীপ আর কক্সবাজার', days: 3, mode: 'বাসে', season: 'শীত', cost: 7100 },
    { href: '/trips/north-bengal-heritage-by-bike', img: 'f1cde9d9', t: 'উত্তরবঙ্গ', s: 'বাইকে বিহার, মন্দির আর রাজবাড়ি', days: 5, mode: 'বাইকে', season: 'শীত, বসন্ত', cost: 6100 },
    { href: '/trips/haor-and-hills-sunamganj', img: '0fafd605', t: 'সুনামগঞ্জ', s: 'টাঙ্গুয়ার হাওর আর নীলাদ্রি লেক', days: 3, mode: 'বাসে', season: 'বর্ষা, শরৎ', cost: 3300 },
    { href: '/trips/birishiri-and-mymensingh', img: 'a11488ed', t: 'বিরিশিরি-ময়মনসিংহ', s: 'চীনামাটির টিলা আর নীল লেক', days: 3, mode: 'বাসে', season: 'শীত, শরৎ', cost: 3500 },
  ];

  const P = (href, im, t, where, d) => ({ href: '/guide/' + href, img: im, t, where, d });
  const SEASONS = [
    { key: 'grishmo', bn: 'গ্রীষ্ম', en: 'Summer', months: 'বৈশাখ · জ্যৈষ্ঠ', mood: 'আম-কাঁঠালের দিন। রোদ এড়িয়ে ছায়াঘেরা জায়গা আর জাদুঘরে ঘোরার সময়।', tint: '#d99a12',
      places: [P('bangladesh-national-museum', 'e37243d5', 'বাংলাদেশ জাতীয় জাদুঘর', 'ঢাকা', 'শাহবাগে দেশের প্রধান জাদুঘর। ইতিহাস, শিল্পকলা আর মুক্তিযুদ্ধের আলাদা গ্যালারি।'),
        P('dream-holiday-park', '2d408420', 'ড্রিম হলিডে পার্ক', 'নরসিংদী', 'ঢাকা–সিলেট মহাসড়কের পাশে বড় থিম পার্ক আর ওয়াটার পার্ক।'),
        P('varendra-research-museum', '7dbbe23a', 'বরেন্দ্র রিসার্চ জাদুঘর', 'রাজশাহী', 'দেশের সবচেয়ে পুরোনো জাদুঘর। বরেন্দ্র অঞ্চলের পাথরের মূর্তিতে ঠাসা।'),
        P('kansat-zamindar-bari', 'f2b97721', 'কানসাট জমিদারবাড়ি', 'চাঁপাইনবাবগঞ্জ', 'আমের দেশের মাঝখানে ক্ষয়ে যাওয়া এক জমিদারবাড়ি।')] },
    { key: 'borsha', bn: 'বর্ষা', en: 'Monsoon', months: 'আষাঢ় · শ্রাবণ', mood: 'বৃষ্টিতে সবুজ আরও গাঢ় হয়। শালবন, বাগান আর ভরা নদী দেখার সেরা সময়।', tint: '#13708a',
      places: [P('bhawal-national-park', 'ae83f008', 'ভাওয়াল জাতীয় উদ্যান', 'গাজীপুর', 'ঢাকা থেকে ঘণ্টাখানেকের পথে ছায়াঘেরা শালবন।'),
        P('baldha-garden', '2a1d7763', 'বলধা গার্ডেন', 'ঢাকা', 'ওয়ারীতে দেয়ালঘেরা ছোট্ট পুরোনো উদ্ভিদ উদ্যান।'),
        P('nuhash-polli', '94cbf799', 'নুহাশ পল্লী', 'গাজীপুর', 'হুমায়ূন আহমেদের বাগানবাড়ি। পুকুর, দুর্লভ গাছ আর লিচুতলা।'),
        P('bangladesh-national-museum', 'e37243d5', 'বাংলাদেশ জাতীয় জাদুঘর', 'ঢাকা', 'বৃষ্টির দিনে ঘরের ভেতরে ইতিহাস ঘুরে দেখা।')] },
    { key: 'shorot', bn: 'শরৎ', en: 'Autumn', months: 'ভাদ্র · আশ্বিন', mood: 'নীল আকাশ, সাদা মেঘ আর কাশফুল। নদীর ধারে আর পুরোনো শহরে হাঁটার দিন।', tint: '#3d86b8',
      places: [P('sadarghat-buriganga', '9aea5c08', 'সদরঘাট ও বুড়িগঙ্গা', 'ঢাকা', 'ঢাকার হট্টগোলের নদীবন্দর। কাঠের নৌকায় এপার‑ওপার।'),
        P('star-mosque-dhaka', 'ed4f1bc8', 'তারা মসজিদ', 'ঢাকা', 'গা জুড়ে চীনামাটির টুকরো দিয়ে বসানো তারার নকশা।'),
        P('armenian-church-dhaka', 'e68e3815', 'আর্মেনিয়ান গির্জা', 'ঢাকা', 'আঠারো শতকের নিরিবিলি গির্জা আর কবরস্থান।'),
        P('dhakeshwari-temple', '13661c4e', 'ঢাকেশ্বরী জাতীয় মন্দির', 'ঢাকা', 'দেশের জাতীয় মন্দির। দুর্গাপূজায় সবচেয়ে বেশি ভিড়।')] },
    { key: 'hemonto', bn: 'হেমন্ত', en: 'Late autumn', months: 'কার্তিক · অগ্রহায়ণ', mood: 'ধান পাকার সময়, হালকা শীতের শুরু। পাহাড়ে ওঠা আর ঝরনায় যাওয়ার সবচেয়ে আরামের দিন।', tint: '#c77b2a',
      places: [P('chandranath-hill-sitakunda', '15cacf15', 'চন্দ্রনাথ পাহাড়', 'সীতাকুণ্ড, চট্টগ্রাম', 'খাড়া পথে উঠে পাহাড়চূড়ার মন্দির। ওপর থেকে বঙ্গোপসাগর দেখা যায়।'),
        P('nafakhum-waterfall', '86ff2fe3', 'নাফাখুম জলপ্রপাত', 'বান্দরবান', 'রেমাক্রি খালের চওড়া, গর্জন করা ঝরনা।'),
        P('rajban-vihara', '6a23d993', 'রাজবন বিহার', 'রাঙ্গামাটি', 'হ্রদের পাড়ে বড় বৌদ্ধ বিহার। পাশেই চাকমা রাজার বাড়ি।'),
        P('alutila-cave', '1b472e87', 'আলুটিলা গুহা', 'খাগড়াছড়ি', 'পাহাড়ের নিচ দিয়ে চলে যাওয়া প্রাকৃতিক সুড়ঙ্গ।')] },
    { key: 'sheet', bn: 'শীত', en: 'Winter', months: 'পৌষ · মাঘ', mood: 'পিঠা, খেজুরের রস আর কুয়াশার সকাল। সৈকত, দ্বীপ আর পুরোনো স্থাপত্য ঘোরার মৌসুম।', tint: '#5d7fa3',
      places: [P('lalbagh-fort', 'bb5c0311', 'লালবাগ কেল্লা', 'ঢাকা', 'সতেরো শতকের অসমাপ্ত মোগল কেল্লা। ভিড়ের মাঝে এক টুকরো শান্ত সবুজ।'),
        P('ahsan-manzil', 'e969eb19', 'আহসান মঞ্জিল', 'ঢাকা', 'বুড়িগঙ্গার পাড়ে ঢাকার নবাবদের গোলাপি প্রাসাদ।'),
        P('star-mosque-dhaka', 'ed4f1bc8', 'তারা মসজিদ', 'ঢাকা', 'আরমানিটোলার ছোট্ট মসজিদ, তারার নকশায় ঢাকা।'),
        P('sadarghat-buriganga', '9aea5c08', 'সদরঘাট ও বুড়িগঙ্গা', 'ঢাকা', 'তিনতলা‑চারতলা লঞ্চ এখান থেকেই দক্ষিণে ছাড়ে।')] },
    { key: 'boshonto', bn: 'বসন্ত', en: 'Spring', months: 'ফাল্গুন · চৈত্র', mood: 'পলাশ-শিমুলের লাল, কোকিলের ডাক। বাগান আর পুরোনো শহর ঘোরার রঙিন সময়।', tint: '#cc2633',
      places: [P('ahsan-manzil', 'e969eb19', 'আহসান মঞ্জিল', 'ঢাকা', 'বুড়িগঙ্গার পাড়ে গোলাপি প্রাসাদ, এখন জাদুঘর।'),
        P('lalbagh-fort', 'bb5c0311', 'লালবাগ কেল্লা', 'ঢাকা', 'ঘাসের লন, সমাধি আর মসজিদ নিয়ে মোগল কেল্লা।'),
        P('armenian-church-dhaka', 'e68e3815', 'আর্মেনিয়ান গির্জা', 'ঢাকা', 'ঢাকার আর্মেনীয় সওদাগর সমাজের স্মৃতি।'),
        P('star-mosque-dhaka', 'ed4f1bc8', 'তারা মসজিদ', 'ঢাকা', 'চীনামাটির তারায় মোড়া ছোট্ট মসজিদ।')] },
  ];

  const FOODS = [
    P('titas-river-fish', '42cadc1f', 'তিতাস ও হাওরের মাছ', 'ব্রাহ্মণবাড়িয়া', ''),
    P('chawkbazar-iftar-bazar', 'e2aaf0a4', 'চকবাজারের ইফতার', 'ঢাকা', ''),
    P('jashore-khejur-gur', '8336cc6e', 'যশোরের খেজুর গুড়', 'যশোর', ''),
    P('rangpur-shidol', '921e59ad', 'সিদল', 'রংপুর', ''),
    P('dinajpur-papad', '26b34e64', 'দিনাজপুরের পাঁপড়', 'দিনাজপুর', ''),
    P('sunamganj-haor-duck', 'b7303d8c', 'হাওরের হাঁসের মাংস', 'সুনামগঞ্জ', ''),
    P('surjapuri-mango', 'ec06c7e0', 'সূর্যপুরী আম', 'ঠাকুরগাঁও', ''),
    P('narail-nalini-patali', '80d92099', 'নড়াইলের নলেন পাটালি', 'নড়াইল', ''),
  ];

  /* Named places people search for, mapped onto the district that holds them. */
  const SPOTS = [
    { id: 'sajek-valley', bn: 'সাজেক ভ্যালি', en: 'sajek valley', d: 'rangamati' },
    { id: 'st-martins-island', bn: 'সেন্ট মার্টিন দ্বীপ', en: 'saint st martin island', d: 'coxs-bazar' },
    { id: 'sundarbans', bn: 'সুন্দরবন', en: 'sundarbans', d: 'khulna' },
    { id: 'srimangal', bn: 'শ্রীমঙ্গলের চা বাগান', en: 'srimangal sreemangal tea', d: 'moulvibazar' },
    { id: 'kuakata', bn: 'কুয়াকাটা সমুদ্র সৈকত', en: 'kuakata beach', d: 'patuakhali' },
    { id: 'tanguar-haor', bn: 'টাঙ্গুয়ার হাওর', en: 'tanguar haor', d: 'sunamganj' },
    { id: 'sixty-dome-mosque', bn: 'ষাট গম্বুজ মসজিদ', en: 'sixty dome mosque shat gombuj', d: 'bagerhat' },
    { id: 'ratargul', bn: 'রাতারগুল জলাবন', en: 'ratargul swamp', d: 'sylhet' },
    { id: 'jaflong', bn: 'জাফলং', en: 'jaflong', d: 'sylhet' },
    { id: 'nilgiri', bn: 'নীলগিরি', en: 'nilgiri', d: 'bandarban' },
    { id: 'paharpur', bn: 'পাহাড়পুর বৌদ্ধ বিহার', en: 'paharpur somapura', d: 'naogaon' },
    { id: 'mahasthangarh', bn: 'মহাস্থানগড়', en: 'mahasthangarh', d: 'bogura' },
  ];
  const POPULAR = ['sylhet', 'coxs-bazar', 'sajek-valley', 'bandarban', 'sundarbans', 'srimangal'];

  /* What to see / eat per district — used by the plan page. Districts not listed fall back to a generic day. */
  const G = (im, see, eat) => ({ img: im, see, eat });
  const GUIDE = {
    'coxs-bazar': G('3504ab27', ['লাবণী ও সুগন্ধা সৈকত', 'মেরিন ড্রাইভ', 'হিমছড়ি ঝরনা', 'ইনানী সৈকত', 'রামু বৌদ্ধ বিহার', 'মহেশখালীর আদিনাথ মন্দির'], 'লইট্টা ফ্রাই আর রূপচাঁদা'),
    sylhet: G('1d3d07b8', ['রাতারগুল জলাবন', 'জাফলং', 'বিছনাকান্দি', 'লালাখাল', 'হযরত শাহজালাল (রহ.) মাজার', 'মালনীছড়া চা-বাগান'], 'সাতকরা দিয়ে গরুর মাংস'),
    bandarban: G('6408af3e', ['নীলগিরি', 'নীলাচল', 'স্বর্ণমন্দির', 'শৈলপ্রপাত', 'চিম্বুক পাহাড়', 'মেঘলা পর্যটন কেন্দ্র'], 'বাঁশ কোড়ল আর পাহাড়ি মুন্ডি'),
    rangamati: G('72041c57', ['সাজেক ভ্যালি ও কংলাক পাহাড়', 'কাপ্তাই লেকে নৌকা ভ্রমণ', 'ঝুলন্ত সেতু', 'শুভলং ঝরনা', 'রাজবন বিহার'], 'ব্যাম্বু চিকেন আর লেকের মাছ'),
    khagrachhari: G('1b472e87', ['আলুটিলা গুহা', 'রিছাং ঝরনা', 'হর্টিকালচার পার্ক', 'দেবতা পুকুর'], 'পাহাড়ি বাঁশ কোড়ল'),
    khulna: G('a943eed4', ['সুন্দরবনের করমজল', 'হাড়বাড়িয়া ইকো ট্যুরিজম কেন্দ্র', 'রূপসা সেতু', 'খুলনার নদীপাড়'], 'চুই ঝালের মাংস'),
    bagerhat: G('a943eed4', ['ষাট গম্বুজ মসজিদ', 'খান জাহান আলীর মাজার', 'নয় গম্বুজ মসজিদ', 'মোংলা বন্দর'], 'নদীর চিংড়ি'),
    moulvibazar: G('1d3d07b8', ['শ্রীমঙ্গলের চা-বাগান', 'লাউয়াছড়া জাতীয় উদ্যান', 'মাধবপুর লেক', 'মাধবকুণ্ড জলপ্রপাত'], 'সাত রঙের চা'),
    patuakhali: G('3460505a', ['কুয়াকাটা সৈকতে সূর্যোদয়', 'গঙ্গামতির চর', 'লেবুর চরে সূর্যাস্ত', 'মিশ্রিপাড়া বৌদ্ধ মন্দির', 'ফাতরার বন'], 'সৈকতের ধারে তাজা মাছ ভাজা'),
    sunamganj: G('0fafd605', ['টাঙ্গুয়ার হাওর', 'নীলাদ্রি লেক', 'বারিক্কা টিলা', 'যাদুকাটা নদী', 'শিমুল বাগান'], 'হাওরের হাঁসের মাংস'),
    dhaka: G('8d009406', ['লালবাগ কেল্লা', 'আহসান মঞ্জিল', 'সদরঘাট ও বুড়িগঙ্গা', 'তারা মসজিদ', 'জাতীয় জাদুঘর', 'ঢাকেশ্বরী মন্দির'], 'পুরান ঢাকার কাচ্চি আর বাকরখানি'),
    chattogram: G('15cacf15', ['চন্দ্রনাথ পাহাড়, সীতাকুণ্ড', 'পতেঙ্গা সৈকত', 'ফয়’স লেক', 'গুলিয়াখালী সৈকত', 'ওয়ার সিমেট্রি'], 'মেজবানি মাংস'),
    rajshahi: G('f1cde9d9', ['বরেন্দ্র রিসার্চ জাদুঘর', 'পদ্মার পাড়', 'পুঠিয়া রাজবাড়ি ও মন্দির', 'বাঘা মসজিদ'], 'কালাই রুটি'),
    bogura: G('f1cde9d9', ['মহাস্থানগড়', 'গোকুল মেধ (বেহুলার বাসরঘর)', 'ভাসু বিহার'], 'বগুড়ার দই'),
    naogaon: G('f1cde9d9', ['পাহাড়পুর বৌদ্ধ বিহার', 'কুসুম্বা মসজিদ', 'আলতাদীঘি জাতীয় উদ্যান'], 'প্যারা সন্দেশ'),
    dinajpur: G('f1cde9d9', ['কান্তজীউ মন্দির', 'রামসাগর দীঘি', 'দিনাজপুর রাজবাড়ি', 'নয়াবাদ মসজিদ'], 'দিনাজপুরের পাঁপড়'),
    kushtia: G('9f148ba9', ['লালনের আখড়া, ছেঁউড়িয়া', 'শিলাইদহ কুঠিবাড়ি', 'হার্ডিঞ্জ ব্রিজ'], 'তিলের খাজা আর কুলফি'),
    netrokona: G('a11488ed', ['বিরিশিরি', 'বিজয়পুরের চীনামাটির পাহাড়', 'সোমেশ্বরী নদী'], 'বালিশ মিষ্টি'),
    mymensingh: G('a11488ed', ['শশী লজ', 'জয়নুল আবেদিন সংগ্রহশালা', 'ব্রহ্মপুত্রের পাড়'], 'মুক্তাগাছার মণ্ডা'),
    cumilla: G('f1cde9d9', ['শালবন বিহার, ময়নামতি', 'ময়নামতি ওয়ার সিমেট্রি', 'ধর্মসাগর দীঘি'], 'কুমিল্লার রসমালাই'),
    natore: G('e969eb19', ['উত্তরা গণভবন', 'রানী ভবানীর রাজবাড়ি', 'চলনবিল'], 'নাটোরের কাঁচাগোল্লা'),
    panchagarh: G('6408af3e', ['তেঁতুলিয়া থেকে কাঞ্চনজঙ্ঘা', 'সমতলের চা-বাগান', 'বাংলাবান্ধা জিরো পয়েন্ট'], 'সমতলের চা'),
    narayanganj: G('8d009406', ['পানাম নগর', 'সোনারগাঁও লোকশিল্প জাদুঘর', 'গোয়ালদি মসজিদ'], 'সোনারগাঁওয়ের মিষ্টি'),
  };

  const MODES = [
    { id: 'bus', bn: 'বাস', by: 'বাসে', speed: 38 },
    { id: 'car', bn: 'গাড়ি', by: 'গাড়িতে', speed: 45 },
    { id: 'bike', bn: 'বাইক', by: 'বাইকে', speed: 42 },
  ];

  const BN = '০১২৩৪৫৬৭৮৯';
  const bn = (n) => String(n).replace(/\d/g, (d) => BN[d]);
  const taka = (n) => '৳' + bn(Math.round(n).toLocaleString('en-IN'));

  /* live-site paths → pages of this prototype (anything not rebuilt yet still opens the live site) */
  const LISTS = { '/trips': 'trips.html', '/explore': 'explore.html', '/foods': 'discover.html?type=foods', '/hidden': 'discover.html?type=hidden', '/places': 'discover.html?type=places', '/traditions': 'discover.html?type=traditions', '/hotels': 'hotels.html', '/map': 'map.html', '/seasons': 'seasons.html' };
  const local = (href) => {
    const m = href.match(/^\/(trips|guide|district)\/([a-z0-9-]+)$/);
    if (m) return ({ trips: 'trip', guide: 'guide', district: 'district' })[m[1]] + '.html?id=' + m[2];
    return LISTS[href] || SITE + href;
  };

  window.EB = { SITE, local, img, JOURNEY, TRIPS, SEASONS, FOODS, SPOTS, POPULAR, GUIDE, MODES, bn, taka };
})();
