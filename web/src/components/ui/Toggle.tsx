"use client";

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  /** Tailwind background class for the legend swatch. */
  swatchClassName: string;
}

/** Full-row switch with a 44px touch target. */
export function Toggle({ label, checked, onChange, swatchClassName }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm font-medium text-slate-100 transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-accent"
    >
      <span className={`size-3 shrink-0 rounded-sm ${swatchClassName}`} aria-hidden />
      <span className="flex-1">{label}</span>
      <span
        aria-hidden
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? "bg-accent" : "bg-slate-700"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`}
        />
      </span>
    </button>
  );
}
