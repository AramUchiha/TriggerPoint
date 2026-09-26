import { describe, expect, it } from "vitest";
import manifest from "../../public/scenarios/manifest.json";
import { CommunitySchema, ScenarioManifestSchema, WindFieldSchema } from "./scenario";

// Values below are synthetic test fixtures, not data.
const provenance = { source: "test fixture", vintage: "n/a" };
const method = { model: "WindNinja", version: "test", configuration: "test fixture" } as const;

describe("scenario schemas", () => {
  it("sanity: the checked-in manifest matches the schema", () => {
    const parsed = ScenarioManifestSchema.parse(manifest);
    expect(parsed.generatedAt).toBeNull();
    expect(parsed.files).toEqual([]);
  });

  it("rejects a community with no exits", () => {
    const result = CommunitySchema.safeParse({
      id: "test-community",
      name: "Test",
      households: 1,
      vehiclesPerHousehold: 1,
      exits: [],
      provenance: { households: provenance, vehiclesPerHousehold: provenance },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a wind field whose arrays do not match the grid", () => {
    const result = WindFieldSchema.safeParse({
      id: "test-wind",
      windDirectionDeg: 45,
      windSpeedMph: 1,
      outputHeightM: 6.1,
      method,
      grid: { crs: "EPSG:32611", bbox: [0, 0, 1, 1], width: 2, height: 2, cellSizeM: 1 },
      speedMph: [1, 1, 1],
      directionDeg: [0, 0, 0, 0],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["speedMph"]);
  });
});
