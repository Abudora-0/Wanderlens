<div align="center">

<img src=".github/assets/logo.svg" alt="Wanderlens logo" width="104" height="104" />

# Wanderlens

**Spin the globe. Find where to go.**

Pick a continent, drill into a country, then a region, then a city. Every stop is
a place travellers and guidebooks actually single out, with live weather and
country context on arrival. Built entirely on open travel data. No API keys, no
accounts, no trackers.

[**Live demo**](https://wanderlenss.vercel.app)

[![License: MIT](https://img.shields.io/badge/License-MIT-f5c451.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![three.js](https://img.shields.io/badge/three.js-globe-34ddbb?logo=threedotjs&logoColor=white)](https://threejs.org)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-34c26e.svg)](https://github.com/Abudora-0/Wanderlens/pulls)
[![Deploy with Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/Abudora-0/Wanderlens)

`travel` &nbsp; `tourism` &nbsp; `interactive-globe` &nbsp; `wikivoyage` &nbsp; `nextjs` &nbsp; `threejs` &nbsp; `open-data`

</div>

---

## The idea

Most travel sites bury the good places under ads and rankings. Wanderlens takes
the shortlists that volunteer editors have already written for every country and
region on Earth and lets you spin through them.

- **Explore** is a 3D globe. Choose a continent, click a country, and it drills
  down: country to region to city, each level listing the places guides agree are
  worth a stop.
- **Destination pages** land you on a city with its best sights, current weather,
  a seven-day outlook and a few facts about the country, all server-rendered and
  shareable.
- **Search** takes any place name straight to its dossier.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Home: the pitch, a light decorative globe, curated starts |
| `/explore` | The interactive globe and drill-down. three.js loads here and nowhere else |
| `/destination/[slug]` | A city dossier: sights, weather, country facts |
| `/about` | How the Wikivoyage curation works, and the data behind it |
| `/contact` | Links, no form |

## Data sources

All open, all keyless.

| Source | Used for | License |
| --- | --- | --- |
| [Wikivoyage](https://en.wikivoyage.org) | The continent to city hierarchy and the picks | CC BY-SA 4.0 |
| [Wikipedia](https://en.wikipedia.org) | Individual sights and their photos | CC BY-SA 4.0 |
| [Wikidata](https://www.wikidata.org) | Coordinate backfill | CC0 |
| [Open-Meteo](https://open-meteo.com) | Geocoding and weather | CC BY 4.0 |
| [Natural Earth](https://www.naturalearthdata.com) | Country borders on the globe | Public domain |
| [mledoze/countries](https://github.com/mledoze/countries) + [World Bank](https://data.worldbank.org) | Country facts and population | ODbL 1.0 / CC BY 4.0 |

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS v4 with a hand-built token layer |
| Globe | react-globe.gl on three.js, code-split so only `/explore` pays for it |
| Animation | Motion (Framer Motion), native smooth scroll |
| Data | Route handlers with layered fetch caching, no database |
| Hosting | Vercel, zero configuration, zero environment variables |

## Getting started

```bash
git clone https://github.com/Abudora-0/Wanderlens.git
cd Wanderlens
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Nothing else to configure.

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Project structure

```
app/
  page.tsx                home
  explore/page.tsx        the globe drill-down
  destination/[slug]/     server-rendered city dossier
  about/  contact/
  api/
    place/                Wikivoyage hierarchy node
    destination/          the city briefing (aggregator)
    geocode/ continents/ collections/
components/
  brand/    logo + wordmark
  home/     hero, aurora, how-it-works, featured strip
  explore/  Globe3D, ExploreView, ExplorePanel
  destination/  dossier, weather, country facts, cards
  site/     header (mobile nav) + footer
  ui/       scrollbar, counter, select, range slider, cursor
lib/
  continents.ts
  sources/  one module per upstream (wikitext helpers shared)
  destination.ts  merges, ranks and de-duplicates the city sources
public/
  countries-110m.geojson  (simplified Natural Earth)
```

## Roadmap

- Remember visited destinations
- Seasonal hints, best months to visit
- A print-friendly one-page briefing

## License

Released under the [MIT License](LICENSE). Guide text and map data keep their own
open licenses, listed above and surfaced in the app.
