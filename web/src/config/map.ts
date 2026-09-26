import type { MapProps } from "react-map-gl/maplibre";
import { parseMapProvider, type MapProvider } from "@/lib/map-provider";

/**
 * Single place for basemap / terrain configuration. To swap providers set
 * NEXT_PUBLIC_MAP_PROVIDER (inlined at build time) and edit BASEMAP_STYLE_URLS.
 */
export const MAP_PROVIDER: MapProvider = parseMapProvider(process.env.NEXT_PUBLIC_MAP_PROVIDER);

const BASEMAP_STYLE_URLS = {
  // OpenFreeMap "dark": keyless, no usage limits, OpenStreetMap data. https://openfreemap.org
  // Alternative keyless style: https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json
  maplibre: "https://tiles.openfreemap.org/styles/dark",
  // TODO(mapbox): not wired. Needs `mapbox-gl`, the `react-map-gl/mapbox` entry in MapView,
  // and NEXT_PUBLIC_MAPBOX_TOKEN (a public, URL-restricted token only).
  mapbox: "mapbox://styles/mapbox/dark-v11",
} satisfies Record<MapProvider, string>;

export const BASEMAP_STYLE_URL = BASEMAP_STYLE_URLS[MAP_PROVIDER];

/**
 * Display-only terrain: AWS Terrain Tiles (Mapzen terrarium encoding), keyless.
 * https://registry.opendata.aws/terrain-tiles/ — analysis uses USGS 3DEP via the pipeline, not these tiles.
 */
export const TERRAIN_TILES = {
  tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
  encoding: "terrarium" as const,
  tileSize: 256,
  maxzoom: 15,
  attribution:
    '<a href="https://github.com/tilezen/joerd/blob/master/docs/attribution.md" target="_blank" rel="noreferrer">Terrain Tiles (Mapzen/AWS)</a>',
};

// MapLibre recommends separate DEM sources for 3D terrain and hillshade.
export const TERRAIN_SOURCE_ID = "terrain-dem";
export const HILLSHADE_SOURCE_ID = "hillshade-dem";
export const TERRAIN_EXAGGERATION = 1.3;

export const SKY: NonNullable<MapProps["sky"]> = {
  "sky-color": "#0b1220",
  "horizon-color": "#1e293b",
  "fog-color": "#0f172a",
  "sky-horizon-blend": 0.6,
  "horizon-fog-blend": 0.7,
  "fog-ground-blend": 0.35,
  "atmosphere-blend": 0,
};

export const INITIAL_VIEW_STATE = {
  latitude: 34.185,
  longitude: -118.235,
  zoom: 12.5,
  pitch: 60,
  bearing: -20,
} as const;
