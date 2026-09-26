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
