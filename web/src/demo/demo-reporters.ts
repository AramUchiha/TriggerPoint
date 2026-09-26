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
