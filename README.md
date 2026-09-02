<div align="center">

<img src=".github/assets/logo.svg" alt="Wanderlens logo" width="104" height="104" />

# Wanderlens

**Focus the globe. Find where to go.**

Spin an interactive 3D globe, drop into any country, city, region or area on Earth,
and get the places worth your time there, with live weather and country context.
Built entirely on open travel data. No API keys, no accounts, no trackers.

[![License: MIT](https://img.shields.io/badge/License-MIT-f5c451.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![three.js](https://img.shields.io/badge/three.js-globe-7c6cf5?logo=threedotjs&logoColor=white)](https://threejs.org)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-38e1c4.svg)](https://github.com/Abudora-0/wanderlens/pulls)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/Abudora-0/wanderlens)

`travel` &nbsp; `tourism` &nbsp; `interactive-globe` &nbsp; `data-visualization` &nbsp; `nextjs` &nbsp; `threejs` &nbsp; `open-data`

</div>

---

## What it does

Type a place, or click a country on the globe. Wanderlens then assembles a single
briefing for that destination:

- **The best places to visit**, blended from Wikivoyage listings and geo-tagged
  Wikipedia articles, ranked and de-duplicated, each with a photo, a short note
  and its distance from the centre.
- **Live weather**, current conditions plus a seven day outlook.
- **Country context**, capital, currencies, languages, dialling code, population
  and land area, with animated counters.
- A filter bar to narrow by category, reorder the list, or tighten the search
  radius.

Everything is deep linkable, so a destination view has its own shareable URL.

## Highlights

- **Interactive WebGL globe** built with three.js. Hover to highlight countries,
  click to dive in, watch the camera fly to your pick with a pulse ring on
  landing. Auto-rotates until you take over.
- **Animated aperture logo** rendered as live SVG. The blades iris open on load,
  the lens keeps a slow rotation, the core breathes.
- **A theme that runs all the way down** to the controls: a gradient scrollbar, a
  scroll-progress rail, odometer counters, a custom listbox, a custom range
  slider, a magnetic cursor and an aurora and starfield canvas backdrop.
- **Motion with manners.** Every animation has a reduced-motion fallback, the
  globe degrades to a lightweight spinning marker globe and a searchable list on
  small screens or when WebGL is unavailable.
- **Resilient data layer.** Each upstream source is fetched and cached
  independently, so one slow or failing API degrades the page instead of
  breaking it.

## Data sources

All open, all keyless.

| Source | Used for | License |
| --- | --- | --- |
| [Open-Meteo](https://open-meteo.com) | Geocoding and weather | CC BY 4.0 |
| [Wikivoyage](https://en.wikivoyage.org) | Attraction listings and summaries | CC BY-SA 4.0 |
| [Wikipedia](https://en.wikipedia.org) | Nearby points of interest and photos | CC BY-SA 4.0 |
| [mledoze/countries](https://github.com/mledoze/countries) | Country reference data | ODbL 1.0 |
| [World Bank Open Data](https://data.worldbank.org) | Population figures | CC BY 4.0 |
| [Natural Earth](https://www.naturalearthdata.com) | Country polygons for the globe | Public domain |

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS v4 with a hand-built token layer |
| 3D globe | three.js via react-globe.gl, plus cobe for the fallback |
| Animation | Motion (Framer Motion), Lenis smooth scroll |
| Data | Route handlers with layered fetch caching, no database |
| Hosting | Vercel, zero configuration, zero environment variables |

## Getting started

```bash
git clone https://github.com/Abudora-0/wanderlens.git
cd wanderlens
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). There is nothing else to
configure.

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Deploy

The project is Vercel ready as is. Import the repository at
[vercel.com/new](https://vercel.com/new), or use the button at the top of this
file. The framework is auto-detected and no environment variables are required.

## Project structure

```
app/
  api/
    geocode/        location search      (Open-Meteo)
    destination/    the full briefing    (aggregator)
    collections/    curated starting points
  opengraph-image.tsx
  icon.svg
components/
  brand/            animated logo and wordmark
  globe/            three.js globe and the fallback
  experience/       state store, search field, page shell
  destination/      dossier, weather, country facts, attraction cards
  sections/         hero, aurora field, explore rail, footer, nav
  ui/               scrollbar, counter, select, range slider, cursor
lib/
  sources/          one module per upstream API
  data/             bundled country reference dataset
  destination.ts    merges, ranks and de-duplicates the sources
public/
  countries-110m.geojson
```

## Roadmap

- Route between two picks and surface stops along the way
- Save a shortlist of destinations to local storage
- Seasonal hints, best months to visit per destination
- A print friendly one page briefing

## License

Released under the [MIT License](LICENSE). Upstream data keeps its own license,
listed in the table above and surfaced in the app.
