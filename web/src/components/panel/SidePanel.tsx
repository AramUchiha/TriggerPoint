"use client";

import { PANEL_INSET_PX, PANEL_WIDTH_PX } from "@/config/layout";
import { useAppStore } from "@/store/app-store";
import { CommunitySection } from "./CommunitySection";
import { EmptyState, PanelSection } from "./PanelSection";

export function SidePanel() {
  const open = useAppStore((s) => s.panelOpen);
  const togglePanel = useAppStore((s) => s.togglePanel);

  return (
    <aside
      aria-label="Scenario panel"
      style={{ width: PANEL_WIDTH_PX, right: PANEL_INSET_PX }}
      className={`absolute top-20 bottom-10 z-20 flex max-w-[calc(100vw-5rem)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
        open ? "translate-x-0" : "translate-x-[calc(100%+1rem)]"
      }`}
    >
      <button
        type="button"
        onClick={togglePanel}
        aria-expanded={open}
        aria-controls="scenario-panel-body"
        aria-label={open ? "Collapse panel" : "Expand panel"}
        className="glass absolute top-3 -left-14 flex size-11 items-center justify-center rounded-xl text-slate-200 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <svg viewBox="0 0 20 20" className={`size-5 transition-transform ${open ? "" : "rotate-180"}`} aria-hidden>
          <path d="M8 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div id="scenario-panel-body" className="glass flex w-full flex-col overflow-hidden rounded-2xl" inert={!open}>
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <CommunitySection />
          <PanelSection
            index={2}
            title="Wind Scenario"
            description="Precomputed WindNinja field for a direction and speed, plus a worst case one speed class up."
          />
          <PanelSection
            index={3}
            title="Fire Projection"
            description="ELMFIRE time of arrival from a chosen ignition point."
          />
          <PanelSection
            index={4}
            title="Clearance"
            description="Time to get every household out through the available exits."
          />
          <PanelSection
            index={5}
            title="Verdict"
            description="Can the neighborhood clear before the fire arrives, and where is the trigger line?"
          >
            <EmptyState label="Needs a fire projection and a clearance estimate" />
          </PanelSection>
        </div>
        <footer className="border-t border-white/10 px-5 py-3 text-xs text-slate-400">
          Planning projection, not a forecast. Every number traces to a model run or source.
        </footer>
      </div>
    </aside>
  );
}
