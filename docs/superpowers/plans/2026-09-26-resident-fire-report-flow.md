# Resident Fire-Report Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the chief planning UI with a phone-first resident flow: drag a fire onto the map → crowd-report thresholds (3 → spread, 10 → confirmed) → where to go, runnable end to end with a fenced `?demo=1` simulated-data mode and no backend.

**Architecture:** All rules (clustering, exit classification, copy) are pure functions in `web/src/lib/` with Vitest tests. A zustand store holds reports and UI state. A single client `DataProvider` supplies the spread provider and shelter data through React context; it is the only file allowed to import `web/src/demo/`, enforced by ESLint. The map renders reports, spread rings, exits, and sites with native MapLibre layers and `Marker`s (not deck.gl), because native layers drape on 3D terrain and deck layers at z=0 would be hidden inside the canyons.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict + `noUncheckedIndexedAccess`, react-map-gl 8 / MapLibre 5, zustand 5, Tailwind v4, Vitest, pnpm. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-26-resident-fire-report-flow-design.md`

## Global Constraints

- All commands run inside `web/`. Gate before every commit: `pnpm lint && pnpm typecheck && pnpm test` (plus `pnpm build` in the final task).
- Cluster rules, verbatim: `radiusM = 500`, `windowMin = 60`, `reportedAt = 3`, `confirmedAt = 10`. One reporter counts once per cluster.
- Status copy: `"Reported by N residents"`, `"Confirmed by N residents"`. Never a bare "Confirmed".
- Spread rings: 30 / 60 / 120 min.
- Every report sheet leads with **Call 911** (`tel:911` link, with "911" also shown as text). The app never says a report alerted anyone.
- Persistent footer text: `Projection, not a forecast · Call 911 for emergencies`.
- Demo mode only when the `demo` search param is exactly `"1"`. Banner text: `PROTOTYPE · SIMULATED DATA`.
- Simulated data lives only in `web/src/demo/`; only `web/src/components/data/DataProvider.tsx` may import it. Demo names are obviously synthetic ("Demo Shelter A", "Zone DEMO-1"); never real place names.
- Every simulated value carries `provenance.source === "demo"` (`Provenance` from `@/types/scenario`, fields `source`, `vintage`, optional `url`, `notes`).
- An exit is never "clear" when no spread is loaded; it is "unknown".
- Touch targets ≥ 44 px (`size-11` / `min-h-11`). Colours: `warning` amber, `critical` red, `accent` sky for interaction only. Units in names (`...M`, `...Min`, `...Ms`).
- Next.js 16: read `web/node_modules/next/dist/docs/` before using a Next API. `PageProps<"/">` is a generated global; `searchParams` is a `Promise`.
- Map-library code stays in `web/src/components/map/`.
- Commit messages: sentence case, ending with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`. Work on branch `resident-fire-flow`.

## Review Focus

1. **A drag released over UI chrome (status bar, banner, footer, sheet) or off the map** should create no report. Owner: Task 6 (`FireDragButton`, `elementFromPoint` check). Manual step in Task 8.
2. **A drag interrupted by the OS (`pointercancel`, e.g. an iOS edge swipe)** should clear the ghost and create no report. Owner: Task 6. Manual step in Task 8.
3. **The same resident dropping repeatedly on the same fire** should keep the count unchanged. Owner: Task 2 (`upsertReport` test "moves instead of adding").
4. **A demo flag that isn't exactly `1`** (`?demo=true`, `?demo=0`, repeated `?demo=1&demo=0`) should behave predictably: only a first value of `"1"` enables demo. Owner: Task 3 (`parseDemoFlag` tests).
5. **A selected report that ages out while its sheet is open** should show "This report has expired." instead of crashing or showing a stale count. Owner: Task 7 (`ReportSheet`). Manual step in Task 8.

---

## File map

| File | Status | Responsibility |
| --- | --- | --- |
| `web/src/lib/geo.ts` (+ test) | create | `LngLat`, `Ring`, `BBox`, distance, bearing, offset, point-in-polygon, bbox, sort, ring scaling |
| `web/src/lib/reports.ts` (+ test) | create | `Report`, `ReportInput`, `MY_REPORTER_ID`, `upsertReport` |
| `web/src/lib/clusters.ts` (+ test) | create | `CLUSTER_RULES`, `Cluster`, `clusterReports` |
| `web/src/lib/provenance.ts` | create | `DEMO_SOURCE`, `isDemo` |
| `web/src/lib/spread.ts` | create | `SpreadProvider` interface, ring minutes, `outerRing` |
| `web/src/lib/shelter.ts` | create | `Zone`, `ShelterExit`, `Site`, `ShelterData`, `zoneAt` |
| `web/src/lib/exits.ts` (+ test) | create | `classifyExits` |
| `web/src/lib/demo-flag.ts` (+ test) | create | `parseDemoFlag` |
| `web/src/lib/report-copy.ts` (+ test) | create | `reportCopy`, `formatMiles` |
| `web/src/lib/map-features.ts` (+ test) | create | reports / spread → GeoJSON |
| `web/src/demo/demo-spread.ts` (+ test) | create | simulated spread provider |
| `web/src/demo/demo-reporters.ts` (+ test) | create | simulated nearby reporters |
| `web/src/demo/demo-shelter.ts` (+ test) | create | simulated zones, exits, sites |
| `web/eslint.config.mjs` | modify | demo import fence |
| `web/src/store/app-store.ts` | rewrite | reports + sheet + location + notice |
| `web/src/components/data/DataProvider.tsx` | create | context; only importer of `@/demo` |
| `web/src/components/data/hooks.ts` | create | `useNow`, `useClusters`, `useSelectedCluster`, `useSpreadFor`, `useWatchUserLocation` |
| `web/src/config/coverage.ts` | create | `COVERAGE_BBOX` from `manifest.json` |
| `web/src/components/ui/DemoBanner.tsx`, `SafetyFooter.tsx`, `Notice.tsx` | create | chrome |
| `web/src/components/ui/StatusBar.tsx` | modify | resident copy |
| `web/src/app/page.tsx`, `layout.tsx`, `globals.css` | modify | wiring, metadata, control offsets |
| `web/src/components/map/MapView.tsx` | modify | drop planner layers, mount resident layers + drag button |
| `web/src/components/map/ResidentLayers.tsx`, `useRevealProgress.ts`, `FireDragButton.tsx` | create | map rendering and drag-to-report |
| `web/src/components/sheet/BottomSheet.tsx`, `ReportSheet.tsx`, `ShelterSheet.tsx` | create | bottom sheet |
| `web/src/components/panel/*`, `map/LayerToggles.tsx`, `map/CameraController.tsx`, `map/scenario-layers.ts`, `ui/Toggle.tsx`, `config/communities.ts`, `config/layout.ts` | delete | planner UI |
| `CLAUDE.md` | modify | resident mission + demo exception |

`web/src/components/map/DeckOverlay.tsx` stays (unmounted) for the future real spread raster; it records a StrictMode gotcha.

---

### Task 1: Geo helpers

**Files:**
- Create: `web/src/lib/geo.ts`
- Test: `web/src/lib/geo.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  export interface LngLat { lng: number; lat: number }
  export type Ring = [number, number][];              // [lng, lat] vertices
  export type BBox = readonly [number, number, number, number]; // [west, south, east, north]
  export function haversineM(a: LngLat, b: LngLat): number
  export function bearingDeg(from: LngLat, to: LngLat): number   // [0, 360), compass
  export function offsetM(origin: LngLat, eastM: number, northM: number): LngLat
  export function pointInPolygon(p: LngLat, ring: Ring): boolean
  export function isInBbox(p: LngLat, bbox: BBox): boolean
  export function sortByDistance<T extends LngLat>(origin: LngLat, items: readonly T[]): (T & { distanceM: number })[]
  export function scaleRing(ring: Ring, origin: LngLat, t: number): Ring
  ```

- [ ] **Step 1: Write the failing test** at `web/src/lib/geo.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  bearingDeg,
  haversineM,
  isInBbox,
  offsetM,
  pointInPolygon,
  scaleRing,
  sortByDistance,
  type Ring,
} from "./geo";

// Synthetic coordinates near the study area; not data.
const O = { lng: -118.2, lat: 34.2 };

describe("haversineM", () => {
  it("measures one degree of latitude as ~111.195 km", () => {
    expect(haversineM({ lng: 0, lat: 0 }, { lng: 0, lat: 1 })).toBeCloseTo(111_195, -1);
  });
  it("shrinks longitude distance by cos(latitude)", () => {
    expect(haversineM({ lng: 0, lat: 34.2 }, { lng: 0.001, lat: 34.2 })).toBeCloseTo(91.97, 1);
  });
  it("is zero for the same point", () => {
    expect(haversineM(O, O)).toBe(0);
  });
});

describe("offsetM + bearingDeg", () => {
  it("round-trips a 300 m east / 400 m north offset to ~500 m", () => {
    expect(haversineM(O, offsetM(O, 300, 400))).toBeCloseTo(500, 0);
  });
  it("points south-west for a negative east and north offset", () => {
    expect(bearingDeg(O, offsetM(O, -100, -100))).toBeCloseTo(225, 0);
  });
  it("returns bearings in [0, 360)", () => {
    const b = bearingDeg(O, offsetM(O, -1, 100));
    expect(b).toBeGreaterThanOrEqual(0);
    expect(b).toBeLessThan(360);
  });
});

describe("pointInPolygon", () => {
  const square: Ring = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1],
    [0, 0],
  ];
  it("detects inside and outside", () => {
    expect(pointInPolygon({ lng: 0.5, lat: 0.5 }, square)).toBe(true);
    expect(pointInPolygon({ lng: 1.5, lat: 0.5 }, square)).toBe(false);
  });
});

describe("isInBbox", () => {
  const bbox = [-118.32, 34.12, -118.17, 34.27] as const;
  it("includes the interior and edges, excludes outside", () => {
    expect(isInBbox({ lng: -118.2, lat: 34.2 }, bbox)).toBe(true);
    expect(isInBbox({ lng: -118.32, lat: 34.12 }, bbox)).toBe(true);
    expect(isInBbox({ lng: -118.1, lat: 34.2 }, bbox)).toBe(false);
  });
});

describe("sortByDistance", () => {
  it("sorts nearest first and attaches distanceM", () => {
    const far = { id: "far", ...offsetM(O, 0, 2000) };
    const near = { id: "near", ...offsetM(O, 0, 100) };
    const sorted = sortByDistance(O, [far, near]);
    expect(sorted.map((s) => s.id)).toEqual(["near", "far"]);
    expect(sorted[0]?.distanceM).toBeCloseTo(100, 0);
  });
});

describe("scaleRing", () => {
  it("scales vertices toward the origin", () => {
    const ring: Ring = [[O.lng + 0.01, O.lat + 0.02]];
    expect(scaleRing(ring, O, 0.5)[0]?.[0]).toBeCloseTo(O.lng + 0.005, 10);
    expect(scaleRing(ring, O, 0.5)[0]?.[1]).toBeCloseTo(O.lat + 0.01, 10);
    expect(scaleRing(ring, O, 0)[0]).toEqual([O.lng, O.lat]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/geo.test.ts`
Expected: FAIL, `Failed to resolve import "./geo"`.

- [ ] **Step 3: Write the implementation** at `web/src/lib/geo.ts`

```ts
/** WGS84 point in degrees. */
export interface LngLat {
  lng: number;
  lat: number;
}

/** Polygon ring as [lng, lat] vertices. */
export type Ring = [number, number][];

/** [west, south, east, north] in WGS84 degrees. */
export type BBox = readonly [number, number, number, number];

const EARTH_RADIUS_M = 6_371_008.8;
const M_PER_DEG_LAT = (Math.PI / 180) * EARTH_RADIUS_M;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function haversineM(a: LngLat, b: LngLat): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial compass bearing from `from` to `to`, degrees in [0, 360). */
export function bearingDeg(from: LngLat, to: LngLat): number {
  const phi1 = toRad(from.lat);
  const phi2 = toRad(to.lat);
  const dLambda = toRad(to.lng - from.lng);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Moves a point by metres east / north. Flat-earth approximation; fine at neighbourhood scale. */
export function offsetM(origin: LngLat, eastM: number, northM: number): LngLat {
  return {
    lng: origin.lng + eastM / (M_PER_DEG_LAT * Math.cos(toRad(origin.lat))),
    lat: origin.lat + northM / M_PER_DEG_LAT,
  };
}

/** Ray casting; `ring` may be open or closed. */
export function pointInPolygon(p: LngLat, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    const crosses = yi > p.lat !== yj > p.lat && p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function isInBbox(p: LngLat, [west, south, east, north]: BBox): boolean {
  return p.lng >= west && p.lng <= east && p.lat >= south && p.lat <= north;
}

export function sortByDistance<T extends LngLat>(
  origin: LngLat,
  items: readonly T[],
): (T & { distanceM: number })[] {
  return items
    .map((item) => ({ ...item, distanceM: haversineM(origin, item) }))
    .sort((a, b) => a.distanceM - b.distanceM);
}

/** Scales a ring about `origin`; t = 0 collapses it to the origin, t = 1 leaves it unchanged. */
export function scaleRing(ring: Ring, origin: LngLat, t: number): Ring {
  return ring.map(([lng, lat]) => [origin.lng + (lng - origin.lng) * t, origin.lat + (lat - origin.lat) * t]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/geo.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add src/lib/geo.ts src/lib/geo.test.ts
git commit -m "Add geo helpers for the resident flow

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Reports and clustering rules

**Files:**
- Create: `web/src/lib/reports.ts`, `web/src/lib/clusters.ts`
- Test: `web/src/lib/reports.test.ts`, `web/src/lib/clusters.test.ts`

**Interfaces:**
- Consumes: `LngLat`, `haversineM` from `@/lib/geo` (Task 1).
- Produces:
  ```ts
  // reports.ts
  export const MY_REPORTER_ID = "me";
  export interface Report { id: string; lng: number; lat: number; createdAtMs: number; reporterId: string }
  export interface ReportInput { lng: number; lat: number; reporterId: string }
  export function upsertReport(reports: readonly Report[], input: ReportInput, nowMs: number,
    makeId: () => string, rules?: Pick<ClusterRules, "radiusM" | "windowMin">): { reports: Report[]; id: string }
  // clusters.ts
  export interface ClusterRules { radiusM: number; windowMin: number; reportedAt: number; confirmedAt: number }
  export const CLUSTER_RULES: ClusterRules  // { radiusM: 500, windowMin: 60, reportedAt: 3, confirmedAt: 10 }
  export type ClusterStatus = "unverified" | "reported" | "confirmed";
  export interface Cluster { id: string; centroid: LngLat; reports: Report[]; distinctReporters: number; status: ClusterStatus }
  export function clusterReports(reports: readonly Report[], nowMs: number, rules?: ClusterRules): Cluster[]
  ```

- [ ] **Step 1: Write the failing tests**

`web/src/lib/clusters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { CLUSTER_RULES, clusterReports } from "./clusters";
import { offsetM } from "./geo";
import type { Report } from "./reports";

// Synthetic reports; not data.
const O = { lng: -118.2, lat: 34.2 };
const NOW = 1_800_000_000_000;
const MIN = 60_000;

let n = 0;
function report(eastM: number, reporterId: string, ageMin = 0): Report {
  const p = offsetM(O, eastM, 0);
  n += 1;
  return { id: `t${n}`, lng: p.lng, lat: p.lat, createdAtMs: NOW - ageMin * MIN - n, reporterId };
}

describe("clusterReports", () => {
  it("uses the spec thresholds", () => {
    expect(CLUSTER_RULES).toEqual({ radiusM: 500, windowMin: 60, reportedAt: 3, confirmedAt: 10 });
  });

  it("is unverified at 2 distinct reporters, reported at 3, confirmed at 10", () => {
    const two = [report(0, "a"), report(10, "b")];
    expect(clusterReports(two, NOW)[0]?.status).toBe("unverified");
    const three = [...two, report(20, "c")];
    expect(clusterReports(three, NOW)[0]?.status).toBe("reported");
    const ten = Array.from({ length: 10 }, (_, i) => report(i * 10, `r${i}`));
    const c = clusterReports(ten, NOW)[0];
    expect(c?.status).toBe("confirmed");
    expect(c?.distinctReporters).toBe(10);
  });

  it("counts one reporter once however many reports they make", () => {
    const same = Array.from({ length: 5 }, (_, i) => report(i * 10, "a"));
    const [c] = clusterReports(same, NOW);
    expect(c?.distinctReporters).toBe(1);
    expect(c?.status).toBe("unverified");
  });

  it("joins at 499 m and splits at 501 m", () => {
    expect(clusterReports([report(0, "a"), report(499, "b")], NOW)).toHaveLength(1);
    expect(clusterReports([report(0, "a"), report(501, "b")], NOW)).toHaveLength(2);
  });

  it("links a chain of reports each within the radius (single linkage)", () => {
    const chain = [report(0, "a"), report(400, "b"), report(800, "c")];
    const clusters = clusterReports(chain, NOW);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.status).toBe("reported");
  });

  it("drops reports older than the window", () => {
    const clusters = clusterReports([report(0, "a", 61), report(10, "b", 59)], NOW);
    expect(clusters).toHaveLength(1);
    expect(clusters[0]?.reports.map((r) => r.reporterId)).toEqual(["b"]);
  });

  it("keeps a stable id: the earliest report's id", () => {
    const first = report(0, "a", 10);
    const later = report(10, "b", 1);
    expect(clusterReports([later, first], NOW)[0]?.id).toBe(first.id);
  });

  it("puts the centroid at the mean position", () => {
    const [c] = clusterReports([report(-100, "a"), report(100, "b")], NOW);
    expect(c?.centroid.lng).toBeCloseTo(O.lng, 6);
    expect(c?.centroid.lat).toBeCloseTo(O.lat, 6);
  });

  it("returns clusters oldest first", () => {
    const older = report(0, "a", 20);
    const newer = report(5000, "b", 1);
    expect(clusterReports([newer, older], NOW).map((c) => c.id)).toEqual([older.id, newer.id]);
  });
});
```

`web/src/lib/reports.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { offsetM } from "./geo";
import { MY_REPORTER_ID, upsertReport, type Report } from "./reports";

// Synthetic reports; not data.
const O = { lng: -118.2, lat: 34.2 };
const NOW = 1_800_000_000_000;
let seq = 0;
const makeId = () => `id${++seq}`;

describe("upsertReport", () => {
  it("appends a first report and returns its id", () => {
    const { reports, id } = upsertReport([], { ...O, reporterId: MY_REPORTER_ID }, NOW, makeId);
    expect(reports).toHaveLength(1);
    expect(reports[0]).toMatchObject({ id, lng: O.lng, lat: O.lat, createdAtMs: NOW, reporterId: "me" });
  });

  it("moves instead of adding when the same reporter drops within 500 m", () => {
    const first = upsertReport([], { ...O, reporterId: "me" }, NOW, makeId);
    const p = offsetM(O, 200, 0);
    const second = upsertReport(first.reports, { ...p, reporterId: "me" }, NOW + 1000, makeId);
    expect(second.reports).toHaveLength(1);
    expect(second.id).toBe(first.id);
    expect(second.reports[0]).toMatchObject({ lng: p.lng, createdAtMs: NOW + 1000 });
  });

  it("adds a second report when the same reporter drops more than 500 m away", () => {
    const first = upsertReport([], { ...O, reporterId: "me" }, NOW, makeId);
    const second = upsertReport(first.reports, { ...offsetM(O, 900, 0), reporterId: "me" }, NOW, makeId);
    expect(second.reports).toHaveLength(2);
    expect(second.id).not.toBe(first.id);
  });

  it("adds when a different reporter drops at the same spot", () => {
    const first = upsertReport([], { ...O, reporterId: "me" }, NOW, makeId);
    const second = upsertReport(first.reports, { ...O, reporterId: "demo-1" }, NOW, makeId);
    expect(second.reports).toHaveLength(2);
  });

  it("does not move an expired report; adds a fresh one", () => {
    const old: Report = { id: "old", ...O, createdAtMs: NOW - 61 * 60_000, reporterId: "me" };
    const { reports, id } = upsertReport([old], { ...O, reporterId: "me" }, NOW, makeId);
    expect(reports).toHaveLength(2);
    expect(id).not.toBe("old");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/lib/clusters.test.ts src/lib/reports.test.ts`
Expected: FAIL, cannot resolve `./clusters` / `./reports`.

- [ ] **Step 3: Write the implementation**

`web/src/lib/clusters.ts`:

```ts
import { haversineM, type LngLat } from "./geo";
import type { Report } from "./reports";

export interface ClusterRules {
  /** Reports within this distance of any cluster member join the cluster. */
  radiusM: number;
  /** Reports older than this are ignored. */
  windowMin: number;
  /** Distinct reporters needed before projected spread is shown. */
  reportedAt: number;
  /** Distinct reporters needed for "Confirmed by N residents". */
  confirmedAt: number;
}

/** The crowd-reporting rule. A future backend must enforce the same values. */
export const CLUSTER_RULES: ClusterRules = { radiusM: 500, windowMin: 60, reportedAt: 3, confirmedAt: 10 };

export type ClusterStatus = "unverified" | "reported" | "confirmed";

export interface Cluster {
  /** The earliest report's id, so it stays stable as reports join. */
  id: string;
  centroid: LngLat;
  /** Oldest first. */
  reports: Report[];
  distinctReporters: number;
  status: ClusterStatus;
}

function statusFor(distinctReporters: number, rules: ClusterRules): ClusterStatus {
  if (distinctReporters >= rules.confirmedAt) return "confirmed";
  if (distinctReporters >= rules.reportedAt) return "reported";
  return "unverified";
}

/** Single-linkage clustering of live reports. Returns clusters oldest first. */
export function clusterReports(
  reports: readonly Report[],
  nowMs: number,
  rules: ClusterRules = CLUSTER_RULES,
): Cluster[] {
  const windowMs = rules.windowMin * 60_000;
  const live = reports
    .filter((r) => nowMs - r.createdAtMs <= windowMs)
    .sort((a, b) => a.createdAtMs - b.createdAtMs || a.id.localeCompare(b.id));

  // Union-find where each root is the lowest (earliest) index in its set.
  const parent = live.map((_, i) => i);
  const find = (i: number): number => {
    let root = i;
    while (parent[root] !== root) root = parent[root]!;
    return root;
  };
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      if (haversineM(live[i]!, live[j]!) > rules.radiusM) continue;
      const ri = find(i);
      const rj = find(j);
      if (ri !== rj) parent[Math.max(ri, rj)] = Math.min(ri, rj);
    }
  }

  const groups = new Map<number, Report[]>();
  live.forEach((r, i) => {
    const root = find(i);
    groups.set(root, [...(groups.get(root) ?? []), r]);
  });

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, members]) => {
      const distinctReporters = new Set(members.map((r) => r.reporterId)).size;
      return {
        id: members[0]!.id,
        centroid: {
          lng: members.reduce((sum, r) => sum + r.lng, 0) / members.length,
          lat: members.reduce((sum, r) => sum + r.lat, 0) / members.length,
        },
        reports: members,
        distinctReporters,
        status: statusFor(distinctReporters, rules),
      };
    });
}
```

`web/src/lib/reports.ts`:

```ts
import { CLUSTER_RULES, type ClusterRules } from "./clusters";
import { haversineM } from "./geo";

/** Reporter id for the person using this device. */
export const MY_REPORTER_ID = "me";

export interface Report {
  id: string;
  lng: number;
  lat: number;
  createdAtMs: number;
  reporterId: string;
}

export interface ReportInput {
  lng: number;
  lat: number;
  reporterId: string;
}

/**
 * Adds a report, or moves the reporter's existing live report if it is within the
 * cluster radius, so one reporter never counts twice for the same fire.
 */
export function upsertReport(
  reports: readonly Report[],
  input: ReportInput,
  nowMs: number,
  makeId: () => string,
  rules: Pick<ClusterRules, "radiusM" | "windowMin"> = CLUSTER_RULES,
): { reports: Report[]; id: string } {
  const windowMs = rules.windowMin * 60_000;
  const existing = reports.find(
    (r) =>
      r.reporterId === input.reporterId &&
      nowMs - r.createdAtMs <= windowMs &&
      haversineM(r, input) <= rules.radiusM,
  );
  if (existing) {
    const moved: Report = { ...existing, lng: input.lng, lat: input.lat, createdAtMs: nowMs };
    return { reports: reports.map((r) => (r.id === existing.id ? moved : r)), id: existing.id };
  }
  const id = makeId();
  return { reports: [...reports, { id, ...input, createdAtMs: nowMs }], id };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/lib/clusters.test.ts src/lib/reports.test.ts`
Expected: PASS (9 + 5 tests).

- [ ] **Step 5: Commit**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add src/lib/reports.ts src/lib/reports.test.ts src/lib/clusters.ts src/lib/clusters.test.ts
git commit -m "Add crowd-report clustering rules (3 reported, 10 confirmed)

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Spread, shelter, exit, copy, and demo-flag contracts

**Files:**
- Create: `web/src/lib/provenance.ts`, `web/src/lib/spread.ts`, `web/src/lib/shelter.ts`, `web/src/lib/exits.ts`, `web/src/lib/demo-flag.ts`, `web/src/lib/report-copy.ts`
- Test: `web/src/lib/exits.test.ts`, `web/src/lib/demo-flag.test.ts`, `web/src/lib/report-copy.test.ts`

**Interfaces:**
- Consumes: `LngLat`, `Ring`, `pointInPolygon` (Task 1); `Cluster`, `CLUSTER_RULES`, `ClusterRules` (Task 2); `Provenance` from `@/types/scenario` (existing).
- Produces:
  ```ts
  // provenance.ts
  export const DEMO_SOURCE = "demo";
  export function isDemo(p: Provenance): boolean
  // spread.ts
  export const SPREAD_RING_MINUTES = [30, 60, 120] as const;
  export interface SpreadRing { minutes: number; polygon: Ring }
  export interface SpreadResult { origin: LngLat; rings: SpreadRing[]; provenance: Provenance }
  export interface SpreadProvider { getSpread(origin: LngLat): SpreadResult }
  export function outerRing(spread: SpreadResult): SpreadRing | undefined
  // shelter.ts
  export interface Zone { id: string; name: string; polygon: Ring; provenance: Provenance }
  export interface ShelterExit { id: string; name: string; lng: number; lat: number; provenance: Provenance }
  export interface Site { id: string; name: string; lng: number; lat: number; note: string; provenance: Provenance }
  export interface ShelterData { zones: Zone[]; exits: ShelterExit[]; sites: Site[] }
  export function zoneAt(p: LngLat, zones: readonly Zone[]): Zone | null
  // exits.ts
  export type ExitStatus = "threatened" | "clear" | "unknown";
  export type ClassifiedExit = ShelterExit & { status: ExitStatus };
  export function classifyExits(exits: readonly ShelterExit[], spread: SpreadResult | null): ClassifiedExit[]
  // demo-flag.ts
  export function parseDemoFlag(value: string | string[] | undefined): boolean
  // report-copy.ts
  export interface ReportCopy { title: string; detail: string; tone: "muted" | "warning" | "critical"; showShelter: boolean }
  export function reportCopy(cluster: Pick<Cluster, "status" | "distinctReporters">, hasSpreadModel: boolean, rules?: ClusterRules): ReportCopy
  export function formatMiles(distanceM: number): string
  ```

- [ ] **Step 1: Write the failing tests**

`web/src/lib/exits.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { classifyExits } from "./exits";
import type { ShelterExit } from "./shelter";
import type { SpreadResult } from "./spread";

// Synthetic fixtures; not data.
const provenance = { source: "test fixture", vintage: "n/a" };
const exits: ShelterExit[] = [
  { id: "in", name: "Inside", lng: 0.5, lat: 0.5, provenance },
  { id: "out", name: "Outside", lng: 5, lat: 5, provenance },
];
const spread: SpreadResult = {
  origin: { lng: 0.1, lat: 0.1 },
  provenance,
  rings: [
    { minutes: 30, polygon: [[0, 0], [0.2, 0], [0.2, 0.2], [0, 0.2], [0, 0]] },
    { minutes: 120, polygon: [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]] },
  ],
};

describe("classifyExits", () => {
  it("marks exits inside the outermost (120 min) ring as threatened, others clear", () => {
    expect(classifyExits(exits, spread).map((e) => [e.id, e.status])).toEqual([
      ["in", "threatened"],
      ["out", "clear"],
    ]);
  });

  it("never says clear without a spread model", () => {
    expect(classifyExits(exits, null).map((e) => e.status)).toEqual(["unknown", "unknown"]);
  });

  it("is unknown when the spread has no rings", () => {
    expect(classifyExits(exits, { ...spread, rings: [] }).map((e) => e.status)).toEqual(["unknown", "unknown"]);
  });
});
```

`web/src/lib/demo-flag.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { parseDemoFlag } from "./demo-flag";

describe("parseDemoFlag", () => {
  it("is on only for exactly '1'", () => {
    expect(parseDemoFlag("1")).toBe(true);
    expect(parseDemoFlag("true")).toBe(false);
    expect(parseDemoFlag("0")).toBe(false);
    expect(parseDemoFlag("")).toBe(false);
    expect(parseDemoFlag(undefined)).toBe(false);
  });

  it("uses the first value when the param repeats", () => {
    expect(parseDemoFlag(["1", "0"])).toBe(true);
    expect(parseDemoFlag(["0", "1"])).toBe(false);
    expect(parseDemoFlag([])).toBe(false);
  });
});
```

`web/src/lib/report-copy.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatMiles, reportCopy } from "./report-copy";

describe("reportCopy", () => {
  it("shows progress toward 3 while unverified, with no shelter button", () => {
    expect(reportCopy({ status: "unverified", distinctReporters: 1 }, true)).toEqual({
      title: "Unverified report",
      detail: "1 of 3 reports needed to show spread",
      tone: "muted",
      showShelter: false,
    });
  });

  it("says 'Reported by N residents' at 3+", () => {
    const copy = reportCopy({ status: "reported", distinctReporters: 4 }, true);
    expect(copy.title).toBe("Reported by 4 residents");
    expect(copy.detail).toBe("Projected spread: 30, 60 and 120 minute rings");
    expect(copy.tone).toBe("warning");
    expect(copy.showShelter).toBe(true);
  });

  it("never says a bare 'Confirmed'", () => {
    const copy = reportCopy({ status: "confirmed", distinctReporters: 12 }, true);
    expect(copy.title).toBe("Confirmed by 12 residents");
    expect(copy.tone).toBe("critical");
  });

  it("says no spread model is loaded when there is none", () => {
    expect(reportCopy({ status: "reported", distinctReporters: 3 }, false).detail).toBe(
      "No spread model loaded",
    );
  });
});

describe("formatMiles", () => {
  it("formats metres as miles with one decimal", () => {
    expect(formatMiles(1609.344)).toBe("1.0 mi");
    expect(formatMiles(3380)).toBe("2.1 mi");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/lib/exits.test.ts src/lib/demo-flag.test.ts src/lib/report-copy.test.ts`
Expected: FAIL, unresolved imports.

- [ ] **Step 3: Write the implementation**

`web/src/lib/provenance.ts`:

```ts
import type { Provenance } from "@/types/scenario";

/** `Provenance.source` for simulated prototype data (src/demo, ?demo=1 only). */
export const DEMO_SOURCE = "demo";

export function isDemo(provenance: Provenance): boolean {
  return provenance.source === DEMO_SOURCE;
}
```

`web/src/lib/spread.ts`:

```ts
import type { Provenance } from "@/types/scenario";
import type { LngLat, Ring } from "./geo";

/** Minutes after ignition for each projected spread ring. */
export const SPREAD_RING_MINUTES = [30, 60, 120] as const;

export interface SpreadRing {
  minutes: number;
  polygon: Ring;
}

export interface SpreadResult {
  origin: LngLat;
  rings: SpreadRing[];
  provenance: Provenance;
}

/**
 * Projects spread from an ignition point. Only the demo provider exists today; the real one
 * (browser minimum-travel-time on pipeline spread-rate rasters) plugs in behind this interface.
 */
export interface SpreadProvider {
  getSpread(origin: LngLat): SpreadResult;
}

/** The ring with the most minutes. */
export function outerRing(spread: SpreadResult): SpreadRing | undefined {
  return spread.rings.reduce<SpreadRing | undefined>(
    (outer, ring) => (!outer || ring.minutes > outer.minutes ? ring : outer),
    undefined,
  );
}
```

`web/src/lib/shelter.ts`:

```ts
import type { Provenance } from "@/types/scenario";
import { pointInPolygon, type LngLat, type Ring } from "./geo";

export interface Zone {
  id: string;
  name: string;
  polygon: Ring;
  provenance: Provenance;
}

export interface ShelterExit {
  id: string;
  name: string;
  lng: number;
  lat: number;
  provenance: Provenance;
}

export interface Site {
  id: string;
  name: string;
  lng: number;
  lat: number;
  /** Shown under the name, e.g. "Check if open". */
  note: string;
  provenance: Provenance;
}

export interface ShelterData {
  zones: Zone[];
  exits: ShelterExit[];
  sites: Site[];
}

export function zoneAt(p: LngLat, zones: readonly Zone[]): Zone | null {
  return zones.find((z) => pointInPolygon(p, z.polygon)) ?? null;
}
```

`web/src/lib/exits.ts`:

```ts
import { pointInPolygon } from "./geo";
import type { ShelterExit } from "./shelter";
import { outerRing, type SpreadResult } from "./spread";

export type ExitStatus = "threatened" | "clear" | "unknown";
export type ClassifiedExit = ShelterExit & { status: ExitStatus };

/** Threatened if inside the outermost projected ring. Never "clear" without a spread. */
export function classifyExits(exits: readonly ShelterExit[], spread: SpreadResult | null): ClassifiedExit[] {
  const ring = spread ? outerRing(spread) : undefined;
  return exits.map((exit) => ({
    ...exit,
    status: !ring ? "unknown" : pointInPolygon(exit, ring.polygon) ? "threatened" : "clear",
  }));
}
```

`web/src/lib/demo-flag.ts`:

```ts
/** Demo mode is on only when the first `demo` search param is exactly "1". */
export function parseDemoFlag(value: string | string[] | undefined): boolean {
  const first = Array.isArray(value) ? value[0] : value;
  return first === "1";
}
```

`web/src/lib/report-copy.ts`:

```ts
import { CLUSTER_RULES, type Cluster, type ClusterRules } from "./clusters";
import { SPREAD_RING_MINUTES } from "./spread";

export interface ReportCopy {
  title: string;
  detail: string;
  tone: "muted" | "warning" | "critical";
  showShelter: boolean;
}

const RINGS_TEXT = `${SPREAD_RING_MINUTES.slice(0, -1).join(", ")} and ${SPREAD_RING_MINUTES.at(-1)} minute rings`;

/** Crowd status is always phrased as crowd status, never as an official confirmation. */
export function reportCopy(
  cluster: Pick<Cluster, "status" | "distinctReporters">,
  hasSpreadModel: boolean,
  rules: ClusterRules = CLUSTER_RULES,
): ReportCopy {
  const n = cluster.distinctReporters;
  if (cluster.status === "unverified") {
    return {
      title: "Unverified report",
      detail: `${n} of ${rules.reportedAt} reports needed to show spread`,
      tone: "muted",
      showShelter: false,
    };
  }
  const detail = hasSpreadModel ? `Projected spread: ${RINGS_TEXT}` : "No spread model loaded";
  return cluster.status === "confirmed"
    ? { title: `Confirmed by ${n} residents`, detail, tone: "critical", showShelter: true }
    : { title: `Reported by ${n} residents`, detail, tone: "warning", showShelter: true };
}

export function formatMiles(distanceM: number): string {
  return `${(distanceM / 1609.344).toFixed(1)} mi`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/lib`
Expected: PASS (all lib tests).

- [ ] **Step 5: Commit**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add src/lib
git commit -m "Add spread, shelter, exit, and report-copy contracts

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Demo fence (simulated data + ESLint rule)

**Files:**
- Create: `web/src/demo/demo-spread.ts`, `web/src/demo/demo-reporters.ts`, `web/src/demo/demo-shelter.ts`, `web/src/config/coverage.ts`
- Modify: `web/eslint.config.mjs`
- Test: `web/src/demo/demo-spread.test.ts`, `web/src/demo/demo-reporters.test.ts`, `web/src/demo/demo-shelter.test.ts`

**Interfaces:**
- Consumes: `offsetM`, `haversineM`, `bearingDeg`, `isInBbox`, `LngLat`, `Ring` (Task 1); `ReportInput` (Task 2); `DEMO_SOURCE`, `SPREAD_RING_MINUTES`, `SpreadProvider`, `ShelterData` (Task 3).
- Produces:
  ```ts
  // config/coverage.ts
  export const COVERAGE_BBOX: BBox   // from public/scenarios/manifest.json: [-118.32, 34.12, -118.17, 34.27]
  // demo/demo-spread.ts
  export const DEMO_WIND_FROM_DEG = 45;
  export const DEMO_HEAD_M_PER_MIN = 50;
  export const demoSpreadProvider: SpreadProvider
  // demo/demo-reporters.ts
  export const DEMO_REPORT_INTERVAL_MS = 1500;
  export const DEMO_REPORTER_COUNT = 9;   // plus the user = 10 = confirmed
  export function demoReportPositions(origin: LngLat, count?: number): LngLat[]
  export function startDemoReporters(origin: LngLat, addReport: (input: ReportInput) => void): () => void
  // demo/demo-shelter.ts
  export const DEMO_SHELTER: ShelterData
  ```

- [ ] **Step 1: Write the failing tests**

`web/src/demo/demo-spread.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { bearingDeg, haversineM } from "@/lib/geo";
import { DEMO_SOURCE } from "@/lib/provenance";
import { DEMO_HEAD_M_PER_MIN, demoSpreadProvider } from "./demo-spread";

const O = { lng: -118.24, lat: 34.2 };

function farthest(polygon: [number, number][]) {
  return polygon
    .map(([lng, lat]) => ({ lng, lat }))
    .reduce((best, p) => (haversineM(O, p) > haversineM(O, best) ? p : best));
}

describe("demoSpreadProvider", () => {
  const spread = demoSpreadProvider.getSpread(O);

  it("returns 30, 60 and 120 minute rings tagged as demo", () => {
    expect(spread.rings.map((r) => r.minutes)).toEqual([30, 60, 120]);
    expect(spread.provenance.source).toBe(DEMO_SOURCE);
    expect(spread.origin).toEqual(O);
  });

  it("grows monotonically with minutes", () => {
    const reach = spread.rings.map((r) => haversineM(O, farthest(r.polygon)));
    expect(reach[0]!).toBeLessThan(reach[1]!);
    expect(reach[1]!).toBeLessThan(reach[2]!);
  });

  it("runs downwind toward 225° (Santa Ana from 045°) at the head rate", () => {
    for (const ring of spread.rings) {
      const head = farthest(ring.polygon);
      expect(bearingDeg(O, head)).toBeCloseTo(225, 0);
      expect(haversineM(O, head)).toBeCloseTo(DEMO_HEAD_M_PER_MIN * ring.minutes, -1);
    }
  });

  it("closes each ring", () => {
    for (const ring of spread.rings) expect(ring.polygon.at(0)).toEqual(ring.polygon.at(-1));
  });
});
```

`web/src/demo/demo-reporters.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { haversineM } from "@/lib/geo";
import {
  DEMO_REPORTER_COUNT,
  DEMO_REPORT_INTERVAL_MS,
  demoReportPositions,
  startDemoReporters,
} from "./demo-reporters";

const O = { lng: -118.24, lat: 34.2 };

describe("demoReportPositions", () => {
  it("returns 9 distinct positions within 300 m", () => {
    const positions = demoReportPositions(O);
    expect(positions).toHaveLength(DEMO_REPORTER_COUNT);
    expect(DEMO_REPORTER_COUNT).toBe(9);
    for (const p of positions) expect(haversineM(O, p)).toBeLessThanOrEqual(300);
    expect(new Set(positions.map((p) => `${p.lng},${p.lat}`)).size).toBe(positions.length);
  });
});

describe("startDemoReporters", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("adds one report per interval with distinct reporter ids, then stops at 9", () => {
    const add = vi.fn();
    startDemoReporters(O, add);
    vi.advanceTimersByTime(DEMO_REPORT_INTERVAL_MS * 2);
    expect(add).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(DEMO_REPORT_INTERVAL_MS * 20);
    expect(add).toHaveBeenCalledTimes(9);
    const ids = add.mock.calls.map(([input]) => input.reporterId);
    expect(new Set(ids).size).toBe(9);
  });

  it("stops adding after stop() is called", () => {
    const add = vi.fn();
    const stop = startDemoReporters(O, add);
    vi.advanceTimersByTime(DEMO_REPORT_INTERVAL_MS * 3);
    stop();
    vi.advanceTimersByTime(DEMO_REPORT_INTERVAL_MS * 10);
    expect(add).toHaveBeenCalledTimes(3);
  });
});
```

`web/src/demo/demo-shelter.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { COVERAGE_BBOX } from "@/config/coverage";
import { isInBbox } from "@/lib/geo";
import { DEMO_SOURCE } from "@/lib/provenance";
import { DEMO_SHELTER } from "./demo-shelter";

describe("DEMO_SHELTER", () => {
  const all = [...DEMO_SHELTER.zones, ...DEMO_SHELTER.exits, ...DEMO_SHELTER.sites];

  it("uses obviously synthetic names so screenshots can't pass as real guidance", () => {
    for (const item of all) expect(item.name).toMatch(/\bDEMO\b|^Demo /);
  });

  it("tags everything as demo provenance", () => {
    for (const item of all) expect(item.provenance.source).toBe(DEMO_SOURCE);
  });

  it("places exits and sites inside the covered area", () => {
    for (const p of [...DEMO_SHELTER.exits, ...DEMO_SHELTER.sites]) {
      expect(isInBbox(p, COVERAGE_BBOX)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm vitest run src/demo`
Expected: FAIL, unresolved imports.

- [ ] **Step 3: Write the implementation**

`web/src/config/coverage.ts`:

```ts
import manifest from "../../public/scenarios/manifest.json";
import type { BBox } from "@/lib/geo";
import { ScenarioManifestSchema } from "@/types/scenario";

/** Area the app covers. Fire drops outside it are rejected. */
export const COVERAGE_BBOX: BBox = ScenarioManifestSchema.parse(manifest).bbox;
```

`web/src/demo/demo-spread.ts`:

```ts
// SIMULATED DATA. Only reachable through DataProvider with ?demo=1 (see eslint.config.mjs).
import { offsetM, type LngLat, type Ring } from "@/lib/geo";
import { DEMO_SOURCE } from "@/lib/provenance";
import { SPREAD_RING_MINUTES, type SpreadProvider } from "@/lib/spread";

/** Fixed demo wind, degrees FROM: a Santa Ana out of the north-east. */
export const DEMO_WIND_FROM_DEG = 45;
export const DEMO_HEAD_M_PER_MIN = 50;
const BACK_M_PER_MIN = 5;
const LENGTH_TO_BREADTH = 3;
const VERTICES = 48;

/** Ellipse with the origin near its back end, stretched downwind. Not a fire model. */
function demoEllipse(origin: LngLat, minutes: number): Ring {
  const semiMajorM = ((DEMO_HEAD_M_PER_MIN + BACK_M_PER_MIN) / 2) * minutes;
  const semiMinorM = semiMajorM / LENGTH_TO_BREADTH;
  const centreShiftM = ((DEMO_HEAD_M_PER_MIN - BACK_M_PER_MIN) / 2) * minutes;
  const toward = (((DEMO_WIND_FROM_DEG + 180) % 360) * Math.PI) / 180;
  // Unit vectors in (east, north): downwind u, crosswind v.
  const [ux, uy] = [Math.sin(toward), Math.cos(toward)];
  const [vx, vy] = [Math.cos(toward), -Math.sin(toward)];

  const ring: Ring = [];
  for (let k = 0; k < VERTICES; k++) {
    const phi = (2 * Math.PI * k) / VERTICES;
    const along = centreShiftM + semiMajorM * Math.cos(phi);
    const across = semiMinorM * Math.sin(phi);
    const p = offsetM(origin, along * ux + across * vx, along * uy + across * vy);
    ring.push([p.lng, p.lat]);
  }
  ring.push(ring[0]!);
  return ring;
}

export const demoSpreadProvider: SpreadProvider = {
  getSpread(origin) {
    return {
      origin,
      rings: SPREAD_RING_MINUTES.map((minutes) => ({ minutes, polygon: demoEllipse(origin, minutes) })),
      provenance: {
        source: DEMO_SOURCE,
        vintage: "simulated",
        notes: `Prototype only: wind-stretched ellipse, wind from ${DEMO_WIND_FROM_DEG}°. Not a fire model.`,
      },
    };
  },
};
```

`web/src/demo/demo-reporters.ts`:

```ts
// SIMULATED DATA. Only reachable through DataProvider with ?demo=1 (see eslint.config.mjs).
import { offsetM, type LngLat } from "@/lib/geo";
import type { ReportInput } from "@/lib/reports";

export const DEMO_REPORT_INTERVAL_MS = 1500;
/** Simulated neighbours. With the user's own report this reaches 10, "confirmed". */
export const DEMO_REPORTER_COUNT = 9;

const GOLDEN_ANGLE_RAD = (137.508 * Math.PI) / 180;

/** Deterministic spiral of nearby points (60–260 m out), so demos replay identically. */
export function demoReportPositions(origin: LngLat, count = DEMO_REPORTER_COUNT): LngLat[] {
  return Array.from({ length: count }, (_, i) => {
    const distanceM = 60 + 25 * i;
    const angle = i * GOLDEN_ANGLE_RAD;
    return offsetM(origin, distanceM * Math.sin(angle), distanceM * Math.cos(angle));
  });
}

/** Adds simulated reports around `origin`, one per interval. Returns a stop function. */
export function startDemoReporters(origin: LngLat, addReport: (input: ReportInput) => void): () => void {
  const positions = demoReportPositions(origin);
  let next = 0;
  const timer = setInterval(() => {
    const p = positions[next];
    if (!p) {
      clearInterval(timer);
      return;
    }
    next += 1;
    addReport({ lng: p.lng, lat: p.lat, reporterId: `demo-${next}` });
    if (next >= positions.length) clearInterval(timer);
  }, DEMO_REPORT_INTERVAL_MS);
  return () => clearInterval(timer);
}
```

`web/src/demo/demo-shelter.ts`:

```ts
// SIMULATED DATA. Only reachable through DataProvider with ?demo=1 (see eslint.config.mjs).
// Names are deliberately synthetic. None of these are real shelters, zones, or exits.
import { DEMO_SOURCE } from "@/lib/provenance";
import type { ShelterData } from "@/lib/shelter";

const provenance = { source: DEMO_SOURCE, vintage: "simulated", notes: "Prototype placeholder, not a real location." };

export const DEMO_SHELTER: ShelterData = {
  zones: [
    {
      id: "demo-1",
      name: "Zone DEMO-1",
      polygon: [[-118.32, 34.12], [-118.245, 34.12], [-118.245, 34.27], [-118.32, 34.27], [-118.32, 34.12]],
      provenance,
    },
    {
      id: "demo-2",
      name: "Zone DEMO-2",
      polygon: [[-118.245, 34.12], [-118.17, 34.12], [-118.17, 34.27], [-118.245, 34.27], [-118.245, 34.12]],
      provenance,
    },
  ],
  exits: [
    { id: "demo-exit-n", name: "Demo Exit North", lng: -118.245, lat: 34.25, provenance },
    { id: "demo-exit-s", name: "Demo Exit South", lng: -118.245, lat: 34.14, provenance },
    { id: "demo-exit-w", name: "Demo Exit West", lng: -118.3, lat: 34.195, provenance },
    { id: "demo-exit-e", name: "Demo Exit East", lng: -118.19, lat: 34.195, provenance },
  ],
  sites: [
    { id: "demo-site-a", name: "Demo Shelter A", lng: -118.25, lat: 34.15, note: "Demo site. Check if open.", provenance },
    { id: "demo-site-b", name: "Demo Shelter B", lng: -118.2, lat: 34.16, note: "Demo site. Check if open.", provenance },
    { id: "demo-site-c", name: "Demo Shelter C", lng: -118.29, lat: 34.13, note: "Demo site. Check if open.", provenance },
  ],
};
```

Note: the name test regex `/\bDEMO\b|^Demo /` passes "Zone DEMO-1" (`\bDEMO\b`) and "Demo Exit North" / "Demo Shelter A" (`^Demo `).

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm vitest run src/demo`
Expected: PASS (4 + 3 + 3 tests).

- [ ] **Step 5: Add the ESLint fence** in `web/eslint.config.mjs`, as a new entry after `...nextTs,`:

```js
  // Simulated data may only enter the app through DataProvider (?demo=1). See CLAUDE.md.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/demo/**", "src/components/data/DataProvider.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/demo", "@/demo/*", "**/demo/*"],
              message:
                "Simulated data may only be imported by src/components/data/DataProvider.tsx (?demo=1).",
            },
          ],
        },
      ],
    },
  },
```

- [ ] **Step 6: Verify the fence fails a violating file**

```bash
printf 'import { DEMO_SHELTER } from "@/demo/demo-shelter";\nexport const leak = DEMO_SHELTER;\n' > src/lib/fence-check.ts
pnpm exec eslint src/lib/fence-check.ts; echo "exit=$?"
rm src/lib/fence-check.ts
```

Expected: an error mentioning "Simulated data may only be imported by src/components/data/DataProvider.tsx" and `exit=1`. Confirm the file was removed (`git status` shows no `fence-check.ts`).

- [ ] **Step 7: Commit**

```bash
pnpm lint && pnpm typecheck && pnpm test
git add src/demo src/config/coverage.ts eslint.config.mjs
git commit -m "Add fenced demo data (spread, reporters, shelter) with lint guard

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Store, DataProvider, page wiring, and planner UI removal

**Files:**
- Rewrite: `web/src/store/app-store.ts`
- Create: `web/src/components/data/DataProvider.tsx`, `web/src/components/data/hooks.ts`, `web/src/components/ui/DemoBanner.tsx`, `web/src/components/ui/SafetyFooter.tsx`, `web/src/components/ui/Notice.tsx`
- Modify: `web/src/app/page.tsx`, `web/src/components/ui/StatusBar.tsx`, `web/src/components/map/MapView.tsx`, `web/src/app/globals.css`
- Delete: `web/src/components/panel/` (all), `web/src/components/map/LayerToggles.tsx`, `web/src/components/map/CameraController.tsx`, `web/src/components/map/scenario-layers.ts`, `web/src/components/ui/Toggle.tsx`, `web/src/config/communities.ts`, `web/src/config/layout.ts`

**Interfaces:**
- Consumes: Tasks 1–4 (`upsertReport`, `ReportInput`, `Report`, `clusterReports`, `Cluster`, `SpreadProvider`, `SpreadResult`, `ShelterData`, `parseDemoFlag`, demo modules).
- Produces:
  ```ts
  // store/app-store.ts
  export type SheetId = "none" | "report" | "shelter";
  useAppStore: {
    reports: Report[]; addReport(input: ReportInput, nowMs: number): string; resetReports(): void;
    selectedReportId: string | null; sheet: SheetId;
    openReport(reportId: string): void; openShelter(): void; closeSheet(): void;
    userLocation: LngLat | null; setUserLocation(loc: LngLat | null): void;
    notice: string | null; showNotice(message: string | null): void;
  }
  // components/data/DataProvider.tsx
  export interface DataSources { demo: boolean; spread: SpreadProvider | null; shelter: ShelterData | null;
    onMyReport(at: LngLat): void; reset(): void }
  export function DataProvider(props: { demo: boolean; children: ReactNode }): JSX.Element
  export function useDataSources(): DataSources
  // components/data/hooks.ts
  export function useNow(intervalMs?: number): number
  export function useClusters(): Cluster[]
  export function useSelectedCluster(): Cluster | null
  export function useSpreadFor(cluster: Cluster | null): SpreadResult | null
  export function useWatchUserLocation(): void
  ```

- [ ] **Step 1: Rewrite `web/src/store/app-store.ts`**

```ts
import { create } from "zustand";
import type { LngLat } from "@/lib/geo";
import { upsertReport, type Report, type ReportInput } from "@/lib/reports";

export type SheetId = "none" | "report" | "shelter";

interface AppState {
  reports: Report[];
  /** The single write path for reports (the user's drop and the demo simulator). Returns the report id. */
  addReport: (input: ReportInput, nowMs: number) => string;
  resetReports: () => void;

  /** A report in the fire the sheet is about; the cluster is derived from it. */
  selectedReportId: string | null;
  sheet: SheetId;
  openReport: (reportId: string) => void;
  openShelter: () => void;
  closeSheet: () => void;

  userLocation: LngLat | null;
  setUserLocation: (loc: LngLat | null) => void;

  /** Short transient message, e.g. "Outside the area we cover". */
  notice: string | null;
  showNotice: (message: string | null) => void;
}

// Counter ids: crypto.randomUUID needs a secure context, which an iPad on LAN http isn't.
let seq = 0;
const nextId = () => `r${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const useAppStore = create<AppState>()((set, get) => ({
  reports: [],
  addReport: (input, nowMs) => {
    const { reports, id } = upsertReport(get().reports, input, nowMs, nextId);
    set({ reports });
    return id;
  },
  resetReports: () => set({ reports: [], selectedReportId: null, sheet: "none" }),

  selectedReportId: null,
  sheet: "none",
  openReport: (reportId) => set({ selectedReportId: reportId, sheet: "report" }),
  openShelter: () => set({ sheet: "shelter" }),
  closeSheet: () => set({ sheet: "none" }),

  userLocation: null,
  setUserLocation: (userLocation) => set({ userLocation }),

  notice: null,
  showNotice: (notice) => set({ notice }),
}));
```

- [ ] **Step 2: Create `web/src/components/data/DataProvider.tsx`**

```tsx
"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
// The only file allowed to import src/demo (enforced in eslint.config.mjs).
import { startDemoReporters } from "@/demo/demo-reporters";
import { DEMO_SHELTER } from "@/demo/demo-shelter";
import { demoSpreadProvider } from "@/demo/demo-spread";
import type { LngLat } from "@/lib/geo";
import type { ShelterData } from "@/lib/shelter";
import type { SpreadProvider } from "@/lib/spread";
import { useAppStore } from "@/store/app-store";

export interface DataSources {
  demo: boolean;
  /** Null until a real spread model exists (or in demo mode, the simulated one). */
  spread: SpreadProvider | null;
  shelter: ShelterData | null;
  /** Called after the user drops a report. */
  onMyReport: (at: LngLat) => void;
  reset: () => void;
}

const NO_DATA: DataSources = {
  demo: false,
  spread: null,
  shelter: null,
  onMyReport: () => {},
  reset: () => useAppStore.getState().resetReports(),
};

const DataSourcesContext = createContext<DataSources>(NO_DATA);

export function DataProvider({ demo, children }: { demo: boolean; children: ReactNode }) {
  const stopReporters = useRef<(() => void) | null>(null);

  const value = useMemo<DataSources>(() => {
    if (!demo) return NO_DATA;
    return {
      demo: true,
      spread: demoSpreadProvider,
      shelter: DEMO_SHELTER,
      onMyReport: (at) => {
        stopReporters.current?.();
        stopReporters.current = startDemoReporters(at, (input) =>
          useAppStore.getState().addReport(input, Date.now()),
        );
      },
      reset: () => {
        stopReporters.current?.();
        stopReporters.current = null;
        useAppStore.getState().resetReports();
      },
    };
  }, [demo]);

  useEffect(() => () => stopReporters.current?.(), []);

  return <DataSourcesContext.Provider value={value}>{children}</DataSourcesContext.Provider>;
}

export function useDataSources(): DataSources {
  return useContext(DataSourcesContext);
}
```

- [ ] **Step 3: Create `web/src/components/data/hooks.ts`**

```ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { clusterReports, type Cluster } from "@/lib/clusters";
import type { SpreadResult } from "@/lib/spread";
import { useAppStore } from "@/store/app-store";
import { useDataSources } from "./DataProvider";

/** Current time, refreshed every `intervalMs` so old reports age out. */
export function useNow(intervalMs = 5_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useClusters(): Cluster[] {
  const reports = useAppStore((s) => s.reports);
  const now = useNow();
  return useMemo(() => clusterReports(reports, now), [reports, now]);
}

export function useSelectedCluster(): Cluster | null {
  const clusters = useClusters();
  const selectedReportId = useAppStore((s) => s.selectedReportId);
  return useMemo(
    () => clusters.find((c) => c.reports.some((r) => r.id === selectedReportId)) ?? null,
    [clusters, selectedReportId],
  );
}

/** Projected spread for a cluster once it has reached "reported"; null otherwise or without a model. */
export function useSpreadFor(cluster: Cluster | null): SpreadResult | null {
  const { spread } = useDataSources();
  const active = cluster !== null && cluster.status !== "unverified";
  const lng = cluster?.centroid.lng;
  const lat = cluster?.centroid.lat;
  return useMemo(
    () => (spread && active && lng !== undefined && lat !== undefined ? spread.getSpread({ lng, lat }) : null),
    [spread, active, lng, lat],
  );
}

/** Keeps `userLocation` in the store current. Denied or unavailable leaves it null. */
export function useWatchUserLocation(): void {
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lng: pos.coords.longitude, lat: pos.coords.latitude }),
      () => setUserLocation(null),
      { enableHighAccuracy: true, maximumAge: 30_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [setUserLocation]);
}
```

- [ ] **Step 4: Create the chrome components**

`web/src/components/ui/DemoBanner.tsx`:

```tsx
"use client";

import { useDataSources } from "@/components/data/DataProvider";

export function DemoBanner() {
  const { demo, reset } = useDataSources();
  if (!demo) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[4.5rem] z-30 flex justify-center px-16">
      <div
        role="note"
        className="pointer-events-auto flex items-center gap-2 rounded-full border-2 border-dashed border-warning bg-slate-950/90 py-0.5 pr-1 pl-4 text-xs font-bold tracking-wide text-warning"
      >
        PROTOTYPE · SIMULATED DATA
        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-full px-3 font-semibold text-slate-100 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-accent"
        >
          Reset demo
        </button>
      </div>
    </div>
  );
}
```

`web/src/components/ui/SafetyFooter.tsx`:

```tsx
export function SafetyFooter() {
  return (
    <footer
      role="note"
      className="absolute inset-x-0 bottom-0 z-30 flex h-8 items-center justify-center border-t border-white/10 bg-slate-950/85 px-4 text-xs font-medium text-slate-300 backdrop-blur-md"
    >
      Projection, not a forecast · Call 911 for emergencies
    </footer>
  );
}
```

`web/src/components/ui/Notice.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";

const NOTICE_MS = 3_000;

export function Notice() {
  const notice = useAppStore((s) => s.notice);
  const showNotice = useAppStore((s) => s.showNotice);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => showNotice(null), NOTICE_MS);
    return () => clearTimeout(id);
  }, [notice, showNotice]);

  if (!notice) return null;
  return (
    <div role="status" className="pointer-events-none absolute inset-x-0 top-32 z-40 flex justify-center px-4">
      <p className="glass rounded-xl px-4 py-3 text-sm font-semibold text-slate-100">{notice}</p>
    </div>
  );
}
```

- [ ] **Step 5: Update `web/src/components/ui/StatusBar.tsx` copy**

Replace the subtitle paragraph text `Glendale Fire Department · Wildfire evacuation pre-incident planning` with `Wildfire reports and where to go · Glendale canyons`. Replace the pill contents:

```tsx
        <p
          role="note"
          className="truncate rounded-full border border-warning/50 bg-warning/10 px-3 py-1 text-xs font-semibold tracking-wide text-warning sm:text-sm"
        >
          PROJECTION
          <span className="font-medium">{" — "}not a forecast</span>
        </p>
```

- [ ] **Step 6: Delete the planner UI and strip `MapView`**

```bash
git rm -r src/components/panel src/components/map/LayerToggles.tsx src/components/map/CameraController.tsx \
  src/components/map/scenario-layers.ts src/components/ui/Toggle.tsx src/config/communities.ts src/config/layout.ts
grep -rn "communities\"\|config/layout\|LayerToggles\|CameraController\|scenario-layers\|SidePanel\|ui/Toggle" src
```

Expected: the grep prints only `src/types/scenario.ts` (the `"communities"` file-kind enum, which stays) and the imports in `MapView.tsx` / `page.tsx` you fix next.

In `web/src/components/map/MapView.tsx`: remove the imports of `useMemo`, `useAppStore`, `CameraController`, `DeckOverlay`, `buildScenarioLayers`; remove the `visibility` and `layers` lines; remove `<DeckOverlay layers={layers} />` and `<CameraController />`. The import line becomes `import { useState } from "react";`. (Task 6 mounts the resident layers here.)

- [ ] **Step 7: Rewrite `web/src/app/page.tsx`**

```tsx
import MapClient from "@/components/map/MapClient";
import { DataProvider } from "@/components/data/DataProvider";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Notice } from "@/components/ui/Notice";
import { SafetyFooter } from "@/components/ui/SafetyFooter";
import { StatusBar } from "@/components/ui/StatusBar";
import { parseDemoFlag } from "@/lib/demo-flag";

export default async function Home({ searchParams }: PageProps<"/">) {
  const demo = parseDemoFlag((await searchParams).demo);
  return (
    <DataProvider demo={demo}>
      <main className="relative h-dvh w-full overflow-hidden bg-surface">
        <MapClient />
        <StatusBar />
        <DemoBanner />
        <Notice />
        <SafetyFooter />
      </main>
    </DataProvider>
  );
}
```

- [ ] **Step 8: Lift map controls clear of the footer** in `web/src/app/globals.css`, after the `.maplibregl-ctrl-top-left` rule:

```css
.maplibregl-map .maplibregl-ctrl-bottom-right,
.maplibregl-map .maplibregl-ctrl-bottom-left {
  bottom: 2rem;
}
```

- [ ] **Step 9: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: all pass. If `react-hooks` flags `Date.now()` in `useNow`'s lazy initializer, move the initial read into the effect by initialising state to `0` and calling `setNow(Date.now())` inside the interval callback only, with the first tick at `setTimeout(..., 0)`.

Run: `pnpm dev`, open `http://localhost:3000/?demo=1` and `http://localhost:3000/`.
Expected: map loads; with `?demo=1` the dashed "PROTOTYPE · SIMULATED DATA" banner and "Reset demo" show; without it, no banner; footer text visible on both; no side panel or layer toggles.

- [ ] **Step 10: Commit**

```bash
git add -A src eslint.config.mjs
git commit -m "Replace planner UI with resident shell, store, and demo data provider

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Map rendering and drag-to-report

**Files:**
- Create: `web/src/lib/map-features.ts`, `web/src/components/map/useRevealProgress.ts`, `web/src/components/map/ResidentLayers.tsx`, `web/src/components/map/FireDragButton.tsx`
- Modify: `web/src/components/map/MapView.tsx`
- Test: `web/src/lib/map-features.test.ts`

**Interfaces:**
- Consumes: `Report`, `MY_REPORTER_ID` (Task 2); `SpreadResult`, `isDemo`, `classifyExits`, `COVERAGE_BBOX`, `isInBbox`, `scaleRing` (Tasks 1, 3, 4); `useAppStore`, `useDataSources`, `useClusters`, `useSelectedCluster`, `useSpreadFor`, `useWatchUserLocation` (Task 5).
- Produces:
  ```ts
  // lib/map-features.ts
  export interface RevealedSpread { spread: SpreadResult; reveal: number }
  export function reportsToFeatures(reports: readonly Report[]): FeatureCollection of Point, properties { mine: boolean }
  export function spreadToFeatures(items: readonly RevealedSpread[]): FeatureCollection of Polygon, properties { minutes: number; demo: boolean }
  // components/map
  export function useRevealProgress(ids: readonly string[], durationMs?: number): ReadonlyMap<string, number>
  export function ResidentLayers(props: { beforeId?: string }): JSX.Element
  export function FireDragButton(): JSX.Element | null
  ```

- [ ] **Step 1: Write the failing test** at `web/src/lib/map-features.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { reportsToFeatures, spreadToFeatures } from "./map-features";
import type { Report } from "./reports";
import type { SpreadResult } from "./spread";

// Synthetic fixtures; not data.
const reports: Report[] = [
  { id: "a", lng: 1, lat: 2, createdAtMs: 0, reporterId: "me" },
  { id: "b", lng: 3, lat: 4, createdAtMs: 0, reporterId: "demo-1" },
];
const square = (r: number): [number, number][] => [[-r, -r], [r, -r], [r, r], [-r, r], [-r, -r]];
const spread = (source: string): SpreadResult => ({
  origin: { lng: 0, lat: 0 },
  provenance: { source, vintage: "n/a" },
  rings: [
    { minutes: 30, polygon: square(1) },
    { minutes: 120, polygon: square(4) },
  ],
});

describe("reportsToFeatures", () => {
  it("makes one point per report and flags the user's own", () => {
    const fc = reportsToFeatures(reports);
    expect(fc.type).toBe("FeatureCollection");
    expect(fc.features.map((f) => f.geometry.coordinates)).toEqual([[1, 2], [3, 4]]);
    expect(fc.features.map((f) => f.properties.mine)).toEqual([true, false]);
  });
});

describe("spreadToFeatures", () => {
  it("orders rings outermost first so inner rings draw on top", () => {
    const fc = spreadToFeatures([{ spread: spread("demo"), reveal: 1 }]);
    expect(fc.features.map((f) => f.properties.minutes)).toEqual([120, 30]);
  });

  it("flags demo provenance", () => {
    expect(spreadToFeatures([{ spread: spread("demo"), reveal: 1 }]).features[0]?.properties.demo).toBe(true);
    expect(spreadToFeatures([{ spread: spread("ELMFIRE"), reveal: 1 }]).features[0]?.properties.demo).toBe(false);
  });

  it("scales rings by reveal progress about the origin", () => {
    const fc = spreadToFeatures([{ spread: spread("demo"), reveal: 0.5 }]);
    expect(fc.features[0]?.geometry.coordinates[0]?.[0]).toEqual([-2, -2]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run src/lib/map-features.test.ts`
Expected: FAIL, cannot resolve `./map-features`.

- [ ] **Step 3: Implement `web/src/lib/map-features.ts`**

```ts
import { scaleRing } from "./geo";
import { isDemo } from "./provenance";
import { MY_REPORTER_ID, type Report } from "./reports";
import type { SpreadResult } from "./spread";

interface Feature<G, P> {
  type: "Feature";
  geometry: G;
  properties: P;
}
interface FeatureCollection<G, P> {
  type: "FeatureCollection";
  features: Feature<G, P>[];
}
type PointGeometry = { type: "Point"; coordinates: [number, number] };
type PolygonGeometry = { type: "Polygon"; coordinates: [number, number][][] };

export function reportsToFeatures(reports: readonly Report[]): FeatureCollection<PointGeometry, { mine: boolean }> {
  return {
    type: "FeatureCollection",
    features: reports.map((r) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [r.lng, r.lat] },
      properties: { mine: r.reporterId === MY_REPORTER_ID },
    })),
  };
}

export interface RevealedSpread {
  spread: SpreadResult;
  /** 0..1 grow-in animation progress. */
  reveal: number;
}

export function spreadToFeatures(
  items: readonly RevealedSpread[],
): FeatureCollection<PolygonGeometry, { minutes: number; demo: boolean }> {
  return {
    type: "FeatureCollection",
    features: items.flatMap(({ spread, reveal }) =>
      [...spread.rings]
        .sort((a, b) => b.minutes - a.minutes)
        .map((ring) => ({
          type: "Feature" as const,
          geometry: { type: "Polygon" as const, coordinates: [scaleRing(ring.polygon, spread.origin, reveal)] },
          properties: { minutes: ring.minutes, demo: isDemo(spread.provenance) },
        })),
    ),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run src/lib/map-features.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Create `web/src/components/map/useRevealProgress.ts`**

```ts
"use client";

import { useEffect, useRef, useState } from "react";

/** 0..1 grow-in progress per id, starting the first time each id appears. */
export function useRevealProgress(ids: readonly string[], durationMs = 1_500): ReadonlyMap<string, number> {
  const starts = useRef(new Map<string, number>());
  const [progress, setProgress] = useState<ReadonlyMap<string, number>>(new Map());
  const key = ids.join("|");

  useEffect(() => {
    const current = key ? key.split("|") : [];
    const t0 = performance.now();
    for (const id of current) if (!starts.current.has(id)) starts.current.set(id, t0);

    let raf = 0;
    const tick = () => {
      const t = performance.now();
      const next = new Map<string, number>();
      let running = false;
      for (const id of current) {
        const p = Math.min(1, (t - (starts.current.get(id) ?? t)) / durationMs);
        next.set(id, p);
        if (p < 1) running = true;
      }
      setProgress(next);
      if (running) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key, durationMs]);

  return progress;
}
```

- [ ] **Step 6: Create `web/src/components/map/ResidentLayers.tsx`**

```tsx
"use client";

import type { ExpressionSpecification } from "maplibre-gl";
import { useMemo } from "react";
import { Layer, Marker, Source } from "react-map-gl/maplibre";
import { useDataSources } from "@/components/data/DataProvider";
import {
  useClusters,
  useSelectedCluster,
  useSpreadFor,
  useWatchUserLocation,
} from "@/components/data/hooks";
import { COVERAGE_BBOX } from "@/config/coverage";
import type { Cluster } from "@/lib/clusters";
import { classifyExits, type ExitStatus } from "@/lib/exits";
import { isInBbox } from "@/lib/geo";
import { reportsToFeatures, spreadToFeatures } from "@/lib/map-features";
import { useAppStore } from "@/store/app-store";
import { useRevealProgress } from "./useRevealProgress";

const RING_COLOR: ExpressionSpecification = ["match", ["get", "minutes"], 30, "#f87171", 60, "#fb923c", "#fbbf24"];

/** Reports, spread rings, and (on the shelter sheet) exits and sites. Native layers drape on terrain. */
export function ResidentLayers({ beforeId }: { beforeId?: string }) {
  useWatchUserLocation();
  const clusters = useClusters();
  const reports = useAppStore((s) => s.reports);
  const sheet = useAppStore((s) => s.sheet);
  const openReport = useAppStore((s) => s.openReport);
  const userLocation = useAppStore((s) => s.userLocation);
  const { spread: provider, shelter } = useDataSources();

  const active = useMemo(
    () =>
      provider
        ? clusters
            .filter((c) => c.status !== "unverified")
            .map((c) => ({ id: c.id, spread: provider.getSpread(c.centroid) }))
        : [],
    [clusters, provider],
  );
  const reveal = useRevealProgress(active.map((a) => a.id));
  const spreadData = useMemo(
    () => spreadToFeatures(active.map((a) => ({ spread: a.spread, reveal: reveal.get(a.id) ?? 0 }))),
    [active, reveal],
  );
  const reportData = useMemo(() => reportsToFeatures(reports), [reports]);

  const selected = useSelectedCluster();
  const selectedSpread = useSpreadFor(selected);
  const exits = useMemo(
    () => (shelter ? classifyExits(shelter.exits, selectedSpread) : []),
    [shelter, selectedSpread],
  );
  const showShelter = sheet === "shelter" && shelter !== null;

  return (
    <>
      <Source id="spread" type="geojson" data={spreadData}>
        <Layer id="spread-fill" type="fill" beforeId={beforeId} paint={{ "fill-color": RING_COLOR, "fill-opacity": 0.14 }} />
        <Layer
          id="spread-line-demo"
          type="line"
          beforeId={beforeId}
          filter={["==", ["get", "demo"], true]}
          paint={{ "line-color": RING_COLOR, "line-width": 2, "line-dasharray": [2, 1.5] }}
        />
        <Layer
          id="spread-line"
          type="line"
          beforeId={beforeId}
          filter={["==", ["get", "demo"], false]}
          paint={{ "line-color": RING_COLOR, "line-width": 2 }}
        />
      </Source>
      <Source id="reports" type="geojson" data={reportData}>
        <Layer
          id="report-dots"
          type="circle"
          beforeId={beforeId}
          paint={{
            "circle-radius": 4,
            "circle-color": ["case", ["get", "mine"], "#f8fafc", "#94a3b8"],
            "circle-stroke-color": "#0b1120",
            "circle-stroke-width": 1,
            "circle-pitch-alignment": "map",
          }}
        />
      </Source>

      {clusters.map((c) => (
        <Marker key={c.id} longitude={c.centroid.lng} latitude={c.centroid.lat} anchor="center">
          <ClusterMarker cluster={c} onSelect={() => openReport(c.id)} />
        </Marker>
      ))}

      {showShelter &&
        exits.map((e) => (
          <Marker key={e.id} longitude={e.lng} latitude={e.lat} anchor="bottom">
            <ExitMarker name={e.name} status={e.status} />
          </Marker>
        ))}
      {showShelter &&
        shelter.sites.map((s) => (
          <Marker key={s.id} longitude={s.lng} latitude={s.lat} anchor="bottom">
            <span className="glass flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-100">
              <span aria-hidden>⌂</span>
              {s.name}
            </span>
          </Marker>
        ))}

      {userLocation && isInBbox(userLocation, COVERAGE_BBOX) && (
        <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
          <span aria-label="You are here" className="block size-4 rounded-full border-2 border-white bg-accent shadow" />
        </Marker>
      )}
    </>
  );
}

const CLUSTER_STYLE: Record<Cluster["status"], string> = {
  unverified: "size-11 border-2 border-dashed border-slate-300 opacity-80",
  reported: "size-12 border-2 border-warning",
  confirmed: "size-12 border-4 border-critical",
};

function ClusterMarker({ cluster, onSelect }: { cluster: Cluster; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      aria-label={`Fire report, ${cluster.distinctReporters} residents, ${cluster.status}`}
      className={`relative flex items-center justify-center rounded-full bg-slate-950/80 text-xl focus-visible:outline-2 focus-visible:outline-accent ${CLUSTER_STYLE[cluster.status]}`}
    >
      <span aria-hidden>🔥</span>
      <span className="absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-slate-100 px-1 text-center text-xs font-bold text-slate-900">
        {cluster.distinctReporters}
      </span>
    </button>
  );
}

const EXIT_STYLE: Record<ExitStatus, { className: string; label: string }> = {
  threatened: { className: "border-critical text-critical", label: "Threatened" },
  clear: { className: "border-slate-300 text-slate-100", label: "Clear" },
  unknown: { className: "border-slate-500 text-slate-400", label: "Status unknown" },
};

function ExitMarker({ name, status }: { name: string; status: ExitStatus }) {
  const style = EXIT_STYLE[status];
  return (
    <span className={`glass flex items-center gap-1 rounded-lg border-2 px-2 py-1 text-xs font-semibold ${style.className}`}>
      {name} · {style.label}
    </span>
  );
}
```

- [ ] **Step 7: Create `web/src/components/map/FireDragButton.tsx`**

```tsx
"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useDataSources } from "@/components/data/DataProvider";
import { COVERAGE_BBOX } from "@/config/coverage";
import { isInBbox, type LngLat } from "@/lib/geo";
import { MY_REPORTER_ID } from "@/lib/reports";
import { useAppStore } from "@/store/app-store";

/** Movement (px) before a press becomes a drag rather than a tap. */
const DRAG_THRESHOLD_PX = 8;

/** Pegman-style fire: drag onto the map to report; tap (or Enter) reports at map centre. */
export function FireDragButton() {
  const { current: mapRef } = useMap();
  const sheet = useAppStore((s) => s.sheet);
  const { onMyReport } = useDataSources();
  const start = useRef<{ x: number; y: number } | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);

  const report = (at: LngLat) => {
    const { addReport, openReport, showNotice } = useAppStore.getState();
    if (!isInBbox(at, COVERAGE_BBOX)) {
      showNotice("Outside the area we cover");
      return;
    }
    openReport(addReport({ ...at, reporterId: MY_REPORTER_ID }, Date.now()));
    onMyReport(at);
  };

  const reportAtCenter = () => {
    const map = mapRef?.getMap();
    if (map) report(map.getCenter());
  };

  const dropAt = (clientX: number, clientY: number) => {
    const map = mapRef?.getMap();
    if (!map) return;
    // Only drops over the map itself count, not over the status bar, banner, footer, or sheet.
    const target = document.elementFromPoint(clientX, clientY);
    if (!target || !map.getCanvasContainer().contains(target)) return;
    const rect = map.getContainer().getBoundingClientRect();
    const { lng, lat } = map.unproject([clientX - rect.left, clientY - rect.top]);
    report({ lng, lat });
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!start.current) return;
    const moved = Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y);
    if (ghost || moved > DRAG_THRESHOLD_PX) setGhost({ x: e.clientX, y: e.clientY });
  };
  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (!start.current) return;
    start.current = null;
    if (ghost) {
      setGhost(null);
      dropAt(e.clientX, e.clientY);
    } else {
      reportAtCenter();
    }
  };
  const cancel = () => {
    start.current = null;
    setGhost(null);
  };

  if (sheet !== "none") return null;

  return (
    <>
      <button
        type="button"
        aria-label="Report a fire: drag onto the map, or tap to report at map center"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={cancel}
        onLostPointerCapture={() => ghost && cancel()}
        // Keyboard activation (detail === 0); pointer taps are handled in onPointerUp.
        onClick={(e) => e.detail === 0 && reportAtCenter()}
        className="absolute right-4 bottom-12 z-20 flex size-16 touch-none items-center justify-center rounded-full border-2 border-critical bg-slate-950/90 text-3xl shadow-lg select-none focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span aria-hidden>🔥</span>
      </button>
      {ghost && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-dashed border-critical text-3xl"
          style={{ left: ghost.x, top: ghost.y }}
        >
          🔥
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 8: Mount them in `web/src/components/map/MapView.tsx`**

Add imports:

```tsx
import { FireDragButton } from "./FireDragButton";
import { ResidentLayers } from "./ResidentLayers";
```

Inside `<Map>`, after the hillshade block and `<NavigationControl .../>`:

```tsx
      {styleReady && <ResidentLayers beforeId={labelLayerId} />}
      <FireDragButton />
```

- [ ] **Step 9: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: all pass.

Run `pnpm dev`, open `http://localhost:3000/?demo=1` in a phone-sized responsive viewport (390×844):
- Drag the 🔥 button onto the map → a marker with "1" appears instantly where you released; a dashed-border marker.
- Within ~3 s the count reaches 3, the border turns amber, and dashed spread rings grow in toward the south-west.
- Count continues to 10 and the border turns red.
- Tap the button without dragging → report at map centre.
- Drag and release over the status bar → nothing is created.
- Drag far outside the covered area (zoom out first) → "Outside the area we cover".
The sheet itself arrives in Task 7; until then `openReport` hides the button (sheet ≠ none). To keep testing drops, run `useAppStore.getState().closeSheet()` from the React devtools console, or proceed to Task 7.

- [ ] **Step 10: Commit**

```bash
git add src/lib/map-features.ts src/lib/map-features.test.ts src/components/map
git commit -m "Render reports and spread on the map; add drag-to-report fire button

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Bottom sheet (report + shelter)

**Files:**
- Create: `web/src/components/sheet/BottomSheet.tsx`, `web/src/components/sheet/ReportSheet.tsx`, `web/src/components/sheet/ShelterSheet.tsx`
- Modify: `web/src/app/page.tsx`

**Interfaces:**
- Consumes: `reportCopy`, `formatMiles`, `classifyExits`, `zoneAt`, `sortByDistance`, `isInBbox`, `COVERAGE_BBOX`, `CLUSTER_RULES` (Tasks 1–4); `useAppStore`, `useDataSources`, `useSelectedCluster`, `useSpreadFor` (Task 5).
- Produces: `BottomSheet(): JSX.Element | null`, mounted in `page.tsx`.

- [ ] **Step 1: Create `web/src/components/sheet/ReportSheet.tsx`**

```tsx
"use client";

import { useDataSources } from "@/components/data/DataProvider";
import { useSelectedCluster } from "@/components/data/hooks";
import { CLUSTER_RULES } from "@/lib/clusters";
import { reportCopy, type ReportCopy } from "@/lib/report-copy";
import { useAppStore } from "@/store/app-store";

const TONE: Record<ReportCopy["tone"], string> = {
  muted: "text-slate-200",
  warning: "text-warning",
  critical: "text-critical",
};

export function ReportSheet() {
  const cluster = useSelectedCluster();
  const { spread } = useDataSources();
  const openShelter = useAppStore((s) => s.openShelter);

  return (
    <div className="space-y-4">
      <a
        href="tel:911"
        className="flex min-h-14 items-center justify-center rounded-xl bg-critical text-lg font-bold text-slate-950 focus-visible:outline-2 focus-visible:outline-accent"
      >
        Call 911
      </a>
      <p className="text-sm text-slate-300">
        See a fire? Call 911 first. Reporting here does not alert anyone. If the button doesn&apos;t work, dial 911.
      </p>

      {!cluster ? (
        <p className="text-sm text-slate-400">This report has expired.</p>
      ) : (
        <ClusterStatus copy={reportCopy(cluster, spread !== null)} reporters={cluster.distinctReporters} />
      )}

      {cluster && reportCopy(cluster, spread !== null).showShelter && (
        <>
          <p className="text-xs text-slate-400">
            Projection, not a forecast. Embers can start fires well ahead of these rings.
          </p>
          <button
            type="button"
            onClick={openShelter}
            className="min-h-12 w-full rounded-xl bg-accent font-semibold text-slate-950 focus-visible:outline-2 focus-visible:outline-white"
          >
            See where to go
          </button>
        </>
      )}
    </div>
  );
}

function ClusterStatus({ copy, reporters }: { copy: ReportCopy; reporters: number }) {
  const progress = Math.min(1, reporters / CLUSTER_RULES.reportedAt);
  return (
    <div>
      <h2 className={`text-lg font-bold ${TONE[copy.tone]}`}>{copy.title}</h2>
      <p className="text-sm text-slate-300">{copy.detail}</p>
      {copy.tone === "muted" && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800" aria-hidden>
          <div className="h-full bg-slate-300 transition-[width]" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `web/src/components/sheet/ShelterSheet.tsx`**

```tsx
"use client";

import { useDataSources } from "@/components/data/DataProvider";
import { useSelectedCluster, useSpreadFor } from "@/components/data/hooks";
import { COVERAGE_BBOX } from "@/config/coverage";
import { classifyExits, type ExitStatus } from "@/lib/exits";
import { isInBbox, sortByDistance } from "@/lib/geo";
import { formatMiles } from "@/lib/report-copy";
import { zoneAt } from "@/lib/shelter";
import { useAppStore } from "@/store/app-store";

const EXIT_TEXT: Record<ExitStatus, { label: string; className: string }> = {
  threatened: { label: "Threatened by projected spread", className: "text-critical" },
  clear: { label: "Outside projected spread", className: "text-slate-200" },
  unknown: { label: "Status unknown", className: "text-slate-400" },
};

export function ShelterSheet() {
  const cluster = useSelectedCluster();
  const spread = useSpreadFor(cluster);
  const { shelter } = useDataSources();
  const userLocation = useAppStore((s) => s.userLocation);
  const selectedReportId = useAppStore((s) => s.selectedReportId);
  const openReport = useAppStore((s) => s.openReport);

  const me = userLocation && isInBbox(userLocation, COVERAGE_BBOX) ? userLocation : null;
  const origin = me ?? cluster?.centroid ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {selectedReportId && (
          <button
            type="button"
            onClick={() => openReport(selectedReportId)}
            aria-label="Back to report"
            className="flex size-11 items-center justify-center rounded-xl text-slate-200 hover:bg-white/10"
          >
            ‹
          </button>
        )}
        <h2 className="text-lg font-bold text-slate-50">Where to go</h2>
      </div>

      {!shelter ? (
        <p className="text-sm text-slate-400">No shelter sites loaded.</p>
      ) : !origin ? (
        <p className="text-sm text-slate-400">Select a reported fire first.</p>
      ) : (
        <>
          <section>
            <p className="text-sm text-slate-100">
              {me ? "Your zone" : "Zone at the fire"}: {zoneAt(origin, shelter.zones)?.name ?? "unknown"}
            </p>
            <p className="text-xs text-slate-400">Follow official evacuation orders for your zone.</p>
            {!me && (
              <p className="mt-1 text-xs text-slate-400">
                Distances are from the reported fire, not from you. Your location is unavailable or outside the
                covered area.
              </p>
            )}
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-slate-300">Exits</h3>
            <ul className="space-y-1">
              {classifyExits(shelter.exits, spread).map((e) => (
                <li key={e.id} className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-100">{e.name}</span>
                  <span className={EXIT_TEXT[e.status].className}>{EXIT_TEXT[e.status].label}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-slate-300">Nearest sites</h3>
            <ul className="space-y-2">
              {sortByDistance(origin, shelter.sites)
                .slice(0, 3)
                .map((s) => (
                  <li key={s.id} className="text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold text-slate-100">{s.name}</span>
                      <span className="text-slate-300">{formatMiles(s.distanceM)}</span>
                    </div>
                    <p className="text-xs text-slate-400">{s.note}</p>
                  </li>
                ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `web/src/components/sheet/BottomSheet.tsx`**

```tsx
"use client";

import { useAppStore } from "@/store/app-store";
import { ReportSheet } from "./ReportSheet";
import { ShelterSheet } from "./ShelterSheet";

export function BottomSheet() {
  const sheet = useAppStore((s) => s.sheet);
  const closeSheet = useAppStore((s) => s.closeSheet);
  if (sheet === "none") return null;

  return (
    <section
      aria-label={sheet === "report" ? "Fire report" : "Where to go"}
      className="glass absolute inset-x-3 bottom-10 z-30 mx-auto max-h-[55dvh] max-w-lg overflow-y-auto overscroll-contain rounded-2xl p-4 pt-3"
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={closeSheet}
          aria-label="Close"
          className="flex size-11 items-center justify-center rounded-xl text-xl text-slate-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-accent"
        >
          ×
        </button>
      </div>
      {sheet === "report" ? <ReportSheet /> : <ShelterSheet />}
    </section>
  );
}
```

- [ ] **Step 4: Mount it in `web/src/app/page.tsx`**

Add `import { BottomSheet } from "@/components/sheet/BottomSheet";` and render `<BottomSheet />` after `<Notice />`.

- [ ] **Step 5: Verify**

Run: `pnpm lint && pnpm typecheck && pnpm test`
Expected: all pass.

Run `pnpm dev`, `http://localhost:3000/?demo=1`, phone viewport:
- Drop a fire → sheet opens with red "Call 911" first, then "Unverified report · 1 of 3 reports needed to show spread" and a progress bar.
- At 3 → "Reported by 3 residents", "Projected spread: 30, 60 and 120 minute rings", ember caveat, "See where to go".
- At 10 → "Confirmed by 10 residents" in red.
- "See where to go" → zone, exits (at least one "Threatened by projected spread" when the fire is north-east of an exit), 3 nearest "Demo Shelter" sites with miles and "Check if open"; exit and site markers appear on the map; back arrow returns to the report.
- Close (×) → the fire button returns.
- Without `?demo=1`: drop → Call 911 sheet; count stays 1 (no simulated neighbours); "See where to go" never appears; spread never draws.

- [ ] **Step 6: Commit**

```bash
git add src/components/sheet src/app/page.tsx
git commit -m "Add report and shelter bottom sheets

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Docs, metadata, and end-to-end verification

**Files:**
- Modify: `CLAUDE.md`, `web/src/app/layout.tsx`

**Interfaces:**
- Consumes: everything above.
- Produces: updated project docs; a verified build.

- [ ] **Step 1: Update `web/src/app/layout.tsx` metadata**

```tsx
export const metadata: Metadata = {
  title: "Trigger Point",
  description:
    "Report a wildfire you can see, watch the projected spread once neighbours confirm it, and see where to go. Projection, not a forecast. Call 911 for emergencies.",
  appleWebApp: { capable: true, title: "Trigger Point", statusBarStyle: "black-translucent" },
};
```

- [ ] **Step 2: Update `CLAUDE.md`**

Replace everything from the top of the file through the end of the "Chief-facing pitch" section with:

```markdown
# Trigger Point

Resident-facing wildfire app for Glendale (CA) canyon neighborhoods:

> Open app → see map → drag a fire onto the map where you see one → once enough neighbours
> report it, see the projected spread → see where to go.

Phone-first web app. The current build is a **frontend-only prototype**: no backend, reports
live in local state, and anything that would come from other residents or the pipeline is
simulated in demo mode (`?demo=1`). Design: `docs/superpowers/specs/2026-09-26-resident-fire-report-flow-design.md`.

## Safety posture

- **911 first.** Every report sheet leads with Call 911. Never imply a report alerted anyone.
- Crowd status is phrased as crowd status: "Reported by N residents" (3+), "Confirmed by N
  residents" (10+). Never a bare "Confirmed". Rules live in `web/src/lib/clusters.ts`
  (500 m, 60 min, distinct reporters) and a future backend must enforce the same values.
- Spread is a projection, not a forecast, and embers can start fires ahead of it. Say so.
- Never show an exit as "clear" without a spread model; show "status unknown".
```

In "Core principle: never show fabricated data", add this bullet after the "No mock, placeholder..." bullet:

```markdown
- **One exception: demo mode.** Simulated data may exist only in `web/src/demo/`, only reach the
  UI through `web/src/components/data/DataProvider.tsx` when the URL has `?demo=1`, and only
  with the "PROTOTYPE · SIMULATED DATA" banner showing. ESLint enforces the import fence.
  Demo values carry `provenance.source === "demo"`, render in a distinct dashed style, and
  use obviously synthetic names ("Demo Shelter A"), never real places.
```

In "Architecture", leave the diagram as is and add these bullets directly under it:

```markdown
- The spread engine sits behind `SpreadProvider` (`web/src/lib/spread.ts`). The intended real
  implementation is in-browser minimum-travel-time on pipeline spread-rate rasters, so a drop
  anywhere projects instantly and offline. Only the demo provider exists today.
- Live multi-user reports need a backend (Supabase with PostGIS + realtime was the recommended
  direction). Not built yet.
```

In "Repo layout", replace the `src/components/map/` and `src/components/panel/` lines with:

```markdown
  - `src/components/map/`: `MapClient` (dynamic import, `ssr: false`), `MapView`,
    `ResidentLayers` (native MapLibre layers + markers, which drape on terrain),
    `FireDragButton`, `DeckOverlay` (unmounted, kept for future raster layers).
  - `src/components/sheet/`: `BottomSheet`, `ReportSheet`, `ShelterSheet`.
    `src/components/data/`: `DataProvider` (data sources, demo wiring) and hooks.
    `src/components/ui/`: StatusBar, Clock, DemoBanner, SafetyFooter, Notice.
  - `src/demo/`: simulated data for `?demo=1` only.
```

and change the `src/config/` line to: `` - `src/config/`: `map.ts` (basemap, terrain, provider), `coverage.ts` (covered bbox from the manifest). ``

In "Coding conventions", change "Design:" to note phone-first: `Design: phone-first. Dark slate surfaces...` (rest unchanged).

- [ ] **Step 3: Full gate**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: all pass; build reports `/` as dynamic (ƒ) because it reads `searchParams`.

- [ ] **Step 4: Manual walkthrough (Review Focus included)**

`pnpm dev`, responsive mode 390×844, `http://localhost:3000/?demo=1`:
1. Banner "PROTOTYPE · SIMULATED DATA" and footer "Projection, not a forecast · Call 911 for emergencies" visible.
2. Drag fire → drop → Call 911 sheet → 3 → spread → 10 → "Confirmed by 10 residents" → "See where to go" → shelter sheet and map markers.
3. Close sheet, drag again and release over the status bar → no report (Review Focus 1).
4. Start a drag, then press Escape / switch tabs mid-drag (simulates `pointercancel`) → ghost disappears, no report (Review Focus 2).
5. Drop a second fire within 500 m of your first → your count does not go up (Review Focus 3).
6. `?demo=true` → no banner, no simulated neighbours (Review Focus 4).
7. With a report sheet open, in devtools run `useAppStore.setState(s => ({ reports: s.reports.map(r => ({ ...r, createdAtMs: r.createdAtMs - 61 * 60_000 })) }))` (expose via React devtools, or temporarily add `window.useAppStore = useAppStore` and remove it afterwards); within 5 s the sheet reads "This report has expired." (Review Focus 5).
8. "Reset demo" clears everything and no new simulated reports appear.
Take screenshots of steps 2 (each state) for the PR.

- [ ] **Step 5: Commit**

```bash
cd .. && git add CLAUDE.md web/src/app/layout.tsx
git commit -m "Update docs and metadata for the resident fire-report flow

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```
