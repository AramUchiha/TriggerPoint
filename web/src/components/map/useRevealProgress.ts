"use client";

import { useEffect, useRef, useState } from "react";

/** 0..1 grow-in progress per id, starting the first time each id appears. */
export function useRevealProgress(ids: readonly string[], durationMs = 1_500): ReadonlyMap<string, number> {
  const starts = useRef(new Map<string, number>());
  const [progress, setProgress] = useState<ReadonlyMap<string, number>>(new Map());
  const key = ids.join("|");

  useEffect(() => {
    const current = key ? key.split("|") : [];
    const t0 = performance.now();
    for (const id of current) if (!starts.current.has(id)) starts.current.set(id, t0);

    let raf = 0;
    const tick = () => {
      const t = performance.now();
      const next = new Map<string, number>();
      let running = false;
      for (const id of current) {
        const p = Math.min(1, (t - (starts.current.get(id) ?? t)) / durationMs);
        next.set(id, p);
        if (p < 1) running = true;
      }
      setProgress(next);
      if (running) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key, durationMs]);

  return progress;
}
