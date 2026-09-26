"use client";

import type { ExpressionSpecification } from "maplibre-gl";
import { useMemo } from "react";
import { Layer, Marker, Source } from "react-map-gl/maplibre";
import { useDataSources } from "@/components/data/DataProvider";
import {
  useClusters,
  useSelectedCluster,
  useSpreadFor,
  useWatchUserLocation,
} from "@/components/data/hooks";
import { COVERAGE_BBOX } from "@/config/coverage";
import type { Cluster } from "@/lib/clusters";
import { classifyExits, type ExitStatus } from "@/lib/exits";
import { isInBbox } from "@/lib/geo";
import { reportsToFeatures, spreadToFeatures } from "@/lib/map-features";
import { useAppStore } from "@/store/app-store";
import { useRevealProgress } from "./useRevealProgress";

const RING_COLOR: ExpressionSpecification = ["match", ["get", "minutes"], 30, "#f87171", 60, "#fb923c", "#fbbf24"];

/** Reports, spread rings, and (on the shelter sheet) exits and sites. Native layers drape on terrain. */
export function ResidentLayers({ beforeId }: { beforeId?: string }) {
  useWatchUserLocation();
  const clusters = useClusters();
  const reports = useAppStore((s) => s.reports);
  const sheet = useAppStore((s) => s.sheet);
  const openReport = useAppStore((s) => s.openReport);
  const userLocation = useAppStore((s) => s.userLocation);
  const { spread: provider, shelter } = useDataSources();

  const active = useMemo(
    () =>
      provider
        ? clusters
            .filter((c) => c.status !== "unverified")
            .map((c) => ({ id: c.id, spread: provider.getSpread(c.centroid) }))
        : [],
    [clusters, provider],
  );
  const reveal = useRevealProgress(active.map((a) => a.id));
  const spreadData = useMemo(
    () => spreadToFeatures(active.map((a) => ({ spread: a.spread, reveal: reveal.get(a.id) ?? 0 }))),
    [active, reveal],
  );
  const reportData = useMemo(() => reportsToFeatures(reports), [reports]);

  const selected = useSelectedCluster();
  const selectedSpread = useSpreadFor(selected);
  const exits = useMemo(
    () => (shelter ? classifyExits(shelter.exits, selectedSpread) : []),
    [shelter, selectedSpread],
  );
  const showShelter = sheet === "shelter" && shelter !== null;

  return (
    <>
      <Source id="spread" type="geojson" data={spreadData}>
        <Layer id="spread-fill" type="fill" beforeId={beforeId} paint={{ "fill-color": RING_COLOR, "fill-opacity": 0.14 }} />
        <Layer
          id="spread-line-demo"
          type="line"
          beforeId={beforeId}
          filter={["==", ["get", "demo"], true]}
          paint={{ "line-color": RING_COLOR, "line-width": 2, "line-dasharray": [2, 1.5] }}
        />
        <Layer
          id="spread-line"
          type="line"
          beforeId={beforeId}
          filter={["==", ["get", "demo"], false]}
          paint={{ "line-color": RING_COLOR, "line-width": 2 }}
        />
      </Source>
      <Source id="reports" type="geojson" data={reportData}>
        <Layer
          id="report-dots"
          type="circle"
          beforeId={beforeId}
          paint={{
            "circle-radius": 4,
            "circle-color": ["case", ["get", "mine"], "#f8fafc", "#94a3b8"],
            "circle-stroke-color": "#0b1120",
            "circle-stroke-width": 1,
            "circle-pitch-alignment": "map",
          }}
        />
      </Source>

      {clusters.map((c) => (
        <Marker key={c.id} longitude={c.centroid.lng} latitude={c.centroid.lat} anchor="center">
          <ClusterMarker cluster={c} onSelect={() => openReport(c.id)} />
        </Marker>
      ))}

      {showShelter &&
        exits.map((e) => (
          <Marker key={e.id} longitude={e.lng} latitude={e.lat} anchor="bottom">
            <ExitMarker name={e.name} status={e.status} />
          </Marker>
        ))}
      {showShelter &&
        shelter.sites.map((s) => (
          <Marker key={s.id} longitude={s.lng} latitude={s.lat} anchor="bottom">
            <span className="glass flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-100">
              <span aria-hidden>⌂</span>
              {s.name}
            </span>
          </Marker>
        ))}

      {userLocation && isInBbox(userLocation, COVERAGE_BBOX) && (
        <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
          <span aria-label="You are here" className="block size-4 rounded-full border-2 border-white bg-accent shadow" />
        </Marker>
      )}
    </>
  );
}

const CLUSTER_STYLE: Record<Cluster["status"], string> = {
  unverified: "size-11 border-2 border-dashed border-slate-300 opacity-80",
  reported: "size-12 border-2 border-warning",
  confirmed: "size-12 border-4 border-critical",
};

function ClusterMarker({ cluster, onSelect }: { cluster: Cluster; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      aria-label={`Fire report, ${cluster.distinctReporters} residents, ${cluster.status}`}
      className={`relative flex items-center justify-center rounded-full bg-slate-950/80 text-xl focus-visible:outline-2 focus-visible:outline-accent ${CLUSTER_STYLE[cluster.status]}`}
    >
      <span aria-hidden>🔥</span>
      <span className="absolute -top-1.5 -right-1.5 min-w-5 rounded-full bg-slate-100 px-1 text-center text-xs font-bold text-slate-900">
        {cluster.distinctReporters}
      </span>
    </button>
  );
}

const EXIT_STYLE: Record<ExitStatus, { className: string; label: string }> = {
  threatened: { className: "border-critical text-critical", label: "Threatened" },
  clear: { className: "border-slate-300 text-slate-100", label: "Clear" },
  unknown: { className: "border-slate-500 text-slate-400", label: "Status unknown" },
};

function ExitMarker({ name, status }: { name: string; status: ExitStatus }) {
  const style = EXIT_STYLE[status];
  return (
    <span className={`glass flex items-center gap-1 rounded-lg border-2 px-2 py-1 text-xs font-semibold ${style.className}`}>
      {name} · {style.label}
    </span>
  );
}
