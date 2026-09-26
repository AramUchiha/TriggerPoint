import { pointInPolygon } from "./geo";
import type { ShelterExit } from "./shelter";
import { outerRing, type SpreadResult } from "./spread";

export type ExitStatus = "threatened" | "clear" | "unknown";
export type ClassifiedExit = ShelterExit & { status: ExitStatus };

/** Threatened if inside the outermost projected ring. Never "clear" without a spread. */
export function classifyExits(exits: readonly ShelterExit[], spread: SpreadResult | null): ClassifiedExit[] {
  const ring = spread ? outerRing(spread) : undefined;
  return exits.map((exit) => ({
    ...exit,
    status: !ring ? "unknown" : pointInPolygon(exit, ring.polygon) ? "threatened" : "clear",
  }));
}
