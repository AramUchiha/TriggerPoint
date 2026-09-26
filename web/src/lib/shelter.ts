import type { Provenance } from "@/types/scenario";
import { pointInPolygon, type LngLat, type Ring } from "./geo";

export interface Zone {
  id: string;
  name: string;
  polygon: Ring;
  provenance: Provenance;
}

export interface ShelterExit {
  id: string;
  name: string;
  lng: number;
  lat: number;
  provenance: Provenance;
}

export interface Site {
  id: string;
  name: string;
  lng: number;
  lat: number;
  /** Shown under the name, e.g. "Check if open". */
  note: string;
  provenance: Provenance;
}

export interface ShelterData {
  zones: Zone[];
  exits: ShelterExit[];
  sites: Site[];
}

export function zoneAt(p: LngLat, zones: readonly Zone[]): Zone | null {
  return zones.find((z) => pointInPolygon(p, z.polygon)) ?? null;
}
