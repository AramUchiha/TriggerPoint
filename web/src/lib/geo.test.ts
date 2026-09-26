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
