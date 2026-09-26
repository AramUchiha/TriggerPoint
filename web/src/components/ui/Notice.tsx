"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";

const NOTICE_MS = 3_000;

export function Notice() {
  const notice = useAppStore((s) => s.notice);
  const showNotice = useAppStore((s) => s.showNotice);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => showNotice(null), NOTICE_MS);
    return () => clearTimeout(id);
  }, [notice, showNotice]);

  if (!notice) return null;
  return (
    <div role="status" className="pointer-events-none absolute inset-x-0 top-32 z-40 flex justify-center px-4">
      <p className="glass rounded-xl px-4 py-3 text-sm font-semibold text-slate-100">{notice}</p>
    </div>
  );
}
