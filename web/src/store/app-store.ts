import { create } from "zustand";
import type { LngLat } from "@/lib/geo";
import { upsertReport, type Report, type ReportInput } from "@/lib/reports";

export type SheetId = "none" | "report" | "shelter";

interface AppState {
  reports: Report[];
  /** The single write path for reports (the user's drop and the demo simulator). Returns the report id. */
  addReport: (input: ReportInput, nowMs: number) => string;
  resetReports: () => void;

  /** A report in the fire the sheet is about; the cluster is derived from it. */
  selectedReportId: string | null;
  sheet: SheetId;
  openReport: (reportId: string) => void;
  openShelter: () => void;
  closeSheet: () => void;

  userLocation: LngLat | null;
  setUserLocation: (loc: LngLat | null) => void;

  /** Short transient message, e.g. "Outside the area we cover". */
  notice: string | null;
  showNotice: (message: string | null) => void;
}

// Counter ids: crypto.randomUUID needs a secure context, which an iPad on LAN http isn't.
let seq = 0;
const nextId = () => `r${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const useAppStore = create<AppState>()((set, get) => ({
  reports: [],
  addReport: (input, nowMs) => {
    const { reports, id } = upsertReport(get().reports, input, nowMs, nextId);
    set({ reports });
    return id;
  },
  resetReports: () => set({ reports: [], selectedReportId: null, sheet: "none" }),

  selectedReportId: null,
  sheet: "none",
  openReport: (reportId) => set({ selectedReportId: reportId, sheet: "report" }),
  openShelter: () => set({ sheet: "shelter" }),
  closeSheet: () => set({ sheet: "none" }),

  userLocation: null,
  setUserLocation: (userLocation) => set({ userLocation }),

  notice: null,
  showNotice: (notice) => set({ notice }),
}));
