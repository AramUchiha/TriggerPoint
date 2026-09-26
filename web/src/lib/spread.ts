import type { Provenance } from "@/types/scenario";
import type { LngLat, Ring } from "./geo";

/** Minutes after ignition for each projected spread ring. */
export const SPREAD_RING_MINUTES = [30, 60, 120] as const;

export interface SpreadRing {
  minutes: number;
  polygon: Ring;
}

export interface SpreadResult {
  origin: LngLat;
  rings: SpreadRing[];
  provenance: Provenance;
}

/**
 * Projects spread from an ignition point. Only the demo provider exists today; the real one
 * (browser minimum-travel-time on pipeline spread-rate rasters) plugs in behind this interface.
 */
export interface SpreadProvider {
  getSpread(origin: LngLat): SpreadResult;
}

/** The ring with the most minutes. */
export function outerRing(spread: SpreadResult): SpreadRing | undefined {
  return spread.rings.reduce<SpreadRing | undefined>(
    (outer, ring) => (!outer || ring.minutes > outer.minutes ? ring : outer),
    undefined,
  );
}
