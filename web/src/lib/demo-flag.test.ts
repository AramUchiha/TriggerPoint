import { describe, expect, it } from "vitest";
import { parseDemoFlag } from "./demo-flag";

describe("parseDemoFlag", () => {
  it("is on only for exactly '1'", () => {
    expect(parseDemoFlag("1")).toBe(true);
    expect(parseDemoFlag("true")).toBe(false);
    expect(parseDemoFlag("0")).toBe(false);
    expect(parseDemoFlag("")).toBe(false);
    expect(parseDemoFlag(undefined)).toBe(false);
  });

  it("uses the first value when the param repeats", () => {
    expect(parseDemoFlag(["1", "0"])).toBe(true);
    expect(parseDemoFlag(["0", "1"])).toBe(false);
    expect(parseDemoFlag([])).toBe(false);
  });
});
