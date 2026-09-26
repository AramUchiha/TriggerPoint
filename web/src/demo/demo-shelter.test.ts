import { describe, expect, it } from "vitest";
import { COVERAGE_BBOX } from "@/config/coverage";
import { isInBbox } from "@/lib/geo";
import { DEMO_SOURCE } from "@/lib/provenance";
import { DEMO_SHELTER } from "./demo-shelter";

describe("DEMO_SHELTER", () => {
  const all = [...DEMO_SHELTER.zones, ...DEMO_SHELTER.exits, ...DEMO_SHELTER.sites];

  it("uses obviously synthetic names so screenshots can't pass as real guidance", () => {
    for (const item of all) expect(item.name).toMatch(/\bDEMO\b|^Demo /);
  });

  it("tags everything as demo provenance", () => {
    for (const item of all) expect(item.provenance.source).toBe(DEMO_SOURCE);
  });

  it("places exits and sites inside the covered area", () => {
    for (const p of [...DEMO_SHELTER.exits, ...DEMO_SHELTER.sites]) {
      expect(isInBbox(p, COVERAGE_BBOX)).toBe(true);
    }
  });
});
