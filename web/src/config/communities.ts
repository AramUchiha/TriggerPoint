export interface CameraPreset {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

/**
 * Fly-to camera presets for the pilot canyon communities.
 *
 * TODO(verify): centers are approximate, eyeballed for camera framing only. Verify
 * against city neighborhood boundaries / Safety Element Appendix C, and never use
 * them for analysis — community geometry and counts come from the data pipeline
 * (`tp build-communities`).
 */
export const COMMUNITY_PRESETS = [
  {
    id: "chevy-chase-canyon",
    name: "Chevy Chase Canyon",
    longitude: -118.21,
    latitude: 34.152,
    zoom: 14,
    pitch: 62,
    bearing: -30,
  },
  {
    id: "glenoaks-canyon",
    name: "Glenoaks Canyon",
    longitude: -118.285,
    latitude: 34.182,
    zoom: 14,
    pitch: 62,
    bearing: 10,
  },
  {
    id: "whiting-woods",
    name: "Whiting Woods",
    longitude: -118.253,
    latitude: 34.222,
    zoom: 14,
    pitch: 62,
    bearing: 0,
  },
] as const satisfies readonly CameraPreset[];

export type CommunityId = (typeof COMMUNITY_PRESETS)[number]["id"];
