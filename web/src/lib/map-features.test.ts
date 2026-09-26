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
