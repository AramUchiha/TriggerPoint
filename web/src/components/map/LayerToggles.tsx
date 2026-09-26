"use client";

import { Toggle } from "@/components/ui/Toggle";
import { LAYER_IDS, type LayerId, useAppStore } from "@/store/app-store";

const LAYER_META: Record<LayerId, { label: string; swatch: string }> = {
  wind: { label: "Wind", swatch: "bg-sky-300" },
  fireContours: { label: "Fire contours", swatch: "bg-warning" },
  triggerLine: { label: "Trigger line", swatch: "bg-critical" },
  communities: { label: "Communities", swatch: "bg-slate-200" },
};

export function LayerToggles() {
  const layers = useAppStore((s) => s.layers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);

  return (
    <section
      aria-label="Map layers"
      className="glass absolute bottom-4 left-4 z-10 w-56 rounded-2xl p-2"
    >
      <h2 className="px-2 pt-1 pb-1 text-xs font-semibold tracking-wider text-slate-400 uppercase">
        Layers
      </h2>
      {LAYER_IDS.map((id) => (
        <Toggle
          key={id}
          label={LAYER_META[id].label}
          checked={layers[id]}
          onChange={() => toggleLayer(id)}
          swatchClassName={LAYER_META[id].swatch}
        />
      ))}
      <p className="px-2 pt-1 pb-1 text-xs text-slate-500">No scenario data loaded.</p>
    </section>
  );
}
