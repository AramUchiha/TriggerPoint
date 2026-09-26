"use client";

import { useSyncExternalStore } from "react";
import { formatClock } from "@/lib/clock";

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
// Whole seconds, so the snapshot is stable between ticks.
const getSnapshot = () => Math.floor(Date.now() / 1000) * 1000;
// Nothing on the server: avoids a hydration mismatch on the time string.
const getServerSnapshot = () => null;

export function Clock() {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const parts = now === null ? null : formatClock(now);

  return (
    <div className="text-right leading-tight" aria-live="off">
      <div className="font-semibold tabular-nums text-slate-50">
        {parts ? parts.time : "--:--:--"}
        <span className="ml-1.5 text-sm font-medium text-slate-400">{parts?.zone}</span>
      </div>
      <div className="text-xs text-slate-400">{parts?.date ?? " "}</div>
    </div>
  );
}
