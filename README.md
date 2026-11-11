# Explore Bangladesh — redesign prototype

A static design prototype for [explorebangladesh.xyz](https://explorebangladesh.xyz): a storytelling, photo-first take on the travel guide and trip planner. Bangla text is set in Anek Bangla.

**Live preview:** https://litu173.github.io/explorebangladesh/

## Pages

| Page | File |
|---|---|
| Home with the AI trip planner and the dawn-to-night story | `index.html` |
| Generated trip plan (route map, day cards, cost) | `plan.html` |
| Ready-made trips and one trip's story | `trips.html`, `trip.html` |
| 64 districts and one district | `explore.html`, `district.html` |
| Place / food / tradition guide | `guide.html` |
| Galleries: places, foods, hidden places, traditions | `discover.html` |
| Hotels and one hotel | `hotels.html`, `hotel.html` |
| My travel map | `map.html` |
| Six seasons | `seasons.html` |

## Run locally

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173.

## Notes

- Plain HTML, CSS and JavaScript; no build step. Smooth scrolling uses [Lenis](https://lenis.darkroom.engineering/) from a CDN.
- Content in `assets/data/` and all photographs come from the live site; photos load from its image server.
- The trip plan page uses simplified stand-in maths for distance and cost. It is not the live site's planner.
- Pages carry a `noindex` tag so this preview does not compete with the live site in search results.
