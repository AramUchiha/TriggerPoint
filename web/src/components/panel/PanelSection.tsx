import type { ReactNode } from "react";

interface PanelSectionProps {
  index: number;
  title: string;
  /** One line on what this section will show once data exists. */
  description: string;
  children?: ReactNode;
}

export function PanelSection({ index, title, description, children }: PanelSectionProps) {
  const headingId = `panel-section-${index}`;
  return (
    <section aria-labelledby={headingId} className="border-b border-white/10 px-5 py-4 last:border-b-0">
      <h2 id={headingId} className="flex items-baseline gap-2 text-base font-semibold text-slate-50">
        <span className="text-xs font-semibold text-slate-500 tabular-nums">
          {String(index).padStart(2, "0")}
        </span>
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
      <div className="mt-3">{children ?? <EmptyState />}</div>
    </section>
  );
}

export function EmptyState({ label = "No scenario loaded" }: { label?: string }) {
  return (
    <p className="rounded-lg border border-dashed border-white/15 px-3 py-2.5 text-sm text-slate-500">
      {label}
    </p>
  );
}
