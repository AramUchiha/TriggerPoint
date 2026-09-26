"use client";

import { useDataSources } from "@/components/data/DataProvider";

export function DemoBanner() {
  const { demo, reset } = useDataSources();
  if (!demo) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[4.5rem] z-30 flex justify-center px-16">
      <div
        role="note"
        className="pointer-events-auto flex items-center gap-2 rounded-full border-2 border-dashed border-warning bg-slate-950/90 py-0.5 pr-1 pl-4 text-xs font-bold tracking-wide text-warning"
      >
        PROTOTYPE · SIMULATED DATA
        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-full px-3 font-semibold text-slate-100 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-accent"
        >
          Reset demo
        </button>
      </div>
    </div>
  );
}
