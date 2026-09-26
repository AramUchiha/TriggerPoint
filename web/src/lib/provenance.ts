import type { Provenance } from "@/types/scenario";

/** `Provenance.source` for simulated prototype data (src/demo, ?demo=1 only). */
export const DEMO_SOURCE = "demo";

export function isDemo(provenance: Provenance): boolean {
  return provenance.source === DEMO_SOURCE;
}
