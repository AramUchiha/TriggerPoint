# Resident fire-report flow: frontend prototype

Date: 2026-09-26
Status: approved in brainstorming, pending spec review

## Intent

Trigger Point changes audience. It is no longer an internal pre-incident planning tool
for Glendale Fire Department chiefs. It becomes a **resident-facing app**:

> Open app → see map → drag a fire onto the map → see projected spread once enough
> residents report it → see where to go (shelter).

This spec covers a **frontend-only prototype** of that flow. There is no backend. Reports
live in local state. Anything that would normally come from other residents or from the
data pipeline is simulated, and the simulation is fenced into an explicit demo mode.

### Decisions made (from the user)

| Topic | Decision |
| --- | --- |
| Audience | Residents / civilians. Replaces the chief planning tool. |
| Reporting | Drag-and-drop a fire icon onto the map (Google Maps "Pegman" style). No separate "Report Fire" button flow. |
| Spread visibility | Spread is shown only once **3 or more** distinct reporters cluster on the same fire. |
| Confirmation | Crowd-based only ("mass reporting"). Labeled "Confirmed by N residents", never a bare "Confirmed". |
| Liveness | The dropped fire appears instantly. Reports are meant to be live and shared. The prototype simulates this locally. |
| Shelter | Evacuation zone + designated sites ("check if open") + exits flagged threatened/clear by the projected spread. No turn-by-turn routing. |
| Backend | None for now. Frontend flow only. |
| Missing data | Clearly fenced demo mode (`?demo=1`) with a persistent "PROTOTYPE · SIMULATED DATA" banner. |

### Non-goals

- Backend, realtime sync, accounts, abuse protection (designed later; Supabase was the
  recommended direction).
- Real spread modeling (browser minimum-travel-time on pipeline spread-rate rasters comes
  later behind the same interface).
- Real shelter, zone, or exit data sourcing.
- Native apps. This is the existing Next.js web app, laid out phone-first.
- Turn-by-turn routing.

## Safety posture

- **911 first.** Every report sheet leads with a Call 911 action. The app never claims a
  report alerted anyone.
- Persistent footer: "Projection, not a forecast · Call 911 for emergencies."
- Crowd status is always phrased as crowd status ("Reported by 3 residents",
  "Confirmed by 10 residents").
- An exit is never shown as "clear" when no spread model is loaded; it shows
  "status unknown".
- Demo data uses obviously synthetic names ("Demo Shelter A", "Zone DEMO-1"), never real
  place names, so a screenshot can't be mistaken for real guidance.

## Screens and flow

One screen: full-bleed 3D map, a bottom sheet, a fire drag button.

1. **Open app.** Map of the covered area with "you are here" (if location is permitted),
   the fire button bottom-right, and the footer. In demo mode, a banner at the top reads
   "PROTOTYPE · SIMULATED DATA".
2. **Drag fire.** Press and drag the fire button. A target ring follows the pointer over
   the map. On release, the pin drops instantly at that spot. Tapping without dragging, or
   the accessible "Report fire at map center" button, drops the pin at map center.
3. **Pin dropped.** Bottom sheet opens in the `report` state: **Call 911** first, then
   "1 of 3 reports needed to show spread". The pin renders as a faint "unverified" marker.
4. **3+ distinct reporters → Reported.** Marker strengthens, spread rings animate out
   (30 / 60 / 120 min). Sheet shows "Reported by N residents" and a "See where to go"
   button.
5. **10+ distinct reporters → Confirmed by residents.** Stronger marker styling. Sheet
   shows "Confirmed by N residents".
6. **Shelter sheet.** Your evacuation zone; each exit marked `threatened` / `clear` /
   `unknown` against the projected spread; nearest designated sites sorted by distance,
   each labeled "check if open".

Removed from the UI: the chief side panel (Community / Wind / Fire Projection /
Clearance / Verdict), layer toggles, and community camera presets. Kept: MapLibre map,
terrain, hillshade, deck.gl overlay, status bar/clock.

## Architecture

### Store: `web/src/store/app-store.ts` (rewritten)

```ts
interface Report {
  id: string;
  lng: number;
  lat: number;
  createdAtMs: number;
  reporterId: string;   // "me" for the local user; demo ids for simulated residents
  isMine: boolean;
}

interface AppState {
  reports: Report[];
  addReport(input: { lng: number; lat: number; reporterId: string }): void;
  resetReports(): void;
  selectedClusterId: string | null;
  selectCluster(id: string | null): void;
  sheet: "none" | "report" | "shelter";
  openSheet(sheet: "report" | "shelter"): void;
  closeSheet(): void;
  userLocation: { lng: number; lat: number } | null;
  setUserLocation(loc: { lng: number; lat: number } | null): void;
}
```

`addReport` is the single write path. The user's drop and the demo simulator both call it.
If the same `reporterId` already has a report within the cluster radius, the report is
**moved** instead of added (one reporter counts once). UI talks to the map only through
the store, per the existing convention.

### Pure logic: `web/src/lib/` (each with colocated tests)

- **`clusters.ts`**: `clusterReports(reports, nowMs, opts)` returns
  `Cluster[] = { id, centroid, reports, distinctReporters, status }`.
  - Defaults: `radiusM = 500`, `windowMin = 60`, `reportedAt = 3`, `confirmedAt = 10`.
  - Reports older than the window are dropped.
  - Clustering: single-linkage within `radiusM`. A report joins a cluster if it is within
    `radiusM` of any member.
  - `status`: `"unverified"` (< 3 distinct), `"reported"` (3–9), `"confirmed"` (≥ 10).
  - Cluster id is stable: the id of its earliest report.
  - This is the real rule, identical to what a future backend would enforce.
- **`geo.ts`**: `haversineM(a, b)`, `nearestSites(origin, sites)`, `pointInPolygon`,
  `isInBbox(point, bbox)`.
- **`exits.ts`**: `classifyExits(exits, spread | null)` returns each exit with
  `status: "threatened" | "clear" | "unknown"`. `threatened` if the exit point lies inside
  the largest (120 min) spread ring; `unknown` if `spread` is null.
- **`spread.ts`**: provider interface only.
  ```ts
  interface SpreadRing { minutes: number; polygon: [number, number][] }
  interface SpreadResult { rings: SpreadRing[]; provenance: Provenance }
  interface SpreadProvider { getSpread(origin: LngLat): SpreadResult }
  ```

### Shelter data interfaces: `web/src/lib/shelter.ts`

```ts
interface Zone { id: string; name: string; polygon: [number, number][]; provenance: Provenance }
interface Exit { id: string; name: string; lng: number; lat: number; provenance: Provenance }
interface Site { id: string; name: string; lng: number; lat: number; note: string; provenance: Provenance }
interface ShelterData { zones: Zone[]; exits: Exit[]; sites: Site[] }
```

Real data would be zod-validated at load. With no data, the Shelter sheet shows explicit
empty states ("No shelter sites loaded").

### Demo fence: `web/src/demo/`

The only place simulated data lives.

- `demo-spread.ts`: `SpreadProvider` that returns wind-stretched ellipses (fixed Santa Ana
  wind from 045°, so it elongates toward 225°), one ring per 30 / 60 / 120 min, growing
  over time. The rings are hatched/dashed to look distinct from real output.
- `demo-reporters.ts`: `startDemoReporters(clusterOrigin, addReport)`. After the user drops
  a pin, it adds a simulated report every ~1.5 s at a random offset ≤ 300 m, with distinct
  `demo-N` reporter ids, until 10 distinct reporters. It returns a stop function.
- `demo-shelter.ts`: synthetic zones, exits, and sites positioned around the covered bbox
  with obviously synthetic names.
- Every value carries `provenance: { source: "demo", ... }`.

**Activation:** `DemoProvider` (client component) reads `?demo=1` once and wires the demo
spread provider, reporters, and shelter data into React context. Without the flag, the
real flow runs with empty states.

**Enforcement:** an ESLint `no-restricted-imports` rule forbids importing `@/demo/*`
anywhere except `DemoProvider`.

**Rendering:** anything with `provenance.source === "demo"` renders in demo styling, and
the banner stays up whenever demo mode is on.

### Map: `web/src/components/map/`

- `scenario-layers.ts` → `buildLayers({ clusters, spread, exits, sites, userLocation })`
  returns deck.gl layers: report markers (styled by status), spread rings, exits
  (colored by status), sites, user location.
- `FireDragButton.tsx`: pointer-event drag with a ghost icon and target ring. On release,
  converts screen → lngLat via the map's `unproject` (it lives in `components/map/`
  because it needs the map instance) and calls `addReport`. Includes the
  "Report fire at map center" accessible alternative.
- Pin drop outside `manifest.json`'s `bbox` is rejected with "Outside the area we cover".

### UI: `web/src/components/sheet/`

- `BottomSheet.tsx`: container with `none | report | shelter` states.
- `ReportSheet.tsx`: Call 911 (`tel:911` link, number also shown as text), progress
  "N of 3 reports", status line, "See where to go".
- `ShelterSheet.tsx`: zone, exits with status, sites sorted by distance (from user
  location, or from the fire with a note when location is unavailable), "check if open".
- `DemoBanner.tsx` and a "Reset demo" button (demo mode only).

### Docs

- Rewrite `CLAUDE.md` for the resident mission: new pitch, new flow, safety posture, and
  a narrow, explicit exception to the no-fabricated-data rule for `src/demo/` behind
  `?demo=1` with the banner.

## Edge cases

| Case | Behavior |
| --- | --- |
| Drop outside covered bbox | Rejected with "Outside the area we cover". No report created. |
| Location permission denied | Map works. No "you are here". Sites sorted from the fire, with a note. |
| Same reporter drops again within 500 m | Moves their report. Count unchanged. |
| Multiple fires | Separate clusters, each with its own count and spread. Sheet follows the tapped cluster. |
| Reports older than 60 min | Aged out of clustering. |
| No spread provider | Cluster still reaches Reported. Sheet: "No spread model loaded". Exits: "status unknown". |
| No shelter data | Shelter sheet empty states. |
| Accessibility | Long-press drag, "Report fire at map center" button, ≥ 44 px targets, high-contrast dark theme. |

## Testing

- Vitest:
  - `clusters.test.ts`: thresholds (2 → unverified, 3 → reported, 10 → confirmed),
    distinct reporters (one reporter × 5 reports = 1), radius edge (499 m joins, 501 m
    doesn't), window expiry, stable ids, multiple clusters.
  - `geo.test.ts`: haversine known distances, point-in-polygon, bbox.
  - `exits.test.ts`: threatened / clear / unknown.
  - `demo-spread.test.ts`: rings grow monotonically with minutes; elongated toward 225°.
  - Store: `addReport` moves an existing report from the same reporter.
- Lint: the demo import restriction fails on a violating file.
- Manual: phone-sized viewport with `?demo=1`: drop → 911 sheet → 3 → spread → 10 →
  confirmed → shelter. Also without `?demo=1`: empty states appear.
- Gate: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.
