import { CLUSTER_RULES, type Cluster, type ClusterRules } from "./clusters";
import { SPREAD_RING_MINUTES } from "./spread";

export interface ReportCopy {
  title: string;
  detail: string;
  tone: "muted" | "warning" | "critical";
  showShelter: boolean;
}

const RINGS_TEXT = `${SPREAD_RING_MINUTES.slice(0, -1).join(", ")} and ${SPREAD_RING_MINUTES.at(-1)} minute rings`;

/** Crowd status is always phrased as crowd status, never as an official confirmation. */
export function reportCopy(
  cluster: Pick<Cluster, "status" | "distinctReporters">,
  hasSpreadModel: boolean,
  rules: ClusterRules = CLUSTER_RULES,
): ReportCopy {
  const n = cluster.distinctReporters;
  if (cluster.status === "unverified") {
    return {
      title: "Unverified report",
      detail: `${n} of ${rules.reportedAt} reports needed to show spread`,
      tone: "muted",
      showShelter: false,
    };
  }
  const detail = hasSpreadModel ? `Projected spread: ${RINGS_TEXT}` : "No spread model loaded";
  return cluster.status === "confirmed"
    ? { title: `Confirmed by ${n} residents`, detail, tone: "critical", showShelter: true }
    : { title: `Reported by ${n} residents`, detail, tone: "warning", showShelter: true };
}

export function formatMiles(distanceM: number): string {
  return `${(distanceM / 1609.344).toFixed(1)} mi`;
}
