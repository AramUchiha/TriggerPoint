// SIMULATED DATA. Only reachable through DataProvider with ?demo=1 (see eslint.config.mjs).
// Names are deliberately synthetic. None of these are real shelters, zones, or exits.
import { DEMO_SOURCE } from "@/lib/provenance";
import type { ShelterData } from "@/lib/shelter";

const provenance = { source: DEMO_SOURCE, vintage: "simulated", notes: "Prototype placeholder, not a real location." };

export const DEMO_SHELTER: ShelterData = {
  zones: [
    {
      id: "demo-1",
      name: "Zone DEMO-1",
      polygon: [[-118.32, 34.12], [-118.245, 34.12], [-118.245, 34.27], [-118.32, 34.27], [-118.32, 34.12]],
      provenance,
    },
    {
      id: "demo-2",
      name: "Zone DEMO-2",
      polygon: [[-118.245, 34.12], [-118.17, 34.12], [-118.17, 34.27], [-118.245, 34.27], [-118.245, 34.12]],
      provenance,
    },
  ],
  exits: [
    { id: "demo-exit-n", name: "Demo Exit North", lng: -118.245, lat: 34.25, provenance },
    { id: "demo-exit-s", name: "Demo Exit South", lng: -118.245, lat: 34.14, provenance },
    { id: "demo-exit-w", name: "Demo Exit West", lng: -118.3, lat: 34.195, provenance },
    { id: "demo-exit-e", name: "Demo Exit East", lng: -118.19, lat: 34.195, provenance },
  ],
  sites: [
    { id: "demo-site-a", name: "Demo Shelter A", lng: -118.25, lat: 34.15, note: "Demo site. Check if open.", provenance },
    { id: "demo-site-b", name: "Demo Shelter B", lng: -118.2, lat: 34.16, note: "Demo site. Check if open.", provenance },
    { id: "demo-site-c", name: "Demo Shelter C", lng: -118.29, lat: 34.13, note: "Demo site. Check if open.", provenance },
  ],
};
