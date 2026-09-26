"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useState } from "react";
import Map, { Layer, NavigationControl, Source, type MapEvent } from "react-map-gl/maplibre";
import {
  BASEMAP_STYLE_URL,
  HILLSHADE_SOURCE_ID,
  INITIAL_VIEW_STATE,
  MAP_PROVIDER,
  SKY,
  TERRAIN_EXAGGERATION,
  TERRAIN_SOURCE_ID,
  TERRAIN_TILES,
} from "@/config/map";

const TERRAIN = { source: TERRAIN_SOURCE_ID, exaggeration: TERRAIN_EXAGGERATION };

export default function MapView() {
  if (MAP_PROVIDER !== "maplibre") {
    throw new Error(
      `NEXT_PUBLIC_MAP_PROVIDER="${MAP_PROVIDER}" is not wired yet; see src/config/map.ts.`,
    );
  }

  // Hillshade goes beneath the basemap's first label layer so text stays legible.
  // Looked up at load time so any basemap style works without hard-coded layer ids.
  const [labelLayerId, setLabelLayerId] = useState<string | undefined>();
  const [styleReady, setStyleReady] = useState(false);

  const handleLoad = (e: MapEvent) => {
    setLabelLayerId(e.target.getStyle().layers.find((l) => l.type === "symbol")?.id);
    setStyleReady(true);
  };

  return (
    <Map
      initialViewState={INITIAL_VIEW_STATE}
      mapStyle={BASEMAP_STYLE_URL}
      terrain={TERRAIN}
      sky={SKY}
      maxPitch={85}
      attributionControl={{ compact: true }}
      onLoad={handleLoad}
      style={{ position: "absolute", inset: 0 }}
    >
      <Source id={TERRAIN_SOURCE_ID} type="raster-dem" {...TERRAIN_TILES} />
      <Source id={HILLSHADE_SOURCE_ID} type="raster-dem" {...TERRAIN_TILES} />
      {styleReady && (
        <Layer
          id="hillshade"
          type="hillshade"
          source={HILLSHADE_SOURCE_ID}
          beforeId={labelLayerId}
          paint={{
            "hillshade-exaggeration": 0.45,
            "hillshade-shadow-color": "#020617",
            "hillshade-highlight-color": "#475569",
            "hillshade-accent-color": "#0f172a",
          }}
        />
      )}
      <NavigationControl position="top-left" visualizePitch />
    </Map>
  );
}
