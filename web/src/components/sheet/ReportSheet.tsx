"use client";

import { useDataSources } from "@/components/data/DataProvider";
import { useSelectedCluster } from "@/components/data/hooks";
import { CLUSTER_RULES } from "@/lib/clusters";
import { reportCopy, type ReportCopy } from "@/lib/report-copy";
import { useAppStore } from "@/store/app-store";

const TONE: Record<ReportCopy["tone"], string> = {
  muted: "text-slate-200",
  warning: "text-warning",
  critical: "text-critical",
};

export function ReportSheet() {
  const cluster = useSelectedCluster();
  const { spread } = useDataSources();
  const openShelter = useAppStore((s) => s.openShelter);

  return (
    <div className="space-y-4">
      <a
        href="tel:911"
        className="flex min-h-14 items-center justify-center rounded-xl bg-critical text-lg font-bold text-slate-950 focus-visible:outline-2 focus-visible:outline-accent"
      >
        Call 911
      </a>
      <p className="text-sm text-slate-300">
        See a fire? Call 911 first. Reporting here does not alert anyone. If the button doesn&apos;t work, dial 911.
      </p>

      {!cluster ? (
        <p className="text-sm text-slate-400">This report has expired.</p>
      ) : (
        <ClusterStatus copy={reportCopy(cluster, spread !== null)} reporters={cluster.distinctReporters} />
      )}

      {cluster && reportCopy(cluster, spread !== null).showShelter && (
        <>
          <p className="text-xs text-slate-400">
            Projection, not a forecast. Embers can start fires well ahead of these rings.
          </p>
          <button
            type="button"
            onClick={openShelter}
            className="min-h-12 w-full rounded-xl bg-accent font-semibold text-slate-950 focus-visible:outline-2 focus-visible:outline-white"
          >
            See where to go
          </button>
        </>
      )}
    </div>
  );
}

function ClusterStatus({ copy, reporters }: { copy: ReportCopy; reporters: number }) {
  const progress = Math.min(1, reporters / CLUSTER_RULES.reportedAt);
  return (
    <div>
      <h2 className={`text-lg font-bold ${TONE[copy.tone]}`}>{copy.title}</h2>
      <p className="text-sm text-slate-300">{copy.detail}</p>
      {copy.tone === "muted" && (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800" aria-hidden>
          <div className="h-full bg-slate-300 transition-[width]" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
    </div>
  );
}
