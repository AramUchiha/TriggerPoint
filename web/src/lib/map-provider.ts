import { z } from "zod";

export const MapProviderSchema = z.enum(["maplibre", "mapbox"]);
export type MapProvider = z.infer<typeof MapProviderSchema>;

/**
 * Parses NEXT_PUBLIC_MAP_PROVIDER. Unset or blank means the keyless MapLibre
 * default; anything unrecognised throws so a typo never silently changes the map.
 */
export function parseMapProvider(raw: string | undefined): MapProvider {
  const value = raw?.trim().toLowerCase();
  if (!value) return "maplibre";
  return MapProviderSchema.parse(value);
}
