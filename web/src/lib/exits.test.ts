import { describe, expect, it } from "vitest";
import { classifyExits } from "./exits";
import type { ShelterExit } from "./shelter";
import type { SpreadResult } from "./spread";

// Synthetic fixtures; not data.
const provenance = { source: "test fixture", vintage: "n/a" };
const exits: ShelterExit[] = [
  { id: "in", name: "Inside", lng: 0.5, lat: 0.5, provenance },
  { id: "out", name: "Outside", lng: 5, lat: 5, provenance },
];
const spread: SpreadResult = {
  origin: { lng: 0.1, lat: 0.1 },
  provenance,
  rings: [
    { minutes: 30, polygon: [[0, 0], [0.2, 0], [0.2, 0.2], [0, 0.2], [0, 0]] },
    { minutes: 120, polygon: [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]] },
  ],
};

describe("classifyExits", () => {
  it("marks exits inside the outermost (120 min) ring as threatened, others clear", () => {
    expect(classifyExits(exits, spread).map((e) => [e.id, e.status])).toEqual([
      ["in", "threatened"],
      ["out", "clear"],
    ]);
  });

  it("never says clear without a spread model", () => {
    expect(classifyExits(exits, null).map((e) => e.status)).toEqual(["unknown", "unknown"]);
  });

  it("is unknown when the spread has no rings", () => {
    expect(classifyExits(exits, { ...spread, rings: [] }).map((e) => e.status)).toEqual(["unknown", "unknown"]);
  });
});
