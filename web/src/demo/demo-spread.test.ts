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
