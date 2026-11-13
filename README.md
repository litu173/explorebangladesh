# Explore Bangladesh — redesign prototype

A static design prototype for [explorebangladesh.xyz](https://explorebangladesh.xyz): a storytelling, photo-first take on the travel guide and trip planner, in **Bangla** (site root) and **English** (`/en/`). Bangla text is set in Anek Bangla.

**Live preview:** https://litu173.github.io/explorebangladesh/ · English: https://litu173.github.io/explorebangladesh/en/

## Pages

| Page | File |
|---|---|
| Home with the AI trip planner and the dawn-to-dusk boat story | `index.html` |
| Generated trip plan (road-following route map, day cards, cost) | `plan.html` |
| Ready-made trips and one trip's story | `trips.html`, `trip.html` |
| 64 districts and one district | `explore.html`, `district.html` |
| Place / food / tradition guide | `guide.html` |
| Galleries: places, foods, hidden places, traditions | `discover.html` |
| Hotels and one hotel | `hotels.html`, `hotel.html` |
| My travel map | `map.html` |
| Six seasons | `seasons.html` |

## How it is built

- Plain HTML, CSS and JavaScript; no framework. Smooth scrolling uses [Lenis](https://lenis.darkroom.engineering/) from a CDN.
- **Languages.** Every UI string is written as a pair, `T('বাংলা', 'English')` in scripts and `data-en="…"` in the two static pages. The page language comes from `<html lang>`. Content lives in `assets/data/` in both languages (`guides.js` / `guides.en.js`, `atlas.*`, `hotels.*`, `guide/` / `guide-en/`), extracted from the live site's Bangla and English pages.
- **English pages are generated.** After changing any root page or asset, run:

  ```bash
  python3 tools/build_all.py
  ```

  It stamps asset versions (so browsers pick up changes) and writes the English copies to `en/`.
- **Road routes.** `tools/roads_src.py` lists district headquarters and highway junctions with the national-highway links between them. `python3 tools/build_roads.py` checks every junction lies in its district and every link stays on land, then writes `assets/js/roads.js`; `assets/js/route.js` finds the shortest road path. Trip plans follow it, so routes pass through each district on the way (Dhaka → Chattogram goes via Narayanganj, Cumilla and Feni).
- **Audit.** Serve the site and open `/tools/audit.html` to check every page in both languages for wrong-language text, script errors, broken images and sideways scrolling.

## Run locally

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173.

## Notes

- Costs and travel times on the plan page are estimates from average rates and road distances. They are not the live site's planner.
- Photos load from the live site's image server.
- Pages carry a `noindex` tag so this preview does not compete with the live site in search results.
