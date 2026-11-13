/* temporary audit harness: loads pages in an iframe, scrolls through, reports wrong-language text and errors */
window.runAudit = async function (urls, w, h) {
  const out = [];
  const f = document.createElement('iframe');
  f.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;border:0;z-index:99999;background:#fff`;
  document.body.appendChild(f);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const BN = /[ঀ-৿]/, LAT = /[A-Za-z]{2,}/;
  const ALLOW_LAT = /^(AI|EN|English|US|explorebangladesh\.xyz)$/; // the language switch and brand URL are intentional
  for (const u of urls) {
    const errs = [];
    await new Promise((res) => { f.onload = res; f.src = u; });
    const win = f.contentWindow, doc = f.contentDocument;
    win.addEventListener('error', (e) => errs.push(String(e.message).slice(0, 120)));
    await wait(3000);
    const H = doc.documentElement.scrollHeight;
    for (let y = 0; y < H; y += Math.round(h * 0.9)) { win.scrollTo(0, y); await wait(90); }
    await wait(600);
    const en = doc.documentElement.lang === 'en';
    const bad = new Set();
    const check = (s, where) => {
      s = String(s || '').trim(); if (!s) return;
      if (en) { const t = s.replace(/৳/g, ''); if (BN.test(t) && t !== 'বাংলা') bad.add(where + ': ' + s.slice(0, 70)); }
      else { (s.match(/[A-Za-z][A-Za-z.\-']+/g) || []).forEach((wd) => { if (!ALLOW_LAT.test(wd) && wd.length > 1) bad.add(where + ': ' + wd + ' ‹' + s.slice(0, 50) + '›'); }); }
    };
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode, p = n.parentElement;
      if (!p || p.closest('script,style,svg title,[hidden]')) continue;
      if (p.closest('svg') && !p.closest('text')) continue;
      check(n.nodeValue, p.tagName.toLowerCase() + (p.className && typeof p.className === 'string' ? '.' + p.className.split(' ')[0] : ''));
    }
    doc.querySelectorAll('[placeholder],[aria-label],[title],img[alt],[data-cursor]').forEach((el) => {
      ['placeholder', 'aria-label', 'title', 'alt', 'data-cursor'].forEach((a) => { if (el.hasAttribute(a) && !(a === 'title' && el.tagName === 'TITLE')) check(el.getAttribute(a), '@' + a); });
    });
    check(doc.title, 'title');
    const broken = [...doc.images].filter((i) => i.complete && i.naturalWidth === 0 && i.getAttribute('src')).length;
    out.push({ u, en, n: bad.size, bad: [...bad].slice(0, 14), errs, broken, ox: doc.documentElement.scrollWidth - doc.documentElement.clientWidth });
  }
  f.remove();
  return out;
};
