"use client";

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
// The only file allowed to import src/demo (enforced in eslint.config.mjs).
import { startDemoReporters } from "@/demo/demo-reporters";
import { DEMO_SHELTER } from "@/demo/demo-shelter";
import { demoSpreadProvider } from "@/demo/demo-spread";
import type { LngLat } from "@/lib/geo";
import type { ShelterData } from "@/lib/shelter";
import type { SpreadProvider } from "@/lib/spread";
import { useAppStore } from "@/store/app-store";

export interface DataSources {
  demo: boolean;
  /** Null until a real spread model exists (or in demo mode, the simulated one). */
  spread: SpreadProvider | null;
  shelter: ShelterData | null;
  /** Called after the user drops a report. */
  onMyReport: (at: LngLat) => void;
  reset: () => void;
}

const NO_DATA: DataSources = {
  demo: false,
  spread: null,
  shelter: null,
  onMyReport: () => {},
  reset: () => useAppStore.getState().resetReports(),
};

const DataSourcesContext = createContext<DataSources>(NO_DATA);

export function DataProvider({ demo, children }: { demo: boolean; children: ReactNode }) {
  const stopReporters = useRef<(() => void) | null>(null);

  const value = useMemo<DataSources>(() => {
    if (!demo) return NO_DATA;
    return {
      demo: true,
      spread: demoSpreadProvider,
      shelter: DEMO_SHELTER,
      onMyReport: (at) => {
        stopReporters.current?.();
        stopReporters.current = startDemoReporters(at, (input) =>
          useAppStore.getState().addReport(input, Date.now()),
        );
      },
      reset: () => {
        stopReporters.current?.();
        stopReporters.current = null;
        useAppStore.getState().resetReports();
      },
    };
  }, [demo]);

  useEffect(() => () => stopReporters.current?.(), []);

  return <DataSourcesContext.Provider value={value}>{children}</DataSourcesContext.Provider>;
}

export function useDataSources(): DataSources {
  return useContext(DataSourcesContext);
}
