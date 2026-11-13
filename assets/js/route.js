/* Road router: shortest path over the highway network in roads.js, projected onto the district map.
   EB.route.leg(a, b) → { pts:[[x,y]…], km, ferry, ds:[district ids passed through] }
   a / b are either a district id (its headquarters) or { id, ll:[lat,lon], d } for a specific place. */
(function () {
  const R = window.EB_ROADS; if (!R) return;
  const P = R.proj, N = R.nodes;
  const kx = (P.maxx - P.minx) / (P.e - P.w), ky = (P.maxy - P.miny) / (P.n - P.s);
  const xy = (la, lo) => [P.minx + (lo - P.w) * kx, P.miny + (P.n - la) * ky];
  const rad = Math.PI / 180;
  const hav = (a, b) => { const dLa = (b[0] - a[0]) * rad, dLo = (b[1] - a[1]) * rad; const h = Math.sin(dLa / 2) ** 2 + Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin(dLo / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
  const ROAD = 1.22; // highways wind: straight-line km × 1.22 ≈ road km
  const adj = {};
  Object.keys(N).forEach((k) => { adj[k] = []; });
  R.edges.forEach(([a, b, f]) => {
    const km = hav(N[a], N[b]) * ROAD, w = km + (f ? 30 : 0); // ferries cost extra so bridges win when there is one
    adj[a].push({ to: b, km, w, f: !!f }); adj[b].push({ to: a, km, w, f: !!f });
  });
  function dijkstra(s, t) {
    const dist = { [s]: 0 }, prev = {}, done = new Set(), q = [s];
    while (q.length) {
      q.sort((a, b) => dist[a] - dist[b]);
      const u = q.shift(); if (done.has(u)) continue; done.add(u); if (u === t) break;
      adj[u].forEach((e) => { const nd = dist[u] + e.w; if (dist[e.to] === undefined || nd < dist[e.to]) { dist[e.to] = nd; prev[e.to] = { u, e }; q.push(e.to); } });
    }
    const path = [t], steps = []; let c = t;
    while (c !== s && prev[c]) { steps.unshift(prev[c].e); c = prev[c].u; path.unshift(c); }
    return { path, steps };
  }
  /* a place joins the network at its nearest junction */
  const nearestNode = (ll) => { let best = null, bd = Infinity; Object.keys(N).forEach((k) => { const d = hav(ll, N[k]); if (d < bd) { bd = d; best = k; } }); return { node: best, km: bd }; };
  const endpoint = (p) => (typeof p === 'string' ? { node: p, ll: N[p], extra: 0, own: null } : (() => {
    if (!p.ll) return { node: p.d, ll: N[p.d], extra: 0, own: null };
    const n = nearestNode(p.ll); return { node: n.node, ll: p.ll, extra: n.km * ROAD, own: p.ll };
  })());
  function leg(a, b) {
    const A = endpoint(a), B = endpoint(b);
    const { path, steps } = A.node === B.node ? { path: [A.node], steps: [] } : dijkstra(A.node, B.node);
    const lls = path.map((k) => N[k].slice(0, 2));
    if (A.own) lls.unshift(A.own);
    if (B.own) lls.push(B.own);
    const pts = lls.map(([la, lo]) => xy(la, lo));
    const km = steps.reduce((t, e) => t + e.km, 0) + A.extra + B.extra;
    const ds = [...new Set(path.map((k) => N[k][2]).filter(Boolean))];
    return { pts, km: Math.max(km, 6), ferry: steps.some((e) => e.f), ds, path };
  }
  /* smooth line through points (centripetal Catmull-Rom → cubic Bézier) */
  function d(pts) {
    if (!pts.length) return '';
    const p = pts.filter((q, i) => !i || Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) > 0.5);
    let s = `M${p[0][0].toFixed(1)} ${p[0][1].toFixed(1)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2, t = 0.18;
      const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t], c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
      s += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return s;
  }
  /* the last district town on the road to a place: where you stay before the final stretch (Khagrachhari for Sajek, Cox's Bazar for Saint Martin) */
  const gateway = (from, p) => {
    if (typeof p === 'string') return p;
    const { path } = leg(from, p), dist = window.EB_DISTRICTS || [];
    const isHQ = (k) => dist.some((d) => d.id === k);
    for (let i = path.length - 1; i >= 0; i--) if (isHQ(path[i])) return path[i];
    return p.d;
  };
  const place = (id) => { const g = EB.guide && EB.guide(id); const ll = (window.EB_COORDS || {})[id]; return g ? { id, ll, d: g.d } : id; };
  window.EB.route = { xy, leg, d, place, gateway, hq: (id) => xy(N[id][0], N[id][1]) };
})();
