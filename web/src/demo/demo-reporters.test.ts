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
