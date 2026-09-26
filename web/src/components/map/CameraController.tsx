"use client";

import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";
import { COMMUNITY_PRESETS } from "@/config/communities";
import { useAppStore } from "@/store/app-store";
import { PANEL_INSET_PX, PANEL_WIDTH_PX } from "@/config/layout";

/** Executes camera requests from the store so UI outside the map stays map-library agnostic. */
export function CameraController() {
  const { current: map } = useMap();
  const request = useAppStore((s) => s.cameraRequest);

  useEffect(() => {
    if (!map || !request) return;
    const preset = COMMUNITY_PRESETS.find((p) => p.id === request.communityId);
    if (!preset) return;
    const panelOpen = useAppStore.getState().panelOpen;
    map.flyTo({
      center: [preset.longitude, preset.latitude],
      zoom: preset.zoom,
      pitch: preset.pitch,
      bearing: preset.bearing,
      // Keep the community centred in the area not covered by the side panel.
      padding: { top: 0, bottom: 0, left: 0, right: panelOpen ? PANEL_WIDTH_PX + PANEL_INSET_PX : 0 },
      duration: 2500,
    });
  }, [map, request]);

  return null;
}
