import { describe, expect, it } from "vitest";
import { parseMapProvider } from "./map-provider";

describe("parseMapProvider", () => {
  it("defaults to maplibre when unset or blank", () => {
    expect(parseMapProvider(undefined)).toBe("maplibre");
    expect(parseMapProvider("")).toBe("maplibre");
    expect(parseMapProvider("   ")).toBe("maplibre");
  });

  it("accepts known providers case-insensitively", () => {
    expect(parseMapProvider("mapbox")).toBe("mapbox");
    expect(parseMapProvider(" MapLibre ")).toBe("maplibre");
  });

  it("rejects unknown providers instead of falling back", () => {
    expect(() => parseMapProvider("google")).toThrow();
  });
});
