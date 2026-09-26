import { CLUSTER_RULES, type ClusterRules } from "./clusters";
import { haversineM } from "./geo";

/** Reporter id for the person using this device. */
export const MY_REPORTER_ID = "me";

export interface Report {
  id: string;
  lng: number;
  lat: number;
  createdAtMs: number;
  reporterId: string;
}

export interface ReportInput {
  lng: number;
  lat: number;
  reporterId: string;
}

/**
 * Adds a report, or moves the reporter's existing live report if it is within the
 * cluster radius, so one reporter never counts twice for the same fire.
 */
export function upsertReport(
  reports: readonly Report[],
  input: ReportInput,
  nowMs: number,
  makeId: () => string,
  rules: Pick<ClusterRules, "radiusM" | "windowMin"> = CLUSTER_RULES,
): { reports: Report[]; id: string } {
  const windowMs = rules.windowMin * 60_000;
  const existing = reports.find(
    (r) =>
      r.reporterId === input.reporterId &&
      nowMs - r.createdAtMs <= windowMs &&
      haversineM(r, input) <= rules.radiusM,
  );
  if (existing) {
    const moved: Report = { ...existing, lng: input.lng, lat: input.lat, createdAtMs: nowMs };
    return { reports: reports.map((r) => (r.id === existing.id ? moved : r)), id: existing.id };
  }
  const id = makeId();
  return { reports: [...reports, { id, ...input, createdAtMs: nowMs }], id };
}
