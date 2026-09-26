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
