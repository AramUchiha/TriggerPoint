/** WGS84 point in degrees. */
export interface LngLat {
  lng: number;
  lat: number;
}

/** Polygon ring as [lng, lat] vertices. */
export type Ring = [number, number][];

/** [west, south, east, north] in WGS84 degrees. */
export type BBox = readonly [number, number, number, number];

const EARTH_RADIUS_M = 6_371_008.8;
const M_PER_DEG_LAT = (Math.PI / 180) * EARTH_RADIUS_M;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function haversineM(a: LngLat, b: LngLat): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial compass bearing from `from` to `to`, degrees in [0, 360). */
export function bearingDeg(from: LngLat, to: LngLat): number {
  const phi1 = toRad(from.lat);
  const phi2 = toRad(to.lat);
  const dLambda = toRad(to.lng - from.lng);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/** Moves a point by metres east / north. Flat-earth approximation; fine at neighbourhood scale. */
export function offsetM(origin: LngLat, eastM: number, northM: number): LngLat {
  return {
    lng: origin.lng + eastM / (M_PER_DEG_LAT * Math.cos(toRad(origin.lat))),
    lat: origin.lat + northM / M_PER_DEG_LAT,
  };
}

/** Ray casting; `ring` may be open or closed. */
export function pointInPolygon(p: LngLat, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    const crosses = yi > p.lat !== yj > p.lat && p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

export function isInBbox(p: LngLat, [west, south, east, north]: BBox): boolean {
  return p.lng >= west && p.lng <= east && p.lat >= south && p.lat <= north;
}

export function sortByDistance<T extends LngLat>(
  origin: LngLat,
  items: readonly T[],
): (T & { distanceM: number })[] {
  return items
    .map((item) => ({ ...item, distanceM: haversineM(origin, item) }))
    .sort((a, b) => a.distanceM - b.distanceM);
}

/** Scales a ring about `origin`; t = 0 collapses it to the origin, t = 1 leaves it unchanged. */
export function scaleRing(ring: Ring, origin: LngLat, t: number): Ring {
  return ring.map(([lng, lat]) => [origin.lng + (lng - origin.lng) * t, origin.lat + (lat - origin.lat) * t]);
}
