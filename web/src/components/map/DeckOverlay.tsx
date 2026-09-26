"use client";

import type { Layer } from "@deck.gl/core";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { Map as MaplibreMap } from "maplibre-gl";
import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";

// One interleaved overlay per map instance. Deliberately not tied to React's effect
// lifecycle: StrictMode re-runs effects (add, remove, add), and re-attaching an
// interleaved deck to the same WebGL context throws "context already attached".
// MapLibre's map.remove() calls onRemove on its controls, which finalizes deck.
const overlays = new WeakMap<MaplibreMap, MapboxOverlay>();

function overlayFor(map: MaplibreMap): MapboxOverlay {
  let overlay = overlays.get(map);
  if (!overlay) {
    overlay = new MapboxOverlay({ interleaved: true });
    map.addControl(overlay);
    overlays.set(map, overlay);
  }
  return overlay;
}

/** Renders deck.gl layers inside the MapLibre map, depth-tested against 3D terrain. */
export function DeckOverlay({ layers }: { layers: Layer[] }) {
  const { current: mapRef } = useMap();

  useEffect(() => {
    const map = mapRef?.getMap();
    if (map) overlayFor(map).setProps({ layers });
  }, [mapRef, layers]);

  return null;
}
