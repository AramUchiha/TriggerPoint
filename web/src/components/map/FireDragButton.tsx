"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useMap } from "react-map-gl/maplibre";
import { useDataSources } from "@/components/data/DataProvider";
import { COVERAGE_BBOX } from "@/config/coverage";
import { isInBbox, type LngLat } from "@/lib/geo";
import { MY_REPORTER_ID } from "@/lib/reports";
import { useAppStore } from "@/store/app-store";

/** Movement (px) before a press becomes a drag rather than a tap. */
const DRAG_THRESHOLD_PX = 8;

/** Pegman-style fire: drag onto the map to report; tap (or Enter) reports at map centre. */
export function FireDragButton() {
  const { current: mapRef } = useMap();
  const sheet = useAppStore((s) => s.sheet);
  const { onMyReport } = useDataSources();
  const start = useRef<{ x: number; y: number } | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number } | null>(null);

  const report = (at: LngLat) => {
    const { addReport, openReport, showNotice } = useAppStore.getState();
    if (!isInBbox(at, COVERAGE_BBOX)) {
      showNotice("Outside the area we cover");
      return;
    }
    openReport(addReport({ ...at, reporterId: MY_REPORTER_ID }, Date.now()));
    onMyReport(at);
  };

  const reportAtCenter = () => {
    const map = mapRef?.getMap();
    if (map) report(map.getCenter());
  };

  const dropAt = (clientX: number, clientY: number) => {
    const map = mapRef?.getMap();
    if (!map) return;
    // Only drops over the map itself count, not over the status bar, banner, footer, or sheet.
    const target = document.elementFromPoint(clientX, clientY);
    if (!target || !map.getCanvasContainer().contains(target)) return;
    const rect = map.getContainer().getBoundingClientRect();
    const { lng, lat } = map.unproject([clientX - rect.left, clientY - rect.top]);
    report({ lng, lat });
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (!start.current) return;
    const moved = Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y);
    if (ghost || moved > DRAG_THRESHOLD_PX) setGhost({ x: e.clientX, y: e.clientY });
  };
  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (!start.current) return;
    start.current = null;
    if (ghost) {
      setGhost(null);
      dropAt(e.clientX, e.clientY);
    } else {
      reportAtCenter();
    }
  };
  const cancel = () => {
    start.current = null;
    setGhost(null);
  };

  if (sheet !== "none") return null;

  return (
    <>
      <button
        type="button"
        aria-label="Report a fire: drag onto the map, or tap to report at map center"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={cancel}
        onLostPointerCapture={() => ghost && cancel()}
        // Keyboard activation (detail === 0); pointer taps are handled in onPointerUp.
        onClick={(e) => e.detail === 0 && reportAtCenter()}
        className="absolute right-4 bottom-12 z-20 flex size-16 touch-none items-center justify-center rounded-full border-2 border-critical bg-slate-950/90 text-3xl shadow-lg select-none focus-visible:outline-2 focus-visible:outline-accent"
      >
        <span aria-hidden>🔥</span>
      </button>
      {ghost && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-dashed border-critical text-3xl"
          style={{ left: ghost.x, top: ghost.y }}
        >
          🔥
        </div>
      )}
    </>
  );
}
