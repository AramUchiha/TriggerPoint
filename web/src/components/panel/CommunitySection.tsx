"use client";

import { COMMUNITY_PRESETS } from "@/config/communities";
import { useAppStore } from "@/store/app-store";
import { PanelSection } from "./PanelSection";

export function CommunitySection() {
  const selectedId = useAppStore((s) => s.selectedCommunityId);
  const selectCommunity = useAppStore((s) => s.selectCommunity);

  return (
    <PanelSection index={1} title="Community" description="Pick a canyon neighborhood to plan for.">
      <div className="grid gap-2">
        {COMMUNITY_PRESETS.map((c) => {
          const selected = c.id === selectedId;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={selected}
              onClick={() => selectCommunity(c.id)}
              className={`min-h-11 rounded-lg border px-3 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                selected
                  ? "border-accent bg-accent/15 text-slate-50"
                  : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Camera presets only. Households, vehicles and exits load from the pipeline.
      </p>
    </PanelSection>
  );
}
