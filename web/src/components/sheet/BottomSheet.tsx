"use client";

import { useAppStore } from "@/store/app-store";
import { ReportSheet } from "./ReportSheet";
import { ShelterSheet } from "./ShelterSheet";

export function BottomSheet() {
  const sheet = useAppStore((s) => s.sheet);
  const closeSheet = useAppStore((s) => s.closeSheet);
  if (sheet === "none") return null;

  return (
    <section
      aria-label={sheet === "report" ? "Fire report" : "Where to go"}
      className="glass absolute inset-x-3 bottom-10 z-30 mx-auto max-h-[55dvh] max-w-lg overflow-y-auto overscroll-contain rounded-2xl p-4 pt-3"
    >
      <div className="flex justify-end">
        <button
          type="button"
          onClick={closeSheet}
          aria-label="Close"
          className="flex size-11 items-center justify-center rounded-xl text-xl text-slate-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-accent"
        >
          ×
        </button>
      </div>
      {sheet === "report" ? <ReportSheet /> : <ShelterSheet />}
    </section>
  );
}
