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
