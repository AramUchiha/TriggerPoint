"use client";

import { useDataSources } from "@/components/data/DataProvider";
import { useSelectedCluster, useSpreadFor } from "@/components/data/hooks";
import { COVERAGE_BBOX } from "@/config/coverage";
import { classifyExits, type ExitStatus } from "@/lib/exits";
import { isInBbox, sortByDistance } from "@/lib/geo";
import { formatMiles } from "@/lib/report-copy";
import { zoneAt } from "@/lib/shelter";
import { useAppStore } from "@/store/app-store";

const EXIT_TEXT: Record<ExitStatus, { label: string; className: string }> = {
  threatened: { label: "Threatened by projected spread", className: "text-critical" },
  clear: { label: "Outside projected spread", className: "text-slate-200" },
  unknown: { label: "Status unknown", className: "text-slate-400" },
};

export function ShelterSheet() {
  const cluster = useSelectedCluster();
  const spread = useSpreadFor(cluster);
  const { shelter } = useDataSources();
  const userLocation = useAppStore((s) => s.userLocation);
  const selectedReportId = useAppStore((s) => s.selectedReportId);
  const openReport = useAppStore((s) => s.openReport);

  const me = userLocation && isInBbox(userLocation, COVERAGE_BBOX) ? userLocation : null;
  const origin = me ?? cluster?.centroid ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {selectedReportId && (
          <button
            type="button"
            onClick={() => openReport(selectedReportId)}
            aria-label="Back to report"
            className="flex size-11 items-center justify-center rounded-xl text-slate-200 hover:bg-white/10"
          >
            ‹
          </button>
        )}
        <h2 className="text-lg font-bold text-slate-50">Where to go</h2>
      </div>

      {!shelter ? (
        <p className="text-sm text-slate-400">No shelter sites loaded.</p>
      ) : !origin ? (
        <p className="text-sm text-slate-400">Select a reported fire first.</p>
      ) : (
        <>
          <section>
            <p className="text-sm text-slate-100">
              {me ? "Your zone" : "Zone at the fire"}: {zoneAt(origin, shelter.zones)?.name ?? "unknown"}
            </p>
            <p className="text-xs text-slate-400">Follow official evacuation orders for your zone.</p>
            {!me && (
              <p className="mt-1 text-xs text-slate-400">
                Distances are from the reported fire, not from you. Your location is unavailable or outside the
                covered area.
              </p>
            )}
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-slate-300">Exits</h3>
            <ul className="space-y-1">
              {classifyExits(shelter.exits, spread).map((e) => (
                <li key={e.id} className="flex justify-between gap-3 text-sm">
                  <span className="text-slate-100">{e.name}</span>
                  <span className={EXIT_TEXT[e.status].className}>{EXIT_TEXT[e.status].label}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-1 text-sm font-semibold text-slate-300">Nearest sites</h3>
            <ul className="space-y-2">
              {sortByDistance(origin, shelter.sites)
                .slice(0, 3)
                .map((s) => (
                  <li key={s.id} className="text-sm">
                    <div className="flex justify-between gap-3">
                      <span className="font-semibold text-slate-100">{s.name}</span>
                      <span className="text-slate-300">{formatMiles(s.distanceM)}</span>
                    </div>
                    <p className="text-xs text-slate-400">{s.note}</p>
                  </li>
                ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
