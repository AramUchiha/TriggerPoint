import type { Layer } from "@deck.gl/core";
import { LAYER_IDS, type LayerId, type LayerVisibility } from "@/store/app-store";

/**
 * One builder per toggle. Each returns null until the pipeline exports real,
 * schema-validated data for it — no placeholder geometry is ever drawn.
 */
const LAYER_BUILDERS: Record<LayerId, () => Layer | null> = {
  // TODO(wind): WindNinja vectors from a WindField (arrows or particle trails).
  wind: () => null,
  // TODO(fireContours): ELMFIRE time-of-arrival isochrones for the selected ignition + wind.
  fireContours: () => null,
  // TODO(triggerLine): isochrone where remaining fire travel time = clearance time + margin.
  triggerLine: () => null,
  // TODO(communities): community polygons and exits from `tp build-communities`.
  communities: () => null,
};

export function buildScenarioLayers(visibility: LayerVisibility): Layer[] {
  return LAYER_IDS.filter((id) => visibility[id])
    .map((id) => LAYER_BUILDERS[id]())
    .filter((layer): layer is Layer => layer !== null);
}
