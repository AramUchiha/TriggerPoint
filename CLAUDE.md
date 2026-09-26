# Trigger Point

Wildfire evacuation **pre-incident planning** tool for the Glendale (CA) Fire Department.
It answers one question per canyon neighborhood:

> "If a fire starts here, can this neighborhood evacuate before the fire arrives, and
> where is the trigger line where evacuation must begin?"

Users are chief officers and planners working on an iPad **before** an incident. It is not
an incident-management or live-forecast tool.

## Chief-facing pitch

Before the next Santa Ana wind event, see for each canyon neighborhood how long it takes to
get everyone out, how fast a fire could reach it under realistic and worst-case winds, and
the line on the map where the evacuation order must go out if the fire crosses it. It is
precomputed from established wind and fire-spread models, runs on an iPad without internet,
and every number shows where it came from.

## Core principle: never show fabricated data

- Every number on screen traces to a model run or a cited source, and is labeled as a
  **planning projection, not a forecast**. The status-bar pill stays visible.
- No mock, placeholder, random, or "illustrative" data, in dev or in demos. When data is
  missing, show an explicit empty state ("No scenario loaded"), never a plausible stand-in.
  `buildScenarioLayers` returns nothing until real data exists, and that is correct.
- Every exported value carries provenance (`ProvenanceSchema`, `MethodSchema` in
  `web/src/types/scenario.ts`): source, vintage, model/version/configuration.
- Test fixtures in `*.test.ts` / `tests/` are fine but must be obviously synthetic and never
  reachable from the UI.
- Approximate config (camera preset centers in `web/src/config/communities.ts`) is marked
  `TODO(verify)` and is never used for analysis.

## Glossary

- **Time of arrival (TOA)**: minutes from ignition until fire reaches a cell (ELMFIRE output).
- **Clearance time**: minutes to get every household out through the available exits
  (households x vehicles per household / exit capacity, plus mobilization).
- **Trigger line**: the contour where the fire's remaining travel time to the community
  equals clearance time plus a safety margin. Fire crossing it = order the evacuation now.
  Background: Cova et al. (2005) wildfire evacuation trigger points; WUIVAC.
- **Verdict**: whether clearance completes before fire arrival for a given scenario.

## Architecture

```
data-pipeline/ (Python, `tp` CLI)                 web/ (Next.js)
  fetch-dem, fetch-fuels, build-communities         public/scenarios/manifest.json + files
  run-windninja, run-elmfire      --export-web-->   loaded as static files, zod-validated
  hindcast-latuna (validation)                      MapLibre 3D terrain + deck.gl layers
                                                    /api/weather -> api.weather.gov (only live call)
```

- Static precompute plus a thin client. **No database, no accounts.** Scenario outputs are
  static GeoJSON/JSON/raster files in `web/public/scenarios/` indexed by `manifest.json`
  (only the manifest is committed).
- **One live call:** `/api/weather`, a server-side NWS proxy (currently a 501 stub with the
  full TODO in `web/src/app/api/weather/route.ts`). It must degrade to last-good data with
  its timestamp, or say "unavailable". It must never invent a value.
- **Must run offline for demos.** The Inter font is already self-hosted. Still networked (TODO):
  the OpenFreeMap basemap and the AWS terrain tiles. Plan: a PMTiles extract of the bbox plus
  pre-cached terrain tiles, switched in `web/src/config/map.ts`.

## Repo layout

- `web/`: Next.js 16 App Router, TypeScript strict (+ `noUncheckedIndexedAccess`), Tailwind v4, pnpm.
  - `src/app/`: `layout.tsx`, `page.tsx`, `api/weather/route.ts`.
  - `src/components/map/`: `MapClient` (dynamic import, `ssr: false`), `MapView`,
    `DeckOverlay`, `CameraController`, `LayerToggles`, `scenario-layers.ts`.
  - `src/components/panel/`: side panel (Community, Wind Scenario, Fire Projection,
    Clearance, Verdict). `src/components/ui/`: StatusBar, Clock, Toggle.
  - `src/lib/`: pure logic with colocated `*.test.ts`. `src/store/`: zustand `app-store.ts`.
  - `src/config/`: `map.ts` (the one place for basemap, terrain, and provider; swap via
    `NEXT_PUBLIC_MAP_PROVIDER`), `communities.ts` (camera presets), `layout.ts`.
  - `src/types/scenario.ts`: zod contracts for everything the pipeline exports.
- `data-pipeline/`: Python >=3.11 via uv. `tp` Typer CLI; every command is a stub that prints
  its plan and exits 1. `config/` holds `bbox.yaml`, `ignitions.yaml` (empty on purpose), and
  `exits.yaml` (lanes TODO). `raw/` and `work/` are gitignored.
- `docker/`: WindNinja and ELMFIRE Dockerfile stubs that fail on purpose. Don't build them
  until they're implemented.
- `docs/`: `methods.md`, `data-sources.md`, `demo.md` (stubs with headings).

## Data sources and choices

| Need | Source | Notes |
| --- | --- | --- |
| Alerts + forecast (live) | NWS API, api.weather.gov | Via `/api/weather`. User-Agent with contact required. Server-side only. |
| Wind initialization | HRRR (3 km) | Initializes WindNinja (hindcasts and event runs). |
| Station observations | Synoptic Data API | Context and wind validation. Token stays server-side/pipeline. |
| Terrain-adjusted wind | WindNinja | Per direction x speed case. |
| Fire time of arrival | ELMFIRE | Per ignition x wind field. |
| Fuels | LANDFIRE LF2024 FBFM40 (+ canopy CC, CH, CBH, CBD) | Scott & Burgan 40 fuel models. |
| Terrain (analysis) | USGS 3DEP DEM | ~10 m (1/3 arc-second). |
| Households, vehicles | US Census ACS 5-year | Block group. Households and vehicles available. |
| Roads, exits | OpenStreetMap + Glendale Safety Element, Appendix C | Lane counts must be verified. |
| Display only | OpenFreeMap dark basemap; AWS Terrain Tiles (terrarium) | Never used for analysis. |

## Known accuracy caveats (surface these in the UI and docs, don't bury them)

1. **Lee-canyon winds are underpredicted.** HRRR and WindNinja tend to underpredict strong
   downslope (Santa Ana) winds in lee canyons. Always offer a clearly labeled **worst-case
   scenario one wind-speed class above** the modeled or forecast one.
2. **Fuels are dated.** LF2024 misses disturbances after Oct 2024 (recent burns,
   treatments, development). Flag areas for manual review, and show the fuels vintage.
3. **Ember spotting.** Embers can ignite spot fires and homes ahead of the modeled front, so
   real arrival can come sooner than projected. Say so next to every arrival time and
   verdict.
4. The display terrain (AWS tiles) is not the analysis terrain (3DEP). Camera preset centers
   are approximate.

## Coding conventions

- **Pure functions in `web/src/lib/`** (and pipeline modules) with tests. Components stay thin.
- **zod-validate all loaded data** at the boundary (manifest, scenario files, API
  responses). Types come from `z.infer`, never hand-written duplicates.
- **No secrets in client code.** Only `NEXT_PUBLIC_*` reaches the browser, and it must be
  safe to publish. `NWS_USER_AGENT`, Synoptic tokens, etc. stay server/pipeline-only.
- Units go in names (`windSpeedMph`, `cellSizeM`, `...Min`). Wind direction is degrees FROM.
  Time is 24-hour America/Los_Angeles.
- Map-library code stays in `components/map/`. Other UI talks to the map through the store
  (e.g. `cameraRequest`), which keeps a future Mapbox swap contained.
- Design: dark slate surfaces. Amber (`warning`) = warning, red (`critical`) = critical, sky
  `accent` = interaction only. Inter. Touch targets >=44px. High contrast, readable at arm's
  length on an iPad.
- Python: ruff + pytest. Every pipeline output gets its provenance written alongside it.

## Commands

```bash
# web (run inside web/)
pnpm install && pnpm dev          # http://localhost:3000
pnpm lint && pnpm typecheck && pnpm test && pnpm build

# data-pipeline (run inside data-pipeline/)
uv sync && uv run tp --help
uv run pytest && uv run ruff check .
```

## Gotchas found during setup

- **Next.js 16 is newer than most training data.** Read `web/AGENTS.md` (points at
  `web/node_modules/next/dist/docs/`) before using Next APIs. `ssr: false` dynamic imports
  must live in a client component (`MapClient.tsx`).
- **maplibre-gl is pinned to v5.** deck.gl 9.4's `@deck.gl/mapbox` reads `map.transform`,
  which MapLibre v6 removed, so it crashes in `centerCameraOnTerrain` once terrain is on.
  v6 also needs its worker self-hosted (it resolves it from `import.meta.url`, which
  Turbopack doesn't rewrite). Revisit when deck.gl supports v6.
- **`DeckOverlay` attaches one interleaved `MapboxOverlay` per map outside React's effect
  lifecycle.** StrictMode's double effect otherwise re-attaches deck to the same WebGL
  context and throws. `map.remove()` finalizes it.
- **maplibre-gl.css loads after `globals.css`,** so scope overrides under `.maplibregl-map`.
- **Tooling:** pnpm was installed with `npm i -g pnpm` because corepack's signature check fails
  on this machine. Vitest 5 wants Node 22.12+ or 24+; it runs on Node 23 with an engines
  warning. Prefer Node 24 LTS.
- The OpenFreeMap dark style logs a harmless `"wood-pattern" could not be loaded` warning.
