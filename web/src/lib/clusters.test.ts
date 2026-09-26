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
