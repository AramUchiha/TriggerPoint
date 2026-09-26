import { create } from "zustand";
import type { CommunityId } from "@/config/communities";

export const LAYER_IDS = ["wind", "fireContours", "triggerLine", "communities"] as const;
export type LayerId = (typeof LAYER_IDS)[number];
export type LayerVisibility = Record<LayerId, boolean>;

/** A one-shot camera move; `seq` increments so repeated taps on the same preset re-fly. */
export interface CameraRequest {
  communityId: CommunityId;
  seq: number;
}

interface AppState {
  layers: LayerVisibility;
  toggleLayer: (id: LayerId) => void;

  panelOpen: boolean;
  togglePanel: () => void;

  selectedCommunityId: CommunityId | null;
  cameraRequest: CameraRequest | null;
  selectCommunity: (id: CommunityId) => void;
}

export const useAppStore = create<AppState>()((set) => ({
  layers: { wind: false, fireContours: true, triggerLine: true, communities: true },
  toggleLayer: (id) => set((s) => ({ layers: { ...s.layers, [id]: !s.layers[id] } })),

  panelOpen: true,
  togglePanel: () => set((s) => ({ panelOpen: !s.panelOpen })),

  selectedCommunityId: null,
  cameraRequest: null,
  selectCommunity: (id) =>
    set((s) => ({
      selectedCommunityId: id,
      cameraRequest: { communityId: id, seq: (s.cameraRequest?.seq ?? 0) + 1 },
    })),
}));
