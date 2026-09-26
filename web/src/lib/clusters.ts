import { haversineM, type LngLat } from "./geo";
import type { Report } from "./reports";

export interface ClusterRules {
  /** Reports within this distance of any cluster member join the cluster. */
  radiusM: number;
  /** Reports older than this are ignored. */
  windowMin: number;
  /** Distinct reporters needed before projected spread is shown. */
  reportedAt: number;
  /** Distinct reporters needed for "Confirmed by N residents". */
  confirmedAt: number;
}

/** The crowd-reporting rule. A future backend must enforce the same values. */
export const CLUSTER_RULES: ClusterRules = { radiusM: 500, windowMin: 60, reportedAt: 3, confirmedAt: 10 };

export type ClusterStatus = "unverified" | "reported" | "confirmed";

export interface Cluster {
  /** The earliest report's id, so it stays stable as reports join. */
  id: string;
  centroid: LngLat;
  /** Oldest first. */
  reports: Report[];
  distinctReporters: number;
  status: ClusterStatus;
}

function statusFor(distinctReporters: number, rules: ClusterRules): ClusterStatus {
  if (distinctReporters >= rules.confirmedAt) return "confirmed";
  if (distinctReporters >= rules.reportedAt) return "reported";
  return "unverified";
}

/** Single-linkage clustering of live reports. Returns clusters oldest first. */
export function clusterReports(
  reports: readonly Report[],
  nowMs: number,
  rules: ClusterRules = CLUSTER_RULES,
): Cluster[] {
  const windowMs = rules.windowMin * 60_000;
  const live = reports
    .filter((r) => nowMs - r.createdAtMs <= windowMs)
    .sort((a, b) => a.createdAtMs - b.createdAtMs || a.id.localeCompare(b.id));

  // Union-find where each root is the lowest (earliest) index in its set.
  const parent = live.map((_, i) => i);
  const find = (i: number): number => {
    let root = i;
    while (parent[root] !== root) root = parent[root]!;
    return root;
  };
  for (let i = 0; i < live.length; i++) {
    for (let j = i + 1; j < live.length; j++) {
      if (haversineM(live[i]!, live[j]!) > rules.radiusM) continue;
      const ri = find(i);
      const rj = find(j);
      if (ri !== rj) parent[Math.max(ri, rj)] = Math.min(ri, rj);
    }
  }

  const groups = new Map<number, Report[]>();
  live.forEach((r, i) => {
    const root = find(i);
    groups.set(root, [...(groups.get(root) ?? []), r]);
  });

  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, members]) => {
      const distinctReporters = new Set(members.map((r) => r.reporterId)).size;
      return {
        id: members[0]!.id,
        centroid: {
          lng: members.reduce((sum, r) => sum + r.lng, 0) / members.length,
          lat: members.reduce((sum, r) => sum + r.lat, 0) / members.length,
        },
        reports: members,
        distinctReporters,
        status: statusFor(distinctReporters, rules),
      };
    });
}
