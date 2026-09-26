# Trigger Point

Wildfire evacuation pre-incident planning for the Glendale (CA) Fire Department: can a canyon
neighborhood evacuate before a fire arrives, and where is the trigger line where evacuation
must begin?

> **Status: scaffolding.** The map and UI shell run; the pipeline commands and the NWS proxy
> are stubs. No scenario data exists yet, and the app never shows made-up numbers.
> Everything it will show is a planning projection, not a forecast.

## Layout

| Path | What |
| --- | --- |
| `web/` | Next.js app (the product): MapLibre 3D terrain, deck.gl, zustand, zod |
| `data-pipeline/` | Python precompute (`tp` CLI): DEM, fuels, communities, WindNinja, ELMFIRE, export |
| `docker/` | WindNinja and ELMFIRE Dockerfiles (TODO stubs, do not build yet) |
| `docs/` | `methods.md`, `data-sources.md`, `demo.md` |
| `CLAUDE.md` | Project context, principles and conventions (read this first) |

## Prerequisites

- Node.js 22.12+ or 24 LTS
- pnpm 12 (`npm install -g pnpm`, or `corepack enable pnpm`)
- [uv](https://docs.astral.sh/uv/) (installs Python 3.12 for the pipeline automatically)
- Docker, later, for the model containers

## Web app

```bash
cd web
cp .env.example .env.local   # optional; defaults are keyless
pnpm install
pnpm dev                     # http://localhost:3000
```

Checks: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` (then `pnpm start` to serve
the production build).

Environment (`web/.env.example`):

- `NEXT_PUBLIC_MAP_PROVIDER`: `maplibre` (default, keyless OpenFreeMap). `mapbox` is reserved
  and not wired yet.
- `NWS_USER_AGENT`: server-only, required by api.weather.gov once `/api/weather` is built.

## Data pipeline

```bash
cd data-pipeline
uv sync
uv run tp --help             # every command is a stub for now: prints its plan, exits 1
uv run pytest
uv run ruff check .
```

Config is in `data-pipeline/config/` (`bbox.yaml`, `ignitions.yaml`, `exits.yaml`). Outputs go to
`web/public/scenarios/` (gitignored except `manifest.json`). Downloads go to `raw/` and
intermediates to `work/`, both gitignored.

## Offline demos

The app is designed to run without internet: static precomputed data and a self-hosted font.
The basemap and terrain tiles still load from the network. Caching them locally is a TODO
(see `CLAUDE.md`).

## License

MIT, see `LICENSE`. Map data © OpenStreetMap contributors (via OpenFreeMap / OpenMapTiles).
Terrain tiles: Mapzen / AWS Open Data.
