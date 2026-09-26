// SIMULATED DATA. Only reachable through DataProvider with ?demo=1 (see eslint.config.mjs).
import { offsetM, type LngLat, type Ring } from "@/lib/geo";
import { DEMO_SOURCE } from "@/lib/provenance";
import { SPREAD_RING_MINUTES, type SpreadProvider } from "@/lib/spread";

/** Fixed demo wind, degrees FROM: a Santa Ana out of the north-east. */
export const DEMO_WIND_FROM_DEG = 45;
export const DEMO_HEAD_M_PER_MIN = 50;
const BACK_M_PER_MIN = 5;
const LENGTH_TO_BREADTH = 3;
const VERTICES = 48;

/** Ellipse with the origin near its back end, stretched downwind. Not a fire model. */
function demoEllipse(origin: LngLat, minutes: number): Ring {
  const semiMajorM = ((DEMO_HEAD_M_PER_MIN + BACK_M_PER_MIN) / 2) * minutes;
  const semiMinorM = semiMajorM / LENGTH_TO_BREADTH;
  const centreShiftM = ((DEMO_HEAD_M_PER_MIN - BACK_M_PER_MIN) / 2) * minutes;
  const toward = (((DEMO_WIND_FROM_DEG + 180) % 360) * Math.PI) / 180;
  // Unit vectors in (east, north): downwind u, crosswind v.
  const [ux, uy] = [Math.sin(toward), Math.cos(toward)];
  const [vx, vy] = [Math.cos(toward), -Math.sin(toward)];

  const ring: Ring = [];
  for (let k = 0; k < VERTICES; k++) {
    const phi = (2 * Math.PI * k) / VERTICES;
    const along = centreShiftM + semiMajorM * Math.cos(phi);
    const across = semiMinorM * Math.sin(phi);
    const p = offsetM(origin, along * ux + across * vx, along * uy + across * vy);
    ring.push([p.lng, p.lat]);
  }
  ring.push(ring[0]!);
  return ring;
}

export const demoSpreadProvider: SpreadProvider = {
  getSpread(origin) {
    return {
      origin,
      rings: SPREAD_RING_MINUTES.map((minutes) => ({ minutes, polygon: demoEllipse(origin, minutes) })),
      provenance: {
        source: DEMO_SOURCE,
        vintage: "simulated",
        notes: `Prototype only: wind-stretched ellipse, wind from ${DEMO_WIND_FROM_DEG}°. Not a fire model.`,
      },
    };
  },
};
