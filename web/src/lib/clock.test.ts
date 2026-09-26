import { describe, expect, it } from "vitest";
import { formatClock } from "./clock";

describe("formatClock", () => {
  it("formats 24-hour Pacific time with the standard-time abbreviation in winter", () => {
    // 2026-01-15 20:05:09 UTC = 12:05:09 PST
    expect(formatClock(Date.UTC(2026, 0, 15, 20, 5, 9))).toEqual({
      time: "12:05:09",
      zone: "PST",
      date: "Thu, Jan 15",
    });
  });

  it("switches to daylight time in summer and uses 00 for midnight", () => {
    // 2026-07-04 07:00:00 UTC = 00:00:00 PDT
    const { time, zone } = formatClock(Date.UTC(2026, 6, 4, 7, 0, 0));
    expect(time).toBe("00:00:00");
    expect(zone).toBe("PDT");
  });
});
