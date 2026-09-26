"use client";

import { useEffect, useMemo, useState } from "react";
import { clusterReports, type Cluster } from "@/lib/clusters";
import type { SpreadResult } from "@/lib/spread";
import { useAppStore } from "@/store/app-store";
import { useDataSources } from "./DataProvider";

/** Current time, refreshed every `intervalMs` so old reports age out. */
export function useNow(intervalMs = 5_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function useClusters(): Cluster[] {
  const reports = useAppStore((s) => s.reports);
  const now = useNow();
  return useMemo(() => clusterReports(reports, now), [reports, now]);
}

export function useSelectedCluster(): Cluster | null {
  const clusters = useClusters();
  const selectedReportId = useAppStore((s) => s.selectedReportId);
  return useMemo(
    () => clusters.find((c) => c.reports.some((r) => r.id === selectedReportId)) ?? null,
    [clusters, selectedReportId],
  );
}

/** Projected spread for a cluster once it has reached "reported"; null otherwise or without a model. */
export function useSpreadFor(cluster: Cluster | null): SpreadResult | null {
  const { spread } = useDataSources();
  const active = cluster !== null && cluster.status !== "unverified";
  const lng = cluster?.centroid.lng;
  const lat = cluster?.centroid.lat;
  return useMemo(
    () => (spread && active && lng !== undefined && lat !== undefined ? spread.getSpread({ lng, lat }) : null),
    [spread, active, lng, lat],
  );
}

/** Keeps `userLocation` in the store current. Denied or unavailable leaves it null. */
export function useWatchUserLocation(): void {
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setUserLocation({ lng: pos.coords.longitude, lat: pos.coords.latitude }),
      () => setUserLocation(null),
      { enableHighAccuracy: true, maximumAge: 30_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [setUserLocation]);
}
